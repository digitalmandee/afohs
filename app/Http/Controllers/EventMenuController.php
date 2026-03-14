<?php

namespace App\Http\Controllers;

use App\Models\EventMenu;
use App\Models\EventMenuCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventMenuController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:events.menu.view')->only('index');
        $this->middleware('super.admin:events.menu.create')->only('create', 'store');
        $this->middleware('super.admin:events.menu.edit')->only('edit', 'update');
        $this->middleware('permission:events.menu.delete')->only('destroy', 'trashed', 'restore', 'forceDelete');
    }

    public function index(Request $request)
    {
        $query = EventMenu::orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenusData = $query->paginate(10);

        return Inertia::render('App/Admin/Events/Menu/Index', [
            'eventMenusData' => $eventMenusData,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $menuItems = EventMenuCategory::all();
        return Inertia::render('App/Admin/Events/Menu/CreateOrEdit', compact('menuItems'));
    }

    public function edit($id)
    {
        $menu = EventMenu::with('items')->findOrFail($id);
        $menuItems = EventMenuCategory::all();
        return Inertia::render('App/Admin/Events/Menu/CreateOrEdit', [
            'eventMenu' => $menu,
            'menuItems' => $menuItems
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric',
            'status' => 'required|in:active,inactive',
            'items' => 'array',
            'items.*.id' => 'required|exists:event_menu_categories,id',
        ]);

        $menu = EventMenu::create([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,
        ]);

        foreach ($request->items as $item) {
            $category = EventMenuCategory::find($item['id']);
            if ($category) {
                $menu->items()->create([
                    'menu_category_id' => $category->id,
                    'status' => 'active',
                ]);
            }
        }

        return redirect()->route('event-menu.index')->with('success', 'Menu created successfully.');
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'amount' => 'required|numeric',
            'status' => 'required|in:active,inactive',
            'items' => 'array',
            'items.*.id' => 'required|exists:event_menu_categories,id',
        ]);

        $menu = EventMenu::findOrFail($id);

        $menu->update([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,
        ]);

        // Remove old items
        $menu->items()->delete();

        // Add new items
        foreach ($request->items as $item) {
            $category = EventMenuCategory::find($item['id']);
            if ($category) {
                $menu->items()->create([
                    'menu_category_id' => $category->id,
                    'status' => 'active',
                ]);
            }
        }

        return redirect()->route('event-menu.index')->with('success', 'Menu updated successfully.');
    }

    public function destroy($id)
    {
        $eventMenu = EventMenu::findOrFail($id);
        $eventMenu->delete();

        return redirect()->back()->with('success', 'Menu deleted successfully.');
    }

    // Display a listing of trashed event menus
    public function trashed(Request $request)
    {
        $query = EventMenu::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventMenus = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Events/Menu/Trashed', [
            'eventMenus' => $eventMenus,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed event menu
    public function restore($id)
    {
        $eventMenu = EventMenu::withTrashed()->findOrFail($id);
        $eventMenu->restore();

        return redirect()->back()->with('success', 'Menu restored successfully.');
    }

    // Force delete an event menu
    public function forceDelete($id)
    {
        $eventMenu = EventMenu::withTrashed()->findOrFail($id);
        $eventMenu->forceDelete();

        return redirect()->back()->with('success', 'Menu deleted permanently.');
    }
}
