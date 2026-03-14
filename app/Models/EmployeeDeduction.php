<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeDeduction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'deduction_type_id',
        'amount',
        'percentage',
        'is_active',
        'effective_from',
        'effective_to'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'percentage' => 'decimal:2',
        'is_active' => 'boolean',
        'effective_from' => 'date',
        'effective_to' => 'date'
    ];

    /**
     * Get the employee for this deduction
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the deduction type for this deduction
     */
    public function deductionType()
    {
        return $this->belongsTo(DeductionType::class);
    }

    /**
     * Scope to get active deductions
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get current deductions
     */
    public function scopeCurrent($query)
    {
        return $query->where('effective_from', '<=', now())
                    ->where(function($q) {
                        $q->whereNull('effective_to')
                          ->orWhere('effective_to', '>=', now());
                    });
    }

    /**
     * Calculate the deduction amount
     */
    public function calculateAmount($basicSalary, $grossSalary = null)
    {
        $calculationBase = $this->deductionType->calculation_base === 'basic_salary' 
                         ? $basicSalary 
                         : ($grossSalary ?: $basicSalary);
        
        if ($this->deductionType->type === 'fixed') {
            return $this->amount;
        } elseif ($this->deductionType->type === 'percentage') {
            $percentage = $this->percentage ?? $this->amount ?? 0;
            return ($calculationBase * $percentage) / 100;
        }
        
        return 0;
    }
}
