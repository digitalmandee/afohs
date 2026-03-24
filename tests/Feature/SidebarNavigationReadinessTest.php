<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SidebarNavigationReadinessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutMiddleware();
        $this->actingAs(User::factory()->create());
    }

    public function test_inventory_sidebar_pages_load_without_schema_errors(): void
    {
        foreach ([
            'inventory.warehouses.index',
            'inventory.coverage.index',
            'inventory.categories.index',
            'inventory.locations.index',
            'inventory.documents.index',
            'inventory.valuation.index',
        ] as $routeName) {
            $this->get(route($routeName))->assertOk();
        }
    }

    public function test_procurement_purchase_order_create_loads_with_current_product_fields(): void
    {
        $category = Category::create(['name' => 'Raw Materials']);
        Vendor::create([
            'code' => 'VND-001',
            'name' => 'Metro Supplier',
            'status' => 'active',
        ]);
        Warehouse::create([
            'code' => 'WH-001',
            'name' => 'Main Warehouse',
            'status' => 'active',
            'all_restaurants' => true,
        ]);
        Product::create([
            'name' => 'Fresh Flour',
            'category_id' => $category->id,
            'base_price' => 120,
            'cost_of_goods_sold' => 90,
            'current_stock' => 0,
            'minimal_stock' => 0,
            'available_order_types' => ['dineIn'],
            'is_salable' => false,
            'is_purchasable' => true,
            'item_type' => 'raw_material',
            'status' => 'active',
            'manage_stock' => true,
        ]);

        $this->get(route('procurement.purchase-orders.create'))->assertOk();
    }

    public function test_accounting_sidebar_pages_load_without_runtime_exceptions(): void
    {
        foreach ([
            'accounting.general-ledger',
            'accounting.bank-reconciliation.index',
        ] as $routeName) {
            $this->get(route($routeName))->assertOk();
        }
    }
}
