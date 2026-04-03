<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentInventoryBalance extends Model
{
    protected $fillable = [
        'tenant_id',
        'department_id',
        'subdepartment_id',
        'inventory_item_id',
        'current_qty',
        'current_value',
    ];

    protected $casts = [
        'current_qty' => 'decimal:3',
        'current_value' => 'decimal:2',
    ];
}
