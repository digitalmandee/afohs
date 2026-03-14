<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BankReconciliationLine extends Model
{
    protected $fillable = [
        'session_id',
        'txn_date',
        'reference_no',
        'description',
        'direction',
        'amount',
        'status',
        'matched_reference',
        'notes',
    ];

    protected $casts = [
        'txn_date' => 'date',
        'amount' => 'decimal:2',
    ];

    public function session()
    {
        return $this->belongsTo(BankReconciliationSession::class, 'session_id');
    }
}
