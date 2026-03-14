<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_period_id',
        'employee_id',
        'employee_name',
        'employee_id_number',
        'designation',
        'department',
        'basic_salary',
        'total_allowances',
        'total_deductions',
        'gross_salary',
        'net_salary',
        'total_working_days',
        'days_present',
        'days_absent',
        'days_late',
        'overtime_hours',
        'absent_deduction',
        'late_deduction',
        'overtime_amount',
        'status',
        'approved_by',
        'approved_at',
        'paid_at'
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'total_allowances' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'gross_salary' => 'decimal:2',
        'net_salary' => 'decimal:2',
        'absent_deduction' => 'decimal:2',
        'late_deduction' => 'decimal:2',
        'overtime_amount' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'approved_at' => 'datetime',
        'paid_at' => 'datetime'
    ];

    /**
     * Get the employee for this payslip
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the payroll period for this payslip
     */
    public function payrollPeriod()
    {
        return $this->belongsTo(PayrollPeriod::class);
    }

    /**
     * Get allowances for this payslip
     */
    public function allowances()
    {
        return $this->hasMany(PayslipAllowance::class);
    }

    /**
     * Get deductions for this payslip
     */
    public function deductions()
    {
        return $this->hasMany(PayslipDeduction::class);
    }

    /**
     * Get the user who approved this payslip
     */
    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Scope to get payslips by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get approved payslips
     */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope to get paid payslips
     */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    /**
     * Check if payslip is editable
     */
    public function isEditable()
    {
        return $this->status === 'draft';
    }

    /**
     * Check if payslip can be approved
     */
    public function canBeApproved()
    {
        return $this->status === 'draft';
    }

    /**
     * Check if payslip can be paid
     */
    public function canBePaid()
    {
        return $this->status === 'approved';
    }

    /**
     * Approve the payslip
     */
    public function approve($userId = null)
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId ?: auth()->id(),
            'approved_at' => now()
        ]);
    }

    /**
     * Mark payslip as paid
     */
    public function markAsPaid()
    {
        $this->update([
            'status' => 'paid',
            'paid_at' => now()
        ]);
    }

    /**
     * Get formatted payslip number
     */
    public function getPayslipNumberAttribute()
    {
        return 'PS-' . str_pad($this->id, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Get attendance percentage
     */
    public function getAttendancePercentageAttribute()
    {
        if ($this->total_working_days == 0) {
            return 0;
        }
        
        return round(($this->days_present / $this->total_working_days) * 100, 2);
    }
}
