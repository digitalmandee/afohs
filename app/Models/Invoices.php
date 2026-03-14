<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use function PHPSTORM_META\map;

class Invoices extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_no',
        'user_id',
        'cashier_id',
        'order_id',
        'amount',
        'tax',
        'discount',
        'total_price',
        'paid_amount',
        'customer_change',
        'cost_price',
        'payment_method',
        'cash',
        'credit_card',
        'bank_transfer',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function order()
    {
        return $this->belongsTo(Order::class);
    }
    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id', 'id');
    }
}