<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAuditItem extends Model
{
    protected $fillable = [
        'stock_audit_id',
        'inventory_item_id',
        'system_qty',
        'counted_qty',
        'variance_qty',
        'unit_cost',
        'variance_value',
    ];

    protected $casts = [
        'system_qty' => 'decimal:3',
        'counted_qty' => 'decimal:3',
        'variance_qty' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'variance_value' => 'decimal:2',
    ];

    public function stockAudit()
    {
        return $this->belongsTo(StockAudit::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
