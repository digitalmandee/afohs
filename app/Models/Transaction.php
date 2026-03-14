<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'payable_type',
        'payable_id',
        'type',
        'amount',
        'balance',
        'reference_type',
        'reference_id',
        'invoice_id',
        'description',
        'date',
        'remarks',
        'receipt_id',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    public function payable()
    {
        return $this->morphTo();
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function invoice()
    {
        return $this->belongsTo(FinancialInvoice::class);
    }
}
