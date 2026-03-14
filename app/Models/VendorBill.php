<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBill extends Model
{
    protected $fillable = [
        'bill_no',
        'vendor_id',
        'goods_receipt_id',
        'bill_date',
        'due_date',
        'status',
        'currency',
        'sub_total',
        'tax_total',
        'discount_total',
        'grand_total',
        'paid_amount',
        'remarks',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'bill_date' => 'date',
        'due_date' => 'date',
        'posted_at' => 'datetime',
        'sub_total' => 'decimal:2',
        'tax_total' => 'decimal:2',
        'discount_total' => 'decimal:2',
        'grand_total' => 'decimal:2',
        'paid_amount' => 'decimal:2',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function items()
    {
        return $this->hasMany(VendorBillItem::class);
    }

    public function allocations()
    {
        return $this->hasMany(VendorPaymentAllocation::class);
    }
}
