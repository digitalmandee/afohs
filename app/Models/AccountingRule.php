<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingRule extends Model
{
    protected $fillable = [
        'code',
        'name',
        'lines',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'lines' => 'array',
        'is_active' => 'boolean',
    ];
}
