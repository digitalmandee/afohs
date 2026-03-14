<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeLoan extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'amount',
        'loan_date',
        'reason',
        'status',
        'installments',
        'monthly_deduction',
        'total_paid',
        'remaining_amount',
        'next_deduction_date',
        'installments_paid',
        'approved_by',
        'approved_at',
        'disbursed_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'monthly_deduction' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'loan_date' => 'date',
        'next_deduction_date' => 'date',
        'approved_at' => 'datetime',
        'disbursed_at' => 'datetime',
    ];

    /**
     * Get the employee that owns the loan.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who approved the loan.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope for pending loans.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for active loans (disbursed and being deducted).
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'disbursed')->where('remaining_amount', '>', 0);
    }

    /**
     * Scope for completed loans.
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Get installments remaining.
     */
    public function getInstallmentsRemainingAttribute()
    {
        return $this->installments - $this->installments_paid;
    }

    /**
     * Get progress percentage.
     */
    public function getProgressPercentageAttribute()
    {
        if ($this->amount <= 0)
            return 0;
        return round(($this->total_paid / $this->amount) * 100, 1);
    }
}
