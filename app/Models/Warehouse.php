<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Warehouse extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'name',
        'address',
        'is_global',
        'tenant_id',
        'status',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_global' => 'boolean',
        'metadata' => 'array',
    ];
}
