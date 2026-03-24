<?php

namespace Tests\Feature;

use Tests\TestCase;

class InventoryWarehouseProductBackedVisibilityTest extends TestCase
{
    public function test_purchase_order_create_includes_inventory_summary_and_linked_ingredient_metadata(): void
    {
        $controllerPath = app_path('Http/Controllers/Procurement/PurchaseOrderController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read PurchaseOrderController.php');
        $this->assertStringContainsString("'inventorySummary' => [", $contents);
        $this->assertStringContainsString("'linked_ingredient_names' => \$linkedIngredients", $contents);
        $this->assertStringContainsString("'stock_by_warehouse' => \$warehouseSnapshots", $contents);
        $this->assertStringContainsString("'unit_name' => \$product->unit?->name", $contents);
    }

    public function test_warehouse_controller_exposes_configured_and_legacy_inventory_visibility_metrics(): void
    {
        $controllerPath = app_path('Http/Controllers/Inventory/WarehouseController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read WarehouseController.php');
        $this->assertStringContainsString("'configured_products' => Product::query()->warehouseOperationalEligible()->count()", $contents);
        $this->assertStringContainsString("'legacy_only_ingredients' => Ingredient::query()->whereNull('inventory_product_id')->count()", $contents);
        $this->assertStringContainsString("'stocked_elsewhere_count' => \$stockedElsewhereIds->diff(\$stockedHereIds)->count()", $contents);
        $this->assertStringContainsString("'linked_ingredients_here' => \$linkedIngredientsHere", $contents);
    }

    public function test_ingredient_index_uses_warehouse_backed_and_legacy_only_labels(): void
    {
        $pagePath = resource_path('js/pages/App/Inventory/Ingredients/Index.jsx');
        $contents = file_get_contents($pagePath);

        $this->assertNotFalse($contents, 'Unable to read Ingredients/Index.jsx');
        $this->assertStringContainsString("label={ingredient.balance_source === 'warehouse' ? 'Warehouse-backed' : 'Legacy-only'}", $contents);
        $this->assertStringContainsString('{stats.legacy_only || 0}', $contents);
    }
}
