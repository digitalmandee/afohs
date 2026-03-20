<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class PosOrderAdjustmentSourceTest extends TestCase
{
    public function test_order_controller_contains_adjustment_contract_and_inventory_delta_flow(): void
    {
        $source = File::get(app_path('Http/Controllers/OrderController.php'));

        $this->assertStringContainsString("'adjustment_type' => 'nullable|in:void,complementary,return,refund'", $source);
        $this->assertStringContainsString("'adjustment_scope' => 'nullable|in:item,order'", $source);
        $this->assertStringContainsString('applyInventorySnapshotDelta', $source);
        $this->assertStringContainsString('refundOrderInvoice', $source);
        $this->assertStringContainsString('pos.order.adjustment.processed', $source);
    }

    public function test_order_detail_no_longer_uses_inline_current_stock_guard_for_quantity_edit(): void
    {
        $source = File::get(resource_path('js/pages/App/Order/Detail.jsx'));

        $this->assertStringNotContainsString("newQty > item.current_stock", $source);
    }
}
