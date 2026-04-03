<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DepartmentInventoryTransaction extends Model
{
    protected $fillable = [
        'tenant_id',
        'department_id',
        'subdepartment_id',
        'inventory_item_id',
        'transaction_date',
        'type',
        'qty_in',
        'qty_out',
        'unit_cost',
        'total_cost',
        'reference_type',
        'reference_id',
        'remarks',
        'created_by',
    ];

    protected $casts = [
        'transaction_date' => 'date',
        'qty_in' => 'decimal:3',
        'qty_out' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:2',
    ];
}
