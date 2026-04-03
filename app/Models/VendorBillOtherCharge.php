<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBillOtherCharge extends Model
{
    protected $fillable = [
        'vendor_bill_id',
        'account_id',
        'party_vendor_id',
        'description',
        'amount',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function vendorBill()
    {
        return $this->belongsTo(VendorBill::class);
    }

    public function account()
    {
        return $this->belongsTo(CoaAccount::class, 'account_id');
    }

    public function partyVendor()
    {
        return $this->belongsTo(Vendor::class, 'party_vendor_id');
    }
}
