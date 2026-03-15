<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryDocument extends Model
{
    protected $fillable = [
        'document_no',
        'tenant_id',
        'type',
        'source_warehouse_id',
        'source_warehouse_location_id',
        'destination_warehouse_id',
        'destination_warehouse_location_id',
        'transaction_date',
        'status',
        'remarks',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function sourceWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'source_warehouse_id');
    }

    public function sourceWarehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'source_warehouse_location_id');
    }

    public function destinationWarehouse()
    {
        return $this->belongsTo(Warehouse::class, 'destination_warehouse_id');
    }

    public function destinationWarehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'destination_warehouse_location_id');
    }

    public function transactions()
    {
        return $this->hasMany(InventoryTransaction::class, 'reference_id')
            ->where('reference_type', self::class);
    }
}
