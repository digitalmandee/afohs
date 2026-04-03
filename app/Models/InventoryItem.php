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
        'inventory_account_id',
        'cogs_account_id',
        'purchase_account_id',
        'default_unit_cost',
        'current_stock',
        'minimum_stock',
        'manage_stock',
        'is_purchasable',
        'is_expiry_tracked',
        'purchase_price_mode',
        'valuation_method',
        'fixed_purchase_price',
        'allow_price_override',
        'max_price_variance_percent',
        'moving_average_cost',
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
        'is_expiry_tracked' => 'boolean',
        'fixed_purchase_price' => 'decimal:4',
        'allow_price_override' => 'boolean',
        'max_price_variance_percent' => 'decimal:2',
        'moving_average_cost' => 'decimal:4',
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

    public function inventoryAccount()
    {
        return $this->belongsTo(CoaAccount::class, 'inventory_account_id');
    }

    public function cogsAccount()
    {
        return $this->belongsTo(CoaAccount::class, 'cogs_account_id');
    }

    public function purchaseAccount()
    {
        return $this->belongsTo(CoaAccount::class, 'purchase_account_id');
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

    public function vendorMappings()
    {
        return $this->hasMany(VendorItemMapping::class);
    }

    public function batches()
    {
        return $this->hasMany(InventoryBatch::class);
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
