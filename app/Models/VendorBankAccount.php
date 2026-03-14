<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBankAccount extends Model
{
    protected $fillable = [
        'vendor_id',
        'bank_name',
        'account_name',
        'account_number',
        'iban',
        'swift_code',
        'is_primary',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }
}
