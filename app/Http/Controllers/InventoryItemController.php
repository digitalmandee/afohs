<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\GoodsReceiptItem;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\PosManufacturer;
use App\Models\PosUnit;
use App\Models\PurchaseOrderItem;
use App\Models\Vendor;
use App\Models\VendorItemMapping;
use App\Models\VendorBillItem;
use App\Models\CoaAccount;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class InventoryItemController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryItem::query()
            ->with([
                'category:id,name',
                'manufacturer:id,name',
                'unit:id,name',
                'ingredients:id,inventory_item_id',
                'inventoryAccount:id,full_code,name',
                'cogsAccount:id,full_code,name',
                'purchaseAccount:id,full_code,name',
            ])
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
        $data = $this->withGeneratedSku($data);
        $mappings = $this->validatedVendorMappings($request);

        DB::transaction(function () use ($data, $request, $mappings) {
            $item = InventoryItem::create($data + ['created_by' => $request->user()?->id]);
            $this->syncVendorMappings($item, $mappings);
        });

        return $this->redirectToIndex($request)->with('success', 'Inventory item created.');
    }

    public function update(Request $request, InventoryItem $inventoryItem)
    {
        $data = $this->validateItem($request, $inventoryItem->id);
        $mappings = $this->validatedVendorMappings($request);

        DB::transaction(function () use ($inventoryItem, $data, $request, $mappings) {
            $inventoryItem->update($data + ['updated_by' => $request->user()?->id]);
            $this->syncVendorMappings($inventoryItem, $mappings);
        });

        return $this->redirectToIndex($request)->with('success', 'Inventory item updated.');
    }

    public function destroy(InventoryItem $inventoryItem)
    {
        if ($inventoryItem->ingredients()->exists()) {
            return back()->with('error', 'Cannot delete an inventory item that is linked to ingredients.');
        }

        if (
            InventoryTransaction::query()->where('inventory_item_id', $inventoryItem->id)->exists() ||
            PurchaseOrderItem::query()->where('inventory_item_id', $inventoryItem->id)->exists() ||
            GoodsReceiptItem::query()->where('inventory_item_id', $inventoryItem->id)->exists() ||
            VendorBillItem::query()->where('inventory_item_id', $inventoryItem->id)->exists()
        ) {
            return back()->with('error', 'Cannot delete an inventory item that is already used in warehouse or procurement transactions.');
        }

        $inventoryItem->delete();

        return redirect()->back()->with('success', 'Inventory item deleted.');
    }

    protected function formPayload(?InventoryItem $inventoryItem = null): array
    {
        $inventoryItem?->load([
            'category:id,name',
            'manufacturer:id,name',
            'unit:id,name',
            'inventoryAccount:id,full_code,name',
            'cogsAccount:id,full_code,name',
            'purchaseAccount:id,full_code,name',
            'vendorMappings:id,vendor_id,inventory_item_id,is_preferred,is_active,contract_price,last_purchase_price,lead_time_days,minimum_order_qty,currency',
            'vendorMappings.vendor:id,name',
        ]);

        return [
            'inventoryItem' => $inventoryItem,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'manufacturers' => PosManufacturer::query()->orderBy('name')->get(['id', 'name']),
            'units' => PosUnit::query()->orderBy('name')->get(['id', 'name']),
            'coaAccounts' => \App\Models\CoaAccount::query()
                ->active()
                ->postable()
                ->orderBy('full_code')
                ->get(['id', 'full_code', 'name']),
            'vendors' => Vendor::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'tenant_id']),
        ];
    }

    protected function validateItem(Request $request, ?int $ignoreId = null): array
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:inventory_items,sku,' . $ignoreId,
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:categories,id',
            'manufacturer_id' => 'nullable|exists:pos_manufacturers,id',
            'unit_id' => 'nullable|exists:pos_units,id',
            'inventory_account_id' => 'nullable|exists:coa_accounts,id',
            'cogs_account_id' => 'nullable|exists:coa_accounts,id',
            'purchase_account_id' => 'nullable|exists:coa_accounts,id',
            'default_unit_cost' => 'nullable|numeric|min:0',
            'minimum_stock' => 'nullable|numeric|min:0',
            'is_purchasable' => 'nullable|boolean',
            'manage_stock' => 'nullable|boolean',
            'is_expiry_tracked' => 'nullable|boolean',
            'purchase_price_mode' => 'required|in:open,fixed',
            'valuation_method' => 'nullable|in:fifo,weighted_average',
            'fixed_purchase_price' => 'nullable|numeric|min:0',
            'allow_price_override' => 'nullable|boolean',
            'max_price_variance_percent' => 'nullable|numeric|min:0|max:100',
            'vendor_mappings' => 'nullable|array',
            'vendor_mappings.*.vendor_id' => 'required|exists:vendors,id',
            'vendor_mappings.*.is_preferred' => 'nullable|boolean',
            'vendor_mappings.*.is_active' => 'nullable|boolean',
            'vendor_mappings.*.contract_price' => 'nullable|numeric|min:0',
            'vendor_mappings.*.lead_time_days' => 'nullable|integer|min:0',
            'vendor_mappings.*.minimum_order_qty' => 'nullable|numeric|min:0',
            'vendor_mappings.*.currency' => 'nullable|string|max:8',
            'status' => 'required|in:active,inactive',
        ]);

        if (($data['purchase_price_mode'] ?? 'open') === 'fixed' && !array_key_exists('fixed_purchase_price', $data)) {
            $data['fixed_purchase_price'] = $data['default_unit_cost'] ?? 0;
        }

        if (($data['purchase_price_mode'] ?? 'open') === 'open') {
            $data['fixed_purchase_price'] = null;
            $data['allow_price_override'] = true;
            $data['max_price_variance_percent'] = null;
        }

        if (empty($data['valuation_method'])) {
            $data['valuation_method'] = 'fifo';
        }

        foreach (['inventory_account_id', 'cogs_account_id', 'purchase_account_id'] as $accountField) {
            if (empty($data[$accountField])) {
                continue;
            }

            $isValid = CoaAccount::query()
                ->whereKey($data[$accountField])
                ->active()
                ->postable()
                ->exists();

            if (!$isValid) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    $accountField => 'Selected COA account must be active and postable.',
                ]);
            }
        }

        unset($data['vendor_mappings']);

        return $data;
    }

    protected function validatedVendorMappings(Request $request): array
    {
        $mappings = $request->input('vendor_mappings', []);
        if (!is_array($mappings)) {
            $mappings = [];
        }

        $preferredCount = collect($mappings)->filter(fn ($row) => !empty($row['is_preferred']))->count();
        if ($preferredCount > 1) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'vendor_mappings' => 'Only one preferred vendor can be selected per item.',
            ]);
        }

        $vendorIds = collect($mappings)
            ->pluck('vendor_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->all();
        if (count($vendorIds) !== count(array_unique($vendorIds))) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'vendor_mappings' => 'Duplicate vendor rows are not allowed for the same item.',
            ]);
        }

        return $mappings;
    }

    protected function syncVendorMappings(InventoryItem $item, array $mappings): void
    {
        VendorItemMapping::query()->where('inventory_item_id', $item->id)->delete();

        foreach ($mappings as $mapping) {
            if (empty($mapping['vendor_id'])) {
                continue;
            }

            VendorItemMapping::query()->create([
                'vendor_id' => $mapping['vendor_id'],
                'inventory_item_id' => $item->id,
                'tenant_id' => Vendor::query()->whereKey($mapping['vendor_id'])->value('tenant_id'),
                'is_preferred' => (bool) ($mapping['is_preferred'] ?? false),
                'is_active' => (bool) ($mapping['is_active'] ?? true),
                'contract_price' => $mapping['contract_price'] ?? null,
                'lead_time_days' => $mapping['lead_time_days'] ?? null,
                'minimum_order_qty' => $mapping['minimum_order_qty'] ?? null,
                'currency' => $mapping['currency'] ?? 'PKR',
            ]);
        }
    }

    protected function withGeneratedSku(array $data): array
    {
        if (!empty(trim((string) ($data['sku'] ?? '')))) {
            return $data;
        }

        $seed = ((int) InventoryItem::query()->max('id')) + 1;
        $maxAttempts = 50;

        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $candidate = sprintf('INV-%06d', $seed + $attempt);
            $exists = InventoryItem::query()
                ->where('sku', $candidate)
                ->exists();

            if (!$exists) {
                $data['sku'] = $candidate;
                return $data;
            }
        }

        $data['sku'] = 'INV-' . now()->format('ymdHis');

        return $data;
    }

    protected function redirectToIndex(Request $request)
    {
        if ($request->routeIs('inventory.items.*')) {
            return redirect()->route('inventory.items.index');
        }

        if ($request->routeIs('pos.inventory.*')) {
            return redirect()->route('pos.inventory.index');
        }

        return redirect()->route('inventory.index');
    }
}
