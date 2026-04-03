<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryBatch extends Model
{
    protected $fillable = [
        'inventory_item_id',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'batch_no',
        'received_date',
        'expiry_date',
        'unit_cost',
        'original_qty',
        'remaining_qty',
        'status',
        'reference_type',
        'reference_id',
    ];

    protected $casts = [
        'received_date' => 'date',
        'expiry_date' => 'date',
        'unit_cost' => 'decimal:4',
        'original_qty' => 'decimal:3',
        'remaining_qty' => 'decimal:3',
    ];

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'warehouse_location_id');
    }

    public function issueAllocations()
    {
        return $this->hasMany(InventoryIssueAllocation::class, 'inventory_batch_id');
    }
}
