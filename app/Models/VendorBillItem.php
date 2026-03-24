<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorBillItem extends Model
{
    protected $appends = ['resolved_product_id'];

    protected $fillable = [
        'vendor_bill_id',
        'product_id',
        'inventory_item_id',
        'description',
        'qty',
        'unit_cost',
        'tax_amount',
        'discount_amount',
        'line_total',
    ];

    protected $casts = [
        'qty' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function vendorBill()
    {
        return $this->belongsTo(VendorBill::class);
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
