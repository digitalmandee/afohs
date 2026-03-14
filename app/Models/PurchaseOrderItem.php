<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderItem extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'product_id',
        'description',
        'qty_ordered',
        'qty_received',
        'unit_cost',
        'tax_amount',
        'discount_amount',
        'line_total',
    ];

    protected $casts = [
        'qty_ordered' => 'decimal:3',
        'qty_received' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
