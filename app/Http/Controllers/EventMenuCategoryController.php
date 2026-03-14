<?php

namespace App\Http\Controllers;

use App\Models\EventMenuCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventMenuCategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:events.menuCategory.view')->only('index');
        $this->middleware('super.admin:events.menuCategory.create')->only('create', 'store');
        $this->middleware('super.admin:events.menuCategory.edit')->only('edit', 'update');
        $this->middleware('permission:events.menuCategory.delete')->only('destroy', 'trashed', 'restore', 'forceDelete');
    }

    public function index(Request $request)
    {
        $query = EventMenuCategory::orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenuCategoriesData = $query->paginate(10);

        return Inertia::render('App/Admin/Events/Category/Index', [
            'eventMenuCategoriesData' => $eventMenuCategoriesData,
            'filters' => $request->only(['search']),
        ]);
    }

    // Store a new event menu category
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:event_menu_categories,name',
            'status' => 'required|in:active,inactive',
        ]);

        $eventMenuCategory = EventMenuCategory::create([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Event Menu Category created successfully.',
            'data' => $eventMenuCategory,
        ], 201);
    }

    // Update an existing event menu category
    public function update(Request $request, $id)
    {
        $eventMenuCategory = EventMenuCategory::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:event_menu_categories,name,' . $eventMenuCategory->id,
            'status' => 'required|in:active,inactive',
        ]);

        $eventMenuCategory->update([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Event Menu Category updated successfully.',
            'data' => $eventMenuCategory,
        ], 200);
    }

    // Delete an event menu category
    public function destroy($id)
    {
        $eventMenuCategory = EventMenuCategory::findOrFail($id);
        $eventMenuCategory->delete();

        return response()->json(['message' => 'Event Menu Category deleted successfully.']);
    }

    // Display a listing of trashed event menu categories
    public function trashed(Request $request)
    {
        $query = EventMenuCategory::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenuCategories = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Events/Category/Trashed', [
            'eventMenuCategories' => $eventMenuCategories,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed event menu category
    public function restore($id)
    {
        $eventMenuCategory = EventMenuCategory::withTrashed()->findOrFail($id);
        $eventMenuCategory->restore();

        return redirect()->back()->with('success', 'Event Menu Category restored successfully.');
    }

    // Force delete an event menu category
    public function forceDelete($id)
    {
        $eventMenuCategory = EventMenuCategory::withTrashed()->findOrFail($id);
        $eventMenuCategory->forceDelete();

        return redirect()->back()->with('success', 'Event Menu Category deleted permanently.');
    }
}
