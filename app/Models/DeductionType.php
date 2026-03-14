<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class DeductionType extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'type',
        'is_mandatory',
        'calculation_base',
        'is_active',
        'is_global',
        'default_amount',
        'percentage',
        'description'
    ];

    protected $casts = [
        'is_mandatory' => 'boolean',
        'is_active' => 'boolean',
        'is_global' => 'boolean',
        'default_amount' => 'decimal:2',
        'percentage' => 'decimal:2'
    ];

    /**
     * Get employee deductions for this type
     */
    public function employeeDeductions()
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    /**
     * Get payslip deductions for this type
     */
    public function payslipDeductions()
    {
        return $this->hasMany(PayslipDeduction::class);
    }

    /**
     * Scope to get only active deduction types
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only mandatory deduction types
     */
    public function scopeMandatory($query)
    {
        return $query->where('is_mandatory', true);
    }
}
