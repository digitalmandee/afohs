<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index()
    {
        $warehouses = Warehouse::orderBy('name')->get();

        return Inertia::render('App/Admin/Inventory/Warehouses/Index', [
            'warehouses' => $warehouses,
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

        $data['updated_by'] = $request->user()?->id;

        $warehouse->update($data);

        return redirect()->back()->with('success', 'Warehouse updated.');
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();

        return redirect()->back()->with('success', 'Warehouse removed.');
    }
}
