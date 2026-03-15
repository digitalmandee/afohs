<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'product_id',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'transaction_date',
        'type',
        'qty_in',
        'qty_out',
        'unit_cost',
        'total_cost',
        'reference_type',
        'reference_id',
        'reason',
        'status',
        'created_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'qty_in' => 'decimal:3',
        'qty_out' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:4',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
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
