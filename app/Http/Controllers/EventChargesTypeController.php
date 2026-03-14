<?php

namespace App\Http\Controllers;

use App\Models\EventChargeType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventChargesTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:events.chargesType.view')->only('index');
        $this->middleware('super.admin:events.chargesType.create')->only('create', 'store');
        $this->middleware('super.admin:events.chargesType.edit')->only('edit', 'update');
        $this->middleware('permission:events.chargesType.delete')->only('destroy', 'trashed', 'restore', 'forceDelete');
    }

    // List all Event charges types
    public function index(Request $request)
    {
        $query = EventChargeType::orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventChargesData = $query->paginate(10);

        return Inertia::render('App/Admin/Events/ChargesType/Index', [
            'eventChargesData' => $eventChargesData,
            'filters' => $request->only(['search']),
        ]);
    }

    // Store a new Event charges type
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:event_charge_types,name',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',  // ✅ validate status
        ]);

        $eventChargesType = EventChargeType::create([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,  // ✅ store status
        ]);

        return response()->json([
            'message' => 'Event Charges Type created successfully.',
            'data' => $eventChargesType,
        ], 201);
    }

    // Update an existing Event charges type
    public function update(Request $request, $id)
    {
        $eventChargesType = EventChargeType::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:event_charge_types,name,' . $eventChargesType->id,
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',  // ✅ validate status
        ]);

        $eventChargesType->update([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,  // ✅ update status
        ]);

        return response()->json([
            'message' => 'Event Charges Type updated successfully.',
            'data' => $eventChargesType,
        ], 200);
    }

    // Delete a Event charges type
    public function destroy($id)
    {
        $eventChargesType = EventChargeType::findOrFail($id);
        $eventChargesType->delete();

        return response()->json(['message' => 'Event Charges Type deleted successfully.']);
    }

    // Display a listing of trashed event charges types
    public function trashed(Request $request)
    {
        $query = EventChargeType::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventChargesTypes = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Events/ChargesType/Trashed', [
            'eventChargesTypes' => $eventChargesTypes,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed event charges type
    public function restore($id)
    {
        $eventChargesType = EventChargeType::withTrashed()->findOrFail($id);
        $eventChargesType->restore();

        return redirect()->back()->with('success', 'Event Charges Type restored successfully.');
    }

    // Force delete an event charges type
    public function forceDelete($id)
    {
        $eventChargesType = EventChargeType::withTrashed()->findOrFail($id);
        $eventChargesType->forceDelete();

        return redirect()->back()->with('success', 'Event Charges Type deleted permanently.');
    }
}
