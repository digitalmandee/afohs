<?php

namespace App\Services\Inventory;

use App\Models\InventoryTransaction;
use App\Models\RestaurantWarehouseAssignment;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
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
            throw new InvalidArgumentException('No sellable warehouse/location is assigned to this restaurant. Configure restaurant inventory assignments before processing POS stock.');
        }

        $primarySellable = $sellableAssignments->firstWhere('is_primary', true);
        if ($primarySellable) {
            return $primarySellable;
        }

        if ($sellableAssignments->count() === 1) {
            return $sellableAssignments->first();
        }

        throw new InvalidArgumentException('Multiple sellable warehouse assignments exist for this restaurant without a primary issue source. Mark one assignment as primary before processing POS stock.');
    }

    public function aggregateBalancesForAssignments(array $productIds, Collection|EloquentCollection $assignments): Collection
    {
        $productIds = collect($productIds)->filter()->map(fn ($id) => (int) $id)->unique()->values();
        if ($productIds->isEmpty() || $assignments->isEmpty()) {
            return collect();
        }

        return InventoryTransaction::query()
            ->selectRaw('product_id, COALESCE(SUM(qty_in - qty_out), 0) as balance')
            ->whereIn('product_id', $productIds->all())
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
            ->groupBy('product_id')
            ->pluck('balance', 'product_id')
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
}
