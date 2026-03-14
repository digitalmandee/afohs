<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeAdvance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'amount',
        'advance_date',
        'reason',
        'status',
        'deduction_start_date',
        'deduction_months',
        'monthly_deduction',
        'remaining_amount',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'monthly_deduction' => 'decimal:2',
        'remaining_amount' => 'decimal:2',
        'advance_date' => 'date',
        'deduction_start_date' => 'date',
        'approved_at' => 'datetime',
    ];

    /**
     * Get the employee that owns the advance.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who approved the advance.
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope for pending advances.
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for approved advances.
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope for active (being deducted) advances.
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['approved', 'paid'])->where('remaining_amount', '>', 0);
    }

    /**
     * Get formatted status.
     */
    public function getStatusLabelAttribute()
    {
        return ucfirst($this->status);
    }
}
