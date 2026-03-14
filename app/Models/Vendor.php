<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Vendor extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'tax_id',
        'phone',
        'email',
        'address',
        'payment_terms_days',
        'currency',
        'opening_balance',
        'status',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function contacts()
    {
        return $this->hasMany(VendorContact::class);
    }

    public function bankAccounts()
    {
        return $this->hasMany(VendorBankAccount::class);
    }
}
