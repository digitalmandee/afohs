<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WarehouseCategory extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'color',
        'status',
        'sort_order',
    ];

    public function warehouses()
    {
        return $this->hasMany(Warehouse::class, 'category_id');
    }
}

