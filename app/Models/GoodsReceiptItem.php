<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoodsReceiptItem extends Model
{
    protected $appends = ['resolved_product_id'];

    protected $fillable = [
        'goods_receipt_id',
        'purchase_order_item_id',
        'product_id',
        'inventory_item_id',
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

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }

    public function product()
    {
        return $this->inventoryItem();
    }

    public function getProductIdAttribute($value)
    {
        return $value ?: $this->inventory_item_id;
    }

    public function getResolvedProductIdAttribute(): ?int
    {
        return $this->product_id;
    }
}
