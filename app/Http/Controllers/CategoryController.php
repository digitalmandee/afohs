<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\Category;
use App\Models\InventoryItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();

        $categoriesList = $query
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->withCount('products')
            ->withCount('inventoryItems')
            ->latest()
            ->paginate(10)  // Changed to pagination to match other modules
            ->withQueryString();

        return Inertia::render('App/Inventory/Categories/Index', [
            'categories' => $categoriesList,
            'filters' => $request->only(['search']),
        ]);
    }

    public function getCategories(Request $request)
    {
        $categories = Category::latest()->get();

        return response()->json(['categories' => $categories]);
    }

    public function store(Request $request)
    {
        $posLocationId = $request->session()->get('active_pos_location_id');

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('pos_categories', 'name')->whereNull('deleted_at'),
            ],
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = FileHelper::saveImage($request->file('image'), 'categories');
            $validated['image'] = $path;
        }

        $validated['tenant_id'] = null;
        $validated['location_id'] = $posLocationId ? (int) $posLocationId : null;
        $validated['created_by'] = Auth::id();

        Category::create($validated);

        return redirect()->back()->with('success', 'Category created.');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('pos_categories', 'name')
                    ->ignore($category->id)
                    ->whereNull('deleted_at'),
            ],
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
            'existingImage' => 'nullable|string',
        ]);

        if ($request->hasFile('image')) {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $path = FileHelper::saveImage($request->file('image'), 'categories');
            $validated['image'] = $path;
        } elseif ($request->input('existingImage')) {
            $validated['image'] = $request->input('existingImage');
        } else {
            if ($category->image && Storage::disk('public')->exists($category->image)) {
                Storage::disk('public')->delete($category->image);
            }
            $validated['image'] = null;
        }

        $validated['updated_by'] = Auth::id();

        $category->update($validated);

        return redirect()->back()->with('success', 'Category updated.');
    }

    public function destroy(Request $request, Category $category)
    {
        $newCategoryId = $request->input('new_category_id');
        $targetCategoryId = null;

        if ($newCategoryId) {
            $targetCategoryId = Category::query()
                ->whereKey($newCategoryId)
                ->whereNull('deleted_at')
                ->value('id');
        }

        if ($targetCategoryId) {
            Product::where('category_id', $category->id)->update(['category_id' => $targetCategoryId]);
            InventoryItem::where('category_id', $category->id)->update(['category_id' => $targetCategoryId]);
        } else {
            Product::where('category_id', $category->id)->update(['category_id' => null]);
            InventoryItem::where('category_id', $category->id)->update(['category_id' => null]);
        }

        $category->update(['deleted_by' => Auth::id()]);
        $category->delete();

        return redirect()->back()->with('success', 'Category deleted.');
    }

    public function trashed(Request $request)
    {
        $query = Category::onlyTrashed();

        $trashedCategories = $query
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('deleted_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('App/Inventory/Categories/Trashed', [
            'trashedCategories' => $trashedCategories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $query = Category::withTrashed();

        $category = $query->findOrFail($id);
        $category->restore();

        return redirect()->back()->with('success', 'Category restored successfully.');
    }

    public function forceDelete($id)
    {
        $query = Category::withTrashed();

        $category = $query->findOrFail($id);

        if ($category->image && Storage::disk('public')->exists($category->image)) {
            Storage::disk('public')->delete($category->image);
        }

        $category->forceDelete();

        return redirect()->back()->with('success', 'Category permanently deleted.');
    }
}
