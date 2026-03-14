<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankReconciliationSession extends Model
{
    protected $fillable = [
        'payment_account_id',
        'statement_start_date',
        'statement_end_date',
        'statement_opening_balance',
        'statement_closing_balance',
        'book_opening_balance',
        'book_closing_balance',
        'difference_amount',
        'status',
        'notes',
        'created_by',
        'updated_by',
        'reconciled_at',
        'reconciled_by',
    ];

    protected $casts = [
        'statement_start_date' => 'date',
        'statement_end_date' => 'date',
        'reconciled_at' => 'datetime',
        'statement_opening_balance' => 'decimal:2',
        'statement_closing_balance' => 'decimal:2',
        'book_opening_balance' => 'decimal:2',
        'book_closing_balance' => 'decimal:2',
        'difference_amount' => 'decimal:2',
    ];

    public function paymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }

    public function lines()
    {
        return $this->hasMany(BankReconciliationLine::class, 'session_id');
    }
}
