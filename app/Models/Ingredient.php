<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Ingredient extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'total_quantity',
        'used_quantity',
        'remaining_quantity',
        'unit',
        'cost_per_unit',
        'expiry_date',
        'status'
    ];

    protected $casts = [
        'total_quantity' => 'decimal:2',
        'used_quantity' => 'decimal:2',
        'remaining_quantity' => 'decimal:2',
        'cost_per_unit' => 'decimal:2',
        'expiry_date' => 'date'
    ];

    /**
     * Relationship with products through pivot table
     */
    public function products()
    {
        return $this->belongsToMany(Product::class, 'product_ingredients', 'ingredient_id', 'product_id')
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

    /**
     * Check if ingredient has enough quantity
     */
    public function hasEnoughQuantity($requiredQuantity)
    {
        return $this->remaining_quantity >= $requiredQuantity;
    }

    /**
     * Use ingredient quantity
     */
    public function useQuantity($quantity)
    {
        if (!$this->hasEnoughQuantity($quantity)) {
            throw new \Exception("Not enough quantity available. Required: {$quantity}, Available: {$this->remaining_quantity}");
        }

        $this->used_quantity += $quantity;
        $this->remaining_quantity -= $quantity;
        $this->save();

        return $this;
    }

    /**
     * Add ingredient quantity (when restocking)
     */
    public function addQuantity($quantity)
    {
        $this->total_quantity += $quantity;
        $this->remaining_quantity += $quantity;
        $this->save();

        return $this;
    }

    /**
     * Check if ingredient is expired
     */
    public function isExpired()
    {
        return $this->expiry_date && $this->expiry_date < now();
    }

    /**
     * Check if ingredient is low in stock
     */
    public function isLowStock($threshold = 10)
    {
        return $this->remaining_quantity <= $threshold;
    }

    /**
     * Scope for active ingredients
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for ingredients with available quantity
     */
    public function scopeAvailable($query)
    {
        return $query->where('remaining_quantity', '>', 0);
    }

}
