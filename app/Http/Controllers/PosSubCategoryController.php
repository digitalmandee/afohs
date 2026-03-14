<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\PosSubCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PosSubCategoryController extends Controller
{
    public function index(Request $request)
    {
        $subCategories = PosSubCategory::with('category')
            ->when($request->search, function ($query, $search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        $categories = Category::select('id', 'name')->get();

        return Inertia::render('App/Inventory/SubCategories/Index', [
            'subCategories' => $subCategories,
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $locationId = $request->session()->get('active_pos_location_id');
        $request->validate([
            'category_id' => 'required|exists:pos_categories,id',
            'name' => 'required|string|max:50',
            'status' => 'required|in:active,inactive',
        ]);

        PosSubCategory::create($request->merge([
            'created_by' => Auth::id(),
            'tenant_id' => null,
            'location_id' => $locationId ? (int) $locationId : null,
        ])->all());

        return redirect()->back()->with('success', 'Sub Category created successfully.');
    }

    public function update(Request $request, $id)
    {
        $subCategory = PosSubCategory::findOrFail($id);

        $request->validate([
            'category_id' => 'required|exists:pos_categories,id',
            'name' => 'required|string|max:50',
            'status' => 'required|in:active,inactive',
        ]);

        $subCategory->update($request->merge([
            'updated_by' => Auth::id(),
        ])->all());

        return redirect()->back()->with('success', 'Sub Category updated successfully.');
    }

    public function destroy(Request $request, $id)
    {
        $subCategory = PosSubCategory::findOrFail($id);
        $subCategory->update(['deleted_by' => Auth::id()]);
        $subCategory->delete();

        return redirect()->back()->with('success', 'Sub Category deleted successfully.');
    }

    public function trashed(Request $request)
    {
        $trashedSubCategories = PosSubCategory::onlyTrashed()
            ->with('category')
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('deleted_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('App/Inventory/SubCategories/Trashed', [
            'trashedSubCategories' => $trashedSubCategories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore(Request $request, $id)
    {
        $subCategory = PosSubCategory::withTrashed()
            ->findOrFail($id);
        $subCategory->restore();

        return redirect()->back()->with('success', 'Sub Category restored successfully.');
    }

    public function forceDelete(Request $request, $id)
    {
        $subCategory = PosSubCategory::withTrashed()
            ->findOrFail($id);
        $subCategory->forceDelete();

        return redirect()->back()->with('success', 'Sub Category permanently deleted.');
    }

    public function getByCategory(Request $request, $categoryId)
    {
        $subCategories = PosSubCategory::where('category_id', $categoryId)
            ->select('id', 'name')
            ->get();

        return response()->json(['subCategories' => $subCategories]);
    }
}
