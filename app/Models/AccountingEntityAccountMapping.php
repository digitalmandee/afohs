<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingEntityAccountMapping extends Model
{
    protected $fillable = [
        'entity_type',
        'entity_id',
        'role',
        'account_id',
        'is_active',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function account()
    {
        return $this->belongsTo(CoaAccount::class, 'account_id');
    }
}

