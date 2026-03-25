<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\RestaurantWarehouseAssignment;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Services\Inventory\InventoryMovementService;
use App\Services\Inventory\RestaurantInventoryResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class InventoryWarehouseIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolver_returns_primary_issue_source_when_configured(): void
    {
        $this->createRestaurantTenant(101, 'Restaurant A');
        $warehouse = Warehouse::create([
            'code' => 'WH-001',
            'name' => 'Sellable Warehouse',
            'status' => 'active',
            'all_restaurants' => false,
        ]);
        $location = WarehouseLocation::create([
            'warehouse_id' => $warehouse->id,
            'code' => 'LOC-01',
            'name' => 'POS Rack',
            'status' => 'active',
            'is_primary' => true,
        ]);

        RestaurantWarehouseAssignment::create([
            'restaurant_id' => 101,
            'warehouse_id' => $warehouse->id,
            'warehouse_location_id' => $location->id,
            'role' => 'primary_issue_source',
            'is_primary' => true,
            'is_active' => true,
        ]);

        $resolved = app(RestaurantInventoryResolver::class)->resolvePrimaryIssueSource(101);

        $this->assertSame($warehouse->id, $resolved->warehouse_id);
        $this->assertSame($location->id, $resolved->warehouse_location_id);
    }

    public function test_inventory_movement_service_tracks_transfer_and_availability_by_location_with_inventory_items(): void
    {
        $category = Category::create(['name' => 'Raw Materials']);
        $inventoryItem = InventoryItem::create([
            'name' => 'Flour',
            'category_id' => $category->id,
            'default_unit_cost' => 12,
            'current_stock' => 0,
            'minimum_stock' => 0,
            'manage_stock' => true,
            'is_purchasable' => true,
            'status' => 'active',
        ]);

        $sourceWarehouse = Warehouse::create([
            'code' => 'WH-RAW',
            'name' => 'Back Store',
            'status' => 'active',
            'all_restaurants' => true,
        ]);
        $sourceLocation = WarehouseLocation::create([
            'warehouse_id' => $sourceWarehouse->id,
            'code' => 'BACK-1',
            'name' => 'Bulk Storage',
            'status' => 'active',
        ]);

        $destinationWarehouse = Warehouse::create([
            'code' => 'WH-POS',
            'name' => 'Sellable Stock',
            'status' => 'active',
            'all_restaurants' => true,
        ]);
        $destinationLocation = WarehouseLocation::create([
            'warehouse_id' => $destinationWarehouse->id,
            'code' => 'POS-1',
            'name' => 'Service Shelf',
            'status' => 'active',
        ]);

        $service = app(InventoryMovementService::class);
        $service->createOpeningBalance([
            'warehouse_id' => $sourceWarehouse->id,
            'warehouse_location_id' => $sourceLocation->id,
            'inventory_item_id' => $inventoryItem->id,
            'transaction_date' => now()->toDateString(),
            'quantity' => 10,
            'unit_cost' => 12,
        ]);

        $service->createTransfer([
            'source_warehouse_id' => $sourceWarehouse->id,
            'source_warehouse_location_id' => $sourceLocation->id,
            'destination_warehouse_id' => $destinationWarehouse->id,
            'destination_warehouse_location_id' => $destinationLocation->id,
            'inventory_item_id' => $inventoryItem->id,
            'transaction_date' => now()->toDateString(),
            'quantity' => 4,
            'unit_cost' => 12,
        ]);

        $inventoryItem->refresh();

        $this->assertSame(6.0, $service->availableQuantity($inventoryItem->id, $sourceWarehouse->id, $sourceLocation->id));
        $this->assertSame(4.0, $service->availableQuantity($inventoryItem->id, $destinationWarehouse->id, $destinationLocation->id));
        $this->assertSame(10.0, (float) $inventoryItem->current_stock);
        $this->assertNotNull($inventoryItem->legacy_product_id);
        $this->assertSame(3, InventoryTransaction::query()->where('inventory_item_id', $inventoryItem->id)->count());
    }

    private function createRestaurantTenant(int $id, string $name): void
    {
        DB::table('tenants')->insert([
            'id' => $id,
            'name' => $name,
            'status' => 'active',
            'data' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
