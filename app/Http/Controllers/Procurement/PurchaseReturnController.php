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

        $query = PurchaseReturn::query()->with(['vendor:id,name', 'warehouse:id,name']);

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

        return Inertia::render('App/Admin/Procurement/PurchaseReturns/Index', [
            'returns' => $query->latest('id')->paginate($perPage)->withQueryString(),
            'summary' => [
                'count' => (int) $query->count(),
                'total' => (float) (clone $query)->sum('grand_total'),
                'posted' => (int) (clone $query)->where('status', 'posted')->count(),
            ],
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/PurchaseReturns/Create', [
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name', 'tenant_id']),
            'inventoryItems' => InventoryItem::query()->procurementEligible()->orderBy('name')->get(['id', 'name', 'sku', 'default_unit_cost']),
            'goodsReceipts' => GoodsReceipt::query()->orderByDesc('id')->limit(100)->get(['id', 'grn_no']),
            'vendorBills' => VendorBill::query()->orderByDesc('id')->limit(100)->get(['id', 'bill_no']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'tenant_id' => 'nullable|exists:tenants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'goods_receipt_id' => 'nullable|exists:goods_receipts,id',
            'vendor_bill_id' => 'nullable|exists:vendor_bills,id',
            'return_date' => 'required|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.qty_returned' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $this->validateReturnCaps(
            items: $data['items'],
            goodsReceiptId: $data['goods_receipt_id'] ?? null,
            vendorBillId: $data['vendor_bill_id'] ?? null,
            excludePurchaseReturnId: null,
            statusesToCount: ['draft', 'submitted', 'posted'],
        );

        $purchaseReturn = DB::transaction(function () use ($data) {
            $returnNo = $this->workflowService->nextDocumentNumber('purchase_return');
            $purchaseReturn = PurchaseReturn::query()->create([
                'return_no' => $returnNo,
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => $data['tenant_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'],
                'warehouse_location_id' => $data['warehouse_location_id'] ?? null,
                'goods_receipt_id' => $data['goods_receipt_id'] ?? null,
                'vendor_bill_id' => $data['vendor_bill_id'] ?? null,
                'return_date' => $data['return_date'],
                'status' => 'draft',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $total = 0;
            foreach ($data['items'] as $item) {
                $lineTotal = (float) $item['qty_returned'] * (float) $item['unit_cost'];
                $total += $lineTotal;
                $purchaseReturn->items()->create([
                    'inventory_item_id' => $item['inventory_item_id'],
                    'qty_returned' => $item['qty_returned'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ]);
            }

            $purchaseReturn->update(['grand_total' => $total]);
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
            $purchaseReturn->load('items');

            if ($purchaseReturn->goods_receipt_id) {
                GoodsReceiptItem::query()
                    ->where('goods_receipt_id', $purchaseReturn->goods_receipt_id)
                    ->lockForUpdate()
                    ->get(['id']);
            }

            if ($purchaseReturn->vendor_bill_id) {
                VendorBillItem::query()
                    ->where('vendor_bill_id', $purchaseReturn->vendor_bill_id)
                    ->lockForUpdate()
                    ->get(['id']);
            }

            $this->validateReturnCaps(
                items: $purchaseReturn->items->map(fn ($item) => [
                    'inventory_item_id' => $item->inventory_item_id,
                    'qty_returned' => $item->qty_returned,
                ])->all(),
                goodsReceiptId: $purchaseReturn->goods_receipt_id,
                vendorBillId: $purchaseReturn->vendor_bill_id,
                excludePurchaseReturnId: $purchaseReturn->id,
                statusesToCount: ['draft', 'submitted', 'posted'],
            );

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
                'posting_key' => "purchase-return:{$purchaseReturn->id}",
                'approved_at' => now(),
                'approved_by' => auth()->id(),
                'posted_at' => now(),
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            foreach ($purchaseReturn->items as $item) {
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

            $this->workflowService->maybeQueueAccountingEvent($inventoryDocument);

            $purchaseReturn->update([
                'status' => 'posted',
                'approved_at' => now(),
                'posted_at' => now(),
            ]);
        });

        return back()->with('success', 'Purchase return approved and posted.');
    }

    public function reject(PurchaseReturn $purchaseReturn)
    {
        $purchaseReturn->update(['status' => 'rejected']);
        return back()->with('success', 'Purchase return rejected.');
    }

    private function validateReturnCaps(
        array $items,
        ?int $goodsReceiptId,
        ?int $vendorBillId,
        ?int $excludePurchaseReturnId,
        array $statusesToCount
    ): void {
        if (!$goodsReceiptId && !$vendorBillId) {
            return;
        }

        $eligibleByItem = $this->sourceEligibleByItem($goodsReceiptId, $vendorBillId);
        $alreadyReturnedByItem = $this->alreadyReturnedByItem(
            goodsReceiptId: $goodsReceiptId,
            vendorBillId: $vendorBillId,
            excludePurchaseReturnId: $excludePurchaseReturnId,
            statusesToCount: $statusesToCount,
        );

        $requestedByItem = [];
        foreach ($items as $item) {
            $itemId = (int) $item['inventory_item_id'];
            $requestedByItem[$itemId] = ($requestedByItem[$itemId] ?? 0) + (float) ($item['qty_returned'] ?? 0);
        }

        $errors = [];
        foreach ($requestedByItem as $itemId => $requestedQty) {
            $eligibleQty = (float) ($eligibleByItem[$itemId] ?? 0);
            $alreadyQty = (float) ($alreadyReturnedByItem[$itemId] ?? 0);
            $remainingQty = max(0, $eligibleQty - $alreadyQty);

            if ($requestedQty > $remainingQty + 0.0001) {
                $itemName = InventoryItem::query()->whereKey($itemId)->value('name') ?: "Item {$itemId}";
                $errors["items.{$itemId}"] = "Return quantity exceeds remaining eligible quantity for {$itemName}. Remaining: " . number_format($remainingQty, 3) . '.';
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function sourceEligibleByItem(?int $goodsReceiptId, ?int $vendorBillId): array
    {
        $fromReceipt = [];
        if ($goodsReceiptId) {
            $fromReceipt = GoodsReceiptItem::query()
                ->where('goods_receipt_id', $goodsReceiptId)
                ->selectRaw('inventory_item_id, SUM(qty_received) as qty')
                ->groupBy('inventory_item_id')
                ->pluck('qty', 'inventory_item_id')
                ->map(fn ($qty) => (float) $qty)
                ->all();
        }

        $fromBill = [];
        if ($vendorBillId) {
            $fromBill = VendorBillItem::query()
                ->where('vendor_bill_id', $vendorBillId)
                ->selectRaw('inventory_item_id, SUM(qty) as qty')
                ->groupBy('inventory_item_id')
                ->pluck('qty', 'inventory_item_id')
                ->map(fn ($qty) => (float) $qty)
                ->all();
        }

        if ($goodsReceiptId && $vendorBillId) {
            $keys = array_unique(array_merge(array_keys($fromReceipt), array_keys($fromBill)));
            $combined = [];
            foreach ($keys as $key) {
                $receiptQty = (float) ($fromReceipt[$key] ?? 0);
                $billQty = (float) ($fromBill[$key] ?? 0);
                $combined[$key] = min($receiptQty, $billQty);
            }

            return $combined;
        }

        return $goodsReceiptId ? $fromReceipt : $fromBill;
    }

    private function alreadyReturnedByItem(
        ?int $goodsReceiptId,
        ?int $vendorBillId,
        ?int $excludePurchaseReturnId,
        array $statusesToCount
    ): array {
        $query = PurchaseReturnItem::query()
            ->join('purchase_returns', 'purchase_returns.id', '=', 'purchase_return_items.purchase_return_id')
            ->selectRaw('purchase_return_items.inventory_item_id as inventory_item_id, SUM(purchase_return_items.qty_returned) as qty')
            ->whereIn('purchase_returns.status', $statusesToCount)
            ->groupBy('purchase_return_items.inventory_item_id');

        if ($goodsReceiptId) {
            $query->where('purchase_returns.goods_receipt_id', $goodsReceiptId);
        }

        if ($vendorBillId) {
            $query->where('purchase_returns.vendor_bill_id', $vendorBillId);
        }

        if ($excludePurchaseReturnId) {
            $query->where('purchase_returns.id', '!=', $excludePurchaseReturnId);
        }

        return $query->pluck('qty', 'inventory_item_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();
    }
}
