<?php

namespace App\Http\Controllers;

use App\Models\EventMenuAddOn;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventMenuAddOnsController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:events.menuAddOn.view')->only('index');
        $this->middleware('super.admin:events.menuAddOn.create')->only('create', 'store');
        $this->middleware('super.admin:events.menuAddOn.edit')->only('edit', 'update');
        $this->middleware('permission:events.menuAddOn.delete')->only('destroy', 'trashed', 'restore', 'forceDelete');
    }

    public function index(Request $request)
    {
        $query = EventMenuAddOn::orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenuAddOnsData = $query->paginate(10);

        return Inertia::render('App/Admin/Events/MenuAddons/Index', [
            'eventMenuAddOnsData' => $eventMenuAddOnsData,
            'filters' => $request->only(['search']),
        ]);
    }

    // Store a new event menu add-on
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:event_menu_add_ons,name',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',  // validate status
        ]);

        $eventMenuAddOn = EventMenuAddOn::create([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,  // store status
        ]);

        return response()->json([
            'message' => 'Event Menu Add-on created successfully.',
            'data' => $eventMenuAddOn,
        ], 201);
    }

    // Update an existing event menu add-on
    public function update(Request $request, $id)
    {
        $eventMenuAddOn = EventMenuAddOn::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:event_menu_add_ons,name,' . $eventMenuAddOn->id,
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',  // validate status
        ]);

        $eventMenuAddOn->update([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,  // update status
        ]);

        return response()->json([
            'message' => 'Event Menu Add-on updated successfully.',
            'data' => $eventMenuAddOn,
        ], 200);
    }

    // Delete an event menu add-on
    public function destroy($id)
    {
        $eventMenuAddOn = EventMenuAddOn::findOrFail($id);
        $eventMenuAddOn->delete();

        return response()->json(['message' => 'Event Menu Add-on deleted successfully.']);
    }

    // Display a listing of trashed event menu add-ons
    public function trashed(Request $request)
    {
        $query = EventMenuAddOn::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenuAddOns = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Events/MenuAddons/Trashed', [
            'eventMenuAddOns' => $eventMenuAddOns,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed event menu add-on
    public function restore($id)
    {
        $eventMenuAddOn = EventMenuAddOn::withTrashed()->findOrFail($id);
        $eventMenuAddOn->restore();

        return redirect()->back()->with('success', 'Event Menu Add-on restored successfully.');
    }

    // Force delete an event menu add-on
    public function forceDelete($id)
    {
        $eventMenuAddOn = EventMenuAddOn::withTrashed()->findOrFail($id);
        $eventMenuAddOn->forceDelete();

        return redirect()->back()->with('success', 'Event Menu Add-on deleted permanently.');
    }
}
