<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBillItem extends Model
{
    protected $fillable = [
        'vendor_bill_id',
        'product_id',
        'description',
        'qty',
        'unit_cost',
        'tax_amount',
        'discount_amount',
        'line_total',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function vendorBill()
    {
        return $this->belongsTo(VendorBill::class);
    }
}
