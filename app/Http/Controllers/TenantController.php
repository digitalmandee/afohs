<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tenants = Tenant::query()->orderBy('name')->get();

        return Inertia::render('tenant/index', [
            'tenants' => $tenants,
            'showTrashed' => false,
        ]);
    }

    public function trashed()
    {
        $tenants = Tenant::onlyTrashed()->orderBy('name')->get();

        return Inertia::render('tenant/index', [
            'tenants' => $tenants,
            'showTrashed' => true,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $branches = Branch::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('tenant/register', [
            'branches' => $branches,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'printer_ip' => 'required|string|max:255',
            'printer_port' => 'required',
        ]);

        Tenant::create($validatedData);

        return to_route('locations.create');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Tenant $tenant)
    {
        $branches = Branch::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('tenant/register', [
            'tenant' => $tenant,  // pass existing tenant
            'branches' => $branches,
        ]);
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'printer_ip' => 'required|string|max:255',
            'printer_port' => 'required',
        ]);

        // Update tenant
        $tenant->update($validatedData);

        return to_route('locations.index')->with('success', 'Tenant updated successfully!');
    }

    public function toggleStatus(Tenant $tenant)
    {
        $tenant->update([
            'status' => $tenant->status === 'active' ? 'inactive' : 'active',
        ]);

        return back()->with('success', 'Restaurant status updated successfully!');
    }

    public function restore(string $id)
    {
        $tenant = Tenant::withTrashed()->findOrFail($id);
        $tenant->restore();

        return back()->with('success', 'Restaurant restored successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Tenant $tenant)
    {
        if (auth()->check()) {
            $tenant->deleted_by = auth()->id();
            $tenant->save();
        }

        $tenant->delete();

        return back()->with('success', 'Restaurant deleted successfully!');
    }
}
