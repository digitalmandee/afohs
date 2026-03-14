<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\Category;
use App\Models\Ingredient;
use App\Models\PosManufacturer;
use App\Models\PosSubCategory;
use App\Models\PosUnit;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\ProductVariantValue;
use App\Rules\KitchenRole;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class InventoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $category_id = $request->query('category_id');

        $query = Product::latest()->with(['category', 'variants', 'variants.values']);

        if ($category_id) {
            $query->where('category_id', $category_id);
        }

        $productLists = $query->paginate(15);
        $categoriesList = Category::select('id', 'name')->get();

        return Inertia::render('App/Inventory/Dashboard', compact('productLists', 'categoriesList'));
    }

    public function getCategories(Request $request)
    {
        $categories = Category::latest()->get();

        return response()->json(['categories' => $categories]);
    }

    public function getSubCategoriesByCategory(Request $request, $category_id)
    {
        $subCategories = PosSubCategory::where('category_id', $category_id)
            ->select('id', 'name')
            ->get();

        return response()->json(['subCategories' => $subCategories]);
    }

    public function getManufacturerList(Request $request)
    {
        $manufacturers = PosManufacturer::select('id', 'name')
            ->get();

        return response()->json(['manufacturers' => $manufacturers]);
    }

    public function getUnitList(Request $request)
    {
        $units = PosUnit::select('id', 'name', 'code')
            ->get();

        return response()->json(['units' => $units]);
    }

    public function filterProducts(Request $request)
    {
        return $this->filter($request);
    }

    /**
     * API endpoint for filtering products with axios
     * Optimized for fast performance with debounced frontend calls
     */
    public function filter(Request $request)
    {
        $query = Product::select([
            'id', 'name', 'menu_code', 'category_id', 'base_price',
            'current_stock', 'minimal_stock', 'status', 'images',
            'description'
        ])
            ->with(['category:id,name', 'variants:id,product_id,name,type', 'variants.values']);

        // Filter by name (case-insensitive)
        if ($request->filled('name')) {
            $query->where('name', 'like', '%' . $request->name . '%');
        }

        // Filter by menu_code (case-insensitive)
        if ($request->filled('menu_code')) {
            $query->where('menu_code', 'like', '%' . $request->menu_code . '%');
        }

        // Filter by status (active/inactive)
        if ($request->filled('status') && $request->status !== 'all') {
            $isActive = $request->status === 'active';
            $query->where('status', $isActive);
        }

        // Filter by category (supports multiple IDs)
        if ($request->filled('category_ids')) {
            $categoryIds = explode(',', $request->category_ids);
            $query->whereIn('category_id', $categoryIds);
        } elseif ($request->filled('category_id') && $request->category_id !== 'all') {
            $query->where('category_id', $request->category_id);
        }

        // Filter by sub_category (supports multiple IDs)
        if ($request->filled('sub_category_ids')) {
            $subCategoryIds = explode(',', $request->sub_category_ids);
            $query->whereIn('sub_category_id', $subCategoryIds);
        }

        // Filter by manufacturer (supports multiple IDs)
        if ($request->filled('manufacturer_ids')) {
            $manufacturerIds = explode(',', $request->manufacturer_ids);
            $query->whereIn('manufacturer_id', $manufacturerIds);
        }

        $products = $query->latest()->paginate(15);

        return response()->json([
            'success' => true,
            'products' => $products,
            'count' => $products->count()
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        return Inertia::render('App/Inventory/Product', [
            'product' => null,
            'id' => null,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Validate the incoming request data
        $request->validate([
            'name' => 'nullable|string|max:255',
            'menu_code' => 'nullable|string|max:100',
            'category_id' => 'required',
            'sub_category_id' => 'nullable|exists:pos_sub_categories,id',
            'manufacturer_id' => 'nullable|exists:pos_manufacturers,id',
            'current_stock' => 'nullable|integer|min:0',
            'minimal_stock' => 'nullable|integer|min:0',
            'is_discountable' => 'nullable|boolean',
            'is_salable' => 'nullable|boolean',
            'is_purchasable' => 'nullable|boolean',
            'is_returnable' => 'nullable|boolean',
            'is_taxable' => 'nullable|boolean',
            'notify_when_out_of_stock' => 'nullable|boolean',
            'unit_id' => 'nullable|exists:pos_units,id',
            'item_type' => 'required|string|in:finished_product,raw_material',
            'available_order_types' => 'required|array|min:1',
            'available_order_types.*' => 'string',
            'cost_of_goods_sold' => 'required|numeric|min:0',
            'base_price' => 'required|numeric|min:0',
            'profit' => 'required|numeric',
            'description' => 'nullable|string',
            'images' => 'nullable|array',
            'images.*' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp,svg|max:2048',
            'ingredients' => 'nullable|array',
            'ingredients.*.id' => 'required_with:ingredients|exists:ingredients,id',
            'ingredients.*.quantity_used' => 'required_with:ingredients|numeric|min:0',
            'ingredients.*.cost' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'max_discount_type' => 'required_with:max_discount|string|in:percentage,amount',
            'manage_stock' => 'nullable|boolean',
        ]);

        DB::beginTransaction();
        // Handle image uploads (if any)
        $imagePaths = [];
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $image) {
                $path = FileHelper::saveImage($image, 'products');
                $imagePaths[] = $path;
            }
        }

        $currentStock = $request->input('current_stock');
        $minimalStock = $request->input('minimal_stock');
        $currentStock = ($currentStock === null || $currentStock === '') ? 0 : (int) $currentStock;
        $minimalStock = ($minimalStock === null || $minimalStock === '') ? 0 : (int) $minimalStock;

        // Create a new product and store it in the database
        $product = Product::create([
            'name' => $request->input('name'),
            'menu_code' => $request->input('menu_code'),
            'category_id' => $request->input('category_id'),
            'sub_category_id' => $request->input('sub_category_id'),
            'manufacturer_id' => $request->input('manufacturer_id'),
            'current_stock' => $currentStock,
            'minimal_stock' => $minimalStock,
            'is_discountable' => $request->input('is_discountable', true),
            'is_salable' => $request->input('is_salable', true),
            'is_purchasable' => $request->input('is_purchasable', true),
            'is_returnable' => $request->input('is_returnable', true),
            'is_taxable' => $request->input('is_taxable', false),
            'notify_when_out_of_stock' => $request->input('notify_when_out_of_stock', false),
            'unit_id' => $request->input('unit_id'),
            'item_type' => $request->input('item_type', 'finished_product'),
            'available_order_types' => $request->input('available_order_types'),
            'cost_of_goods_sold' => $request->input('cost_of_goods_sold'),
            'base_price' => $request->input('base_price'),
            'description' => $request->input('description'),
            'images' => $imagePaths,
            'tenant_id' => null,
            'created_by' => Auth::id(),
            'max_discount' => $request->input('max_discount'),
            'max_discount_type' => $request->input('max_discount_type', 'percentage'),
            'manage_stock' => $request->input('manage_stock', false),
        ]);

        // Auto-generate item code if not provided
        if (empty($product->menu_code)) {
            $product->menu_code = (string) $product->id;
            $product->save();
        }

        // Handle variants if passed as an object
        if ($request->has('variants')) {
            foreach ($request->input('variants') as $variant) {
                if (!$variant['active']) {
                    continue;
                }

                $productVariant = $product->variants()->create([
                    'product_id' => $product->id,
                    'name' => $variant['name'],
                    'type' => $variant['type'],
                ]);

                foreach ($variant['items'] as $item) {
                    if ($item['name'] === '') {
                        continue;
                    }

                    $productVariant->values()->create([
                        'product_variant_id' => $productVariant->id,
                        'name' => $item['name'],
                        'additional_price' => $item['additional_price'],
                        'stock' => $item['stock'],
                        'is_default' => false,
                    ]);
                }
            }
        }

        // Handle ingredients if provided
        if ($request->has('ingredients') && is_array($request->input('ingredients'))) {
            foreach ($request->input('ingredients') as $ingredientData) {
                // Validate ingredient availability
                $ingredient = Ingredient::find($ingredientData['id']);
                if ($ingredient && $ingredient->hasEnoughQuantity($ingredientData['quantity_used'])) {
                    // Attach ingredient to product with pivot data
                    $product->ingredients()->attach($ingredientData['id'], [
                        'quantity_used' => $ingredientData['quantity_used'],
                        'cost' => $ingredientData['cost'] ?? 0
                    ]);

                    // Don't deduct from ingredient stock yet - only when product is actually made/sold
                }
            }
        }

        DB::commit();
        return redirect()->back()->with('success', 'Product created.');
    }

    // Get Single Product
    public function getProduct($id)
    {
        $product = Product::with(['variants:id,product_id,name', 'variants.values', 'kitchen', 'category'])
            ->find($id);
        return response()->json(['success' => true, 'product' => $product], 200);
    }

    public function singleProduct($id)
    {
        return $this->getProduct($id);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id)
    {
        $product = Product::with(['variants:id,product_id,name,type,active', 'variants.items', 'category', 'kitchen', 'ingredients'])
            ->find($id);

        return Inertia::render('App/Inventory/Product', [
            'product' => $product,
            'id' => $id,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'menu_code' => 'required|string|max:100',
            'category_id' => 'required',
            'sub_category_id' => 'nullable|exists:pos_sub_categories,id',
            'manufacturer_id' => 'nullable|exists:pos_manufacturers,id',
            'current_stock' => 'nullable|integer|min:0',
            'minimal_stock' => 'nullable|integer|min:0',
            'is_discountable' => 'nullable|boolean',
            'is_salable' => 'nullable|boolean',
            'is_purchasable' => 'nullable|boolean',
            'is_returnable' => 'nullable|boolean',
            'is_taxable' => 'nullable|boolean',
            'notify_when_out_of_stock' => 'nullable|boolean',
            'unit_id' => 'nullable|exists:pos_units,id',
            'item_type' => 'required|string|in:finished_product,raw_material',
            'available_order_types' => 'required|array|min:1',
            'available_order_types.*' => 'string',
            'cost_of_goods_sold' => 'required|numeric|min:0',
            'base_price' => 'required|numeric|min:0',
            'profit' => 'required|numeric',
            'description' => 'nullable|string',
            'images' => 'nullable|array',
            'deleted_images' => 'nullable|array',
            'deleted_images.*' => 'string',
            'ingredients' => 'nullable|array',
            'ingredients.*.id' => 'required_with:ingredients|exists:ingredients,id',
            'ingredients.*.quantity_used' => 'required_with:ingredients|numeric|min:0',
            'ingredients.*.cost' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'max_discount_type' => 'required_with:max_discount|string|in:percentage,amount',
            'manage_stock' => 'nullable|boolean',
        ]);

        // Get current product to access existing images
        $product = Product::findOrFail($id);
        $oldImages = $product->images ?? [];

        // Step 1: Process request images (mix of new files and existing paths)
        $imagePaths = [];
        $requestImages = $request->input('images', []);

        // Handle existing images that should be kept FIRST (from deleted_images logic)
        $deletedImages = $request->input('deleted_images', []);
        foreach ($oldImages as $oldImage) {
            if (!in_array($oldImage, $deletedImages)) {
                $imagePaths[] = $oldImage;
            }
        }

        // Handle file uploads and add them AFTER existing images
        if ($request->hasFile('images')) {
            $uploadedFiles = $request->file('images');
            foreach ($uploadedFiles as $image) {
                $path = FileHelper::saveImage($image, 'products');
                $imagePaths[] = $path;
            }
        }

        // Step 2: Find deleted images by comparing old vs new
        $deletedImagePaths = [];
        foreach ($oldImages as $oldImage) {
            if (in_array($oldImage, $deletedImages)) {
                $deletedImagePaths[] = $oldImage;
            }
        }

        // Step 3: Delete them from filesystem
        foreach ($deletedImagePaths as $imagePath) {
            $absolutePath = public_path(ltrim($imagePath, '/'));

            if (file_exists($absolutePath)) {
                @unlink($absolutePath);
            }
        }

        $currentStock = $request->input('current_stock');
        $minimalStock = $request->input('minimal_stock');
        $currentStock = ($currentStock === null || $currentStock === '') ? 0 : (int) $currentStock;
        $minimalStock = ($minimalStock === null || $minimalStock === '') ? 0 : (int) $minimalStock;

        Product::where('id', $id)
            ->update([
            'name' => $request->input('name'),
            'menu_code' => $request->input('menu_code'),
            'category_id' => $request->input('category_id'),
            'sub_category_id' => $request->input('sub_category_id'),
            'manufacturer_id' => $request->input('manufacturer_id'),
            'current_stock' => $currentStock,
            'minimal_stock' => $minimalStock,
            'is_discountable' => $request->has('is_discountable') ? $request->boolean('is_discountable') : (bool) $product->is_discountable,
            'is_salable' => $request->input('is_salable', true),
            'is_purchasable' => $request->input('is_purchasable', true),
            'is_returnable' => $request->input('is_returnable', true),
            'is_taxable' => $request->input('is_taxable', false),
            'notify_when_out_of_stock' => $request->input('notify_when_out_of_stock', false),
            'unit_id' => $request->input('unit_id'),
            'item_type' => $request->input('item_type', 'finished_product'),
            'available_order_types' => $request->input('available_order_types'),
            'cost_of_goods_sold' => $request->input('cost_of_goods_sold'),
            'base_price' => $request->input('base_price'),
            'description' => $request->input('description'),
            'images' => $imagePaths,
            'updated_by' => Auth::id(),
            'max_discount' => $request->input('max_discount'),
            'max_discount_type' => $request->input('max_discount_type', 'percentage'),
            'manage_stock' => $request->input('manage_stock', false),
        ]);

        if ($request->has('variants')) {
            $submittedVariantIds = [];

            foreach ($request->input('variants') as $variant) {
                $productVariant = ProductVariant::updateOrCreate(
                    ['id' => $variant['id'] ?? null, 'product_id' => $id],
                    [
                        'product_id' => $id,
                        'name' => $variant['name'],
                        'type' => $variant['type'],
                    ]
                );

                $submittedVariantIds[] = $productVariant->id;

                $submittedValueIds = [];

                foreach ($variant['items'] as $item) {
                    if (empty($item['name'])) {
                        continue;
                    }

                    $variantValue = ProductVariantValue::updateOrCreate(
                        ['id' => $item['id'] ?? null],
                        [
                            'product_variant_id' => $productVariant->id,
                            'name' => $item['name'],
                            'additional_price' => $item['additional_price'],
                            'stock' => $item['stock'],
                            'is_default' => false,
                        ]
                    );

                    $submittedValueIds[] = $variantValue->id;
                }

                ProductVariantValue::where('product_variant_id', $productVariant->id)
                    ->whereNotIn('id', $submittedValueIds)
                    ->delete();
            }

            ProductVariant::where('product_id', $id)->whereNotIn('id', $submittedVariantIds)->orWhereDoesntHave('values')->delete();
        }

        // Handle ingredients update
        if ($request->has('ingredients')) {
            // First, detach all existing ingredients
            $product->ingredients()->detach();

            // Then attach new ingredients with pivot data
            foreach ($request->input('ingredients') as $ingredientData) {
                $product->ingredients()->attach($ingredientData['id'], [
                    'quantity_used' => $ingredientData['quantity_used'],
                    'cost' => $ingredientData['cost'] ?? 0
                ]);
            }
        }

        return redirect()->back()->with('success', 'Product updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        try {
            $product = Product::findOrFail($id);
            $product->update(['deleted_by' => Auth::id()]);
            $product->delete();
            return response()->json(['success' => true, 'message' => 'Product deleted.']);
        } catch (\Throwable $th) {
            Log::info($th);
            return response()->json(['success' => false, 'message' => 'Failed to delete product.']);
        }
    }

    public function trashed(Request $request)
    {
        $trashedProducts = Product::onlyTrashed()
            ->with(['category'])
            ->when($request->search, function ($query, $search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('menu_code', 'like', "%{$search}%");
            })
            ->orderBy('deleted_at', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('App/Inventory/Trashed', [
            'trashedProducts' => $trashedProducts,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $product = Product::withTrashed()
            ->findOrFail($id);
        $product->restore();

        return redirect()->back()->with('success', 'Product restored successfully.');
    }

    public function forceDelete($id)
    {
        $product = Product::withTrashed()
            ->findOrFail($id);

        // Delete images from storage
        if ($product->images) {
            foreach ($product->images as $imagePath) {
                $absolutePath = public_path(ltrim($imagePath, '/'));
                if (file_exists($absolutePath)) {
                    @unlink($absolutePath);
                }
            }
        }

        $product->forceDelete();

        return redirect()->back()->with('success', 'Product permanently deleted.');
    }
}
