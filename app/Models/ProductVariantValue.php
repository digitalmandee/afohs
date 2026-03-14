<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductVariantValue extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_variant_id',
        'name',
        'additional_price',
        'stock',
        'is_default',
    ];

    public function variant()
    {
        return $this->belongsTo(ProductVariant::class);
    }
}