<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TransactionRelation extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_id',
        'receipt_id',
        'amount',  // How much of the receipt is allocated to this invoice
        'legacy_transaction_id',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    public function invoice()
    {
        return $this->belongsTo(FinancialInvoice::class, 'invoice_id');
    }

    public function receipt()
    {
        return $this->belongsTo(FinancialReceipt::class, 'receipt_id');
    }
}
