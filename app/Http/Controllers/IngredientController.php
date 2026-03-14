<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class IngredientController extends Controller
{
    /**
     * Display a listing of ingredients
     */
    public function index(Request $request)
    {
        $query = Ingredient::query();

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

        // Filter by stock level
        if ($request->filled('stock_level')) {
            switch ($request->stock_level) {
                case 'low':
                    $query->where('remaining_quantity', '<=', 10);
                    break;
                case 'out':
                    $query->where('remaining_quantity', '<=', 0);
                    break;
                case 'available':
                    $query->where('remaining_quantity', '>', 0);
                    break;
            }
        }

        // Sort
        $sortBy = $request->input('sort_by', 'name');
        $sortDirection = $request->input('sort_direction', 'asc');
        $query->orderBy($sortBy, $sortDirection);

        $ingredients = $query->paginate(15)->withQueryString();

        // Statistics
        $stats = [
            'total_ingredients' => Ingredient::count(),
            'active_ingredients' => Ingredient::where('status', 'active')->count(),
            'low_stock' => Ingredient::where('remaining_quantity', '<=', 10)->count(),
            'out_of_stock' => Ingredient::where('remaining_quantity', '<=', 0)->count(),
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
        return Inertia::render('App/Inventory/Ingredients/Create');
    }

    /**
     * Store a newly created ingredient
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:ingredients,name',
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

        return redirect()->route('ingredients.index')
            ->with('success', 'Ingredient created successfully!');
    }

    /**
     * Display the specified ingredient
     */
    public function show(Ingredient $ingredient)
    {
        $ingredient->load(['products' => function ($query) {
            $query->withPivot('quantity_used', 'cost');
        }]);

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
            'ingredient' => $ingredient
        ]);
    }

    /**
     * Update the specified ingredient
     */
    public function update(Request $request, Ingredient $ingredient)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('ingredients')->ignore($ingredient->id)],
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

        return redirect()->route('ingredients.index')
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

        return redirect()->route('ingredients.index')
            ->with('success', 'Ingredient deleted successfully!');
    }

    /**
     * Show the form for adding stock to ingredient
     */
    public function showAddStock(Ingredient $ingredient)
    {
        return Inertia::render('App/Inventory/Ingredients/AddStock', [
            'ingredient' => $ingredient
        ]);
    }

    /**
     * Add stock to ingredient
     */
    public function addStock(Request $request, Ingredient $ingredient)
    {
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
        $query = Ingredient::active()->available();

        if ($request->filled('search')) {
            $query->where('name', 'like', "%{$request->search}%");
        }

        $ingredients = $query->select('id', 'name', 'remaining_quantity', 'unit', 'cost_per_unit')
            ->orderBy('name')
            ->get();

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
            $ingredient = Ingredient::find($ingredientData['id']);
            $available = $ingredient->hasEnoughQuantity($ingredientData['quantity']);
            
            $availability[] = [
                'id' => $ingredient->id,
                'name' => $ingredient->name,
                'required' => $ingredientData['quantity'],
                'available' => $ingredient->remaining_quantity,
                'sufficient' => $available,
                'unit' => $ingredient->unit
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
}
