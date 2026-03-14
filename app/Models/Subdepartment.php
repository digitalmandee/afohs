<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class Subdepartment extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'status', 'department_id', 'created_by', 'updated_by', 'deleted_by'];

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}
