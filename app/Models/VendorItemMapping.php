<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorItemMapping extends Model
{
    protected $fillable = [
        'vendor_id',
        'inventory_item_id',
        'tenant_id',
        'is_preferred',
        'is_active',
        'contract_price',
        'last_purchase_price',
        'lead_time_days',
        'minimum_order_qty',
        'currency',
        'metadata',
    ];

    protected $casts = [
        'is_preferred' => 'boolean',
        'is_active' => 'boolean',
        'contract_price' => 'decimal:4',
        'last_purchase_price' => 'decimal:4',
        'minimum_order_qty' => 'decimal:3',
        'metadata' => 'array',
    ];

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function inventoryItem()
    {
        return $this->belongsTo(InventoryItem::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
