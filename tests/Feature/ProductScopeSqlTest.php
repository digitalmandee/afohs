<?php

namespace Tests\Feature;

use App\Models\InventoryItem;
use App\Models\Product;
use Tests\TestCase;

class ProductScopeSqlTest extends TestCase
{
    public function test_inventory_item_procurement_scope_contains_purchasable_stock_managed_predicates(): void
    {
        $sql = InventoryItem::query()->procurementEligible()->toSql();

        $this->assertStringContainsString('"manage_stock" = ?', $sql);
        $this->assertStringContainsString('"is_purchasable" = ?', $sql);
        $this->assertStringContainsString('"status" = ?', $sql);
        $this->assertStringNotContainsString('"item_type" = ?', $sql);
    }

    public function test_pos_menu_scope_contains_finished_item_salable_and_active_predicates(): void
    {
        $sql = Product::query()->posMenuEligible()->toSql();

        $this->assertStringContainsString('"is_salable" = ?', $sql);
        $this->assertStringContainsString('"status" = ?', $sql);
        $this->assertStringContainsString('"item_type" = ?', $sql);
        $this->assertStringNotContainsString('"is_purchasable" = ?', $sql);
    }
}
