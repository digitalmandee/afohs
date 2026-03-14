<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'name',
        'type',
    ];

    public function values(): HasMany
    {
        return $this->hasMany(ProductVariantValue::class)
            ->select('product_variant_id', 'name', 'additional_price', 'stock', 'is_default');
    }
    public function items(): HasMany
    {
        return $this->hasMany(ProductVariantValue::class)
            ->select('id', 'product_variant_id', 'name', 'additional_price', 'stock', 'is_default');
    }

    public function getValuesAttribute()
    {
        return $this->values;
    }
}
