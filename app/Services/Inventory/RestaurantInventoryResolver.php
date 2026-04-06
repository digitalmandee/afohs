<?php

namespace App\Services\Inventory;

use App\Models\InventoryTransaction;
use App\Models\RestaurantWarehouseAssignment;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class RestaurantInventoryResolver
{
    public function assignmentsForRestaurant(int $restaurantId, array $roles = ['sellable']): EloquentCollection
    {
        return RestaurantWarehouseAssignment::query()
            ->with(['warehouse:id,name,code', 'warehouseLocation:id,warehouse_id,name,code'])
            ->where('restaurant_id', $restaurantId)
            ->where('is_active', true)
            ->whereIn('role', $roles)
            ->orderByDesc('is_primary')
            ->orderBy('role')
            ->orderBy('id')
            ->get();
    }

    public function resolvePrimaryIssueSource(int $restaurantId): RestaurantWarehouseAssignment
    {
        $primaryIssue = $this->assignmentsForRestaurant($restaurantId, ['primary_issue_source'])->first();
        if ($primaryIssue) {
            return $primaryIssue;
        }

        $sellableAssignments = $this->assignmentsForRestaurant($restaurantId, ['sellable']);
        if ($sellableAssignments->isEmpty()) {
            throw new InvalidArgumentException('No sellable warehouse/location is assigned to this restaurant. Configure Inventory > Warehouses > Restaurant Inventory Assignments before processing POS stock.');
        }

        $primarySellable = $sellableAssignments->firstWhere('is_primary', true);
        if ($primarySellable) {
            return $primarySellable;
        }

        if ($sellableAssignments->count() === 1) {
            return $sellableAssignments->first();
        }

        throw new InvalidArgumentException('Multiple sellable warehouse assignments exist for this restaurant without a primary issue source. Mark one assignment as Primary in Inventory > Warehouses > Restaurant Inventory Assignments.');
    }

    public function resolveOrProvisionPrimaryIssueSource(int $restaurantId): RestaurantWarehouseAssignment
    {
        $primaryIssue = $this->assignmentsForRestaurant($restaurantId, ['primary_issue_source'])->first();
        if ($primaryIssue) {
            return $primaryIssue;
        }

        $sellableAssignments = $this->assignmentsForRestaurant($restaurantId, ['sellable']);
        if ($sellableAssignments->isNotEmpty()) {
            $primarySellable = $sellableAssignments->firstWhere('is_primary', true);
            if ($primarySellable) {
                return $primarySellable;
            }

            if ($sellableAssignments->count() === 1) {
                return $sellableAssignments->first();
            }

            throw new InvalidArgumentException('Multiple sellable warehouse assignments exist for this restaurant without a primary issue source. Mark one assignment as Primary in Inventory > Warehouses > Restaurant Inventory Assignments.');
        }

        $candidateWarehouses = $this->candidateWarehousesForRestaurant($restaurantId);
        if ($candidateWarehouses->count() === 1) {
            $warehouseId = (int) $candidateWarehouses->first()->id;

            $assignment = RestaurantWarehouseAssignment::query()
                ->where('restaurant_id', $restaurantId)
                ->where('warehouse_id', $warehouseId)
                ->whereNull('warehouse_location_id')
                ->where('role', 'sellable')
                ->first();

            if (!$assignment) {
                RestaurantWarehouseAssignment::query()
                    ->where('restaurant_id', $restaurantId)
                    ->where('role', 'sellable')
                    ->update(['is_primary' => false]);

                $assignment = RestaurantWarehouseAssignment::query()->create([
                    'restaurant_id' => $restaurantId,
                    'warehouse_id' => $warehouseId,
                    'warehouse_location_id' => null,
                    'role' => 'sellable',
                    'is_primary' => true,
                    'is_active' => true,
                    'created_by' => auth()->id(),
                    'updated_by' => auth()->id(),
                ]);
            } else {
                if (!$assignment->is_active || !$assignment->is_primary) {
                    RestaurantWarehouseAssignment::query()
                        ->where('restaurant_id', $restaurantId)
                        ->where('role', 'sellable')
                        ->where('id', '!=', $assignment->id)
                        ->update(['is_primary' => false]);
                }

                $assignment->update([
                    'is_active' => true,
                    'is_primary' => true,
                    'updated_by' => auth()->id(),
                ]);
            }

            Log::info('inventory.restaurant_assignment.auto_provisioned', [
                'event' => 'inventory.restaurant_assignment.auto_provisioned',
                'restaurant_id' => $restaurantId,
                'warehouse_id' => $warehouseId,
                'assignment_id' => $assignment->id,
                'candidate_count' => 1,
                'candidate_warehouse_ids' => [$warehouseId],
                'correlation_id' => request()?->attributes->get('correlation_id') ?? request()?->header('X-Correlation-ID'),
            ]);

            return $assignment->fresh(['warehouse:id,name,code', 'warehouseLocation:id,warehouse_id,name,code']);
        }

        $candidateIds = $candidateWarehouses->pluck('id')->map(fn ($id) => (int) $id)->values()->all();
        Log::warning('inventory.restaurant_assignment.unresolved', [
            'event' => 'inventory.restaurant_assignment.unresolved',
            'restaurant_id' => $restaurantId,
            'candidate_count' => count($candidateIds),
            'candidate_warehouse_ids' => $candidateIds,
            'reason' => count($candidateIds) === 0 ? 'no_covered_warehouse' : 'multiple_covered_warehouses_without_primary',
            'correlation_id' => request()?->attributes->get('correlation_id') ?? request()?->header('X-Correlation-ID'),
        ]);

        if (empty($candidateIds)) {
            throw new InvalidArgumentException('No covered active warehouse exists for this restaurant. Configure warehouse coverage and add a sellable assignment in Inventory > Warehouses > Restaurant Inventory Assignments.');
        }

        throw new InvalidArgumentException('Multiple covered active warehouses exist for this restaurant without a sellable primary source. Mark one assignment as Primary in Inventory > Warehouses > Restaurant Inventory Assignments.');
    }

    public function aggregateBalancesForAssignments(array $productIds, Collection|EloquentCollection $assignments): Collection
    {
        $inventoryItemIds = collect($productIds)->filter()->map(fn ($id) => (int) $id)->unique()->values();
        if ($inventoryItemIds->isEmpty() || $assignments->isEmpty()) {
            return collect();
        }

        return InventoryTransaction::query()
            ->selectRaw('inventory_item_id, COALESCE(SUM(qty_in - qty_out), 0) as balance')
            ->whereIn('inventory_item_id', $inventoryItemIds->all())
            ->where(function ($query) use ($assignments) {
                foreach ($assignments as $assignment) {
                    $query->orWhere(function ($nested) use ($assignment) {
                        $nested->where('warehouse_id', $assignment->warehouse_id);
                        if ($assignment->warehouse_location_id) {
                            $nested->where('warehouse_location_id', $assignment->warehouse_location_id);
                        }
                    });
                }
            })
            ->groupBy('inventory_item_id')
            ->pluck('balance', 'inventory_item_id')
            ->map(fn ($balance) => (float) $balance);
    }

    public function availableQuantityForRestaurantProduct(int $restaurantId, int $productId, array $roles = ['sellable']): float
    {
        $assignments = $this->assignmentsForRestaurant($restaurantId, $roles);
        if ($assignments->isEmpty()) {
            return 0.0;
        }

        return (float) ($this->aggregateBalancesForAssignments([$productId], $assignments)->get($productId, 0.0));
    }

    private function candidateWarehousesForRestaurant(int $restaurantId): EloquentCollection
    {
        return Warehouse::query()
            ->select('warehouses.id', 'warehouses.name', 'warehouses.code')
            ->where('warehouses.status', 'active')
            ->where(function ($query) use ($restaurantId) {
                $query->where('warehouses.all_restaurants', true)
                    ->orWhere('warehouses.tenant_id', $restaurantId)
                    ->orWhereHas('coverageRestaurants', function ($coverage) use ($restaurantId) {
                        $coverage
                            ->where('tenants.id', $restaurantId)
                            ->where('warehouse_restaurants.is_active', true);
                    });
            })
            ->orderBy('warehouses.id')
            ->get();
    }
}
