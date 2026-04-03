<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashPurchase extends Model
{
    protected $fillable = [
        'cp_no',
        'vendor_id',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'payment_account_id',
        'purchase_date',
        'status',
        'grand_total',
        'remarks',
        'submitted_at',
        'approved_at',
        'posted_at',
        'created_by',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'grand_total' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'posted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(CashPurchaseItem::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function paymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class);
    }
}
