<?php

namespace Tests\Feature;

use App\Models\Product;
use Tests\TestCase;

class ProductScopeSqlTest extends TestCase
{
    public function test_procurement_eligible_scope_contains_raw_material_purchasable_stock_managed_predicates(): void
    {
        $sql = Product::query()->procurementEligible()->toSql();

        $this->assertStringContainsString('"item_type" = ?', $sql);
        $this->assertStringContainsString('"is_purchasable" = ?', $sql);
        $this->assertStringContainsString('"manage_stock" = ?', $sql);
        $this->assertStringContainsString('"status" = ?', $sql);
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
