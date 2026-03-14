<?php

namespace App\Http\Controllers;

use App\Models\EventMenuType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventMenuTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:events.menuType.view')->only('index');
        $this->middleware('super.admin:events.menuType.create')->only('create', 'store');
        $this->middleware('super.admin:events.menuType.edit')->only('edit', 'update');
        $this->middleware('permission:events.menuType.delete')->only('destroy', 'trashed', 'restore', 'forceDelete');
    }

    public function index(Request $request)
    {
        $query = EventMenuType::orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenuTypesData = $query->paginate(10);

        return Inertia::render('App/Admin/Events/MenuType/Index', [
            'eventMenuTypesData' => $eventMenuTypesData,
            'filters' => $request->only(['search']),
        ]);
    }

    // Store a new event menu type
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:event_menu_types,name',
            'status' => 'required|in:active,inactive',
        ]);

        $eventMenuType = EventMenuType::create([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Event Menu Type created successfully.',
            'data' => $eventMenuType,
        ], 201);
    }

    // Update an existing event menu type
    public function update(Request $request, $id)
    {
        $eventMenuType = EventMenuType::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:event_menu_types,name,' . $eventMenuType->id,
            'status' => 'required|in:active,inactive',
        ]);

        $eventMenuType->update([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Event Menu Type updated successfully.',
            'data' => $eventMenuType,
        ], 200);
    }

    // Delete an event menu type
    public function destroy($id)
    {
        $eventMenuType = EventMenuType::findOrFail($id);
        $eventMenuType->delete();

        return response()->json(['message' => 'Event Menu Type deleted successfully.']);
    }

    // Display a listing of trashed event menu types
    public function trashed(Request $request)
    {
        $query = EventMenuType::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenuTypes = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Events/MenuType/Trashed', [
            'eventMenuTypes' => $eventMenuTypes,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed event menu type
    public function restore($id)
    {
        $eventMenuType = EventMenuType::withTrashed()->findOrFail($id);
        $eventMenuType->restore();

        return redirect()->back()->with('success', 'Event Menu Type restored successfully.');
    }

    // Force delete an event menu type
    public function forceDelete($id)
    {
        $eventMenuType = EventMenuType::withTrashed()->findOrFail($id);
        $eventMenuType->forceDelete();

        return redirect()->back()->with('success', 'Event Menu Type deleted permanently.');
    }
}
