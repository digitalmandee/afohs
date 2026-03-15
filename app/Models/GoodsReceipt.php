<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoodsReceipt extends Model
{
    protected $fillable = [
        'grn_no',
        'purchase_order_id',
        'vendor_id',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'received_date',
        'status',
        'remarks',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'received_date' => 'date',
        'posted_at' => 'datetime',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'warehouse_location_id');
    }

    public function items()
    {
        return $this->hasMany(GoodsReceiptItem::class);
    }
}
