<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = Warehouse::query()->with(['tenant:id,name', 'locations']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('scope') && in_array($request->scope, ['global', 'tenant'], true)) {
            $query->where('is_global', $request->scope === 'global');
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        return Inertia::render('App/Admin/Inventory/Warehouses/Index', [
            'warehouses' => $query->orderBy('name')->paginate($perPage)->withQueryString(),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'locationSummary' => [
                'total_locations' => WarehouseLocation::query()->count(),
                'active_locations' => WarehouseLocation::query()->where('status', 'active')->count(),
                'tracked_products' => InventoryTransaction::query()->distinct('product_id')->count('product_id'),
            ],
            'filters' => $request->only(['search', 'status', 'scope', 'tenant_id', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:32|unique:warehouses,code',
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'is_global' => 'boolean',
            'tenant_id' => 'nullable|exists:tenants,id',
            'status' => 'required|in:active,inactive',
        ]);

        if (!$data['is_global'] && empty($data['tenant_id'])) {
            return redirect()->back()->withErrors([
                'tenant_id' => 'Restaurant is required for restaurant-scoped warehouses.',
            ])->withInput();
        }

        $data['created_by'] = $request->user()?->id;

        Warehouse::create($data);

        return redirect()->back()->with('success', 'Warehouse created.');
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $data = $request->validate([
            'code' => 'required|string|max:32|unique:warehouses,code,' . $warehouse->id,
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'is_global' => 'boolean',
            'tenant_id' => 'nullable|exists:tenants,id',
            'status' => 'required|in:active,inactive',
        ]);

        if (!$data['is_global'] && empty($data['tenant_id'])) {
            return redirect()->back()->withErrors([
                'tenant_id' => 'Restaurant is required for restaurant-scoped warehouses.',
            ])->withInput();
        }

        $data['updated_by'] = $request->user()?->id;

        $warehouse->update($data);

        return redirect()->back()->with('success', 'Warehouse updated.');
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
}
