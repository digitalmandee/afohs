<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'category_id',
        'address',
        'is_global',
        'tenant_id',
        'all_restaurants',
        'status',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'all_restaurants' => 'boolean',
        'metadata' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function locations()
    {
        return $this->hasMany(WarehouseLocation::class);
    }

    public function category()
    {
        return $this->belongsTo(WarehouseCategory::class, 'category_id');
    }

    public function restaurantAssignments()
    {
        return $this->hasMany(RestaurantWarehouseAssignment::class);
    }

    public function coverageRestaurants()
    {
        return $this->belongsToMany(Tenant::class, 'warehouse_restaurants', 'warehouse_id', 'restaurant_id')
            ->withPivot(['is_active'])
            ->withTimestamps();
    }
}
