<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class AccountingVoucher extends Model
{
    protected $fillable = [
        'voucher_no',
        'voucher_type',
        'entry_mode',
        'party_type',
        'party_id',
        'invoice_type',
        'invoice_id',
        'expense_type_id',
        'template_id',
        'amount',
        'voucher_date',
        'posting_date',
        'tenant_id',
        'department_id',
        'reference_no',
        'external_reference_no',
        'currency_code',
        'exchange_rate',
        'payment_account_id',
        'instrument_type',
        'instrument_no',
        'instrument_date',
        'bank_reference',
        'deposit_reference',
        'clearing_date',
        'period_id',
        'status',
        'remarks',
        'system_narration',
        'created_by',
        'updated_by',
        'submitted_by',
        'submitted_at',
        'approved_by',
        'approved_at',
        'posted_by',
        'posted_at',
        'cancelled_by',
        'cancelled_at',
        'reversed_by',
        'reversed_at',
        'reversal_voucher_id',
        'approval_reference',
    ];

    protected $casts = [
        'voucher_date' => 'date',
        'posting_date' => 'date',
        'instrument_date' => 'date',
        'clearing_date' => 'date',
        'exchange_rate' => 'decimal:6',
        'amount' => 'decimal:2',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'posted_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'reversed_at' => 'datetime',
    ];

    public function lines()
    {
        return $this->hasMany(AccountingVoucherLine::class)->orderBy('line_order');
    }

    public function allocations()
    {
        return $this->hasMany(AccountingVoucherAllocation::class, 'voucher_id')->latest('id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }

    public function paymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }

    public function expenseType()
    {
        return $this->belongsTo(AccountingExpenseType::class, 'expense_type_id');
    }

    public function template()
    {
        return $this->belongsTo(AccountingVoucherTemplate::class, 'template_id');
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }

    public function cancelledBy()
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function reversedBy()
    {
        return $this->belongsTo(User::class, 'reversed_by');
    }

    public function reversalVoucher()
    {
        return $this->belongsTo(self::class, 'reversal_voucher_id');
    }
}
