<?php

namespace Tests\Feature;

use Tests\TestCase;

class InventoryItemScopeAlignmentTest extends TestCase
{
    public function test_order_controller_uses_pos_menu_scope_for_menu_and_search_queries(): void
    {
        $controllerPath = app_path('Http/Controllers/OrderController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read OrderController.php');
        $this->assertSame(2, substr_count($contents, '->posMenuEligible()'));
        $this->assertStringNotContainsString("->where('is_salable', true)", $contents);
    }

    public function test_inventory_operations_use_shared_warehouse_scope(): void
    {
        $controllerPath = app_path('Http/Controllers/Inventory/InventoryOperationController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read InventoryOperationController.php');
        $this->assertStringContainsString('->warehouseOperationalEligible()', $contents);
        $this->assertStringNotContainsString("->where('manage_stock', true)->orWhere('item_type', 'raw_material')", $contents);
    }

    public function test_ingredient_controller_uses_inventory_items_for_picker_queries(): void
    {
        $controllerPath = app_path('Http/Controllers/IngredientController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read IngredientController.php');
        $this->assertSame(2, substr_count($contents, 'InventoryItem::query()'));
        $this->assertSame(2, substr_count($contents, '->warehouseOperationalEligible()'));
        $this->assertStringContainsString("->where('manage_stock', true)", $contents);
        $this->assertStringNotContainsString('inventory_product_id', $contents);
    }
}
