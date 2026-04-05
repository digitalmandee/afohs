<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseReturn extends Model
{
    protected $fillable = [
        'return_no',
        'source_type',
        'source_id',
        'vendor_id',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'goods_receipt_id',
        'vendor_bill_id',
        'return_date',
        'status',
        'grand_total',
        'vendor_credit_amount',
        'credit_status',
        'remarks',
        'submitted_at',
        'approved_at',
        'posted_at',
        'created_by',
    ];

    protected $casts = [
        'return_date' => 'date',
        'grand_total' => 'decimal:2',
        'vendor_credit_amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'posted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseReturnItem::class);
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

    public function goodsReceipt()
    {
        return $this->belongsTo(GoodsReceipt::class);
    }

    public function vendorBill()
    {
        return $this->belongsTo(VendorBill::class);
    }
}
