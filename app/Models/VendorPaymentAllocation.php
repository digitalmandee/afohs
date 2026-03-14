<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorPaymentAllocation extends Model
{
    protected $fillable = [
        'vendor_payment_id',
        'vendor_bill_id',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function payment()
    {
        return $this->belongsTo(VendorPayment::class, 'vendor_payment_id');
    }

    public function bill()
    {
        return $this->belongsTo(VendorBill::class, 'vendor_bill_id');
    }
}
