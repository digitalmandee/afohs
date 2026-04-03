<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierAdvance extends Model
{
    protected $fillable = [
        'advance_no',
        'vendor_id',
        'tenant_id',
        'purchase_order_id',
        'payment_account_id',
        'advance_date',
        'amount',
        'applied_amount',
        'status',
        'reference',
        'remarks',
        'created_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'advance_date' => 'date',
        'amount' => 'decimal:2',
        'applied_amount' => 'decimal:2',
        'posted_at' => 'datetime',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function paymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }

    public function applications()
    {
        return $this->hasMany(SupplierAdvanceApplication::class);
    }
}
