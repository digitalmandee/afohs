<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'fee',
        'subscription_fee',
        'status',
        'category_types',  // JSON array: ["primary", "corporate"]
    ];

    protected $casts = [
        'category_types' => 'array',
    ];

    public function members()
    {
        return $this->hasMany(Member::class, 'member_category_id');
    }
}
