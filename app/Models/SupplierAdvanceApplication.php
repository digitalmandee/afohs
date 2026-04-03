<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierAdvanceApplication extends Model
{
    protected $fillable = [
        'supplier_advance_id',
        'vendor_bill_id',
        'amount',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function supplierAdvance()
    {
        return $this->belongsTo(SupplierAdvance::class);
    }

    public function vendorBill()
    {
        return $this->belongsTo(VendorBill::class);
    }
}
