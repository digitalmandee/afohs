<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CashPurchaseItem extends Model
{
    protected $fillable = [
        'cash_purchase_id',
        'inventory_item_id',
        'qty',
        'unit_cost',
        'line_total',
        'remarks',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'line_total' => 'decimal:2',
    ];

    public function cashPurchase()
    {
        return $this->belongsTo(CashPurchase::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
