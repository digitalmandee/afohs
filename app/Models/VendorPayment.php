<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorPayment extends Model
{
    protected $fillable = [
        'payment_no',
        'vendor_id',
        'tenant_id',
        'payment_account_id',
        'payment_date',
        'method',
        'amount',
        'status',
        'reference',
        'remarks',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'posted_at' => 'datetime',
        'amount' => 'decimal:2',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function paymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }

    public function allocations()
    {
        return $this->hasMany(VendorPaymentAllocation::class);
    }
}
