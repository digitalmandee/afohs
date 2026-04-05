<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingVoucherLine extends Model
{
    protected $fillable = [
        'accounting_voucher_id',
        'account_id',
        'department_id',
        'debit',
        'credit',
        'vendor_id',
        'member_id',
        'employee_id',
        'party_type',
        'party_id',
        'reference_type',
        'reference_id',
        'tax_code',
        'tax_amount',
        'dimensions',
        'is_system_generated',
        'description',
        'line_order',
    ];

    protected $casts = [
        'tax_amount' => 'decimal:2',
        'dimensions' => 'array',
        'is_system_generated' => 'boolean',
    ];

    public function voucher()
    {
        return $this->belongsTo(AccountingVoucher::class, 'accounting_voucher_id');
    }

    public function account()
    {
        return $this->belongsTo(CoaAccount::class, 'account_id');
    }

    public function department()
    {
        return $this->belongsTo(Department::class, 'department_id');
    }
}
