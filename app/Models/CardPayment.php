<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CardPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'invoice_number',
        'member_type',
        'subscription_type',
        'duration',
        'amount_paid',
        'customer_charges',
        'discount_type',
        'discount_value',
        'total_amount',
        'paid_for_month',
        'expiry_date',
        'payment_method',
        'payment_date',
        'reciept'
    ];

    protected $casts = [
        'member_type' => 'array',
    ];
}
