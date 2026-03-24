<?php

namespace App\Console\Commands;

use App\Models\Ingredient;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\PurchaseOrderItem;
use App\Models\GoodsReceiptItem;
use App\Models\VendorBillItem;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CutoverInventoryItemsCommand extends Command
{
    protected $signature = 'inventory:cutover-items {--dry-run : Preview the migration without writing changes}';

    protected $description = 'Create inventory items from legacy raw-material products and remap active inventory/procurement references.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $legacyProducts = Product::query()
            ->where('item_type', 'raw_material')
            ->where('manage_stock', true)
            ->get();

        $mapping = [];
        $migrated = 0;

        $runner = function () use ($legacyProducts, &$mapping, &$migrated): void {
            foreach ($legacyProducts as $product) {
                $item = InventoryItem::query()->updateOrCreate(
                    ['legacy_product_id' => $product->id],
                    [
                        'name' => $product->name,
                        'sku' => $product->menu_code,
                        'description' => $product->description,
                        'category_id' => $product->category_id,
                        'manufacturer_id' => $product->manufacturer_id,
                        'unit_id' => $product->unit_id,
                        'default_unit_cost' => $product->cost_of_goods_sold ?? $product->base_price ?? 0,
                        'current_stock' => $product->current_stock ?? 0,
                        'minimum_stock' => $product->minimal_stock ?? 0,
                        'manage_stock' => true,
                        'is_purchasable' => (bool) $product->is_purchasable,
                        'status' => (string) ($product->status ?? 'active'),
                        'tenant_id' => $product->tenant_id,
                        'created_by' => $product->created_by,
                        'updated_by' => $product->updated_by,
                        'deleted_by' => $product->deleted_by,
                        'deleted_at' => $product->deleted_at,
                    ]
                );

                $mapping[(int) $product->id] = (int) $item->id;
                $migrated++;
            }

            foreach ($mapping as $legacyProductId => $inventoryItemId) {
                Ingredient::query()
                    ->where('inventory_product_id', $legacyProductId)
                    ->update(['inventory_item_id' => $inventoryItemId]);

                InventoryTransaction::query()
                    ->where('product_id', $legacyProductId)
                    ->update(['inventory_item_id' => $inventoryItemId]);

                PurchaseOrderItem::query()
                    ->where('product_id', $legacyProductId)
                    ->update(['inventory_item_id' => $inventoryItemId]);

                GoodsReceiptItem::query()
                    ->where('product_id', $legacyProductId)
                    ->update(['inventory_item_id' => $inventoryItemId]);

                VendorBillItem::query()
                    ->where('product_id', $legacyProductId)
                    ->update(['inventory_item_id' => $inventoryItemId]);
            }
        };

        if ($dryRun) {
            DB::beginTransaction();
            $runner();
            DB::rollBack();
        } else {
            DB::transaction($runner);
        }

        $this->table(
            ['Metric', 'Value'],
            [
                ['Legacy raw-material products', $legacyProducts->count()],
                ['Inventory items prepared', $migrated],
                ['Ingredient links ready', Ingredient::query()->whereNotNull('inventory_item_id')->count()],
                ['Unlinked ingredients', Ingredient::query()->whereNull('inventory_item_id')->count()],
            ]
        );

        $this->line($dryRun ? 'Dry run complete.' : 'Inventory item cutover complete.');

        return self::SUCCESS;
    }
}
