<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\InventoryItem;
use App\Models\PosManufacturer;
use App\Models\PosUnit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::query()
            ->with(['category:id,name', 'manufacturer:id,name', 'unit:id,name', 'ingredients:id,inventory_item_id'])
            ->latest('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('status', $request->status);
        }

        return Inertia::render('App/Inventory/Items/Index', [
            'items' => $query->paginate(15)->withQueryString(),
            'filters' => $request->only(['search', 'status']),
            'summary' => [
                'count' => InventoryItem::query()->count(),
                'active' => InventoryItem::query()->where('status', 'active')->count(),
                'purchasable' => InventoryItem::query()->where('is_purchasable', true)->count(),
                'linked_ingredients' => \App\Models\Ingredient::query()->whereNotNull('inventory_item_id')->count(),
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Inventory/Items/Form', $this->formPayload());
    }

    public function show(InventoryItem $inventoryItem)
    {
        return Inertia::render('App/Inventory/Items/Form', $this->formPayload($inventoryItem));
    }

    public function store(Request $request)
    {
        $data = $this->validateItem($request);
        InventoryItem::create($data + ['created_by' => $request->user()?->id]);

        return redirect()->route('pos.inventory.index')->with('success', 'Inventory item created.');
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $data = $this->validateItem($request, $inventoryItem->id);
        $inventoryItem->update($data + ['updated_by' => $request->user()?->id]);

        return redirect()->route('pos.inventory.index')->with('success', 'Inventory item updated.');
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        $inventoryItem->delete();

        return redirect()->back()->with('success', 'Inventory item deleted.');
    }

    protected function formPayload(?InventoryItem $inventoryItem = null): array
    {
        return [
            'inventoryItem' => $inventoryItem?->load(['category:id,name', 'manufacturer:id,name', 'unit:id,name']),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'manufacturers' => PosManufacturer::query()->orderBy('name')->get(['id', 'name']),
            'units' => PosUnit::query()->orderBy('name')->get(['id', 'name']),
        ];
    }

    protected function validateItem(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:inventory_items,sku,' . $ignoreId,
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'manufacturer_id' => 'nullable|exists:pos_manufacturers,id',
            'unit_id' => 'nullable|exists:pos_units,id',
            'default_unit_cost' => 'nullable|numeric|min:0',
            'minimum_stock' => 'nullable|numeric|min:0',
            'is_purchasable' => 'nullable|boolean',
            'manage_stock' => 'nullable|boolean',
            'status' => 'required|in:active,inactive',
        ]);
    }
}
