<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeTransfer extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'from_department_id',
        'from_subdepartment_id',
        'from_designation_id',
        'from_branch_id',
        'from_shift_id',
        'to_department_id',
        'to_subdepartment_id',
        'to_designation_id',
        'to_branch_id',
        'to_shift_id',
        'transfer_date',
        'reason',
        'transferred_by',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'transfer_date' => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function fromDepartment()
    {
        return $this->belongsTo(Department::class, 'from_department_id');
    }

    public function toDepartment()
    {
        return $this->belongsTo(Department::class, 'to_department_id');
    }

    public function fromBranch()
    {
        return $this->belongsTo(Branch::class, 'from_branch_id');
    }

    public function toBranch()
    {
        return $this->belongsTo(Branch::class, 'to_branch_id');
    }

    public function fromDesignation()
    {
        return $this->belongsTo(Designation::class, 'from_designation_id');
    }

    public function toDesignation()
    {
        return $this->belongsTo(Designation::class, 'to_designation_id');
    }

    public function fromShift()
    {
        return $this->belongsTo(Shift::class, 'from_shift_id');
    }

    public function toShift()
    {
        return $this->belongsTo(Shift::class, 'to_shift_id');
    }

    public function transferer()
    {
        return $this->belongsTo(User::class, 'transferred_by');
    }
}
