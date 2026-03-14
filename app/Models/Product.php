<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'menu_code',
        'description',
        'images',
        'category_id',
        'sub_category_id',
        'manufacturer_id',
        'base_price',
        'cost_of_goods_sold',
        'current_stock',
        'minimal_stock',
        'is_discountable',
        'notify_when_out_of_stock',
        'available_order_types',
        'is_salable',
        'is_purchasable',
        'is_returnable',
        'is_taxable',
        'item_type',
        'unit_id',
        'status',
        'tenant_id',
        'created_by',
        'updated_by',
        'deleted_by',
        'max_discount',
        'max_discount_type',
        'manage_stock',
    ];

    protected $casts = [
        'images' => 'array',
        'available_order_types' => 'array',
        'is_salable' => 'boolean',
        'is_purchasable' => 'boolean',
        'is_returnable' => 'boolean',
        'is_taxable' => 'boolean',
        'max_discount' => 'float',
    ];

    public function variants()
    {
        return $this->hasMany(ProductVariant::class);  // Or many-to-many if applicable
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function subCategory()
    {
        return $this->belongsTo(PosSubCategory::class, 'sub_category_id');
    }

    public function manufacturer()
    {
        return $this->belongsTo(PosManufacturer::class, 'manufacturer_id');
    }

    public function kitchen()
    {
        return $this->belongsTo(User::class, 'kitchen_id', 'id');
    }

    /**
     * Relationship with ingredients through pivot table
     */
    public function ingredients()
    {
        return $this
            ->belongsToMany(Ingredient::class, 'product_ingredients', 'product_id', 'ingredient_id')
            ->withPivot('quantity_used', 'cost')
            ->withTimestamps();
    }

    /**
     * Get the product ingredients pivot records
     */
    public function productIngredients()
    {
        return $this->hasMany(ProductIngredient::class);
    }

    public function unit()
    {
        return $this->belongsTo(PosUnit::class, 'unit_id');
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
