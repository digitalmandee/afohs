<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;

class CakeType extends Product
{
    use HasFactory;

    protected $table = 'products';

    protected static function booted()
    {
        static::addGlobalScope('cake_type', function (Builder $builder) {
            $builder->whereHas('category', function ($query) {
                $query->where('name', 'Cakes');
            });
        });
    }
}
