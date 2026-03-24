<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryDocument;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Services\Inventory\InventoryMovementService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use InvalidArgumentException;

class InventoryOperationController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = InventoryTransaction::query()
            ->with([
                'tenant:id,name',
                'inventoryItem:id,name,sku,current_stock',
                'warehouse:id,name,tenant_id',
                'warehouseLocation:id,name,code,warehouse_id',
            ]);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->whereHas('product', function ($product) use ($search) {
                        $product->where('name', 'like', "%{$search}%")
                            ->orWhere('sku', 'like', "%{$search}%");
                    })
                    ->orWhere('reason', 'like', "%{$search}%")
                    ->orWhere('reference_id', $search);
            });
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('warehouse_location_id')) {
            $query->where('warehouse_location_id', $request->warehouse_location_id);
        }

        if ($request->filled('product_id')) {
            $query->where('inventory_item_id', $request->product_id);
        }

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('transaction_date', [$request->from, $request->to]);
        }

        $ledger = $query->orderByDesc('transaction_date')->orderByDesc('id')->paginate($perPage)->withQueryString();

        $documents = InventoryDocument::query()
            ->with([
                'tenant:id,name',
                'sourceWarehouse:id,name',
                'sourceWarehouseLocation:id,name,code',
                'destinationWarehouse:id,name',
                'destinationWarehouseLocation:id,name,code',
            ])
            ->latest('transaction_date')
            ->latest('id')
            ->limit(8)
            ->get();

        $valuationByWarehouse = InventoryTransaction::query()
            ->selectRaw('warehouse_id, tenant_id, COALESCE(SUM(qty_in - qty_out), 0) as net_qty, COALESCE(SUM(total_cost), 0) as valuation')
            ->groupBy('warehouse_id', 'tenant_id')
            ->with(['warehouse:id,name', 'tenant:id,name'])
            ->get()
            ->map(function ($row) {
                return [
                    'warehouse_id' => $row->warehouse_id,
                    'warehouse_name' => $row->warehouse?->name,
                    'restaurant_name' => $row->tenant?->name,
                    'net_qty' => (float) $row->net_qty,
                    'valuation' => (float) $row->valuation,
                ];
            });

        $summary = [
            'net_qty' => (float) InventoryTransaction::query()->selectRaw('COALESCE(SUM(qty_in - qty_out), 0) as qty')->value('qty'),
            'transfers' => (int) InventoryDocument::query()->where('type', 'transfer')->count(),
            'adjustments' => (int) InventoryDocument::query()->where('type', 'adjustment')->count(),
            'opening_balances' => (int) InventoryDocument::query()->where('type', 'opening_balance')->count(),
            'issues' => (int) InventoryTransaction::query()->where('type', 'adjustment_out')->where('reason', 'like', '%issue%')->count(),
            'valuation' => (float) InventoryTransaction::query()->sum('total_cost'),
        ];

        return Inertia::render('App/Admin/Inventory/Operations/Index', [
            'ledger' => $ledger,
            'documents' => $documents,
            'valuationByWarehouse' => $valuationByWarehouse,
            'summary' => $summary,
            'filters' => $request->only(['search', 'tenant_id', 'warehouse_id', 'warehouse_location_id', 'product_id', 'type', 'from', 'to', 'per_page']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->with('tenant:id,name')->orderBy('name')->get(['id', 'name', 'tenant_id']),
            'warehouseLocations' => WarehouseLocation::query()->orderBy('name')->get(['id', 'warehouse_id', 'tenant_id', 'name', 'code', 'status']),
            'products' => InventoryItem::query()
                ->warehouseOperationalEligible()
                ->orderBy('name')
                ->limit(300)
                ->get(['id', 'name', 'sku', 'tenant_id', 'current_stock']),
            'typeOptions' => [
                ['value' => 'purchase', 'label' => 'Purchase receipt'],
                ['value' => 'adjustment_in', 'label' => 'Adjustment in'],
                ['value' => 'adjustment_out', 'label' => 'Adjustment out'],
                ['value' => 'transfer_in', 'label' => 'Transfer in'],
                ['value' => 'transfer_out', 'label' => 'Transfer out'],
                ['value' => 'sale', 'label' => 'Sale'],
                ['value' => 'return_in', 'label' => 'Return in'],
                ['value' => 'return_out', 'label' => 'Return out'],
            ],
        ]);
    }

    public function storeIssue(Request $request, InventoryMovementService $service)
    {
        $this->normalizeInventoryItemPayload($request);
        $data = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'transaction_date' => 'required|date',
            'quantity' => 'required|numeric|min:0.001',
            'unit_cost' => 'nullable|numeric|min:0',
            'remarks' => 'required|string|max:500',
        ]);

        $this->assertWarehouseContext($data['warehouse_id'], $data['warehouse_location_id'] ?? null, $data['tenant_id'] ?? null);

        try {
            $service->createIssue([
                ...$data,
                'created_by' => $request->user()?->id,
            ]);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'quantity' => $exception->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', 'Stock issue posted.');
    }

    public function storeOpeningBalance(Request $request, InventoryMovementService $service)
    {
        $this->normalizeInventoryItemPayload($request);
        $data = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'transaction_date' => 'required|date',
            'quantity' => 'required|numeric|min:0.001',
            'unit_cost' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:500',
        ]);

        $this->assertWarehouseContext($data['warehouse_id'], $data['warehouse_location_id'] ?? null, $data['tenant_id'] ?? null);

        $service->createOpeningBalance([
            ...$data,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Opening balance posted.');
    }

    public function storeAdjustment(Request $request, InventoryMovementService $service)
    {
        $this->normalizeInventoryItemPayload($request);
        $data = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'transaction_date' => 'required|date',
            'direction' => 'required|in:in,out',
            'quantity' => 'required|numeric|min:0.001',
            'unit_cost' => 'nullable|numeric|min:0',
            'remarks' => 'required|string|max:500',
        ]);

        $this->assertWarehouseContext($data['warehouse_id'], $data['warehouse_location_id'] ?? null, $data['tenant_id'] ?? null);

        try {
            $service->createAdjustment([
                ...$data,
                'created_by' => $request->user()?->id,
            ]);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'quantity' => $exception->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', 'Stock adjustment posted.');
    }

    public function storeTransfer(Request $request, InventoryMovementService $service)
    {
        $this->normalizeInventoryItemPayload($request);
        $data = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'source_warehouse_id' => 'required|exists:warehouses,id',
            'source_warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'destination_warehouse_id' => 'required|exists:warehouses,id',
            'destination_warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'transaction_date' => 'required|date',
            'quantity' => 'required|numeric|min:0.001',
            'unit_cost' => 'nullable|numeric|min:0',
            'remarks' => 'nullable|string|max:500',
        ]);

        $sameWarehouse = (int) $data['source_warehouse_id'] === (int) $data['destination_warehouse_id'];
        $sameLocation = (int) ($data['source_warehouse_location_id'] ?? 0) === (int) ($data['destination_warehouse_location_id'] ?? 0);

        if ($sameWarehouse && $sameLocation) {
            throw ValidationException::withMessages([
                'destination_warehouse_id' => 'Choose a different destination warehouse or destination location for this transfer.',
            ]);
        }

        $this->assertWarehouseContext($data['source_warehouse_id'], $data['source_warehouse_location_id'] ?? null, $data['tenant_id'] ?? null);
        $this->assertWarehouseContext($data['destination_warehouse_id'], $data['destination_warehouse_location_id'] ?? null, $data['tenant_id'] ?? null);

        try {
            $service->createTransfer([
                ...$data,
                'created_by' => $request->user()?->id,
            ]);
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'quantity' => $exception->getMessage(),
            ]);
        }

        return redirect()->back()->with('success', 'Warehouse transfer posted.');
    }

    protected function normalizeInventoryItemPayload(Request $request): void
    {
        if (!$request->filled('inventory_item_id') && $request->filled('product_id')) {
            $request->merge(['inventory_item_id' => $request->input('product_id')]);
        }
    }

    protected function assertWarehouseContext(int $warehouseId, ?int $locationId = null, ?int $tenantId = null): void
    {
        $warehouse = Warehouse::query()->findOrFail($warehouseId);

        if ($tenantId && (int) $warehouse->tenant_id !== (int) $tenantId) {
            throw ValidationException::withMessages([
                'tenant_id' => 'Selected warehouse does not belong to the selected restaurant.',
            ]);
        }

        if ($locationId) {
            $location = WarehouseLocation::query()->findOrFail($locationId);
            if ((int) $location->warehouse_id !== (int) $warehouse->id) {
                throw ValidationException::withMessages([
                    'warehouse_location_id' => 'Selected location does not belong to the selected warehouse.',
                ]);
            }
        }
    }
}
