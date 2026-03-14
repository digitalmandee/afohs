<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventMenuType extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'amount',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];
}
