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
        'tenant_id',
        'payment_terms_days',
        'currency',
        'opening_balance',
        'payable_account_id',
        'advance_account_id',
        'default_payment_account_id',
        'tax_treatment',
        'approval_status',
        'status',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function payableAccount()
    {
        return $this->belongsTo(CoaAccount::class, 'payable_account_id');
    }

    public function advanceAccount()
    {
        return $this->belongsTo(CoaAccount::class, 'advance_account_id');
    }

    public function defaultPaymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'default_payment_account_id');
    }

    public function contacts()
    {
        return $this->hasMany(VendorContact::class);
    }

    public function bankAccounts()
    {
        return $this->hasMany(VendorBankAccount::class);
    }

    public function itemMappings()
    {
        return $this->hasMany(VendorItemMapping::class);
    }
}
