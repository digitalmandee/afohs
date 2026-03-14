<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeAllowance extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'allowance_type_id',
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
     * Get the employee for this allowance
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the allowance type for this allowance
     */
    public function allowanceType()
    {
        return $this->belongsTo(AllowanceType::class);
    }

    /**
     * Scope to get active allowances
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get current allowances
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
     * Calculate the allowance amount
     */
    public function calculateAmount($basicSalary)
    {
        if ($this->allowanceType->type === 'fixed') {
            return $this->amount;
        } elseif ($this->allowanceType->type === 'percentage') {
            $percentage = $this->percentage ?? $this->amount ?? 0;
            return ($basicSalary * $percentage) / 100;
        }
        
        return 0;
    }
}
