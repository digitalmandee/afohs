<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class InventoryItem extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $appends = [
        'menu_code',
    ];

    protected $fillable = [
        'legacy_product_id',
        'name',
        'sku',
        'description',
        'category_id',
        'manufacturer_id',
        'unit_id',
        'default_unit_cost',
        'current_stock',
        'minimum_stock',
        'manage_stock',
        'is_purchasable',
        'status',
        'tenant_id',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'default_unit_cost' => 'decimal:4',
        'current_stock' => 'decimal:3',
        'minimum_stock' => 'decimal:3',
        'manage_stock' => 'boolean',
        'is_purchasable' => 'boolean',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function manufacturer()
    {
        return $this->belongsTo(PosManufacturer::class, 'manufacturer_id');
    }

    public function unit()
    {
        return $this->belongsTo(PosUnit::class, 'unit_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function ingredients()
    {
        return $this->hasMany(Ingredient::class, 'inventory_item_id');
    }

    public function legacyProduct()
    {
        return $this->belongsTo(Product::class, 'legacy_product_id');
    }

    public function scopeProcurementEligible(Builder $query): Builder
    {
        return $query
            ->where('manage_stock', true)
            ->where('is_purchasable', true)
            ->where('status', 'active');
    }

    public function scopeWarehouseOperationalEligible(Builder $query): Builder
    {
        return $query
            ->where('manage_stock', true)
            ->where('status', 'active');
    }

    public function getMenuCodeAttribute(): ?string
    {
        return $this->sku;
    }
}
