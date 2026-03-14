<?php

namespace App\Http\Controllers;

use App\Models\FinancialChargeType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinancialChargeTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $types = FinancialChargeType::orderBy('id', 'desc')->paginate(10);
        return Inertia::render('App/Admin/Membership/TransactionTypes/Index', [
            'types' => $types
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('App/Admin/Membership/TransactionTypes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'default_amount' => 'nullable|numeric|min:0',
            'is_fixed' => 'boolean',
            'status' => 'required|in:active,inactive',
        ]);

        FinancialChargeType::create($validated);

        return redirect()->route('finance.charge-types.index')->with('success', 'Charge Type created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        $item = FinancialChargeType::findOrFail($id);
        return Inertia::render('App/Admin/Membership/TransactionTypes/Create', [
            'item' => $item
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $item = FinancialChargeType::findOrFail($id);
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'default_amount' => 'nullable|numeric|min:0',
            'is_fixed' => 'boolean',
            'status' => 'required|in:active,inactive',
        ]);

        $item->update($validated);

        return redirect()->route('finance.charge-types.index')->with('success', 'Charge Type updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $item = FinancialChargeType::findOrFail($id);

        // Removed is_system check as it is not in the new model yet, or add if needed.
        // Assuming no system charge types for now or field not added.
        // Plan didn't specify is_system but TransactionType had it.
        // Plan says: uses name, status, default_amount, is_fixed. No is_system.

        $item->delete();

        return back()->with('success', 'Charge Type deleted successfully.');
    }

    /**
     * Display a listing of trashed resources.
     */
    public function trashed(Request $request)
    {
        $types = FinancialChargeType::onlyTrashed()->orderBy('deleted_at', 'desc')->paginate(10);
        return Inertia::render('App/Admin/Membership/TransactionTypes/Trashed', [
            'types' => $types
        ]);
    }

    /**
     * Restore the specified trashed resource.
     */
    public function restore($id)
    {
        $item = FinancialChargeType::withTrashed()->findOrFail($id);
        $item->restore();

        return redirect()->route('finance.charge-types.index')->with('success', 'Charge Type restored successfully.');
    }

    /**
     * Permanently remove the specified resource from storage.
     */
    public function forceDelete($id)
    {
        $item = FinancialChargeType::withTrashed()->findOrFail($id);
        $item->forceDelete();

        return back()->with('success', 'Charge Type permanently deleted.');
    }
}
