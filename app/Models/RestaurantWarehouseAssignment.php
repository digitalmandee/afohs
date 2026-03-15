<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RestaurantWarehouseAssignment extends Model
{
    protected $fillable = [
        'restaurant_id',
        'warehouse_id',
        'warehouse_location_id',
        'role',
        'is_primary',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function restaurant()
    {
        return $this->belongsTo(Tenant::class, 'restaurant_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'warehouse_location_id');
    }
}
