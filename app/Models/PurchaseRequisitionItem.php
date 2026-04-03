<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequisitionItem extends Model
{
    protected $fillable = [
        'purchase_requisition_id',
        'inventory_item_id',
        'qty_requested',
        'qty_approved',
        'qty_converted',
        'estimated_unit_cost',
        'remarks',
    ];

    protected $casts = [
        'qty_requested' => 'decimal:3',
        'qty_approved' => 'decimal:3',
        'qty_converted' => 'decimal:3',
        'estimated_unit_cost' => 'decimal:4',
    ];

    public function requisition()
    {
        return $this->belongsTo(PurchaseRequisition::class, 'purchase_requisition_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }
}
