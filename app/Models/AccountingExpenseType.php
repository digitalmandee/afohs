<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingExpenseType extends Model
{
    protected $fillable = [
        'code',
        'name',
        'expense_account_id',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function expenseAccount()
    {
        return $this->belongsTo(CoaAccount::class, 'expense_account_id');
    }
}

