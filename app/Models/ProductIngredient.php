<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductIngredient extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'product_id',
        'ingredient_id',
        'quantity_used',
        'cost'
    ];

    protected $casts = [
        'quantity_used' => 'decimal:2',
        'cost' => 'decimal:2'
    ];

    /**
     * Relationship with product
     */
    public function product()
    {
        return $this->belongsTo(Product::class, 'product_id');
    }

    /**
     * Relationship with ingredient
     */
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }

}
