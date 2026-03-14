<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'relaxation_time',
        'weekend_days',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'weekend_days' => 'array',
        'status' => 'boolean',
        'relaxation_time' => 'integer',
    ];

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
