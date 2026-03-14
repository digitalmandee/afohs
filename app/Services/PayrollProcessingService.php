<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\FinancialInvoice;
use App\Models\Order;
use App\Models\PayrollPeriod;
use App\Models\PayrollSetting;
use App\Models\Payslip;
use App\Models\PayslipAllowance;
use App\Models\PayslipDeduction;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PayrollProcessingService
{
    protected $settings;

    public function __construct()
    {
        $this->settings = PayrollSetting::first();
    }

    /**
     * Process payroll for a specific period
     */
    public function processPayrollForPeriod($periodId, $employeeIds = null)
    {
        $period = PayrollPeriod::findOrFail($periodId);

        $employeesQuery = Employee::with([
            'salaryStructure' => function ($query) {
                $query->where('is_active', true)->latest();
            },
            'allowances' => function ($query) {
                $query->where('is_active', true);
            },
            'allowances.allowanceType',
            'deductions' => function ($query) {
                $query->where('is_active', true);
            },
            'deductions.deductionType',
            'department:id,name',
            'activeLoans',
            'activeAdvances'
        ]);

        if ($employeeIds) {
            $employeesQuery->whereIn('id', $employeeIds);
        }

        $employees = $employeesQuery->get();

        DB::beginTransaction();

        try {
            $totalEmployees = 0;
            $totalGrossAmount = 0;
            $totalDeductions = 0;
            $totalNetAmount = 0;

            // Batch fetch CTS orders for all employees to avoid per-employee queries
            $ordersByEmployee = collect();
            try {
                if ($employees->count() > 0) {
                    $employeeIdsList = $employees->pluck('id')->toArray();
                    $periodStart = Carbon::parse($period->start_date)->startOfDay();
                    $periodEnd = Carbon::parse($period->end_date)->endOfDay();

                    // Only consider CTS orders that have not been deducted yet to avoid double-deduction
                    $ctsOrders = Order::whereIn('employee_id', $employeeIdsList)
                        ->whereNull('deducted_in_payslip_id')
                        ->whereBetween('paid_at', [$periodStart, $periodEnd])
                        ->where(function ($q) {
                            $q
                                ->where('payment_method', 'cts')
                                ->orWhereExists(function ($sub) {
                                    $sub
                                        ->select(DB::raw(1))
                                        ->from('financial_invoices')
                                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR)")
                                        ->where('cts_amount', '>', 0);
                                });
                        })
                        ->addSelect([
                            'orders.*',
                            'invoice_cts_amount' => FinancialInvoice::select('cts_amount')
                                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR)")
                                ->limit(1),
                        ])
                        ->get()
                        ->groupBy('employee_id');

                    $ordersByEmployee = $ctsOrders;
                }
            } catch (\Exception $ex) {
                $ordersByEmployee = collect();
            }

            foreach ($employees as $employee) {
                $employeeOrders = $ordersByEmployee->get($employee->id, collect());
                $payslip = $this->generatePayslip($employee, $period, $employeeOrders);

                if ($payslip) {
                    $totalEmployees++;
                    $totalGrossAmount += $payslip->gross_salary;
                    $totalDeductions += $payslip->total_deductions;
                    $totalNetAmount += $payslip->net_salary;
                }
            }

            // Update period totals
            $period->update([
                'total_employees' => $totalEmployees,
                'total_gross_amount' => $totalGrossAmount,
                'total_deductions' => $totalDeductions,
                'total_net_amount' => $totalNetAmount,
                'status' => 'completed',
                'processed_by' => Auth::id(),
                'processed_at' => now()
            ]);

            DB::commit();

            return [
                'success' => true,
                'message' => "Payroll processed successfully for {$totalEmployees} employees",
                'data' => [
                    'total_employees' => $totalEmployees,
                    'total_gross_amount' => $totalGrossAmount,
                    'total_net_amount' => $totalNetAmount
                ]
            ];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payroll processing error: ' . $e->getMessage());

            return [
                'success' => false,
                'message' => 'Error processing payroll: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate payslip for individual employee
     */
    public function generatePayslip($employee, $period, $employeeOrders = null)
    {
        // Check if payslip already exists
        $existingPayslip = Payslip::where('employee_id', $employee->id)
            ->where('payroll_period_id', $period->id)
            ->first();

        if ($existingPayslip) {
            return $existingPayslip;  // Skip if already processed
        }

        // Get salary structure
        $salaryStructure = $employee->salaryStructure;
        if (!$salaryStructure) {
            Log::warning("No salary structure found for employee: {$employee->name}");
            return null;
        }

        // Calculate attendance data
        $attendanceData = $this->calculateAttendanceData($employee, $period);

        // Calculate salary components
        $salaryComponents = $this->calculateSalaryComponents($employee, $attendanceData, $salaryStructure);

        // --- Calculate Loan Deductions ---
        $loanDeductions = [];
        $totalLoanDeductions = 0;
        $periodEnd = Carbon::parse($period->end_date);

        if ($employee->activeLoans) {
            foreach ($employee->activeLoans as $loan) {
                // Check if next deduction date is on or before period end date
                // Or if it's null (start immediately?) - Assuming next_deduction_date is set upon approval/disbursement
                if ($loan->next_deduction_date && Carbon::parse($loan->next_deduction_date)->lte($periodEnd)) {
                    $amount = min($loan->monthly_deduction, $loan->remaining_amount);
                    if ($amount > 0) {
                        $loanDeductions[] = [
                            'employee_loan_id' => $loan->id,
                            'amount' => $amount,
                            'name' => 'Loan Repayment'
                        ];
                        $totalLoanDeductions += $amount;
                    }
                }
            }
        }

        // --- Calculate Advance Deductions ---
        $advanceDeductions = [];
        $totalAdvanceDeductions = 0;

        if ($employee->activeAdvances) {
            foreach ($employee->activeAdvances as $advance) {
                // Check if deduction start date is on or before period end date
                if ($advance->deduction_start_date && Carbon::parse($advance->deduction_start_date)->lte($periodEnd)) {
                    $amount = min($advance->monthly_deduction, $advance->remaining_amount);
                    if ($amount > 0) {
                        $advanceDeductions[] = [
                            'employee_advance_id' => $advance->id,
                            'amount' => $amount,
                            'name' => 'Advance Repayment'
                        ];
                        $totalAdvanceDeductions += $amount;
                    }
                }
            }
        }

        // Food Bill (CTS) Deduction Logic
        $totalCtsBill = 0;
        $orderDeductions = [];  // Keep track for json storage if needed, but main deduction is via PayslipDeduction

        try {
            $ctsOrders = $employeeOrders instanceof \Illuminate\Support\Collection ? $employeeOrders : collect();

            foreach ($ctsOrders as $order) {
                if (!empty($order->deducted_in_payslip_id)) {
                    continue;
                }
                $amt = $order->invoice_cts_amount ?? $order->total_price ?? $order->paid_amount ?? $order->amount ?? 0;
                $totalCtsBill += (float) $amt;

                $orderDeductions[] = [
                    'order_id' => $order->id,
                    'amount' => (float) $amt,
                    'paid_at' => $order->paid_at ? (string) $order->paid_at : null
                ];
            }
        } catch (\Exception $ex) {
            $totalCtsBill = 0;
            $orderDeductions = [];
        }

        // Calculate Food Deduction after Allowance
        $foodDeductionAmount = 0;
        if ($totalCtsBill > 0) {
            $basicSalaryForFood = (float) ($salaryComponents['basic_salary'] ?? 0);
            $foodAllowanceAmount = 0.0;

            $foodAllowance = optional($employee->allowances)->where('allowance_type_id', \App\Constants\AppConstants::FOOD_ALLOWANCE_TYPE_ID)->first();

            if ($foodAllowance && $foodAllowance->allowanceType) {
                if ($foodAllowance->allowanceType->type === 'percentage') {
                    $percentage = (float) ($foodAllowance->percentage ?? $foodAllowance->amount ?? 0);
                    $foodAllowanceAmount = ($basicSalaryForFood * $percentage) / 100;
                } else {
                    $foodAllowanceAmount = (float) ($foodAllowance->amount ?? 0);
                }
            } else {
                $globalFoodType = \App\Models\AllowanceType::where('id', \App\Constants\AppConstants::FOOD_ALLOWANCE_TYPE_ID)
                    ->where('is_active', true)
                    ->where('is_global', true)
                    ->first();

                if ($globalFoodType) {
                    if ($globalFoodType->type === 'percentage') {
                        $foodAllowanceAmount = ($basicSalaryForFood * (float) ($globalFoodType->percentage ?? 0)) / 100;
                    } else {
                        $foodAllowanceAmount = (float) ($globalFoodType->default_amount ?? 0);
                    }
                }
            }

            // Deduction = Bill - Allowance (if Bill > Allowance)
            // If Bill <= Allowance, Deduction is 0 (Company covers it up to value)
            $foodDeductionAmount = max(0, $totalCtsBill - $foodAllowanceAmount);
        }

        // Create explicit PayslipDeduction for Food Bill
        if ($foodDeductionAmount > 0) {
            // Find or Create "Food Bill / CTS" Deduction Type
            $foodDeductionType = DeductionType::firstOrCreate(
                ['name' => \App\Constants\AppConstants::FOOD_BILL_DEDUCTION_NAME],
                [
                    'type' => 'fixed',
                    'is_mandatory' => true,
                    'calculation_base' => 'gross_salary',
                    'is_active' => true,
                    'description' => 'Auto-calculated Food Bill (Excess over Allowance)'
                ]
            );

            // Add to deductions list for creating explicit PayslipDeduction later
            // We append to $salaryComponents['deductions'] implicitly?
            // No, generatePayslip creates PayslipDeductions after Payslip creation usually.
            // But wait, generatePayslip here relies on $totalDeductionsWithOrders.
            // We need to ADD this $foodDeductionAmount to the totals.
        }

        $totalOrderDeductions = $foodDeductionAmount;  // This will be added to total_deductions below

        // Adjust totals to include all additional deductions
        $totalDeductionsWithOrders = $salaryComponents['total_deductions'] + $totalOrderDeductions + $totalLoanDeductions + $totalAdvanceDeductions;
        $netSalaryWithOrders = ($salaryComponents['gross_salary']) - $totalDeductionsWithOrders;

        // Create payslip
        $payslip = Payslip::create([
            'payroll_period_id' => $period->id,
            'employee_id' => $employee->id,
            'employee_name' => $employee->name,
            'employee_id_number' => $employee->employee_id,
            'designation' => $employee->designation,
            'department' => $employee->department->name ?? 'N/A',
            // Salary Components
            'basic_salary' => $salaryComponents['basic_salary'],
            'total_allowances' => $salaryComponents['total_allowances'],
            'total_deductions' => $totalDeductionsWithOrders,
            'gross_salary' => $salaryComponents['gross_salary'],
            'net_salary' => $netSalaryWithOrders,
            // Attendance Data
            'total_working_days' => $attendanceData['total_working_days'],
            'days_present' => $attendanceData['days_present'],
            'days_absent' => $attendanceData['days_absent'],
            'days_late' => $attendanceData['days_late'],
            'overtime_hours' => $attendanceData['overtime_hours'],
            // Calculations
            'absent_deduction' => $salaryComponents['absent_deduction'],
            'late_deduction' => $salaryComponents['late_deduction'],
            'overtime_amount' => $salaryComponents['overtime_amount'],
            'status' => 'draft'
        ]);

        // Create allowances details
        foreach ($salaryComponents['allowances'] as $allowance) {
            PayslipAllowance::create([
                'payslip_id' => $payslip->id,
                'allowance_type_id' => $allowance['type_id'],
                'allowance_name' => $allowance['name'],
                'amount' => $allowance['amount'],
                'is_taxable' => $allowance['is_taxable']
            ]);
        }

        // Create deductions details
        foreach ($salaryComponents['deductions'] as $deduction) {
            PayslipDeduction::create([
                'payslip_id' => $payslip->id,
                'deduction_type_id' => $deduction['type_id'],
                'deduction_name' => $deduction['name'],
                'amount' => $deduction['amount']
            ]);
        }

        // Create Loan Deductions
        if (!empty($loanDeductions)) {
            $loanDeductionType = DeductionType::firstOrCreate(
                ['name' => 'Loan Repayment'],
                [
                    'type' => 'fixed',
                    'is_mandatory' => false,
                    'calculation_base' => 'basic_salary',
                    'is_active' => true,
                    'description' => 'Automatic deduction for loan repayment'
                ]
            );

            foreach ($loanDeductions as $ld) {
                PayslipDeduction::create([
                    'payslip_id' => $payslip->id,
                    'employee_loan_id' => $ld['employee_loan_id'],
                    'deduction_type_id' => $loanDeductionType->id,
                    'deduction_name' => 'Loan Repayment',
                    'amount' => $ld['amount']
                ]);
            }
        }

        // Create Advance Deductions
        if (!empty($advanceDeductions)) {
            $advanceDeductionType = DeductionType::firstOrCreate(
                ['name' => 'Advance Repayment'],
                [
                    'type' => 'fixed',
                    'is_mandatory' => false,
                    'calculation_base' => 'basic_salary',
                    'is_active' => true,
                    'description' => 'Automatic deduction for advance repayment'
                ]
            );

            foreach ($advanceDeductions as $ad) {
                PayslipDeduction::create([
                    'payslip_id' => $payslip->id,
                    'employee_advance_id' => $ad['employee_advance_id'],
                    'deduction_type_id' => $advanceDeductionType->id,
                    'deduction_name' => 'Advance Repayment',
                    'amount' => $ad['amount']
                ]);
            }
        }

        // Create Single Food Bill Deduction (if applicable)
        if ($foodDeductionAmount > 0) {
            $foodDeductionType = DeductionType::firstOrCreate(
                ['name' => \App\Constants\AppConstants::FOOD_BILL_DEDUCTION_NAME],
                [
                    'type' => 'fixed',
                    'is_mandatory' => true,
                    'calculation_base' => 'gross_salary',
                    'is_active' => true,
                    'description' => 'Auto-calculated Food Bill (Excess over Allowance)'
                ]
            );

            PayslipDeduction::create([
                'payslip_id' => $payslip->id,
                'deduction_type_id' => $foodDeductionType->id,
                'deduction_name' => \App\Constants\AppConstants::FOOD_BILL_DEDUCTION_NAME,
                'amount' => $foodDeductionAmount
            ]);
        }

        // Mark ALL processed CTS orders as deducted (regardless of allowance coverage)
        // Even if deducted amount is 0 (fully covered by allowance), the orders are "settled" for this pay period.
        if (!empty($ctsOrders)) {
            foreach ($ctsOrders as $order) {
                if (!empty($order->deducted_in_payslip_id))
                    continue;

                // Update order status
                try {
                    $order->deducted_in_payslip_id = $payslip->id;
                    $order->deducted_at = now();
                    $order->save();
                } catch (\Exception $ex) {
                    // Log error but continue
                }
            }
        }

        return $payslip;
    }

    /**
     * Calculate attendance data for employee in period
     */
    private function calculateAttendanceData($employee, $period)
    {
        $attendances = Attendance::where('employee_id', $employee->id)
            ->whereBetween('date', [$period->start_date, $period->end_date])
            ->get();

        $totalWorkingDays = $this->calculateWorkingDays($period->start_date, $period->end_date);
        $daysPresent = $attendances->whereIn('status', ['present', 'late'])->count();
        $daysAbsent = $attendances->where('status', 'absent')->count();
        $daysLate = $attendances->where('status', 'late')->count();

        // Calculate overtime hours
        $overtimeHours = 0;
        foreach ($attendances as $attendance) {
            if ($attendance->check_in && $attendance->check_out) {
                $checkIn = Carbon::parse($attendance->check_in);
                $checkOut = Carbon::parse($attendance->check_out);
                $hoursWorked = $checkOut->diffInHours($checkIn);

                if ($hoursWorked > $this->settings->working_hours_per_day) {
                    $overtimeHours += $hoursWorked - $this->settings->working_hours_per_day;
                }
            }
        }

        return [
            'total_working_days' => $totalWorkingDays,
            'days_present' => $daysPresent,
            'days_absent' => $daysAbsent,
            'days_late' => $daysLate,
            'overtime_hours' => $overtimeHours
        ];
    }

    /**
     * Calculate salary components
     */
    private function calculateSalaryComponents($employee, $attendanceData, $salaryStructure)
    {
        $basicSalary = $salaryStructure->basic_salary;
        $dailySalary = $basicSalary / $this->settings->working_days_per_month;

        // Calculate allowances
        $allowances = [];
        $totalAllowances = 0;

        foreach ($employee->allowances as $employeeAllowance) {
            $amount = 0;

            if ($employeeAllowance->allowanceType->type === 'fixed') {
                $amount = $employeeAllowance->amount ?? 0;
            } elseif ($employeeAllowance->allowanceType->type === 'percentage') {
                $percentage = $employeeAllowance->percentage ?? $employeeAllowance->amount ?? 0;
                $amount = ($basicSalary * $percentage) / 100;
            }

            $allowances[] = [
                'type_id' => $employeeAllowance->allowance_type_id,
                'name' => $employeeAllowance->allowanceType->name,
                'amount' => $amount,
                'is_taxable' => $employeeAllowance->allowanceType->is_taxable
            ];

            $totalAllowances += $amount;
        }

        // Apply global allowances (is_global = true)
        $existingAllowanceTypeIds = collect($allowances)->pluck('type_id')->toArray();
        $globalAllowanceTypes = \App\Models\AllowanceType::where('is_active', true)
            ->where('is_global', true)
            ->whereNotIn('id', $existingAllowanceTypeIds)  // Avoid duplicates
            ->get();

        foreach ($globalAllowanceTypes as $globalType) {
            $amount = 0;
            if ($globalType->type === 'fixed') {
                $amount = $globalType->default_amount ?? 0;
            } elseif ($globalType->type === 'percentage') {
                $amount = ($basicSalary * ($globalType->percentage ?? 0)) / 100;
            }

            if ($amount > 0) {
                $allowances[] = [
                    'type_id' => $globalType->id,
                    'name' => $globalType->name . ' (Global)',
                    'amount' => $amount,
                    'is_taxable' => $globalType->is_taxable
                ];
                $totalAllowances += $amount;
            }
        }

        // Calculate deductions
        $deductions = [];
        $totalDeductions = 0;

        foreach ($employee->deductions as $employeeDeduction) {
            $amount = 0;
            $calculationBase = $employeeDeduction->deductionType->calculation_base === 'basic_salary'
                ? $basicSalary
                : ($basicSalary + $totalAllowances);

            if ($employeeDeduction->deductionType->type === 'fixed') {
                $amount = $employeeDeduction->amount ?? 0;
            } elseif ($employeeDeduction->deductionType->type === 'percentage') {
                $percentage = $employeeDeduction->percentage ?? $employeeDeduction->amount ?? 0;
                $amount = ($calculationBase * $percentage) / 100;
            }

            $deductions[] = [
                'type_id' => $employeeDeduction->deduction_type_id,
                'name' => $employeeDeduction->deductionType->name,
                'amount' => $amount
            ];

            $totalDeductions += $amount;
        }

        // Apply global deductions (is_global = true)
        $existingDeductionTypeIds = collect($deductions)->pluck('type_id')->toArray();
        $globalDeductionTypes = \App\Models\DeductionType::where('is_active', true)
            ->where('is_global', true)
            ->whereNotIn('id', $existingDeductionTypeIds)
            ->get();

        foreach ($globalDeductionTypes as $globalType) {
            $calculationBase = ($globalType->calculation_base ?? 'basic_salary') === 'basic_salary'
                ? $basicSalary
                : ($basicSalary + $totalAllowances);

            $amount = 0;
            if ($globalType->type === 'fixed') {
                $amount = $globalType->default_amount ?? 0;
            } elseif ($globalType->type === 'percentage') {
                $amount = ($calculationBase * ($globalType->percentage ?? 0)) / 100;
            }

            if ($amount > 0) {
                $deductions[] = [
                    'type_id' => $globalType->id,
                    'name' => $globalType->name . ' (Global)',
                    'amount' => $amount
                ];
                $totalDeductions += $amount;
            }
        }

        // Calculate overtime amount
        $overtimeAmount = $attendanceData['overtime_hours']
            * ($basicSalary / ($this->settings->working_days_per_month * $this->settings->working_hours_per_day))
            * $this->settings->overtime_rate_multiplier;

        // Add overtime to allowances
        $totalAllowances += $overtimeAmount;

        // Calculate Gross Salary first so we can use it for Tax
        $grossSalary = $basicSalary + $totalAllowances;

        // Calculate Income Tax based on slabs
        $taxAmount = 0;
        $taxSlabs = $this->settings->tax_slabs ?? [];

        if (!empty($taxSlabs) && is_array($taxSlabs)) {
            // Sort slabs by min_salary to ensure correct order check
            usort($taxSlabs, function ($a, $b) {
                return $a['min_salary'] <=> $b['min_salary'];
            });

            foreach ($taxSlabs as $slab) {
                $minSalary = $slab['min_salary'];
                $maxSalary = $slab['max_salary'];
                $fixedAmount = $slab['fixed_amount'] ?? 0;
                $taxRate = $slab['tax_rate'] ?? 0;

                // Normalize Yearly to Monthly
                if (($slab['frequency'] ?? 'monthly') === 'yearly') {
                    $minSalary = $minSalary / 12;
                    if (!is_null($maxSalary)) {
                        $maxSalary = $maxSalary / 12;
                    }
                    $fixedAmount = $fixedAmount / 12;
                }

                // Check if salary falls in this slab
                // If max_salary is null, it means "above min_salary"
                if ($grossSalary >= $minSalary && (is_null($maxSalary) || $grossSalary <= $maxSalary)) {
                    // Calculate Tax
                    // Logic: (Gross - Min) * Rate% + Fixed
                    // Note: This is a direct slab check as per user request ("if has salary 50k plus above then this tax employe cut")
                    // It is NOT a progressive tax calculation (where you pay different rates for different chunks of salary).
                    // It applies the rule of the matching slab.

                    $taxableAmount = $grossSalary - $minSalary;
                    $calculatedTax = ($taxableAmount * $taxRate / 100) + $fixedAmount;

                    $taxAmount = $calculatedTax;
                    break;  // Stop after finding the matching slab
                }
            }
        }

        if ($taxAmount > 0) {
            // Find or Create Income Tax Deduction Type
            $taxDeductionType = DeductionType::firstOrCreate(
                ['name' => 'Income Tax'],
                [
                    'type' => 'fixed',
                    'is_mandatory' => true,
                    'calculation_base' => 'gross_salary',
                    'is_active' => true,
                    'description' => 'Auto-calculated Income Tax'
                ]
            );

            $deductions[] = [
                'type_id' => $taxDeductionType->id,
                'name' => 'Income Tax',
                'amount' => $taxAmount
            ];
            $totalDeductions += $taxAmount;
        }

        // Calculate absent deduction
        $absentDeduction = 0;
        if ($attendanceData['days_absent'] > $this->settings->max_allowed_absents) {
            $excessAbsents = $attendanceData['days_absent'] - $this->settings->max_allowed_absents;

            if ($this->settings->absent_deduction_type === 'full_day') {
                $absentDeduction = $dailySalary * $excessAbsents;
            } elseif ($this->settings->absent_deduction_type === 'fixed_amount') {
                $absentDeduction = $this->settings->absent_deduction_amount * $excessAbsents;
            }
        }

        // Calculate late deduction
        $lateDeduction = $attendanceData['days_late'] * $this->settings->late_deduction_per_minute * 60;  // Assuming 1 hour late per day

        // Add attendance-based deductions to total
        $totalDeductions += $absentDeduction + $lateDeduction;

        // Note: Overtime was already added to totalAllowances above

        $netSalary = $grossSalary - $totalDeductions;

        return [
            'basic_salary' => $basicSalary,
            'total_allowances' => $totalAllowances,
            'total_deductions' => $totalDeductions,
            'gross_salary' => $grossSalary,
            'net_salary' => $netSalary,
            'absent_deduction' => $absentDeduction,
            'late_deduction' => $lateDeduction,
            'overtime_amount' => $overtimeAmount,
            'allowances' => $allowances,
            'deductions' => $deductions,
            'tax_amount' => $taxAmount ?? 0
        ];
    }

    /**
     * Calculate working days excluding weekends
     */
    private function calculateWorkingDays($startDate, $endDate)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        $workingDays = 0;

        while ($start->lte($end)) {
            if ($start->dayOfWeek !== Carbon::SUNDAY) {  // Exclude Sundays
                $workingDays++;
            }
            $start->addDay();
        }

        return $workingDays;
    }

    /**
     * Generate summary report for period
     */
    public function generateSummaryReport($period)
    {
        $payslips = Payslip::where('payroll_period_id', $period->id)->get();

        return [
            'total_employees' => $payslips->count(),
            'total_basic_salary' => $payslips->sum('basic_salary'),
            'total_allowances' => $payslips->sum('total_allowances'),
            'total_deductions' => $payslips->sum('total_deductions'),
            'total_gross_salary' => $payslips->sum('gross_salary'),
            'total_net_salary' => $payslips->sum('net_salary'),
            'total_absent_deduction' => $payslips->sum('absent_deduction'),
            'total_late_deduction' => $payslips->sum('late_deduction'),
            'total_overtime_amount' => $payslips->sum('overtime_amount'),
            'department_wise' => $this->getDepartmentWiseSummary($payslips),
            'allowances_summary' => $this->getAllowancesSummary($payslips),
            'deductions_summary' => $this->getDeductionsSummary($payslips)
        ];
    }

    /**
     * Get department wise summary
     */
    private function getDepartmentWiseSummary($payslips)
    {
        return $payslips->groupBy('department')->map(function ($departmentPayslips) {
            return [
                'employee_count' => $departmentPayslips->count(),
                'total_gross' => $departmentPayslips->sum('gross_salary'),
                'total_net' => $departmentPayslips->sum('net_salary')
            ];
        });
    }

    /**
     * Get allowances summary
     */
    private function getAllowancesSummary($payslips)
    {
        $summary = [];
        foreach ($payslips as $payslip) {
            foreach ($payslip->allowances as $allowance) {
                if (!isset($summary[$allowance->allowance_name])) {
                    $summary[$allowance->allowance_name] = 0;
                }
                $summary[$allowance->allowance_name] += $allowance->amount;
            }

            // Add Overtime as a separate allowance type if not already in allowances list
            if ($payslip->overtime_amount > 0) {
                if (!isset($summary['Overtime'])) {
                    $summary['Overtime'] = 0;
                }
                $summary['Overtime'] += $payslip->overtime_amount;
            }
        }
        return $summary;
    }

    /**
     * Get deductions summary
     */
    private function getDeductionsSummary($payslips)
    {
        $summary = [];
        foreach ($payslips as $payslip) {
            foreach ($payslip->deductions as $deduction) {
                if (!isset($summary[$deduction->deduction_name])) {
                    $summary[$deduction->deduction_name] = 0;
                }
                $summary[$deduction->deduction_name] += $deduction->amount;
            }

            // Add Absent Deduction
            if ($payslip->absent_deduction > 0) {
                if (!isset($summary['Absent Deduction'])) {
                    $summary['Absent Deduction'] = 0;
                }
                $summary['Absent Deduction'] += $payslip->absent_deduction;
            }

            // Add Late Deduction
            if ($payslip->late_deduction > 0) {
                if (!isset($summary['Late Deduction'])) {
                    $summary['Late Deduction'] = 0;
                }
                $summary['Late Deduction'] += $payslip->late_deduction;
            }
        }
        return $summary;
    }

    /**
     * Post payroll to financials (Create/Update Transaction)
     */
    public function postToFinancials(PayrollPeriod $period)
    {
        DB::beginTransaction();
        try {
            // 1. Ensure Transaction Type exists
            $transType = \App\Models\TransactionType::firstOrCreate(
                ['name' => 'Payroll Expense'],
                [
                    'type' => 'debit',
                    'status' => 'active',
                    'details' => 'Monthly Payroll Expense'
                ]
            );

            // 2. data preparation
            $description = 'Payroll Expense for ' . $period->formatted_period_name;
            $amount = $period->total_net_amount;  // Using Net Amount as the cash outflow

            // 3. Find existing transaction (via reference)
            $existingTransaction = \App\Models\Transaction::where('reference_type', \App\Models\PayrollPeriod::class)
                ->where('reference_id', $period->id)
                ->first();

            if ($existingTransaction) {
                // Update existing
                $existingTransaction->update([
                    'amount' => $amount,
                    'description' => $description,  // Update description in case period name changed
                    'updated_by' => Auth::id()
                ]);
            } else {
                // Create new
                \App\Models\Transaction::create([
                    'trans_type_id' => $transType->id,
                    'type' => 'debit',
                    'amount' => $amount,
                    'date' => now(),
                    'description' => $description,
                    'reference_type' => \App\Models\PayrollPeriod::class,
                    'reference_id' => $period->id,
                    'created_by' => Auth::id()
                ]);
            }

            // 4. Update Period Status
            $period->status = 'posted';
            $period->save();

            DB::commit();
            return ['success' => true, 'message' => 'Payroll posted to financials successfully'];
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Financial Posting Error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to post to financials: ' . $e->getMessage()];
        }
    }
}
