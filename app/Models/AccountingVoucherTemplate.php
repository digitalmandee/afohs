<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingVoucherTemplate extends Model
{
    protected $fillable = [
        'name',
        'scope',
        'user_id',
        'is_active',
        'payload',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'payload' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

