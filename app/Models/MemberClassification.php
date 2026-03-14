<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberClassification extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'code',
        'desc',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];
}
