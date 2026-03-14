<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeLog extends Model
{
    use HasFactory;

    protected $fillable = ['employee_id', 'type', 'logged_at', 'tenant_id'];

    protected $casts = [
        'logged_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
