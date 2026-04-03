<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\AccountingEventQueue;
use App\Models\GoodsReceipt;
use App\Models\JournalEntry;
use App\Models\PurchaseOrder;
use App\Models\VendorItemMapping;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\Accounting\AccountingEventDispatcher;
use App\Services\Inventory\InventoryMovementService;
use Illuminate\Validation\ValidationException;

class GoodsReceiptController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = GoodsReceipt::with('vendor', 'warehouse', 'warehouseLocation', 'purchaseOrder', 'tenant');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('grn_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'received', 'cancelled'], true)) {
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
            'received' => (int) ($statusBreakdown['received'] ?? 0),
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
            return $receipt;
        });

        return Inertia::render('App/Admin/Procurement/GoodsReceipts/Index', [
            'receipts' => $receipts,
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name']),
            'warehouseLocations' => WarehouseLocation::query()->orderBy('name')->get(['id', 'warehouse_id', 'name', 'code']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'vendor_id', 'warehouse_id', 'tenant_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function create(Request $request)
    {
        $purchaseOrder = null;
        if ($request->filled('purchase_order_id')) {
            $purchaseOrder = PurchaseOrder::with(['items.inventoryItem', 'warehouse.locations', 'warehouse.tenant', 'tenant', 'vendor'])->find($request->purchase_order_id);
        }

        $purchaseOrders = PurchaseOrder::with(['vendor:id,name', 'warehouse:id,name,tenant_id', 'warehouse.locations:id,warehouse_id,name,code,status,is_primary', 'items.inventoryItem:id,name', 'tenant:id,name'])
            ->orderByDesc('order_date')
            ->limit(200)
            ->get(['id', 'po_no', 'vendor_id', 'warehouse_id', 'tenant_id', 'order_date', 'status']);

        return Inertia::render('App/Admin/Procurement/GoodsReceipts/Create', [
            'purchaseOrder' => $purchaseOrder,
            'purchaseOrders' => $purchaseOrders,
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

        $data = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.qty_received' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $po = PurchaseOrder::with('vendor', 'warehouse')->findOrFail($data['purchase_order_id']);
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

            if ((int) $poItem->inventory_item_id !== (int) $item['inventory_item_id']) {
                throw ValidationException::withMessages([
                    "items.{$index}.inventory_item_id" => 'Inventory item mismatch for selected purchase order item.',
                ]);
            }

            $alreadyReceived = (float) ($previousReceived[$poItem->id] ?? 0);
            $available = max(0, (float) $poItem->qty_ordered - $alreadyReceived);
            if ((float) $item['qty_received'] > $available + 0.0001) {
                throw ValidationException::withMessages([
                    "items.{$index}.qty_received" => "Cannot receive more than available qty ({$available}) for this item.",
                ]);
            }

            $inventoryItem = \App\Models\InventoryItem::query()
                ->find($item['inventory_item_id'], ['id', 'name', 'purchase_price_mode', 'fixed_purchase_price', 'allow_price_override', 'max_price_variance_percent']);
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
        }

        $receipt = GoodsReceipt::create([
            'grn_no' => 'GRN-' . now()->format('YmdHis'),
            'purchase_order_id' => $po->id,
            'vendor_id' => $po->vendor_id,
            'tenant_id' => $po->tenant_id ?: $po->warehouse?->tenant_id,
            'warehouse_id' => $po->warehouse_id,
            'warehouse_location_id' => $locationId,
            'received_date' => $data['received_date'],
            'status' => 'received',
            'remarks' => $data['remarks'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        $total = 0;
        foreach ($data['items'] as $item) {
            $lineTotal = $item['qty_received'] * $item['unit_cost'];
            $total += $lineTotal;
            $receipt->items()->create([
                'purchase_order_item_id' => $item['purchase_order_item_id'],
                'product_id' => null,
                'inventory_item_id' => $item['inventory_item_id'],
                'qty_received' => $item['qty_received'],
                'unit_cost' => $item['unit_cost'],
                'line_total' => $lineTotal,
            ]);

            $inventoryMovementService->record([
                'product_id' => null,
                'inventory_item_id' => $item['inventory_item_id'],
                'tenant_id' => $po->tenant_id ?: $po->warehouse?->tenant_id,
                'warehouse_id' => $po->warehouse_id,
                'warehouse_location_id' => $locationId,
                'transaction_date' => $data['received_date'],
                'type' => 'purchase',
                'qty_in' => $item['qty_received'],
                'qty_out' => 0,
                'unit_cost' => $item['unit_cost'],
                'total_cost' => $lineTotal,
                'reference_type' => GoodsReceipt::class,
                'reference_id' => $receipt->id,
                'reason' => 'Purchase receipt',
                'status' => 'posted',
                'created_by' => $request->user()?->id,
            ]);

            $poItem = $poItems->get($item['purchase_order_item_id']);
            if ($poItem) {
                $poItem->qty_received = (float) $poItem->qty_received + (float) $item['qty_received'];
                $poItem->save();
            }

            VendorItemMapping::query()->updateOrCreate(
                [
                    'vendor_id' => $po->vendor_id,
                    'inventory_item_id' => $item['inventory_item_id'],
                ],
                [
                    'tenant_id' => $po->tenant_id ?: $po->warehouse?->tenant_id,
                    'last_purchase_price' => $item['unit_cost'],
                    'currency' => 'PKR',
                    'is_active' => true,
                ]
            );
        }

        $remaining = $po->items()->whereColumn('qty_received', '<', 'qty_ordered')->count();
        $po->status = $remaining === 0 ? 'received' : 'partially_received';
        $po->save();

        app(AccountingEventDispatcher::class)->dispatch(
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
            $request->user()?->id,
            $receipt->tenant_id
        );

        return redirect()->route('procurement.goods-receipts.index')->with('success', 'Goods receipt created.');
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
}
