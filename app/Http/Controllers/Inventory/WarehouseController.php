<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryDocument;
use App\Models\InventoryTransaction;
use App\Models\RestaurantWarehouseAssignment;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\WarehouseCategory;
use App\Models\WarehouseLocation;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Throwable;

class WarehouseController extends Controller
{
    protected array $perPageOptions = [10, 25, 50, 100];

    public function index(Request $request)
    {
        try {
            $perPage = $this->resolvePerPage($request);

            $query = Warehouse::query()->with([
                'tenant:id,name',
                'locations',
                'category:id,name,color,slug',
                'coverageRestaurants:id,name',
            ]);

            if ($request->filled('search')) {
                $search = trim((string) $request->search);
                $query->where(function ($builder) use ($search) {
                    $builder
                        ->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhereHas('category', fn ($category) => $category->where('name', 'like', "%{$search}%"));
                });
            }

            if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
                $query->where('status', $request->status);
            }

            if ($request->filled('coverage_type') && in_array($request->coverage_type, ['all', 'selected'], true)) {
                $query->where('all_restaurants', $request->coverage_type === 'all');
            }

            if ($request->filled('restaurant_id')) {
                $restaurantId = (int) $request->restaurant_id;
                $query->where(function ($builder) use ($restaurantId) {
                    $builder
                        ->where('all_restaurants', true)
                        ->orWhereHas('coverageRestaurants', fn ($coverage) => $coverage->where('tenants.id', $restaurantId));
                });
            }

            if ($request->boolean('has_primary_source')) {
                $query->whereHas('restaurantAssignments', function ($assignment) {
                    $assignment
                        ->where('role', 'primary_issue_source')
                        ->where('is_primary', true)
                        ->where('is_active', true);
                });
            }

            return Inertia::render('App/Admin/Inventory/Warehouses/Index', [
                'warehouses' => $query->orderBy('name')->paginate($perPage)->withQueryString(),
                'assignmentWarehouses' => Warehouse::query()
                    ->with(['tenant:id,name', 'locations', 'coverageRestaurants:id,name'])
                    ->orderBy('name')
                    ->get(),
                'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
                'categories' => WarehouseCategory::query()->where('status', 'active')->orderBy('sort_order')->orderBy('name')->get(['id', 'name', 'slug', 'color']),
                'assignments' => RestaurantWarehouseAssignment::query()
                    ->with([
                        'restaurant:id,name',
                        'warehouse:id,name,code',
                        'warehouseLocation:id,warehouse_id,name,code',
                    ])
                    ->orderByDesc('is_primary')
                    ->orderBy('restaurant_id')
                    ->orderBy('role')
                    ->get(),
                'locationSummary' => [
                    'total_locations' => WarehouseLocation::query()->count(),
                    'active_locations' => WarehouseLocation::query()->where('status', 'active')->count(),
                    'tracked_products' => InventoryTransaction::query()->distinct('product_id')->count('product_id'),
                    'sellable_assignments' => RestaurantWarehouseAssignment::query()->where('is_active', true)->where('role', 'sellable')->count(),
                    'back_store_assignments' => RestaurantWarehouseAssignment::query()->where('is_active', true)->where('role', 'back_store')->count(),
                    'assignments' => RestaurantWarehouseAssignment::query()
                        ->with([
                            'restaurant:id,name',
                            'warehouse:id,name,code',
                            'warehouseLocation:id,warehouse_id,name,code',
                        ])
                        ->orderByDesc('is_primary')
                        ->orderBy('restaurant_id')
                        ->orderBy('role')
                        ->get(),
                ],
                'filters' => $request->only(['search', 'status', 'coverage_type', 'restaurant_id', 'has_primary_source', 'per_page']),
            ]);
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'master', 'inventory.warehouse.master.failed', $exception, [
                'filters' => $request->only(['search', 'status', 'coverage_type', 'restaurant_id', 'has_primary_source', 'per_page']),
                'expected_schema' => $this->inventorySchemaRequirements('master'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'master', 'inventory.warehouse.master.failed', $exception, [
                'filters' => $request->only(['search', 'status', 'coverage_type', 'restaurant_id', 'has_primary_source', 'per_page']),
                'expected_schema' => $this->inventorySchemaRequirements('master'),
            ]);
            throw $exception;
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'code' => 'required|string|max:32|unique:warehouses,code',
                'name' => 'required|string|max:255',
                'category_id' => 'nullable|exists:warehouse_categories,id',
                'address' => 'nullable|string',
                'all_restaurants' => 'boolean',
                'restaurant_ids' => 'array',
                'restaurant_ids.*' => 'exists:tenants,id',
                'status' => 'required|in:active,inactive',
            ]);

            if (empty($data['all_restaurants']) && empty($data['restaurant_ids'])) {
                $this->logInventoryWarning($request, 'store', 'inventory.warehouse.validation.warning', 'coverage_restaurant_required', [
                    'payload' => $this->sanitizePayload($request->all()),
                ]);
                return redirect()->back()->withErrors([
                    'restaurant_ids' => 'Select at least one restaurant when coverage is not all restaurants.',
                ])->withInput();
            }

            $data['created_by'] = $request->user()?->id;
            $data['is_global'] = (bool) ($data['all_restaurants'] ?? false);
            $data['tenant_id'] = !empty($data['all_restaurants']) ? null : (int) ($data['restaurant_ids'][0] ?? null);

            $warehouse = Warehouse::create($data);
            $this->syncCoverageRestaurants($warehouse, $data['all_restaurants'] ?? false, $data['restaurant_ids'] ?? []);

            return redirect()->back()->with('success', 'Warehouse created.');
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'store', 'inventory.warehouse.master.failed', $exception, [
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('master'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'store', 'inventory.warehouse.master.failed', $exception, [
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('master'),
            ]);
            throw $exception;
        }
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        try {
            $data = $request->validate([
                'code' => 'required|string|max:32|unique:warehouses,code,' . $warehouse->id,
                'name' => 'required|string|max:255',
                'category_id' => 'nullable|exists:warehouse_categories,id',
                'address' => 'nullable|string',
                'all_restaurants' => 'boolean',
                'restaurant_ids' => 'array',
                'restaurant_ids.*' => 'exists:tenants,id',
                'status' => 'required|in:active,inactive',
            ]);

            if (empty($data['all_restaurants']) && empty($data['restaurant_ids'])) {
                $this->logInventoryWarning($request, 'update', 'inventory.warehouse.validation.warning', 'coverage_restaurant_required', [
                    'warehouse_id' => $warehouse->id,
                    'payload' => $this->sanitizePayload($request->all()),
                ]);
                return redirect()->back()->withErrors([
                    'restaurant_ids' => 'Select at least one restaurant when coverage is not all restaurants.',
                ])->withInput();
            }

            $data['updated_by'] = $request->user()?->id;
            $data['is_global'] = (bool) ($data['all_restaurants'] ?? false);
            $data['tenant_id'] = !empty($data['all_restaurants']) ? null : (int) ($data['restaurant_ids'][0] ?? null);

            $warehouse->update($data);
            $this->syncCoverageRestaurants($warehouse, $data['all_restaurants'] ?? false, $data['restaurant_ids'] ?? []);

            return redirect()->back()->with('success', 'Warehouse updated.');
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'update', 'inventory.warehouse.master.failed', $exception, [
                'warehouse_id' => $warehouse->id,
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('master'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'update', 'inventory.warehouse.master.failed', $exception, [
                'warehouse_id' => $warehouse->id,
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('master'),
            ]);
            throw $exception;
        }
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();

        return redirect()->back()->with('success', 'Warehouse removed.');
    }

    public function storeLocation(Request $request, Warehouse $warehouse)
    {
        $data = $request->validate([
            'code' => 'required|string|max:32|unique:warehouse_locations,code,NULL,id,warehouse_id,' . $warehouse->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_primary' => 'boolean',
            'status' => 'required|in:active,inactive',
        ]);

        if (!empty($data['is_primary'])) {
            $warehouse->locations()->update(['is_primary' => false]);
        }

        $warehouse->locations()->create([
            ...$data,
            'tenant_id' => $warehouse->tenant_id,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Warehouse location created.');
    }

    public function updateLocation(Request $request, Warehouse $warehouse, WarehouseLocation $location)
    {
        abort_unless((int) $location->warehouse_id === (int) $warehouse->id, 404);

        $data = $request->validate([
            'code' => 'required|string|max:32|unique:warehouse_locations,code,' . $location->id . ',id,warehouse_id,' . $warehouse->id,
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_primary' => 'boolean',
            'status' => 'required|in:active,inactive',
        ]);

        if (!empty($data['is_primary'])) {
            $warehouse->locations()->whereKeyNot($location->id)->update(['is_primary' => false]);
        }

        $location->update([
            ...$data,
            'tenant_id' => $warehouse->tenant_id,
            'updated_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Warehouse location updated.');
    }

    public function destroyLocation(Warehouse $warehouse, WarehouseLocation $location)
    {
        abort_unless((int) $location->warehouse_id === (int) $warehouse->id, 404);

        $location->delete();

        return redirect()->back()->with('success', 'Warehouse location removed.');
    }

    public function storeAssignment(Request $request)
    {
        try {
            $data = $request->validate([
                'restaurant_id' => 'required|exists:tenants,id',
                'warehouse_id' => 'required|exists:warehouses,id',
                'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
                'role' => 'required|in:sellable,back_store,primary_issue_source',
                'is_primary' => 'boolean',
                'is_active' => 'boolean',
            ]);

            $warehouse = Warehouse::query()->with(['locations', 'coverageRestaurants:id'])->findOrFail($data['warehouse_id']);

            if (!$warehouse->all_restaurants && !$warehouse->coverageRestaurants->contains('id', (int) $data['restaurant_id'])) {
                $this->logInventoryWarning($request, 'store_assignment', 'inventory.warehouse.validation.warning', 'coverage_not_allowed_for_restaurant', [
                    'warehouse_id' => $data['warehouse_id'],
                    'restaurant_id' => $data['restaurant_id'],
                    'payload' => $this->sanitizePayload($request->all()),
                ]);
                return redirect()->back()->withErrors([
                    'warehouse_id' => 'Selected warehouse is not assigned to the chosen restaurant.',
                ]);
            }

            if ($data['warehouse_location_id']) {
                abort_unless(
                    $warehouse->locations->contains('id', (int) $data['warehouse_location_id']),
                    422
                );
            }

            if (!empty($data['is_primary'])) {
                if ($warehouse->status !== 'active') {
                    $this->logInventoryWarning($request, 'store_assignment', 'inventory.warehouse.validation.warning', 'inactive_primary_source_not_allowed', [
                        'warehouse_id' => $data['warehouse_id'],
                        'restaurant_id' => $data['restaurant_id'],
                        'role' => $data['role'],
                        'payload' => $this->sanitizePayload($request->all()),
                    ]);
                    return redirect()->back()->withErrors([
                        'warehouse_id' => 'Inactive warehouses cannot be set as primary issue sources.',
                    ]);
                }

                RestaurantWarehouseAssignment::query()
                    ->where('restaurant_id', $data['restaurant_id'])
                    ->where('role', $data['role'])
                    ->update(['is_primary' => false]);
            }

            RestaurantWarehouseAssignment::updateOrCreate(
                [
                    'restaurant_id' => $data['restaurant_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'warehouse_location_id' => $data['warehouse_location_id'] ?? null,
                    'role' => $data['role'],
                ],
                [
                    'is_primary' => (bool) ($data['is_primary'] ?? false),
                    'is_active' => (bool) ($data['is_active'] ?? true),
                    'created_by' => $request->user()?->id,
                    'updated_by' => $request->user()?->id,
                ]
            );

            return redirect()->back()->with('success', 'Restaurant warehouse assignment saved.');
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'store_assignment', 'inventory.warehouse.coverage.failed', $exception, [
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('coverage'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'store_assignment', 'inventory.warehouse.coverage.failed', $exception, [
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('coverage'),
            ]);
            throw $exception;
        }
    }

    public function destroyAssignment(RestaurantWarehouseAssignment $assignment)
    {
        $assignment->delete();

        return redirect()->back()->with('success', 'Restaurant warehouse assignment removed.');
    }

    public function dashboard(Request $request)
    {
        $totalWarehouses = Warehouse::query()->count();
        $activeWarehouses = Warehouse::query()->where('status', 'active')->count();
        $activeLocations = WarehouseLocation::query()->where('status', 'active')->count();
        $lowStockCount = InventoryTransaction::query()
            ->selectRaw('product_id, COALESCE(SUM(qty_in - qty_out), 0) as balance')
            ->groupBy('product_id')
            ->havingRaw('COALESCE(SUM(qty_in - qty_out), 0) > 0')
            ->havingRaw('COALESCE(SUM(qty_in - qty_out), 0) <= 10')
            ->get()
            ->count();
        $outOfStockCount = InventoryTransaction::query()
            ->selectRaw('product_id, COALESCE(SUM(qty_in - qty_out), 0) as balance')
            ->groupBy('product_id')
            ->havingRaw('COALESCE(SUM(qty_in - qty_out), 0) <= 0')
            ->get()
            ->count();

        $today = now()->toDateString();
        $todayMovements = [
            'in' => (float) InventoryTransaction::query()->whereDate('transaction_date', $today)->sum('qty_in'),
            'out' => (float) InventoryTransaction::query()->whereDate('transaction_date', $today)->sum('qty_out'),
            'transfer' => (int) InventoryDocument::query()->whereDate('transaction_date', $today)->where('type', 'transfer')->count(),
        ];

        $valuationByWarehouse = InventoryTransaction::query()
            ->selectRaw('warehouse_id, COALESCE(SUM(total_cost), 0) as valuation, COALESCE(SUM(qty_in - qty_out), 0) as net_qty')
            ->groupBy('warehouse_id')
            ->with('warehouse:id,name,code')
            ->orderByDesc('valuation')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'warehouse_id' => $row->warehouse_id,
                'warehouse_name' => $row->warehouse?->name,
                'warehouse_code' => $row->warehouse?->code,
                'valuation' => (float) $row->valuation,
                'net_qty' => (float) $row->net_qty,
            ]);

        $restaurantSnapshot = InventoryTransaction::query()
            ->selectRaw('tenant_id, COALESCE(SUM(qty_in - qty_out), 0) as net_qty, COALESCE(SUM(total_cost), 0) as valuation')
            ->whereNotNull('tenant_id')
            ->groupBy('tenant_id')
            ->with('tenant:id,name')
            ->orderByDesc('valuation')
            ->limit(8)
            ->get()
            ->map(fn ($row) => [
                'restaurant_id' => $row->tenant_id,
                'restaurant_name' => $row->tenant?->name,
                'net_qty' => (float) $row->net_qty,
                'valuation' => (float) $row->valuation,
            ]);

        $recentDocuments = InventoryDocument::query()
            ->with(['tenant:id,name', 'sourceWarehouse:id,name', 'destinationWarehouse:id,name'])
            ->latest('transaction_date')
            ->latest('id')
            ->limit(10)
            ->get();

        $alerts = RestaurantWarehouseAssignment::query()
            ->selectRaw('restaurant_id, SUM(CASE WHEN role = "back_store" AND is_active = 1 THEN 1 ELSE 0 END) AS back_store_count, SUM(CASE WHEN role = "sellable" AND is_active = 1 THEN 1 ELSE 0 END) AS sellable_count')
            ->groupBy('restaurant_id')
            ->with('restaurant:id,name')
            ->get()
            ->filter(fn ($row) => (int) $row->back_store_count > 0 && (int) $row->sellable_count === 0)
            ->values()
            ->map(fn ($row) => [
                'restaurant_name' => $row->restaurant?->name,
                'message' => 'Back-store sources exist but no active sellable source is assigned.',
            ]);

        return Inertia::render('App/Admin/Inventory/Warehouses/Dashboard', [
            'summary' => [
                'total_warehouses' => $totalWarehouses,
                'active_warehouses' => $activeWarehouses,
                'active_locations' => $activeLocations,
                'low_stock_count' => $lowStockCount,
                'out_of_stock_count' => $outOfStockCount,
                'stock_value_total' => (float) InventoryTransaction::query()->sum('total_cost'),
            ],
            'todayMovements' => $todayMovements,
            'valuationByWarehouse' => $valuationByWarehouse,
            'restaurantSnapshot' => $restaurantSnapshot,
            'recentDocuments' => $recentDocuments,
            'transferAlerts' => $alerts,
        ]);
    }

    public function categories()
    {
        try {
            $categories = WarehouseCategory::query()
                ->withCount('warehouses')
                ->orderBy('sort_order')
                ->orderBy('name')
                ->get();

            return Inertia::render('App/Admin/Inventory/Warehouses/Categories/Index', [
                'categories' => $categories,
            ]);
        } catch (QueryException $exception) {
            $this->logInventoryFailure(request(), 'categories', 'inventory.warehouse.categories.failed', $exception, [
                'expected_schema' => $this->inventorySchemaRequirements('categories'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure(request(), 'categories', 'inventory.warehouse.categories.failed', $exception, [
                'expected_schema' => $this->inventorySchemaRequirements('categories'),
            ]);
            throw $exception;
        }
    }

    public function storeCategory(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:120',
                'slug' => 'required|string|max:120|unique:warehouse_categories,slug',
                'color' => 'nullable|string|max:24',
                'status' => 'required|in:active,inactive',
                'sort_order' => 'nullable|integer|min:0|max:9999',
            ]);

            WarehouseCategory::create([
                ...$data,
                'sort_order' => (int) ($data['sort_order'] ?? 0),
            ]);

            return redirect()->back()->with('success', 'Warehouse category created.');
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'store_category', 'inventory.warehouse.categories.failed', $exception, [
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('categories'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'store_category', 'inventory.warehouse.categories.failed', $exception, [
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('categories'),
            ]);
            throw $exception;
        }
    }

    public function updateCategory(Request $request, WarehouseCategory $category)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:120',
                'slug' => 'required|string|max:120|unique:warehouse_categories,slug,' . $category->id,
                'color' => 'nullable|string|max:24',
                'status' => 'required|in:active,inactive',
                'sort_order' => 'nullable|integer|min:0|max:9999',
            ]);

            $category->update([
                ...$data,
                'sort_order' => (int) ($data['sort_order'] ?? 0),
            ]);

            return redirect()->back()->with('success', 'Warehouse category updated.');
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'update_category', 'inventory.warehouse.categories.failed', $exception, [
                'category_id' => $category->id,
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('categories'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'update_category', 'inventory.warehouse.categories.failed', $exception, [
                'category_id' => $category->id,
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('categories'),
            ]);
            throw $exception;
        }
    }

    public function locationsMaster(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        $query = WarehouseLocation::query()->with(['warehouse:id,name,code', 'tenant:id,name']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhereHas('warehouse', fn ($warehouse) => $warehouse->where('name', 'like', "%{$search}%")->orWhere('code', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('status', $request->status);
        }

        return Inertia::render('App/Admin/Inventory/Warehouses/Locations/Index', [
            'locations' => $query->orderBy('name')->paginate($perPage)->withQueryString(),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name', 'code']),
            'filters' => $request->only(['search', 'warehouse_id', 'status', 'per_page']),
        ]);
    }

    public function show(Request $request, Warehouse $warehouse)
    {
        $warehouse->load(['category:id,name,color', 'locations', 'coverageRestaurants:id,name']);
        $tab = in_array((string) $request->get('tab', 'overview'), ['overview', 'inventory', 'locations', 'documents', 'movements', 'valuation', 'coverage'], true)
            ? (string) $request->get('tab', 'overview')
            : 'overview';

        $inventory = InventoryTransaction::query()
            ->selectRaw('product_id, warehouse_location_id, COALESCE(SUM(qty_in), 0) as qty_in, COALESCE(SUM(qty_out), 0) as qty_out, COALESCE(SUM(qty_in - qty_out), 0) as on_hand, COALESCE(AVG(unit_cost), 0) as avg_cost, COALESCE(SUM(total_cost), 0) as value')
            ->where('warehouse_id', $warehouse->id)
            ->groupBy('product_id', 'warehouse_location_id')
            ->with(['product:id,name,menu_code', 'warehouseLocation:id,code,name'])
            ->orderByDesc('on_hand')
            ->limit(250)
            ->get()
            ->map(function ($row) {
                return [
                    'product_id' => $row->product_id,
                    'product_name' => $row->product?->name,
                    'product_code' => $row->product?->menu_code,
                    'location' => $row->warehouseLocation ? ($row->warehouseLocation->code . ' · ' . $row->warehouseLocation->name) : 'No location',
                    'on_hand' => (float) $row->on_hand,
                    'reserved_qty' => 0,
                    'available_qty' => (float) $row->on_hand,
                    'avg_cost' => (float) $row->avg_cost,
                    'value' => (float) $row->value,
                ];
            });

        $documents = InventoryDocument::query()
            ->with(['tenant:id,name', 'sourceWarehouse:id,name', 'destinationWarehouse:id,name'])
            ->where(function ($builder) use ($warehouse) {
                $builder
                    ->where('source_warehouse_id', $warehouse->id)
                    ->orWhere('destination_warehouse_id', $warehouse->id);
            })
            ->latest('transaction_date')
            ->latest('id')
            ->limit(200)
            ->get();

        $movements = InventoryTransaction::query()
            ->with(['tenant:id,name', 'product:id,name,menu_code', 'warehouseLocation:id,code,name'])
            ->where('warehouse_id', $warehouse->id)
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->paginate($this->resolvePerPage($request))
            ->withQueryString();

        $valuation = InventoryTransaction::query()
            ->selectRaw('warehouse_location_id, COALESCE(SUM(qty_in - qty_out), 0) as net_qty, COALESCE(SUM(total_cost), 0) as valuation')
            ->where('warehouse_id', $warehouse->id)
            ->groupBy('warehouse_location_id')
            ->with('warehouseLocation:id,code,name')
            ->get()
            ->map(function ($row) {
                return [
                    'location' => $row->warehouseLocation ? ($row->warehouseLocation->code . ' · ' . $row->warehouseLocation->name) : 'No location',
                    'net_qty' => (float) $row->net_qty,
                    'valuation' => (float) $row->valuation,
                ];
            });

        $coverageAssignments = RestaurantWarehouseAssignment::query()
            ->with(['restaurant:id,name', 'warehouseLocation:id,code,name'])
            ->where('warehouse_id', $warehouse->id)
            ->where('is_active', true)
            ->orderBy('restaurant_id')
            ->get();

        return Inertia::render('App/Admin/Inventory/Warehouses/Show', [
            'warehouse' => $warehouse,
            'tab' => $tab,
            'inventory' => $inventory,
            'documents' => $documents,
            'movements' => $movements,
            'valuation' => $valuation,
            'coverageAssignments' => $coverageAssignments,
        ]);
    }

    public function documents(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        $query = InventoryDocument::query()->with([
            'tenant:id,name',
            'sourceWarehouse:id,name,code',
            'sourceWarehouseLocation:id,code,name',
            'destinationWarehouse:id,name,code',
            'destinationWarehouseLocation:id,code,name',
        ]);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('restaurant_id')) {
            $query->where('tenant_id', (int) $request->restaurant_id);
        }

        if ($request->filled('warehouse_id')) {
            $warehouseId = (int) $request->warehouse_id;
            $query->where(function ($builder) use ($warehouseId) {
                $builder
                    ->where('source_warehouse_id', $warehouseId)
                    ->orWhere('destination_warehouse_id', $warehouseId);
            });
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('document_no', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        return Inertia::render('App/Admin/Inventory/Warehouses/Documents/Index', [
            'documents' => $query->latest('transaction_date')->latest('id')->paginate($perPage)->withQueryString(),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name', 'code']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'type', 'restaurant_id', 'warehouse_id', 'per_page']),
        ]);
    }

    public function valuation(Request $request)
    {
        $byWarehouse = InventoryTransaction::query()
            ->selectRaw('warehouse_id, COALESCE(SUM(qty_in - qty_out), 0) as net_qty, COALESCE(SUM(total_cost), 0) as valuation')
            ->groupBy('warehouse_id')
            ->with('warehouse:id,name,code')
            ->get();

        $byLocation = InventoryTransaction::query()
            ->selectRaw('warehouse_location_id, warehouse_id, COALESCE(SUM(qty_in - qty_out), 0) as net_qty, COALESCE(SUM(total_cost), 0) as valuation')
            ->groupBy('warehouse_location_id', 'warehouse_id')
            ->with(['warehouse:id,name,code', 'warehouseLocation:id,name,code'])
            ->get();

        $byRestaurant = InventoryTransaction::query()
            ->selectRaw('tenant_id, COALESCE(SUM(qty_in - qty_out), 0) as net_qty, COALESCE(SUM(total_cost), 0) as valuation')
            ->whereNotNull('tenant_id')
            ->groupBy('tenant_id')
            ->with('tenant:id,name')
            ->get();

        $movementValueDelta = InventoryTransaction::query()
            ->selectRaw('type, COALESCE(SUM(total_cost), 0) as total_value, COALESCE(SUM(qty_in - qty_out), 0) as net_qty')
            ->groupBy('type')
            ->orderBy('type')
            ->get();

        return Inertia::render('App/Admin/Inventory/Warehouses/Valuation/Index', [
            'summary' => [
                'total_valuation' => (float) InventoryTransaction::query()->sum('total_cost'),
                'warehouse_count' => (int) Warehouse::query()->count(),
                'restaurant_count' => (int) InventoryTransaction::query()->distinct('tenant_id')->whereNotNull('tenant_id')->count('tenant_id'),
            ],
            'byWarehouse' => $byWarehouse,
            'byLocation' => $byLocation,
            'byRestaurant' => $byRestaurant,
            'movementValueDelta' => $movementValueDelta,
        ]);
    }

    public function coverage()
    {
        $request = request();

        try {
            $restaurants = Tenant::query()->orderBy('name')->get(['id', 'name']);
            $warehouses = Warehouse::query()
                ->with(['coverageRestaurants:id,name', 'locations:id,warehouse_id,name,code', 'category:id,name'])
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'status', 'all_restaurants', 'category_id']);
            $assignments = RestaurantWarehouseAssignment::query()
                ->with(['restaurant:id,name', 'warehouse:id,name,code', 'warehouseLocation:id,warehouse_id,code,name'])
                ->where('is_active', true)
                ->orderBy('restaurant_id')
                ->get();

            return Inertia::render('App/Admin/Inventory/Warehouses/Coverage/Index', [
                'restaurants' => $restaurants,
                'warehouses' => $warehouses,
                'assignments' => $assignments,
            ]);
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'coverage', 'inventory.warehouse.coverage.failed', $exception, [
                'expected_schema' => $this->inventorySchemaRequirements('coverage'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'coverage', 'inventory.warehouse.coverage.failed', $exception, [
                'expected_schema' => $this->inventorySchemaRequirements('coverage'),
            ]);
            throw $exception;
        }
    }

    public function upsertCoverage(Request $request)
    {
        try {
            $data = $request->validate([
                'restaurant_id' => 'required|exists:tenants,id',
                'warehouse_id' => 'required|exists:warehouses,id',
                'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
                'role' => 'required|in:sellable,back_store,primary_issue_source',
                'is_primary' => 'boolean',
                'is_active' => 'boolean',
            ]);

            $warehouse = Warehouse::query()->with('coverageRestaurants:id')->findOrFail($data['warehouse_id']);
            if (!$warehouse->all_restaurants && !$warehouse->coverageRestaurants->contains('id', (int) $data['restaurant_id'])) {
                $this->logInventoryWarning($request, 'upsert_coverage', 'inventory.warehouse.validation.warning', 'coverage_not_allowed_for_restaurant', [
                    'warehouse_id' => $data['warehouse_id'],
                    'restaurant_id' => $data['restaurant_id'],
                    'payload' => $this->sanitizePayload($request->all()),
                ]);
                return redirect()->back()->withErrors([
                    'warehouse_id' => 'This warehouse is not available for the selected restaurant.',
                ]);
            }

            if (!empty($data['is_primary'])) {
                RestaurantWarehouseAssignment::query()
                    ->where('restaurant_id', $data['restaurant_id'])
                    ->where('role', $data['role'])
                    ->update(['is_primary' => false]);
            }

            RestaurantWarehouseAssignment::updateOrCreate(
                [
                    'restaurant_id' => $data['restaurant_id'],
                    'warehouse_id' => $data['warehouse_id'],
                    'warehouse_location_id' => $data['warehouse_location_id'] ?? null,
                    'role' => $data['role'],
                ],
                [
                    'is_primary' => (bool) ($data['is_primary'] ?? false),
                    'is_active' => (bool) ($data['is_active'] ?? true),
                    'created_by' => $request->user()?->id,
                    'updated_by' => $request->user()?->id,
                ]
            );

            return redirect()->back()->with('success', 'Coverage assignment saved.');
        } catch (QueryException $exception) {
            $this->logInventoryFailure($request, 'upsert_coverage', 'inventory.warehouse.coverage.failed', $exception, [
                'warehouse_id' => $request->input('warehouse_id'),
                'restaurant_id' => $request->input('restaurant_id'),
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('coverage'),
            ]);
            throw $exception;
        } catch (Throwable $exception) {
            $this->logInventoryFailure($request, 'upsert_coverage', 'inventory.warehouse.coverage.failed', $exception, [
                'warehouse_id' => $request->input('warehouse_id'),
                'restaurant_id' => $request->input('restaurant_id'),
                'payload' => $this->sanitizePayload($request->all()),
                'expected_schema' => $this->inventorySchemaRequirements('coverage'),
            ]);
            throw $exception;
        }
    }

    protected function syncCoverageRestaurants(Warehouse $warehouse, bool $allRestaurants, array $restaurantIds): void
    {
        if ($allRestaurants) {
            $warehouse->coverageRestaurants()->detach();

            return;
        }

        $syncPayload = [];
        foreach ($restaurantIds as $restaurantId) {
            $syncPayload[(int) $restaurantId] = ['is_active' => true];
        }

        $warehouse->coverageRestaurants()->sync($syncPayload);
    }

    protected function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', 25);

        return in_array($perPage, $this->perPageOptions, true) ? $perPage : 25;
    }

    protected function inventorySchemaRequirements(string $area): array
    {
        return match ($area) {
            'master' => [
                'tables' => ['warehouses', 'warehouse_categories', 'warehouse_restaurants'],
                'columns' => ['warehouses.all_restaurants', 'warehouses.category_id'],
            ],
            'coverage' => [
                'tables' => ['warehouses', 'warehouse_restaurants', 'restaurant_warehouse_assignments'],
                'columns' => ['warehouses.all_restaurants', 'warehouse_restaurants.warehouse_id', 'warehouse_restaurants.restaurant_id'],
            ],
            'categories' => [
                'tables' => ['warehouse_categories'],
                'columns' => ['warehouse_categories.slug', 'warehouse_categories.status'],
            ],
            default => [],
        };
    }

    protected function sanitizePayload(array $payload): array
    {
        unset(
            $payload['_token'],
            $payload['password'],
            $payload['password_confirmation'],
            $payload['token']
        );

        return $payload;
    }

    protected function inventoryBaseLogContext(Request $request, string $action): array
    {
        $route = $request->route();

        return [
            'action' => $action,
            'request_id' => $request->attributes->get('request_id'),
            'route_name' => $route?->getName(),
            'controller_action' => $route?->getActionName(),
            'method' => $request->method(),
            'path' => $request->path(),
            'url' => $request->fullUrl(),
            'user_id' => $request->user()?->id,
            'tenant_id' => $request->input('tenant_id') ?? $request->input('restaurant_id'),
            'ip' => $request->ip(),
        ];
    }

    protected function logInventoryFailure(Request $request, string $action, string $event, Throwable $exception, array $context = []): void
    {
        $sqlState = null;
        $errorCode = null;

        if ($exception instanceof QueryException) {
            $previous = $exception->getPrevious();
            if ($previous instanceof \PDOException) {
                $sqlState = $previous->errorInfo[0] ?? $exception->getCode();
                $errorCode = $previous->errorInfo[1] ?? null;
            } else {
                $sqlState = $exception->getCode();
            }
        }

        Log::channel('inventory')->error($event, array_merge(
            $this->inventoryBaseLogContext($request, $action),
            [
                'exception_class' => get_class($exception),
                'sql_state' => $sqlState,
                'error_code' => $errorCode,
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ],
            $context
        ));
    }

    protected function logInventoryWarning(Request $request, string $action, string $event, string $reasonCode, array $context = []): void
    {
        Log::channel('inventory')->warning($event, array_merge(
            $this->inventoryBaseLogContext($request, $action),
            [
                'reason_code' => $reasonCode,
            ],
            $context
        ));
    }
}
