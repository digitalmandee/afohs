<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Notifications\ActivityNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\AccountingEventQueue;
use App\Models\ApprovalAction;
use App\Models\Branch;
use App\Models\GoodsReceipt;
use App\Models\InventoryItem;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\User;
use App\Models\VendorItemMapping;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Support\Branding\StaticDocumentBrandingResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use App\Services\Accounting\AccountingEventDispatcher;
use App\Services\Accounting\StrictAccountingSyncService;
use App\Services\Inventory\InventoryMovementService;
use App\Services\Procurement\ProcurementDocumentNumberService;
use Illuminate\Validation\ValidationException;

class GoodsReceiptController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = GoodsReceipt::with('vendor', 'warehouse', 'warehouseLocation', 'purchaseOrder', 'tenant', 'verifier', 'acceptedBy');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('grn_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'pending_acceptance', 'accepted', 'received', 'cancelled'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('received_date', [$request->from, $request->to]);
        }

        $summaryQuery = clone $query;
        $statusBreakdown = (clone $query)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $summary = [
            'count' => (int) $summaryQuery->count(),
            'pending_acceptance' => (int) ($statusBreakdown['pending_acceptance'] ?? 0),
            'accepted' => (int) (($statusBreakdown['accepted'] ?? 0) + ($statusBreakdown['received'] ?? 0)),
            'draft' => (int) ($statusBreakdown['draft'] ?? 0),
            'cancelled' => (int) ($statusBreakdown['cancelled'] ?? 0),
        ];

        $receipts = $query->orderByDesc('received_date')->paginate($perPage)->withQueryString();
        $postedIds = JournalEntry::query()
            ->where('module_type', 'goods_receipt')
            ->whereIn('module_id', $receipts->getCollection()->pluck('id'))
            ->pluck('module_id')
            ->all();
        $postedLookup = array_fill_keys($postedIds, true);
        $eventLookup = AccountingEventQueue::query()
            ->where('source_type', GoodsReceipt::class)
            ->whereIn('source_id', $receipts->getCollection()->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('source_id')
            ->keyBy('source_id');
        $receipts->getCollection()->transform(function ($receipt) use ($postedLookup, $eventLookup) {
            $event = $eventLookup->get($receipt->id);
            $receipt->gl_posted = (bool) ($postedLookup[$receipt->id] ?? false);
            $receipt->accounting_status = $event?->status ?? ($receipt->gl_posted ? 'posted' : 'pending');
            $receipt->accounting_failure_reason = $event?->error_message;
            $receipt->accounting_correlation_id = (string) ($event?->payload['correlation_id'] ?? '');
            return $receipt;
        });

        return Inertia::render('App/Admin/Procurement/GoodsReceipts/Index', [
            'receipts' => $receipts,
            'summary' => $summary,
            'authUserId' => $request->user()?->id,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name']),
            'warehouseLocations' => WarehouseLocation::query()->orderBy('name')->get(['id', 'warehouse_id', 'name', 'code']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'vendor_id', 'warehouse_id', 'tenant_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function view(GoodsReceipt $goodsReceipt)
    {
        return response()->view(
            'procurement.goods-receipts.document',
            $this->buildGoodsReceiptDocumentPayload($goodsReceipt, false)
        );
    }

    public function print(GoodsReceipt $goodsReceipt)
    {
        return response()->view(
            'procurement.goods-receipts.document',
            $this->buildGoodsReceiptDocumentPayload($goodsReceipt, true)
        );
    }

    public function pdf(GoodsReceipt $goodsReceipt)
    {
        $payload = $this->buildGoodsReceiptDocumentPayload($goodsReceipt, false);

        return Pdf::loadView('procurement.goods-receipts.document', $payload)
            ->setPaper('a4', 'portrait')
            ->download(sprintf('%s-%s.pdf', (string) $goodsReceipt->grn_no, now()->format('Ymd-His')));
    }

    public function create(Request $request)
    {
        $purchaseOrder = null;
        $prefillError = null;
        if ($request->filled('purchase_order_id')) {
            $candidate = PurchaseOrder::with(['items.inventoryItem', 'warehouse.locations', 'warehouse.tenant', 'tenant', 'vendor', 'purchaseRequisition'])
                ->find($request->purchase_order_id);
            if ($candidate && in_array((string) $candidate->status, ['approved', 'partially_received'], true)) {
                $this->enrichOrderItemsWithResolvedInventoryId($candidate);
                $purchaseOrder = $candidate;
            } else {
                $prefillError = 'Selected purchase order is not eligible for GRN creation.';
            }
        }

        $purchaseOrderColumns = ['id', 'po_no', 'vendor_id', 'warehouse_id', 'tenant_id', 'order_date', 'status'];
        if (Schema::hasColumn('purchase_orders', 'purchase_requisition_id')) {
            $purchaseOrderColumns[] = 'purchase_requisition_id';
        }

        $purchaseOrderWith = ['vendor:id,name', 'warehouse:id,name,tenant_id', 'warehouse.locations:id,warehouse_id,name,code,status,is_primary', 'items.inventoryItem:id,name', 'tenant:id,name'];
        if (Schema::hasColumn('purchase_orders', 'purchase_requisition_id')) {
            $purchaseOrderWith[] = 'purchaseRequisition:id,pr_no,requested_by';
        }

        $purchaseOrders = PurchaseOrder::with($purchaseOrderWith)
            ->whereIn('status', ['approved', 'partially_received'])
            ->orderByDesc('order_date')
            ->limit(200)
            ->get($purchaseOrderColumns);
        $purchaseOrders->each(fn (PurchaseOrder $order) => $this->enrichOrderItemsWithResolvedInventoryId($order));

        return Inertia::render('App/Admin/Procurement/GoodsReceipts/Create', [
            'purchaseOrder' => $purchaseOrder,
            'purchaseOrders' => $purchaseOrders,
            'prefillError' => $prefillError,
            'acceptanceWorkflowEnabled' => $this->supportsAcceptanceWorkflow(),
        ]);
    }

    public function store(Request $request, InventoryMovementService $inventoryMovementService)
    {
        $request->merge([
            'items' => collect($request->input('items', []))->map(function ($item) {
                if (!isset($item['inventory_item_id']) && isset($item['product_id'])) {
                    $item['inventory_item_id'] = $item['product_id'];
                }
                return $item;
            })->all(),
        ]);

        $containsTaxFields = collect($request->input('items', []))->contains(function ($line) {
            if (!is_array($line)) {
                return false;
            }

            return array_key_exists('tax', $line)
                || array_key_exists('tax_rate', $line)
                || array_key_exists('tax_amount', $line)
                || array_key_exists('line_tax', $line);
        });

        $data = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.inventory_item_id' => 'nullable|integer',
            'items.*.qty_received' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        if ($request->hasAny(['tax_total', 'tax_amount', 'line_tax', 'tax_rate']) || $containsTaxFields) {
            throw ValidationException::withMessages([
                'tax' => 'Tax is not supported on GRN. Use Vendor Bill for tax handling.',
            ]);
        }

        $po = PurchaseOrder::with(['vendor', 'warehouse', 'purchaseRequisition'])->findOrFail($data['purchase_order_id']);
        if (!in_array((string) $po->status, ['approved', 'partially_received'], true)) {
            throw ValidationException::withMessages([
                'purchase_order_id' => 'Only approved or partially received purchase orders can be used for GRN.',
            ]);
        }
        $poItems = $po->items()->get()->keyBy('id');
        $locationId = !empty($data['warehouse_location_id']) ? (int) $data['warehouse_location_id'] : null;

        if ($locationId) {
            $location = WarehouseLocation::query()->find($locationId);
            if (!$location || (int) $location->warehouse_id !== (int) $po->warehouse_id) {
                throw ValidationException::withMessages([
                    'warehouse_location_id' => 'Selected warehouse location does not belong to the purchase order warehouse.',
                ]);
            }
        }

        $inputItemIds = collect($data['items'])->pluck('purchase_order_item_id')->all();
        $previousReceived = DB::table('goods_receipt_items')
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_items.goods_receipt_id')
            ->whereIn('goods_receipt_items.purchase_order_item_id', $inputItemIds)
            ->where('goods_receipts.status', '!=', 'cancelled')
            ->select('goods_receipt_items.purchase_order_item_id', DB::raw('SUM(goods_receipt_items.qty_received) as qty_received'))
            ->groupBy('goods_receipt_items.purchase_order_item_id')
            ->pluck('qty_received', 'purchase_order_item_id');

        foreach ($data['items'] as $index => $item) {
            $poItem = $poItems->get($item['purchase_order_item_id']);
            if (!$poItem || (int) $poItem->purchase_order_id !== (int) $po->id) {
                throw ValidationException::withMessages([
                    "items.{$index}.purchase_order_item_id" => 'Selected item does not belong to this purchase order.',
                ]);
            }

            $resolvedInventoryItemId = $this->resolveInventoryItemForPoLine(
                poItem: $poItem,
                payloadInventoryItemId: $item['inventory_item_id'] ?? null,
                lineIndex: $index
            );

            $alreadyReceived = (float) ($previousReceived[$poItem->id] ?? 0);
            $available = max(0, (float) $poItem->qty_ordered - $alreadyReceived);
            if ((float) $item['qty_received'] > $available + 0.0001) {
                throw ValidationException::withMessages([
                    "items.{$index}.qty_received" => "Cannot receive more than available qty ({$available}) for this item.",
                ]);
            }

            $inventoryItem = InventoryItem::query()
                ->find($resolvedInventoryItemId, ['id', 'name', 'purchase_price_mode', 'fixed_purchase_price', 'allow_price_override', 'max_price_variance_percent']);
            if ($inventoryItem) {
                $this->assertPurchasePricePolicy(
                    itemName: $inventoryItem->name,
                    mode: (string) ($inventoryItem->purchase_price_mode ?? 'open'),
                    fixedPrice: $inventoryItem->fixed_purchase_price,
                    allowOverride: (bool) ($inventoryItem->allow_price_override ?? true),
                    maxVariancePercent: $inventoryItem->max_price_variance_percent,
                    inputUnitCost: (float) $item['unit_cost']
                );
            }

            $data['items'][$index]['inventory_item_id'] = $resolvedInventoryItemId;
            $data['items'][$index]['product_id'] = $this->resolveLedgerProductIdForInventoryItem(
                $resolvedInventoryItemId,
                (int) ($poItem->product_id ?? 0)
            );
        }

        $acceptanceWorkflowEnabled = $this->supportsAcceptanceWorkflow();
        $verifier = null;
        if ($acceptanceWorkflowEnabled) {
            $verifier = $this->resolveVerifierForPurchaseOrder($po);
            if (!$verifier) {
                throw ValidationException::withMessages([
                    'purchase_order_id' => 'No verifier is configured. Assign PR requester or Procurement Admin fallback.',
                ]);
            }
        }

        $receipt = null;
        DB::transaction(function () use ($data, $locationId, $po, $request, $verifier, $acceptanceWorkflowEnabled, $inventoryMovementService, &$receipt) {
            $tenantId = $po->tenant_id ?: $po->warehouse?->tenant_id;
            $branchId = $this->resolveBranchIdForGoodsReceiptNumbering($po);
            if ($branchId <= 0) {
                throw ValidationException::withMessages([
                    'purchase_order_id' => 'Branch mapping missing for numbering. Assign branch to restaurant before creating GRN.',
                ]);
            }

            $grnNo = app(ProcurementDocumentNumberService::class)->generate(
                documentType: 'GRN',
                branchId: $branchId,
                documentDate: $data['received_date']
            );

            $payload = [
                'grn_no' => $grnNo,
                'purchase_order_id' => $po->id,
                'vendor_id' => $po->vendor_id,
                'tenant_id' => $tenantId,
                'warehouse_id' => $po->warehouse_id,
                'warehouse_location_id' => $locationId,
                'received_date' => $data['received_date'],
                'status' => $acceptanceWorkflowEnabled ? 'pending_acceptance' : 'received',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $request->user()?->id,
            ];

            if ($acceptanceWorkflowEnabled) {
                $payload['submitted_at'] = now();
                $payload['verifier_user_id'] = $verifier?->id;
            } else {
                $payload['posted_by'] = $request->user()?->id;
                $payload['posted_at'] = now();
            }

            $receipt = GoodsReceipt::create($payload);

            foreach ($data['items'] as $item) {
                $lineTotal = (float) $item['qty_received'] * (float) $item['unit_cost'];
                $receipt->items()->create([
                    'purchase_order_item_id' => $item['purchase_order_item_id'],
                    'product_id' => $item['product_id'] ?? null,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'qty_received' => $item['qty_received'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ]);
            }

            if (!$acceptanceWorkflowEnabled) {
                $this->postReceiptIntoInventory($receipt, $request->user()?->id, $inventoryMovementService, false);
            }
        });

        if ($acceptanceWorkflowEnabled && $verifier) {
            try {
                $verifier->notify(new ActivityNotification(
                    'GRN awaiting your acceptance',
                    "Goods receipt {$receipt->grn_no} requires verification before inventory posting.",
                    route('procurement.goods-receipts.index', ['search' => $receipt->grn_no]),
                    $request->user(),
                    'Procurement'
                ));
            } catch (\Throwable $e) {
                Log::warning('procurement.grn.verifier_notification_failed', [
                    'goods_receipt_id' => $receipt->id,
                    'verifier_user_id' => $verifier->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return redirect()->route('procurement.goods-receipts.index')->with(
            'success',
            $acceptanceWorkflowEnabled
                ? 'Goods receipt submitted for requester acceptance.'
                : 'Goods receipt posted successfully.'
        );
    }

    private function resolveBranchIdForGoodsReceiptNumbering(PurchaseOrder $po): int
    {
        // Primary source: PO tenant mapping.
        $tenantId = (int) ($po->tenant_id ?? 0);
        if ($tenantId > 0) {
            $branchId = (int) (Tenant::query()->whereKey($tenantId)->value('branch_id') ?? 0);
            if ($branchId > 0) {
                return $branchId;
            }
        }

        // Fallback #1: warehouse tenant mapping.
        $warehouseTenantId = (int) ($po->warehouse?->tenant_id ?? 0);
        if ($warehouseTenantId > 0) {
            $branchId = (int) (Tenant::query()->whereKey($warehouseTenantId)->value('branch_id') ?? 0);
            if ($branchId > 0) {
                return $branchId;
            }
        }

        // Fallback #2: vendor tenant mapping.
        $vendorTenantId = (int) ($po->vendor?->tenant_id ?? 0);
        if ($vendorTenantId > 0) {
            $branchId = (int) (Tenant::query()->whereKey($vendorTenantId)->value('branch_id') ?? 0);
            if ($branchId > 0) {
                return $branchId;
            }
        }

        // Fallback #3: infer from existing PO number prefix: BRANCHCODE-PO-YYMM-####
        $poNo = trim((string) ($po->po_no ?? ''));
        if (preg_match('/^([A-Z0-9]+)-PO-\d{4}-\d{4}$/', strtoupper($poNo), $matches)) {
            $branchCode = strtoupper((string) ($matches[1] ?? ''));
            if ($branchCode !== '') {
                $branchId = (int) (Branch::query()->whereRaw('UPPER(branch_code) = ?', [$branchCode])->value('id') ?? 0);
                if ($branchId > 0) {
                    return $branchId;
                }
            }
        }

        return 0;
    }

    public function accept(Request $request, GoodsReceipt $goodsReceipt, InventoryMovementService $inventoryMovementService)
    {
        $goodsReceipt->load(['purchaseOrder.items', 'purchaseOrder.warehouse', 'items', 'purchaseOrder.purchaseRequisition']);

        if (!$this->canAcceptReceipt($request->user(), $goodsReceipt)) {
            abort(403, 'You are not authorized to accept this GRN.');
        }

        if (!in_array((string) $goodsReceipt->status, ['pending_acceptance', 'draft'], true)) {
            return redirect()->back()->with('error', 'Only pending GRNs can be accepted.');
        }

        DB::transaction(function () use ($goodsReceipt, $request, $inventoryMovementService) {
            /** @var GoodsReceipt $receipt */
            $receipt = GoodsReceipt::query()->lockForUpdate()->findOrFail($goodsReceipt->id);
            if (!in_array((string) $receipt->status, ['pending_acceptance', 'draft'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'This GRN is already accepted or cancelled.',
                ]);
            }
            $this->postReceiptIntoInventory($receipt, $request->user()?->id, $inventoryMovementService, true);
        });

        return redirect()->back()->with('success', 'GRN accepted and inventory posted.');
    }

    private function assertPurchasePricePolicy(
        string $itemName,
        string $mode,
        mixed $fixedPrice,
        bool $allowOverride,
        mixed $maxVariancePercent,
        float $inputUnitCost
    ): void {
        if ($mode !== 'fixed') {
            return;
        }

        $fixed = (float) ($fixedPrice ?? 0);
        if ($fixed <= 0) {
            return;
        }

        if (!$allowOverride && abs($inputUnitCost - $fixed) > 0.0001) {
            throw ValidationException::withMessages([
                'items' => "Item '{$itemName}' requires fixed purchase price ({$fixed}).",
            ]);
        }

        if ($allowOverride && $maxVariancePercent !== null) {
            $variance = abs($inputUnitCost - $fixed) / $fixed * 100;
            if ($variance - (float) $maxVariancePercent > 0.0001) {
                throw ValidationException::withMessages([
                    'items' => "Item '{$itemName}' exceeds allowed variance ({$maxVariancePercent}%).",
                ]);
            }
        }
    }

    private function resolveVerifierForPurchaseOrder(PurchaseOrder $purchaseOrder): ?User
    {
        $requesterId = $purchaseOrder->purchaseRequisition?->requested_by;
        if ($requesterId) {
            $requester = User::query()->whereKey($requesterId)->first();
            if ($requester) {
                return $requester;
            }
        }

        return User::query()
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', [
                    'Procurement Admin',
                    'procurement admin',
                    'procurement-admin',
                    'Super Admin',
                    'super-admin',
                    'super admin',
                ]);
            })
            ->orderBy('id')
            ->first();
    }

    private function canAcceptReceipt(?User $user, GoodsReceipt $goodsReceipt): bool
    {
        if (!$user) {
            return false;
        }

        if ((int) $goodsReceipt->verifier_user_id === (int) $user->id) {
            return true;
        }

        if (method_exists($user, 'hasRole') && (
            $user->hasRole('Procurement Admin') ||
            $user->hasRole('procurement-admin') ||
            $user->hasRole('Super Admin') ||
            $user->hasRole('super-admin')
        )) {
            return true;
        }

        if (method_exists($user, 'can') && $user->can('procurement.goods-receipt.accept')) {
            return true;
        }

        return false;
    }

    private function supportsAcceptanceWorkflow(): bool
    {
        return Schema::hasColumn('goods_receipts', 'verifier_user_id')
            && Schema::hasColumn('goods_receipts', 'submitted_at')
            && Schema::hasColumn('goods_receipts', 'accepted_by')
            && Schema::hasColumn('goods_receipts', 'accepted_at');
    }

    private function postReceiptIntoInventory(
        GoodsReceipt $receipt,
        ?int $userId,
        InventoryMovementService $inventoryMovementService,
        bool $markAsAccepted
    ): void {
        $po = PurchaseOrder::query()->lockForUpdate()->with(['items', 'warehouse'])->findOrFail($receipt->purchase_order_id);
        $poItems = $po->items->keyBy('id');
        $receiptItems = $receipt->items()->get();
        $total = 0.0;

        foreach ($receiptItems as $index => $item) {
            $poItem = $poItems->get((int) $item->purchase_order_item_id);
            if (!$poItem) {
                throw ValidationException::withMessages([
                    "items.{$index}" => 'GRN line item no longer matches purchase order line.',
                ]);
            }

            $resolvedInventoryItemId = $this->resolveInventoryItemForPoLine(
                poItem: $poItem,
                payloadInventoryItemId: $item->inventory_item_id,
                lineIndex: $index
            );

            $available = max(0, (float) $poItem->qty_ordered - (float) $poItem->qty_received);
            if ((float) $item->qty_received > $available + 0.0001) {
                throw ValidationException::withMessages([
                    "items.{$index}.qty_received" => "Cannot accept more than available qty ({$available}) for PO line {$poItem->id}.",
                ]);
            }

            $lineTotal = (float) $item->line_total;
            $total += $lineTotal;
            $resolvedProductId = $this->resolveLedgerProductIdForInventoryItem(
                $resolvedInventoryItemId,
                (int) ($poItem->product_id ?? 0)
            );

            $inventoryMovementService->record([
                'product_id' => $resolvedProductId,
                'inventory_item_id' => $resolvedInventoryItemId,
                'tenant_id' => $receipt->tenant_id ?: $po->warehouse?->tenant_id,
                'warehouse_id' => $receipt->warehouse_id,
                'warehouse_location_id' => $receipt->warehouse_location_id,
                'transaction_date' => $receipt->received_date,
                'type' => 'purchase',
                'qty_in' => $item->qty_received,
                'qty_out' => 0,
                'unit_cost' => $item->unit_cost,
                'total_cost' => $lineTotal,
                'reference_type' => GoodsReceipt::class,
                'reference_id' => $receipt->id,
                'reason' => $markAsAccepted ? 'Purchase receipt accepted' : 'Purchase receipt posted',
                'status' => 'posted',
                'created_by' => $userId,
            ]);

            $poItem->qty_received = (float) $poItem->qty_received + (float) $item->qty_received;
            $poItem->save();

            VendorItemMapping::query()->updateOrCreate(
                [
                    'vendor_id' => $po->vendor_id,
                    'inventory_item_id' => $resolvedInventoryItemId,
                ],
                [
                    'tenant_id' => $receipt->tenant_id ?: $po->warehouse?->tenant_id,
                    'last_purchase_price' => $item->unit_cost,
                    'currency' => 'PKR',
                    'is_active' => true,
                ]
            );

            if ((int) $item->inventory_item_id !== $resolvedInventoryItemId) {
                $item->inventory_item_id = $resolvedInventoryItemId;
            }

            if ((int) ($item->product_id ?? 0) !== $resolvedProductId) {
                $item->product_id = $resolvedProductId;
            }

            if ($item->isDirty()) {
                $item->save();
            }
        }

        $remaining = $po->items()->whereColumn('qty_received', '<', 'qty_ordered')->count();
        $po->status = $remaining === 0 ? 'received' : 'partially_received';
        $po->save();

        $updatePayload = [
            'status' => ($markAsAccepted && $this->supportsAcceptanceWorkflow()) ? 'accepted' : 'received',
            'posted_by' => $userId,
            'posted_at' => now(),
        ];

        if ($markAsAccepted && $this->supportsAcceptanceWorkflow()) {
            $updatePayload['accepted_by'] = $userId;
            $updatePayload['accepted_at'] = now();
        }

        $receipt->update($updatePayload);

        $event = app(AccountingEventDispatcher::class)->dispatch(
            'goods_receipt_posted',
            GoodsReceipt::class,
            (int) $receipt->id,
            [
                'grn_no' => $receipt->grn_no,
                'warehouse_id' => $receipt->warehouse_id,
                'warehouse_location_id' => $receipt->warehouse_location_id,
                'vendor_id' => $receipt->vendor_id,
                'total_value' => $total,
            ],
            $userId,
            $receipt->tenant_id
        );

        app(StrictAccountingSyncService::class)->enforceOrFail($event, "GRN {$receipt->grn_no}");
    }

    private function resolveInventoryItemForPoLine(object $poItem, mixed $payloadInventoryItemId, int $lineIndex): int
    {
        $payloadId = (int) ($payloadInventoryItemId ?: 0);
        $poInventoryItemId = (int) ($poItem->inventory_item_id ?: 0);
        $poLegacyProductId = (int) ($poItem->product_id ?: 0);

        $candidateIds = [];
        if ($payloadId > 0) {
            $candidateIds[] = $payloadId;
        }
        if ($poInventoryItemId > 0 && !in_array($poInventoryItemId, $candidateIds, true)) {
            $candidateIds[] = $poInventoryItemId;
        }
        if ($poLegacyProductId > 0 && !in_array($poLegacyProductId, $candidateIds, true)) {
            $candidateIds[] = $poLegacyProductId;
        }

        $resolvedId = 0;
        foreach ($candidateIds as $candidateId) {
            if (InventoryItem::query()->whereKey($candidateId)->exists()) {
                $resolvedId = $candidateId;
                break;
            }
        }

        if ($resolvedId <= 0 && $poLegacyProductId > 0) {
            $resolvedFromLegacy = $this->findInventoryItemIdFromLegacyProductId($poLegacyProductId);
            if ($resolvedFromLegacy > 0) {
                $resolvedId = $resolvedFromLegacy;
            }
        }

        if ($resolvedId <= 0 && $poLegacyProductId > 0) {
            $resolvedFromLegacy = $this->ensureInventoryItemFromLegacyProductId($poLegacyProductId);
            if ($resolvedFromLegacy > 0) {
                $resolvedId = $resolvedFromLegacy;
            }
        }

        if ($resolvedId <= 0) {
            throw ValidationException::withMessages([
                "items.{$lineIndex}.inventory_item_id" => "PO line {$poItem->id} has no valid inventory mapping. Please map inventory item first.",
            ]);
        }

        if ($payloadId > 0 && $payloadId !== $resolvedId) {
            $isLegacyPlaceholderPayload = $poLegacyProductId > 0 && $payloadId === $poLegacyProductId;
            if ($isLegacyPlaceholderPayload) {
                return $resolvedId;
            }

            throw ValidationException::withMessages([
                "items.{$lineIndex}.inventory_item_id" => "Inventory item mismatch for PO line {$poItem->id}.",
            ]);
        }

        if (empty($poItem->inventory_item_id) && $resolvedId > 0 && method_exists($poItem, 'save')) {
            $poItem->inventory_item_id = $resolvedId;
            $poItem->save();
        }

        return $resolvedId;
    }

    private function enrichOrderItemsWithResolvedInventoryId(PurchaseOrder $order): void
    {
        if (!$order->relationLoaded('items')) {
            return;
        }

        $candidateIds = $order->items
            ->map(fn ($item) => (int) ($item->inventory_item_id ?: 0))
            ->filter(fn ($id) => $id > 0)
            ->values()
            ->all();

        $existingIds = !empty($candidateIds)
            ? InventoryItem::query()->whereIn('id', $candidateIds)->pluck('id')->all()
            : [];
        $existingLookup = array_fill_keys($existingIds, true);

        foreach ($order->items as $item) {
            $resolvedId = 0;
            $primaryId = (int) ($item->inventory_item_id ?: 0);
            if ($primaryId > 0 && isset($existingLookup[$primaryId])) {
                $resolvedId = $primaryId;
            }
            if ($resolvedId <= 0) {
                $directLegacyId = (int) ($item->product_id ?: 0);
                if ($directLegacyId > 0 && InventoryItem::query()->whereKey($directLegacyId)->exists()) {
                    $resolvedId = $directLegacyId;
                }
            }
            if ($resolvedId <= 0) {
                $resolvedId = $this->findInventoryItemIdFromLegacyProductId((int) ($item->product_id ?: 0));
            }

            $item->resolved_inventory_item_id = $resolvedId > 0 ? $resolvedId : null;

            if ($resolvedId <= 0) {
                $legacyProductId = (int) ($item->product_id ?: 0);
                if ($legacyProductId > 0 && Product::withTrashed()->whereKey($legacyProductId)->exists()) {
                    // Legacy PO lines may still carry product_id only; resolve happens during GRN submit.
                    $item->resolved_inventory_item_id = $legacyProductId;
                    $item->mapping_issue = null;
                    continue;
                }

                $item->mapping_issue = 'No inventory item mapping on PO line.';
                continue;
            }

            if (!isset($existingLookup[$resolvedId]) && !InventoryItem::query()->whereKey($resolvedId)->exists()) {
                $item->mapping_issue = "Mapped inventory item {$resolvedId} not found.";
                continue;
            }

            $item->mapping_issue = null;
        }
    }

    private function findInventoryItemIdFromLegacyProductId(int $legacyProductId): int
    {
        static $cache = [];
        if ($legacyProductId <= 0) {
            return 0;
        }

        if (array_key_exists($legacyProductId, $cache)) {
            return (int) $cache[$legacyProductId];
        }

        $resolved = (int) (InventoryItem::query()
            ->where('legacy_product_id', $legacyProductId)
            ->value('id') ?? 0);
        $cache[$legacyProductId] = $resolved;

        return $resolved;
    }

    private function ensureInventoryItemFromLegacyProductId(int $legacyProductId): int
    {
        if ($legacyProductId <= 0) {
            return 0;
        }

        $existing = InventoryItem::withTrashed()
            ->where('legacy_product_id', $legacyProductId)
            ->first();
        if ($existing) {
            if (method_exists($existing, 'trashed') && $existing->trashed()) {
                $existing->restore();
            }

            return (int) $existing->id;
        }

        $product = Product::withTrashed()->find($legacyProductId);
        if (!$product) {
            return 0;
        }

        if (method_exists($product, 'trashed') && $product->trashed()) {
            $product->restore();
        }

        $inventoryItem = InventoryItem::query()->create([
            'legacy_product_id' => $product->id,
            'name' => (string) ($product->name ?: ('Legacy Product #' . $product->id)),
            'sku' => $product->menu_code ?: ('LEG-' . $product->id),
            'description' => $product->description,
            'category_id' => $product->category_id,
            'manufacturer_id' => $product->manufacturer_id,
            'unit_id' => $product->unit_id,
            'default_unit_cost' => (float) ($product->base_price ?? 0),
            'moving_average_cost' => (float) ($product->base_price ?? 0),
            'current_stock' => (float) ($product->current_stock ?? 0),
            'minimum_stock' => (float) ($product->minimal_stock ?? 0),
            'manage_stock' => (bool) ($product->manage_stock ?? true),
            'is_purchasable' => (bool) ($product->is_purchasable ?? true),
            'status' => (string) ($product->status ?: 'active'),
            'tenant_id' => $product->tenant_id,
            'created_by' => auth()->id() ?? $product->created_by,
            'updated_by' => auth()->id() ?? $product->updated_by,
        ]);

        return (int) $inventoryItem->id;
    }

    private function resolveLedgerProductIdForInventoryItem(int $inventoryItemId, int $preferredProductId = 0): int
    {
        if ($preferredProductId > 0 && Product::withTrashed()->whereKey($preferredProductId)->exists()) {
            $product = Product::withTrashed()->find($preferredProductId);
            if ($product && method_exists($product, 'trashed') && $product->trashed()) {
                $product->restore();
            }
            return $preferredProductId;
        }

        $inventoryItem = InventoryItem::query()->find($inventoryItemId);
        if (!$inventoryItem) {
            throw ValidationException::withMessages([
                'items' => "Resolved inventory item {$inventoryItemId} not found for ledger product mapping.",
            ]);
        }

        if ($inventoryItem->legacy_product_id && Product::withTrashed()->whereKey($inventoryItem->legacy_product_id)->exists()) {
            $product = Product::withTrashed()->find($inventoryItem->legacy_product_id);
            if ($product && method_exists($product, 'trashed') && $product->trashed()) {
                $product->restore();
            }
            return (int) $inventoryItem->legacy_product_id;
        }

        $bridgeCode = sprintf('INV-BRIDGE-%d', $inventoryItem->id);
        $bridgeProduct = Product::withTrashed()->where('menu_code', $bridgeCode)->first();

        if (!$bridgeProduct) {
            $bridgeProduct = Product::query()->create([
                'name' => $inventoryItem->name . ' [Inventory Bridge]',
                'menu_code' => $bridgeCode,
                'description' => 'Internal compatibility bridge for inventory item ledger posting.',
                'category_id' => null,
                'manufacturer_id' => null,
                'base_price' => (float) ($inventoryItem->default_unit_cost ?? 0),
                'cost_of_goods_sold' => (float) ($inventoryItem->default_unit_cost ?? 0),
                'current_stock' => (int) round((float) ($inventoryItem->current_stock ?? 0)),
                'manage_stock' => false,
                'minimal_stock' => 0,
                'notify_when_out_of_stock' => false,
                'available_order_types' => [],
                'is_salable' => false,
                'is_purchasable' => false,
                'is_returnable' => false,
                'is_taxable' => false,
                'item_type' => 'raw_material',
                'unit_id' => $inventoryItem->unit_id,
                'status' => 'inactive',
                'tenant_id' => $inventoryItem->tenant_id,
                'created_by' => auth()->id() ?? $inventoryItem->created_by,
                'updated_by' => auth()->id() ?? $inventoryItem->updated_by,
            ]);
        } elseif (method_exists($bridgeProduct, 'trashed') && $bridgeProduct->trashed()) {
            $bridgeProduct->restore();
        }

        $inventoryItem->forceFill([
            'legacy_product_id' => $bridgeProduct->id,
        ])->save();

        return (int) $bridgeProduct->id;
    }

    private function buildGoodsReceiptDocumentPayload(GoodsReceipt $goodsReceipt, bool $autoPrint): array
    {
        $goodsReceipt->loadMissing([
            'vendor',
            'tenant',
            'warehouse.tenant',
            'warehouseLocation',
            'purchaseOrder',
            'items.inventoryItem.unit',
            'createdBy:id,name',
            'verifier:id,name',
            'acceptedBy:id,name',
            'postedBy:id,name',
        ]);

        $lineItems = $goodsReceipt->items->map(function ($item) {
            $qty = (float) ($item->qty_received ?? 0);
            $unitCost = (float) ($item->unit_cost ?? 0);
            $lineTotal = (float) ($item->line_total ?? ($qty * $unitCost));

            return [
                'item_name' => $item->inventoryItem?->name ?? ('Inventory Item #' . $item->inventory_item_id),
                'sku' => $item->inventoryItem?->sku ?: '-',
                'uom' => $item->inventoryItem?->unit?->name ?: '-',
                'qty_received' => number_format($qty, 3, '.', ','),
                'unit_cost' => number_format($unitCost, 2, '.', ','),
                'line_total' => number_format($lineTotal, 2, '.', ','),
            ];
        })->values()->all();

        $total = (float) $goodsReceipt->items->sum('line_total');
        $tenantName = $goodsReceipt->tenant?->name
            ?: $goodsReceipt->warehouse?->tenant?->name
            ?: config('app.name', 'AFOHS Club');
        $verifiedFallback = $this->resolveGoodsReceiptVerifiedFallback((int) $goodsReceipt->id);

        $preparedByName = $goodsReceipt->createdBy?->name ?: 'N/A';
        $preparedAt = optional($goodsReceipt->created_at)->format('d/m/Y h:i A') ?: 'N/A';

        $verifiedByName = $goodsReceipt->verifier?->name
            ?: ($verifiedFallback['name'] ?? null)
            ?: ((string) $goodsReceipt->status === 'draft' ? 'Pending' : 'N/A');
        $verifiedAt = optional($goodsReceipt->submitted_at)->format('d/m/Y h:i A')
            ?: ($verifiedFallback['at'] ?? null)
            ?: ((string) $goodsReceipt->status === 'draft' ? 'Pending' : 'N/A');

        $acceptanceCompleted = in_array((string) $goodsReceipt->status, ['accepted', 'received'], true);
        $acceptedByName = $goodsReceipt->acceptedBy?->name
            ?: $goodsReceipt->postedBy?->name
            ?: ($acceptanceCompleted ? 'N/A' : 'Pending');
        $acceptedAt = optional($goodsReceipt->accepted_at)->format('d/m/Y h:i A')
            ?: optional($goodsReceipt->posted_at)->format('d/m/Y h:i A')
            ?: ($acceptanceCompleted ? 'N/A' : 'Pending');

        return [
            'title' => 'Goods Receipt Note',
            'companyName' => $tenantName,
            'logoDataUri' => $this->documentLogoDataUri(),
            'generatedAt' => now()->format('d/m/Y h:i A'),
            'autoPrint' => $autoPrint,
            'signatories' => [
                'prepared_by_name' => $preparedByName,
                'prepared_at' => $preparedAt,
                'verified_by_name' => $verifiedByName,
                'verified_at' => $verifiedAt,
                'accepted_by_name' => $acceptedByName,
                'accepted_at' => $acceptedAt,
            ],
            'grn' => [
                'number' => $goodsReceipt->grn_no,
                'status' => strtoupper(str_replace('_', ' ', (string) $goodsReceipt->status)),
                'received_date' => optional($goodsReceipt->received_date)->format('d/m/Y') ?: '-',
                'purchase_order_no' => $goodsReceipt->purchaseOrder?->po_no ?: '-',
                'warehouse' => $goodsReceipt->warehouse?->name ?: '-',
                'location' => $goodsReceipt->warehouseLocation?->name ?: '-',
                'restaurant' => $tenantName,
                'remarks' => $goodsReceipt->remarks ?: '-',
            ],
            'vendor' => [
                'name' => $goodsReceipt->vendor?->name ?: '-',
                'code' => $goodsReceipt->vendor?->code ?: '-',
                'phone' => $goodsReceipt->vendor?->phone ?: '-',
                'email' => $goodsReceipt->vendor?->email ?: '-',
                'address' => $goodsReceipt->vendor?->address ?: '-',
            ],
            'lineItems' => $lineItems,
            'totals' => [
                'grand_total' => number_format($total, 2, '.', ','),
            ],
        ];
    }

    private function documentLogoDataUri(): ?string
    {
        return app(StaticDocumentBrandingResolver::class)->resolveLogoDataUri();
    }

    private function resolveGoodsReceiptVerifiedFallback(int $goodsReceiptId): ?array
    {
        if ($goodsReceiptId <= 0) {
            return null;
        }

        $action = ApprovalAction::query()
            ->where('document_type', 'goods_receipt')
            ->where('document_id', $goodsReceiptId)
            ->whereNotNull('action_by')
            ->orderByDesc('id')
            ->first(['action_by', 'created_at']);

        if (!$action) {
            return null;
        }

        $name = (string) (User::query()->whereKey($action->action_by)->value('name') ?? '');
        if ($name === '') {
            return null;
        }

        return [
            'name' => $name,
            'at' => optional($action->created_at)->format('d/m/Y h:i A') ?: 'N/A',
        ];
    }
}
