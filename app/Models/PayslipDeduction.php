<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayslipDeduction extends Model
{
    use HasFactory;

    protected $fillable = [
        'payslip_id',
        'order_id',
        'employee_loan_id',
        'employee_advance_id',
        'deduction_type_id',
        'deduction_name',
        'amount'
    ];

    protected $casts = [
        'amount' => 'decimal:2'
    ];

    /**
     * Get the payslip for this deduction
     */
    public function payslip()
    {
        return $this->belongsTo(Payslip::class);
    }

    /**
     * Get the deduction type for this deduction
     */
    public function deductionType()
    {
        return $this->belongsTo(DeductionType::class);
    }

    public function employeeLoan()
    {
        return $this->belongsTo(EmployeeLoan::class);
    }

    public function employeeAdvance()
    {
        return $this->belongsTo(EmployeeAdvance::class);
    }
}
