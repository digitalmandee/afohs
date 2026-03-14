<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinancialReceipt extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'receipt_no',
        'payer_type',
        'payer_id',
        'employee_id',
        'amount',
        'payment_method',  // Cash, Cheque, Online, etc.
        'payment_account_id',
        'payment_details',  // Cheque no, Transaction ID
        'receipt_date',
        'remarks',
        'created_by',
        'guest_name',
        'guest_contact',
        'legacy_id',
        'advance_amount',
        'ntn',
        'created_by',
        'updated_by',
        'deleted_by'
        // 'check_no' // If needed later
    ];

    public function payer()
    {
        return $this->morphTo();
    }

    public function links()
    {
        return $this->hasMany(TransactionRelation::class, 'receipt_id');
    }

    public function paymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }

    // Helper to get formatted date
    protected $casts = [
        'receipt_date' => 'date',
    ];
}
