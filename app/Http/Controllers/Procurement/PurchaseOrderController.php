<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\Ingredient;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\PurchaseOrder;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = PurchaseOrder::with('vendor', 'warehouse', 'tenant');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('po_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'approved', 'partially_received', 'received', 'cancelled'], true)) {
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
            $query->whereBetween('order_date', [$request->from, $request->to]);
        }

        $summaryQuery = clone $query;
        $statusBreakdown = (clone $query)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $summary = [
            'count' => (int) $summaryQuery->count(),
            'total_value' => (float) ((clone $query)->sum('grand_total') ?? 0),
            'draft' => (int) ($statusBreakdown['draft'] ?? 0),
            'approved' => (int) ($statusBreakdown['approved'] ?? 0),
            'received' => (int) (($statusBreakdown['partially_received'] ?? 0) + ($statusBreakdown['received'] ?? 0)),
            'cancelled' => (int) ($statusBreakdown['cancelled'] ?? 0),
        ];

        $orders = $query->orderByDesc('order_date')->paginate($perPage)->withQueryString();
        $latestActions = ApprovalAction::query()
            ->where('document_type', 'purchase_order')
            ->whereIn('document_id', $orders->getCollection()->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('document_id')
            ->keyBy('document_id');
        $orders->getCollection()->transform(function ($order) use ($latestActions) {
            $action = $latestActions->get($order->id);
            $order->accounting_status = 'non_posting';
            $order->latest_approval_action = $action ? [
                'action' => $action->action,
                'remarks' => $action->remarks,
                'created_at' => $action->created_at,
            ] : null;
            return $order;
        });

        return Inertia::render('App/Admin/Procurement/PurchaseOrders/Index', [
            'orders' => $orders,
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'vendor_id', 'warehouse_id', 'tenant_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function create()
    {
        $warehouses = Warehouse::with('tenant:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'tenant_id', 'status']);

        $products = $this->buildProcurementProductOptions($warehouses->pluck('id')->all());
        $productCount = $products->count();
        $legacyOnlyIngredients = Ingredient::query()->whereNull('inventory_item_id')->count();
        $linkedIngredients = Ingredient::query()->whereNotNull('inventory_item_id')->count();

        return Inertia::render('App/Admin/Procurement/PurchaseOrders/Create', [
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
            'warehouses' => $warehouses,
            'products' => $products->values(),
            'inventorySummary' => [
                'product_count' => $productCount,
                'linked_ingredients' => $linkedIngredients,
                'legacy_only_ingredients' => $legacyOnlyIngredients,
                'empty_reason' => $productCount === 0
                    ? ($legacyOnlyIngredients > 0
                        ? 'Ingredients exist, but they are not linked to warehouse inventory items yet.'
                        : 'No purchasable inventory items are configured yet.')
                    : null,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $request->merge([
            'items' => collect($request->input('items', []))->map(function ($item) {
                if (!isset($item['inventory_item_id']) && isset($item['product_id'])) {
                    $item['inventory_item_id'] = $item['product_id'];
                }
                return $item;
            })->all(),
        ]);

        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:vendors,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date',
            'currency' => 'nullable|string|max:8',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => [
                'required',
                Rule::exists('inventory_items', 'id'),
            ],
            'items.*.qty_ordered' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            Log::channel('procurement')->warning('procurement.purchase_order.store.validation_failed', [
                'event' => 'procurement.purchase_order.store.validation_failed',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'vendor_id' => $request->input('vendor_id'),
                'warehouse_id' => $request->input('warehouse_id'),
                'item_count' => count($request->input('items', [])),
                'errors' => $validator->errors()->toArray(),
            ]);

            throw new ValidationException($validator);
        }

        $data = $validator->validated();
        $submittedItemIds = collect($data['items'] ?? [])
            ->pluck('inventory_item_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $eligibleIds = InventoryItem::query()
            ->procurementEligible()
            ->whereIn('id', $submittedItemIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id);

        $inventoryItems = InventoryItem::query()
            ->whereIn('id', $submittedItemIds)
            ->get(['id', 'legacy_product_id', 'name', 'purchase_price_mode', 'fixed_purchase_price', 'allow_price_override', 'max_price_variance_percent'])
            ->keyBy('id');

        $invalidIds = $submittedItemIds->diff($eligibleIds)->values();
        if ($invalidIds->isNotEmpty()) {
            $ineligibleErrors = [];
            foreach (($data['items'] ?? []) as $index => $item) {
                if (in_array((int) ($item['inventory_item_id'] ?? 0), $invalidIds->all(), true)) {
                    $ineligibleErrors["items.{$index}.inventory_item_id"] = 'Only active purchasable inventory items can be ordered in PO.';
                }
            }

            Log::channel('procurement')->warning('procurement.purchase_order.store.ineligible_items', [
                'event' => 'procurement.purchase_order.store.ineligible_items',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'vendor_id' => $data['vendor_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'invalid_inventory_item_ids' => $invalidIds->all(),
            ]);

            throw ValidationException::withMessages($ineligibleErrors);
        }

        try {
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);

            if ((string) ($warehouse->status ?? 'inactive') !== 'active') {
                throw ValidationException::withMessages([
                    'warehouse_id' => 'The selected warehouse is inactive. Activate it before creating a purchase order.',
                ]);
            }

            $order = PurchaseOrder::create([
                'po_no' => 'PO-' . now()->format('YmdHis'),
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => $warehouse->tenant_id ?: null,
                'warehouse_id' => $data['warehouse_id'],
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'status' => 'draft',
                'currency' => $data['currency'] ?? 'PKR',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $subTotal = 0;
            foreach ($data['items'] as $item) {
                $inventoryItem = $inventoryItems->get((int) $item['inventory_item_id']);
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

                $lineTotal = $item['qty_ordered'] * $item['unit_cost'];
                $subTotal += $lineTotal;

                $order->items()->create([
                    'product_id' => $inventoryItem?->legacy_product_id,
                    'inventory_item_id' => $item['inventory_item_id'],
                    'qty_ordered' => $item['qty_ordered'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ]);
            }

            $order->update([
                'sub_total' => $subTotal,
                'grand_total' => $subTotal,
            ]);

            ApprovalAction::create([
                'document_type' => 'purchase_order',
                'document_id' => $order->id,
                'action' => 'submitted',
                'remarks' => 'PO created and submitted.',
                'action_by' => $request->user()?->id,
            ]);

            return redirect()->route('procurement.purchase-orders.index')->with('success', 'Purchase order created.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::channel('procurement')->error('procurement.purchase_order.store.failed', [
                'event' => 'procurement.purchase_order.store.failed',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'vendor_id' => $data['vendor_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'item_count' => is_array($data['items'] ?? null) ? count($data['items']) : 0,
                'error' => $e->getMessage(),
                'exception' => $e::class,
            ]);

            return redirect()->back()->withInput()->withErrors([
                'error' => str_contains(strtolower($e->getMessage()), 'product_id')
                    ? 'Failed to create purchase order because one or more inventory items are missing legacy product linkage. The purchase order item schema is being used in mixed compatibility mode.'
                    : 'Failed to create purchase order. Please review inputs and try again.',
            ]);
        }
    }

    public function submit(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft purchase orders can be submitted.');
        }

        ApprovalAction::create([
            'document_type' => 'purchase_order',
            'document_id' => $purchaseOrder->id,
            'action' => 'submitted',
            'remarks' => 'PO submitted for approval.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Purchase order submitted.');
    }

    public function approve(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft purchase orders can be approved.');
        }

        $purchaseOrder->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        ApprovalAction::create([
            'document_type' => 'purchase_order',
            'document_id' => $purchaseOrder->id,
            'action' => 'approved',
            'remarks' => 'PO approved.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Purchase order approved.');
    }

    public function reject(Request $request, PurchaseOrder $purchaseOrder)
    {
        if (!in_array($purchaseOrder->status, ['draft', 'approved'], true)) {
            return redirect()->back()->with('error', 'This purchase order cannot be rejected.');
        }

        $purchaseOrder->update([
            'status' => 'cancelled',
        ]);

        ApprovalAction::create([
            'document_type' => 'purchase_order',
            'document_id' => $purchaseOrder->id,
            'action' => 'rejected',
            'remarks' => 'PO rejected/cancelled.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Purchase order rejected.');
    }

    protected function buildProcurementProductOptions(array $warehouseIds = [])
    {
        $products = InventoryItem::query()
            ->procurementEligible()
            ->with('unit:id,name')
            ->orderBy('name')
            ->get(['id', 'name', 'sku', 'default_unit_cost', 'unit_id']);

        $productIds = $products->pluck('id')->map(fn ($id) => (int) $id)->all();

        $ingredientGroups = Ingredient::query()
            ->whereIn('inventory_item_id', $productIds)
            ->orderBy('name')
            ->get(['id', 'name', 'inventory_item_id'])
            ->groupBy('inventory_item_id');

        $stockByProductAndWarehouse = InventoryTransaction::query()
            ->when(!empty($warehouseIds), fn ($query) => $query->whereIn('warehouse_id', $warehouseIds))
            ->whereIn('inventory_item_id', $productIds)
            ->selectRaw('inventory_item_id, warehouse_id, COALESCE(SUM(qty_in - qty_out), 0) as on_hand')
            ->groupBy('inventory_item_id', 'warehouse_id')
            ->get()
            ->groupBy('inventory_item_id');

        return $products->map(function (InventoryItem $product) use ($ingredientGroups, $stockByProductAndWarehouse) {
            $warehouseSnapshots = collect($stockByProductAndWarehouse->get($product->id, collect()))
                ->mapWithKeys(fn ($row) => [(string) $row->warehouse_id => (float) $row->on_hand])
                ->all();

            $linkedIngredients = collect($ingredientGroups->get($product->id, collect()))
                ->pluck('name')
                ->values()
                ->all();

            return [
                'id' => $product->id,
                'name' => $product->name,
                'menu_code' => $product->sku,
                'base_price' => (float) ($product->default_unit_cost ?? 0),
                'unit_id' => $product->unit_id,
                'unit_name' => $product->unit?->name,
                'linked_ingredient_names' => $linkedIngredients,
                'linked_ingredient_count' => count($linkedIngredients),
                'stock_on_hand_total' => (float) array_sum($warehouseSnapshots),
                'stock_by_warehouse' => $warehouseSnapshots,
            ];
        });
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
