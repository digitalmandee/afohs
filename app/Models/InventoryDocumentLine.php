<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryDocumentLine extends Model
{
    protected $fillable = [
        'inventory_document_id',
        'inventory_item_id',
        'quantity',
        'counted_quantity',
        'unit_cost',
        'line_total',
        'remarks',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'counted_quantity' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'line_total' => 'decimal:2',
    ];

    public function document()
    {
        return $this->belongsTo(InventoryDocument::class, 'inventory_document_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class, 'inventory_item_id');
    }
}
