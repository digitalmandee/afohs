<?php

namespace App\Http\Controllers\App;

use App\Helpers\FileHelper;
use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $categoriesList = Category::query()
            // ->where('tenant_id', tenant()->id)
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->withCount('products')
            ->latest()
            ->paginate(10)  // Changed to pagination to match other modules
            ->withQueryString();

        return Inertia::render('App/Inventory/Categories/Index', [
            'categories' => $categoriesList,
            'filters' => $request->only(['search']),
        ]);
    }

    public function getCategories()
    {
        $categories = Category::latest()->get();

        return response()->json(['categories' => $categories]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:pos_categories,name',
            'status' => 'required|in:active,inactive',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = FileHelper::saveImage($request->file('image'), 'categories');
            $validated['image'] = $path;
        }

        $validated['tenant_id'] = tenant()->id;
        $validated['created_by'] = Auth::id();

        Category::create($validated);

        return redirect()->back()->with('success', 'Category created.');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => "required|string|max:255|unique:pos_categories,name,{$category->id}",
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

        // Reassign products logic
        if ($newCategoryId) {
            Product::where('category_id', $category->id)
                ->update(['category_id' => $newCategoryId]);
        } else {
            Product::where('category_id', $category->id)
                ->update(['category_id' => null]);
        }

        $category->update(['deleted_by' => Auth::id()]);
        $category->delete();

        return redirect()->back()->with('success', 'Category deleted.');
    }

    public function trashed(Request $request)
    {
        $trashedCategories = Category::onlyTrashed()
            // ->where('tenant_id', tenant()->id)
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
        $category = Category::withTrashed()->findOrFail($id);
        $category->restore();

        return redirect()->back()->with('success', 'Category restored successfully.');
    }

    public function forceDelete($id)
    {
        $category = Category::withTrashed()->findOrFail($id);

        if ($category->image && Storage::disk('public')->exists($category->image)) {
            Storage::disk('public')->delete($category->image);
        }

        $category->forceDelete();

        return redirect()->back()->with('success', 'Category permanently deleted.');
    }
}
