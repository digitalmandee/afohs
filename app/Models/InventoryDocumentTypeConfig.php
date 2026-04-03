<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryDocumentTypeConfig extends Model
{
    protected $fillable = [
        'code',
        'name',
        'prefix',
        'sequence',
        'auto_post',
        'approval_required',
        'accounting_enabled',
        'settings',
        'is_active',
    ];

    protected $casts = [
        'auto_post' => 'boolean',
        'approval_required' => 'boolean',
        'accounting_enabled' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];
}
