<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingVoucherAllocation extends Model
{
    protected $fillable = [
        'voucher_id',
        'voucher_line_id',
        'invoice_type',
        'invoice_id',
        'party_type',
        'party_id',
        'allocated_amount',
        'currency_code',
        'exchange_rate',
        'allocated_at',
        'created_by',
        'idempotency_key',
    ];

    protected $casts = [
        'allocated_amount' => 'decimal:2',
        'exchange_rate' => 'decimal:6',
        'allocated_at' => 'datetime',
    ];

    public function voucher()
    {
        return $this->belongsTo(AccountingVoucher::class, 'voucher_id');
    }

    public function voucherLine()
    {
        return $this->belongsTo(AccountingVoucherLine::class, 'voucher_line_id');
    }
}

