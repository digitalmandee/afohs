<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseReturn extends Model
{
    protected $fillable = [
        'return_no',
        'vendor_id',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'goods_receipt_id',
        'vendor_bill_id',
        'return_date',
        'status',
        'grand_total',
        'remarks',
        'submitted_at',
        'approved_at',
        'posted_at',
        'created_by',
    ];

    protected $casts = [
        'return_date' => 'date',
        'grand_total' => 'decimal:2',
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
}
