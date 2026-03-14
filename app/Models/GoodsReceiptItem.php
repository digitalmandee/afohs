<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoodsReceiptItem extends Model
{
    protected $fillable = [
        'goods_receipt_id',
        'purchase_order_item_id',
        'product_id',
        'qty_received',
        'unit_cost',
        'line_total',
    ];

    protected $casts = [
        'qty_received' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'line_total' => 'decimal:2',
    ];

    public function goodsReceipt()
    {
        return $this->belongsTo(GoodsReceipt::class);
    }
}
