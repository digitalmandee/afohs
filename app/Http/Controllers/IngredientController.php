<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\InventoryItem;
use App\Models\Product;
use App\Services\Inventory\RestaurantInventoryResolver;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class IngredientController extends Controller
{
    /**
     * Display a listing of ingredients
     */
    public function index(Request $request)
    {
        $query = Ingredient::query()->with('inventoryItem:id,name,sku,manage_stock');

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Sort
        $sortBy = $request->input('sort_by', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortBy, $sortDirection);

        $restaurantId = (int) ($request->session()->get('active_restaurant_id') ?? 0);
        $ingredients = $query->get();
        $this->hydrateWarehouseBalances($ingredients, $restaurantId);

        if ($request->filled('stock_level')) {
            $stockLevel = $request->input('stock_level');
            $ingredients = $ingredients->filter(function (Ingredient $ingredient) use ($stockLevel) {
                $remaining = (float) $ingredient->remaining_quantity;

                return match ($stockLevel) {
                    'low' => $remaining > 0 && $remaining <= 10,
                    'out' => $remaining <= 0,
                    'available' => $remaining > 0,
                    default => true,
                };
            })->values();
        }

        $perPage = 15;
        $currentPage = LengthAwarePaginator::resolveCurrentPage();
        $offset = max(0, ($currentPage - 1) * $perPage);
        $ingredients = new LengthAwarePaginator(
            $ingredients->slice($offset, $perPage)->values(),
            $ingredients->count(),
            $perPage,
            $currentPage,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );

        // Statistics
        $statsCollection = Ingredient::query()
            ->with('inventoryItem:id,name,sku,manage_stock')
            ->get();
        $this->hydrateWarehouseBalances($statsCollection, $restaurantId);
        $stats = [
            'total_ingredients' => $statsCollection->count(),
            'active_ingredients' => $statsCollection->where('status', 'active')->count(),
            'low_stock' => $statsCollection->filter(fn (Ingredient $ingredient) => (float) $ingredient->remaining_quantity > 0 && (float) $ingredient->remaining_quantity <= 10)->count(),
            'out_of_stock' => $statsCollection->filter(fn (Ingredient $ingredient) => (float) $ingredient->remaining_quantity <= 0)->count(),
            'warehouse_managed' => $statsCollection->where('balance_source', 'warehouse')->count(),
            'legacy_only' => $statsCollection->where('balance_source', 'legacy')->count(),
        ];

        return Inertia::render('App/Inventory/Ingredients/Index', [
            'ingredients' => $ingredients,
            'stats' => $stats,
            'filters' => $request->only(['search', 'status', 'stock_level', 'sort_by', 'sort_direction'])
        ]);
    }

    /**
     * Show the form for creating a new ingredient
     */
    public function create()
    {
        return Inertia::render('App/Inventory/Ingredients/Create', [
            'rawMaterialProducts' => InventoryItem::query()
                ->warehouseOperationalEligible()
                ->orderBy('name')
                ->get(['id', 'name', 'sku']),
        ]);
    }

    /**
     * Store a newly created ingredient
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:ingredients,name',
            'inventory_item_id' => [
                'nullable',
                Rule::exists('inventory_items', 'id')->where(fn ($query) => $query
                    ->where('manage_stock', true)),
            ],
            'description' => 'nullable|string',
            'total_quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'cost_per_unit' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date|after:today',
            'status' => 'required|in:active,inactive'
        ]);

        // Calculate remaining quantity (initially same as total)
        $validated['remaining_quantity'] = $validated['total_quantity'];
        $validated['used_quantity'] = 0;

        $ingredient = Ingredient::create($validated);

        return $this->redirectToIndex($request)
            ->with('success', 'Ingredient created successfully!');
    }

    /**
     * Display the specified ingredient
     */
    public function show(Ingredient $ingredient)
    {
        $ingredient->load(['products' => function ($query) {
            $query->withPivot('quantity_used', 'cost');
        }, 'inventoryItem:id,name,sku']);

        $this->hydrateWarehouseBalances(collect([$ingredient]), (int) (request()->session()->get('active_restaurant_id') ?? 0));

        return Inertia::render('App/Inventory/Ingredients/Show', [
            'ingredient' => $ingredient
        ]);
    }

    /**
     * Show the form for editing the specified ingredient
     */
    public function edit(Ingredient $ingredient)
    {
        return Inertia::render('App/Inventory/Ingredients/Edit', [
            'ingredient' => $ingredient->load('inventoryItem:id,name,sku'),
            'rawMaterialProducts' => InventoryItem::query()
                ->warehouseOperationalEligible()
                ->orderBy('name')
                ->get(['id', 'name', 'sku']),
        ]);
    }

    /**
     * Update the specified ingredient
     */
    public function update(Request $request, Ingredient $ingredient)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('ingredients')->ignore($ingredient->id)],
            'inventory_item_id' => [
                'nullable',
                Rule::exists('inventory_items', 'id')->where(fn ($query) => $query
                    ->where('manage_stock', true)),
            ],
            'description' => 'nullable|string',
            'total_quantity' => 'required|numeric|min:0',
            'unit' => 'required|string|max:50',
            'cost_per_unit' => 'nullable|numeric|min:0',
            'expiry_date' => 'nullable|date',
            'status' => 'required|in:active,inactive,expired'
        ]);

        // Recalculate remaining quantity if total quantity changed
        if ($validated['total_quantity'] != $ingredient->total_quantity) {
            $difference = $validated['total_quantity'] - $ingredient->total_quantity;
            $validated['remaining_quantity'] = $ingredient->remaining_quantity + $difference;
        }

        $ingredient->update($validated);

        return $this->redirectToIndex($request)
            ->with('success', 'Ingredient updated successfully!');
    }

    /**
     * Remove the specified ingredient
     */
    public function destroy(Ingredient $ingredient)
    {
        // Check if ingredient is used in any products
        if ($ingredient->products()->exists()) {
            return back()->with('error', 'Cannot delete ingredient that is used in products!');
        }

        $ingredient->delete();

        return $this->redirectToIndex(request())
            ->with('success', 'Ingredient deleted successfully!');
    }

    /**
     * Show the form for adding stock to ingredient
     */
    public function showAddStock(Ingredient $ingredient)
    {
        return Inertia::render('App/Inventory/Ingredients/AddStock', [
            'ingredient' => $ingredient->load('inventoryItem:id,name,sku')
        ]);
    }

    /**
     * Add stock to ingredient
     */
    public function addStock(Request $request, Ingredient $ingredient)
    {
        if ($ingredient->inventory_item_id) {
            return back()->with('error', 'This ingredient is warehouse-managed. Add stock through goods receipt, opening balance, adjustment, or transfer.');
        }

        $validated = $request->validate([
            'quantity' => 'required|numeric|min:0.01',
            'cost_per_unit' => 'nullable|numeric|min:0'
        ]);

        $ingredient->addQuantity($validated['quantity']);

        if (isset($validated['cost_per_unit'])) {
            $ingredient->update(['cost_per_unit' => $validated['cost_per_unit']]);
        }

        return back()->with('success', 'Stock added successfully!');
    }

    /**
     * Get ingredients for API/AJAX calls
     */
    public function getIngredients(Request $request)
    {
        $query = Ingredient::active()->with('inventoryItem:id,name,sku');

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $ingredients = $query->select('id', 'name', 'inventory_item_id', 'remaining_quantity', 'unit', 'cost_per_unit')
            ->orderBy('name')
            ->get();

        $this->hydrateWarehouseBalances($ingredients, (int) ($request->session()->get('active_restaurant_id') ?? 0));

        return response()->json($ingredients);
    }

    /**
     * Check ingredient availability
     */
    public function checkAvailability(Request $request)
    {
        $validated = $request->validate([
            'ingredients' => 'required|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0.01'
        ]);

        $availability = [];
        $allAvailable = true;

        foreach ($validated['ingredients'] as $ingredientData) {
            $ingredient = Ingredient::with('inventoryItem:id,name,sku')->find($ingredientData['id']);
            $this->hydrateWarehouseBalances(collect([$ingredient]), (int) ($request->session()->get('active_restaurant_id') ?? 0));
            $available = $ingredient->hasEnoughQuantity($ingredientData['quantity']);
            
            $availability[] = [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'required' => $ingredientData['quantity'],
                'available' => $ingredient->remaining_quantity,
                'sufficient' => $available,
                'unit' => $ingredient->unit,
                'balance_source' => $ingredient->balance_source,
            ];

            if (!$available) {
                $allAvailable = false;
            }
        }

        return response()->json([
            'all_available' => $allAvailable,
            'ingredients' => $availability
        ]);
    }

    protected function hydrateWarehouseBalances($ingredients, int $restaurantId): void
    {
        foreach ($ingredients as $ingredient) {
            if (!$ingredient) {
                continue;
            }

            $ingredient->legacy_remaining_quantity = (float) $ingredient->remaining_quantity;
            $ingredient->warehouse_managed = (bool) $ingredient->inventory_item_id;
            $ingredient->balance_source = $ingredient->inventory_item_id ? 'warehouse' : 'legacy';
        }

        if ($restaurantId <= 0) {
            return;
        }

        $inventoryItemIds = collect($ingredients)
            ->pluck('inventory_item_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        if (empty($inventoryItemIds)) {
            return;
        }

        $resolver = app(RestaurantInventoryResolver::class);
        $assignments = $resolver->assignmentsForRestaurant($restaurantId, ['sellable', 'primary_issue_source']);
        $balances = $resolver->aggregateBalancesForAssignments($inventoryItemIds, $assignments);

        foreach ($ingredients as $ingredient) {
            if (!$ingredient->inventory_item_id) {
                continue;
            }

            $balance = (float) $balances->get((int) $ingredient->inventory_item_id, 0.0);
            $ingredient->remaining_quantity = $balance;
            $ingredient->warehouse_managed = true;
            $ingredient->balance_source = 'warehouse';
        }
    }

    protected function redirectToIndex(Request $request)
    {
        if ($request->routeIs('inventory.ingredients.*')) {
            return redirect()->route('inventory.ingredients.index');
        }

        if ($request->routeIs('pos.ingredients.*')) {
            return redirect()->route('pos.ingredients.index');
        }

        return redirect()->route('ingredients.index');
    }
}
