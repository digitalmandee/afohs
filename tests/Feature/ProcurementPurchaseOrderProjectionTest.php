<?php

namespace Tests\Feature;

use Tests\TestCase;

class ProcurementPurchaseOrderProjectionTest extends TestCase
{
    public function test_purchase_order_create_uses_base_price_projection(): void
    {
        $controllerPath = app_path('Http/Controllers/Procurement/PurchaseOrderController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read PurchaseOrderController.php');
        $this->assertStringContainsString('InventoryItem::query()', $contents);
        $this->assertStringContainsString('->procurementEligible()', $contents);
        $this->assertStringContainsString("'base_price' => (float) (\$product->default_unit_cost ?? 0)", $contents);
        $this->assertStringContainsString("'unit_name' => \$product->unit?->name", $contents);
    }

    public function test_purchase_order_store_has_procurement_eligibility_guard_message(): void
    {
        $controllerPath = app_path('Http/Controllers/Procurement/PurchaseOrderController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read PurchaseOrderController.php');
        $this->assertStringContainsString('procurement.purchase_order.store.ineligible_items', $contents);
        $this->assertStringContainsString('Only active purchasable inventory items can be ordered in PO.', $contents);
    }
}
