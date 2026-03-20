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
        $this->assertStringContainsString('->procurementEligible()', $contents);
        $this->assertStringContainsString("['id', 'name', 'menu_code', 'base_price', 'unit_id']", $contents);
        $this->assertStringNotContainsString("['id', 'name', 'price']", $contents);
    }

    public function test_purchase_order_store_has_procurement_eligibility_guard_message(): void
    {
        $controllerPath = app_path('Http/Controllers/Procurement/PurchaseOrderController.php');
        $contents = file_get_contents($controllerPath);

        $this->assertNotFalse($contents, 'Unable to read PurchaseOrderController.php');
        $this->assertStringContainsString('procurement.purchase_order.store.ineligible_items', $contents);
        $this->assertStringContainsString('Only active purchasable raw-material items can be ordered in PO.', $contents);
    }
}
