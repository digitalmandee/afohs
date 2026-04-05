<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\InventoryDocument;
use App\Models\InventoryItem;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\VendorBillItem;
use App\Models\Warehouse;
use App\Services\Inventory\InventoryDocumentWorkflowService;
use App\Services\Inventory\InventoryMovementService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PurchaseReturnController extends Controller
{
    public function __construct(
        private readonly InventoryMovementService $movementService,
        private readonly InventoryDocumentWorkflowService $workflowService,
    ) {
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = PurchaseReturn::query()->with(['vendor:id,name', 'warehouse:id,name', 'goodsReceipt:id,grn_no', 'vendorBill:id,bill_no']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder->where('return_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', fn ($vendor) => $vendor->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        return Inertia::render('App/Admin/Procurement/PurchaseReturns/Index', [
            'returns' => $query->latest('id')->paginate($perPage)->withQueryString(),
            'summary' => [
                'count' => (int) (clone $query)->count(),
                'total' => (float) (clone $query)->sum('grand_total'),
                'posted' => (int) (clone $query)->where('status', 'posted')->count(),
                'unapplied_credit' => (float) (clone $query)
                    ->where('status', 'posted')
                    ->where('credit_status', 'unapplied')
                    ->sum('vendor_credit_amount'),
            ],
            'filters' => $request->only(['search', 'status', 'vendor_id', 'per_page']),
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/PurchaseReturns/Create', [
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name', 'tenant_id']),
            'inventoryItems' => InventoryItem::query()->procurementEligible()->orderBy('name')->get(['id', 'name', 'sku', 'default_unit_cost']),
            'goodsReceipts' => GoodsReceipt::query()
                ->with(['vendor:id,name'])
                ->whereIn('status', ['accepted', 'received'])
                ->orderByDesc('id')
                ->limit(200)
                ->get(['id', 'grn_no', 'vendor_id', 'received_date', 'warehouse_id']),
            'vendorBills' => VendorBill::query()->orderByDesc('id')->limit(100)->get(['id', 'bill_no']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function sourceFromGrn(GoodsReceipt $goodsReceipt): JsonResponse
    {
        $goodsReceipt->load([
            'vendor:id,name',
            'tenant:id,name',
            'warehouse:id,name',
            'warehouseLocation:id,name',
            'items.inventoryItem:id,name,sku',
        ]);

        $alreadyReturnedByItem = $this->alreadyReturnedByItem(
            goodsReceiptId: $goodsReceipt->id,
            excludePurchaseReturnId: null,
            statusesToCount: ['draft', 'submitted', 'posted'],
        );

        $billOptions = VendorBill::query()
            ->where('goods_receipt_id', $goodsReceipt->id)
            ->whereNotIn('status', ['void', 'draft'])
            ->orderByDesc('id')
            ->get(['id', 'bill_no', 'grand_total', 'paid_amount', 'advance_applied_amount', 'return_applied_amount'])
            ->map(function (VendorBill $bill) {
                return [
                    'id' => $bill->id,
                    'bill_no' => $bill->bill_no,
                    'outstanding' => $this->billOutstanding($bill),
                ];
            })
            ->values();

        $lines = $goodsReceipt->items
            ->groupBy('inventory_item_id')
            ->map(function ($rows, $itemId) use ($alreadyReturnedByItem) {
                $receivedQty = (float) $rows->sum('qty_received');
                $receivedValue = (float) $rows->sum('line_total');
                $alreadyQty = (float) ($alreadyReturnedByItem[(int) $itemId] ?? 0);
                $returnableQty = max(0, $receivedQty - $alreadyQty);
                $defaultUnitCost = $receivedQty > 0 ? ($receivedValue / $receivedQty) : (float) ($rows->first()?->unit_cost ?? 0);
                $firstItem = $rows->first()?->inventoryItem;

                return [
                    'inventory_item_id' => (int) $itemId,
                    'item_name' => $firstItem?->name ?: ('Item ' . $itemId),
                    'sku' => $firstItem?->sku,
                    'received_qty' => $receivedQty,
                    'already_returned_qty' => $alreadyQty,
                    'returnable_qty' => $returnableQty,
                    'default_unit_cost' => round($defaultUnitCost, 4),
                ];
            })
            ->values();

        return response()->json([
            'source_type' => 'grn',
            'source_id' => $goodsReceipt->id,
            'grn' => [
                'id' => $goodsReceipt->id,
                'grn_no' => $goodsReceipt->grn_no,
                'received_date' => optional($goodsReceipt->received_date)->toDateString(),
                'status' => $goodsReceipt->status,
            ],
            'vendor' => $goodsReceipt->vendor ? ['id' => $goodsReceipt->vendor->id, 'name' => $goodsReceipt->vendor->name] : null,
            'tenant' => $goodsReceipt->tenant ? ['id' => $goodsReceipt->tenant->id, 'name' => $goodsReceipt->tenant->name] : null,
            'warehouse' => $goodsReceipt->warehouse ? ['id' => $goodsReceipt->warehouse->id, 'name' => $goodsReceipt->warehouse->name] : null,
            'warehouse_location' => $goodsReceipt->warehouseLocation ? ['id' => $goodsReceipt->warehouseLocation->id, 'name' => $goodsReceipt->warehouseLocation->name] : null,
            'vendor_bills' => $billOptions,
            'lines' => $lines,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'source_type' => 'required|in:grn',
            'source_id' => 'required|exists:goods_receipts,id',
            'vendor_bill_id' => 'nullable|exists:vendor_bills,id',
            'return_date' => 'required|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.qty_returned' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $goodsReceipt = GoodsReceipt::query()->with(['vendor:id,name', 'tenant:id,name', 'warehouse:id,name', 'warehouseLocation:id,name'])->findOrFail((int) $data['source_id']);
        $this->assertGrnIsReturnable($goodsReceipt);

        $vendorBill = null;
        if (!empty($data['vendor_bill_id'])) {
            $vendorBill = VendorBill::query()->findOrFail((int) $data['vendor_bill_id']);
            $this->assertBillMatchesSource($vendorBill, $goodsReceipt);
        }

        $this->validateReturnCaps(
            items: $data['items'],
            goodsReceiptId: $goodsReceipt->id,
            excludePurchaseReturnId: null,
            statusesToCount: ['draft', 'submitted', 'posted'],
        );

        $total = collect($data['items'])->sum(fn ($item) => (float) $item['qty_returned'] * (float) $item['unit_cost']);
        if ($vendorBill && $total > $this->billOutstanding($vendorBill) + 0.01) {
            throw ValidationException::withMessages([
                'vendor_bill_id' => 'Return total exceeds linked vendor bill outstanding.',
            ]);
        }

        $purchaseReturn = DB::transaction(function () use ($data, $goodsReceipt, $total) {
            $returnNo = $this->workflowService->nextDocumentNumber('purchase_return');
            $purchaseReturn = PurchaseReturn::query()->create([
                'return_no' => $returnNo,
                'source_type' => 'grn',
                'source_id' => $goodsReceipt->id,
                'vendor_id' => $goodsReceipt->vendor_id,
                'tenant_id' => $goodsReceipt->tenant_id,
                'warehouse_id' => $goodsReceipt->warehouse_id,
                'warehouse_location_id' => $goodsReceipt->warehouse_location_id,
                'goods_receipt_id' => $goodsReceipt->id,
                'vendor_bill_id' => $data['vendor_bill_id'] ?? null,
                'return_date' => $data['return_date'],
                'status' => 'draft',
                'grand_total' => $total,
                'vendor_credit_amount' => 0,
                'credit_status' => 'none',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $item) {
                $lineTotal = (float) $item['qty_returned'] * (float) $item['unit_cost'];
                $purchaseReturn->items()->create([
                    'inventory_item_id' => $item['inventory_item_id'],
                    'qty_returned' => $item['qty_returned'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ]);
            }

            return $purchaseReturn;
        });

        return redirect()->route('procurement.purchase-returns.index')
            ->with('success', "Purchase return {$purchaseReturn->return_no} created.");
    }

    public function submit(PurchaseReturn $purchaseReturn)
    {
        if ($purchaseReturn->status !== 'draft') {
            return back()->with('error', 'Only draft purchase returns can be submitted.');
        }

        $purchaseReturn->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'purchase_return',
            'document_id' => $purchaseReturn->id,
            'action' => 'submitted',
            'remarks' => 'Purchase return submitted.',
            'action_by' => auth()->id(),
        ]);

        return back()->with('success', 'Purchase return submitted.');
    }

    public function approve(PurchaseReturn $purchaseReturn)
    {
        if (!in_array($purchaseReturn->status, ['draft', 'submitted'], true)) {
            return back()->with('error', 'Purchase return cannot be approved in current state.');
        }

        DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn = PurchaseReturn::query()->lockForUpdate()->findOrFail($purchaseReturn->id);
            if (!in_array($purchaseReturn->status, ['draft', 'submitted'], true)) {
                throw ValidationException::withMessages([
                    'status' => 'Purchase return is already processed.',
                ]);
            }

            $purchaseReturn->load('items');
            $goodsReceipt = GoodsReceipt::query()->lockForUpdate()->find($purchaseReturn->goods_receipt_id);
            if (!$goodsReceipt) {
                throw ValidationException::withMessages([
                    'source_id' => 'Linked goods receipt was not found.',
                ]);
            }

            $this->assertGrnIsReturnable($goodsReceipt);

            GoodsReceiptItem::query()
                ->where('goods_receipt_id', $goodsReceipt->id)
                ->lockForUpdate()
                ->get(['id']);

            PurchaseReturn::query()
                ->where('goods_receipt_id', $goodsReceipt->id)
                ->whereIn('status', ['draft', 'submitted', 'posted'])
                ->lockForUpdate()
                ->get(['id']);

            $vendorBill = null;
            if ($purchaseReturn->vendor_bill_id) {
                $vendorBill = VendorBill::query()->lockForUpdate()->find($purchaseReturn->vendor_bill_id);
                if (!$vendorBill) {
                    throw ValidationException::withMessages([
                        'vendor_bill_id' => 'Linked vendor bill was not found.',
                    ]);
                }
                $this->assertBillMatchesSource($vendorBill, $goodsReceipt);
                VendorBillItem::query()
                    ->where('vendor_bill_id', $vendorBill->id)
                    ->lockForUpdate()
                    ->get(['id']);
            }

            $this->validateReturnCaps(
                items: $purchaseReturn->items->map(fn ($item) => [
                    'inventory_item_id' => $item->inventory_item_id,
                    'qty_returned' => $item->qty_returned,
                ])->values()->all(),
                goodsReceiptId: $goodsReceipt->id,
                excludePurchaseReturnId: $purchaseReturn->id,
                statusesToCount: ['draft', 'submitted', 'posted'],
            );

            $postingKey = "purchase-return:{$purchaseReturn->id}";
            if (InventoryDocument::query()->where('posting_key', $postingKey)->exists()) {
                throw ValidationException::withMessages([
                    'status' => 'Purchase return is already posted.',
                ]);
            }

            $inventoryDocument = InventoryDocument::query()->create([
                'document_no' => $purchaseReturn->return_no,
                'tenant_id' => $purchaseReturn->tenant_id,
                'type' => 'purchase_return',
                'source_warehouse_id' => $purchaseReturn->warehouse_id,
                'source_warehouse_location_id' => $purchaseReturn->warehouse_location_id,
                'transaction_date' => $purchaseReturn->return_date,
                'status' => 'posted',
                'approval_status' => 'approved',
                'remarks' => $purchaseReturn->remarks ?: 'Purchase return posted.',
                'source_document_type' => PurchaseReturn::class,
                'source_document_id' => $purchaseReturn->id,
                'posting_key' => $postingKey,
                'approved_at' => now(),
                'approved_by' => auth()->id(),
                'posted_at' => now(),
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            foreach ($purchaseReturn->items as $item) {
                $inventoryDocument->lines()->create([
                    'inventory_item_id' => $item->inventory_item_id,
                    'quantity' => $item->qty_returned,
                    'unit_cost' => $item->unit_cost,
                    'line_total' => $item->line_total,
                    'remarks' => 'Purchase return line',
                ]);

                $this->movementService->record([
                    'inventory_item_id' => $item->inventory_item_id,
                    'tenant_id' => $purchaseReturn->tenant_id,
                    'warehouse_id' => $purchaseReturn->warehouse_id,
                    'warehouse_location_id' => $purchaseReturn->warehouse_location_id,
                    'transaction_date' => $purchaseReturn->return_date,
                    'type' => 'return_out',
                    'qty_in' => 0,
                    'qty_out' => $item->qty_returned,
                    'unit_cost' => $item->unit_cost,
                    'total_cost' => $item->line_total,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $inventoryDocument->id,
                    'reason' => 'Purchase return',
                    'created_by' => auth()->id(),
                ]);
            }

            $creditAmount = 0.0;
            $creditStatus = 'none';
            if ($vendorBill) {
                $outstanding = $this->billOutstanding($vendorBill);
                if ((float) $purchaseReturn->grand_total > $outstanding + 0.01) {
                    throw ValidationException::withMessages([
                        'vendor_bill_id' => 'Return total exceeds linked vendor bill outstanding at approval time.',
                    ]);
                }

                $vendorBill->return_applied_amount = (float) $vendorBill->return_applied_amount + (float) $purchaseReturn->grand_total;
                $billOutstandingAfter = $this->billOutstanding($vendorBill);
                if ($billOutstandingAfter <= 0.01) {
                    $vendorBill->status = 'paid';
                } elseif (((float) $vendorBill->paid_amount + (float) $vendorBill->advance_applied_amount + (float) $vendorBill->return_applied_amount) > 0.009) {
                    $vendorBill->status = 'partially_paid';
                } else {
                    $vendorBill->status = 'posted';
                }
                $vendorBill->save();
                $creditStatus = 'applied';
            } else {
                $creditAmount = (float) $purchaseReturn->grand_total;
                $creditStatus = 'unapplied';
            }

            $this->workflowService->maybeQueueAccountingEvent($inventoryDocument);

            $purchaseReturn->update([
                'status' => 'posted',
                'vendor_credit_amount' => $creditAmount,
                'credit_status' => $creditStatus,
                'approved_at' => now(),
                'posted_at' => now(),
            ]);

            ApprovalAction::query()->create([
                'document_type' => 'purchase_return',
                'document_id' => $purchaseReturn->id,
                'action' => 'approved',
                'remarks' => 'Purchase return approved and posted.',
                'action_by' => auth()->id(),
            ]);
        });

        return back()->with('success', 'Purchase return approved and posted.');
    }

    public function reject(PurchaseReturn $purchaseReturn)
    {
        $purchaseReturn->update(['status' => 'rejected']);

        ApprovalAction::query()->create([
            'document_type' => 'purchase_return',
            'document_id' => $purchaseReturn->id,
            'action' => 'rejected',
            'remarks' => 'Purchase return rejected.',
            'action_by' => auth()->id(),
        ]);

        return back()->with('success', 'Purchase return rejected.');
    }

    private function validateReturnCaps(
        array $items,
        int $goodsReceiptId,
        ?int $excludePurchaseReturnId,
        array $statusesToCount
    ): void {
        $eligibleByItem = $this->sourceEligibleByItem($goodsReceiptId);
        $alreadyReturnedByItem = $this->alreadyReturnedByItem(
            goodsReceiptId: $goodsReceiptId,
            excludePurchaseReturnId: $excludePurchaseReturnId,
            statusesToCount: $statusesToCount,
        );

        $requestedByItem = [];
        $lineMap = [];
        foreach ($items as $index => $item) {
            $itemId = (int) $item['inventory_item_id'];
            $requestedByItem[$itemId] = ($requestedByItem[$itemId] ?? 0) + (float) ($item['qty_returned'] ?? 0);
            $lineMap[$itemId][] = $index;
        }

        $errors = [];
        foreach ($requestedByItem as $itemId => $requestedQty) {
            $eligibleQty = (float) ($eligibleByItem[$itemId] ?? 0);
            $alreadyQty = (float) ($alreadyReturnedByItem[$itemId] ?? 0);
            $remainingQty = max(0, $eligibleQty - $alreadyQty);

            if ($requestedQty > $remainingQty + 0.0001) {
                $itemName = InventoryItem::query()->whereKey($itemId)->value('name') ?: "Item {$itemId}";
                foreach ($lineMap[$itemId] ?? [] as $lineIndex) {
                    $errors["items.{$lineIndex}.qty_returned"] = "Return quantity exceeds remaining eligible quantity for {$itemName}. Remaining: " . number_format($remainingQty, 3) . '.';
                }
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function sourceEligibleByItem(int $goodsReceiptId): array
    {
        return GoodsReceiptItem::query()
            ->where('goods_receipt_id', $goodsReceiptId)
            ->selectRaw('inventory_item_id, SUM(qty_received) as qty')
            ->groupBy('inventory_item_id')
            ->pluck('qty', 'inventory_item_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();
    }

    private function alreadyReturnedByItem(
        int $goodsReceiptId,
        ?int $excludePurchaseReturnId,
        array $statusesToCount
    ): array {
        $query = PurchaseReturnItem::query()
            ->join('purchase_returns', 'purchase_returns.id', '=', 'purchase_return_items.purchase_return_id')
            ->selectRaw('purchase_return_items.inventory_item_id as inventory_item_id, SUM(purchase_return_items.qty_returned) as qty')
            ->whereIn('purchase_returns.status', $statusesToCount)
            ->where('purchase_returns.goods_receipt_id', $goodsReceiptId)
            ->groupBy('purchase_return_items.inventory_item_id');

        if ($excludePurchaseReturnId) {
            $query->where('purchase_returns.id', '!=', $excludePurchaseReturnId);
        }

        return $query->pluck('qty', 'inventory_item_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();
    }

    private function assertGrnIsReturnable(GoodsReceipt $goodsReceipt): void
    {
        if (!in_array($goodsReceipt->status, ['accepted', 'received'], true)) {
            throw ValidationException::withMessages([
                'source_id' => 'Only accepted goods receipts can be used for purchase returns.',
            ]);
        }
    }

    private function assertBillMatchesSource(VendorBill $vendorBill, GoodsReceipt $goodsReceipt): void
    {
        if ((int) $vendorBill->vendor_id !== (int) $goodsReceipt->vendor_id) {
            throw ValidationException::withMessages([
                'vendor_bill_id' => 'Selected vendor bill does not match GRN vendor.',
            ]);
        }

        if ((int) ($vendorBill->goods_receipt_id ?? 0) !== (int) $goodsReceipt->id) {
            throw ValidationException::withMessages([
                'vendor_bill_id' => 'Selected vendor bill does not belong to selected GRN.',
            ]);
        }
    }

    private function billOutstanding(VendorBill $vendorBill): float
    {
        return max(0, (float) $vendorBill->grand_total
            - (float) $vendorBill->paid_amount
            - (float) $vendorBill->advance_applied_amount
            - (float) $vendorBill->return_applied_amount);
    }
}
