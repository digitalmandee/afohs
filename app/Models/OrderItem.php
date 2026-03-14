<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = ['order_id', 'tenant_id', 'location_id', 'order_item', 'status', 'remark', 'instructions', 'cancelType'];

    protected $casts = ['order_item' => 'array'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
