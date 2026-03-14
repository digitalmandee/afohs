<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\EmployeeDeduction;
use App\Models\EmployeeSalaryStructure;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class EmployeeReportController extends Controller
{
    /**
     * Reports Dashboard - Index page with all report links
     */
    public function index()
    {
        $reports = [
            [
                'id' => 1,
                'title' => 'Employee Details Report',
                'description' => 'Complete employee information with personal and professional details',
                'icon' => 'People',
                'color' => '#063455',
                'route' => 'employees.reports.employee-details',
                'stats' => 'Employee Data'
            ],
            [
                'id' => 2,
                'title' => 'New Hiring Report',
                'description' => 'Employees who joined in the selected period (default: last 3 months)',
                'icon' => 'PersonAdd',
                'color' => '#063455',
                'route' => 'employees.reports.new-hiring',
                'stats' => 'New Hires'
            ],
            [
                'id' => 3,
                'title' => 'Monthly Attendance Report',
                'description' => 'Monthly attendance summary with present, absent, and leave days',
                'icon' => 'CalendarMonth',
                'color' => '#063455',
                'route' => 'employees.attendances.monthly.report',
                'stats' => 'Attendance'
            ],
            [
                'id' => 4,
                'title' => 'Daily Attendance Report',
                'description' => 'Day-wise attendance records for all employees',
                'icon' => 'Today',
                'color' => '#063455',
                'route' => 'employees.attendances.report',
                'stats' => 'Daily Records'
            ],
            [
                'id' => 5,
                'title' => 'Employee Leaves Report',
                'description' => 'Leave applications and balances for all employees',
                'icon' => 'EventBusy',
                'color' => '#063455',
                'route' => 'employees.leaves.application.report',
                'stats' => 'Leave Tracking'
            ],
            [
                'id' => 6,
                'title' => 'Salary Sheet',
                'description' => 'Complete salary breakdown for payroll periods',
                'icon' => 'Receipt',
                'color' => '#063455',
                'route' => 'employees.reports.salary-sheet',
                'stats' => 'Salary Data'
            ],
            [
                'id' => 7,
                'title' => 'Advances Report',
                'description' => 'Employee salary advances and recovery status',
                'icon' => 'AccountBalance',
                'color' => '#063455',
                'route' => 'employees.reports.advances',
                'stats' => 'Advance Payments'
            ],
            [
                'id' => 8,
                'title' => 'Deductions Report',
                'description' => 'All deductions applied to employee salaries',
                'icon' => 'RemoveCircle',
                'color' => '#063455',
                'route' => 'employees.reports.deductions',
                'stats' => 'Deductions'
            ],
            [
                'id' => 9,
                'title' => 'Increments Report',
                'description' => 'Salary increment history and changes',
                'icon' => 'TrendingUp',
                'color' => '#063455',
                'route' => 'employees.reports.increments',
                'stats' => 'Salary Changes'
            ],
            [
                'id' => 10,
                'title' => 'Employee Loans Report',
                'description' => 'Disbursed loans, repayments, and outstanding balances',
                'icon' => 'AccountBalance',
                'color' => '#063455',
                'route' => 'employees.reports.loans',
                'stats' => 'Loan Recovery'
            ],
            [
                'id' => 11,
                'title' => 'Bank Transfer Report',
                'description' => 'Bank account details for salary transfers',
                'icon' => 'AccountBalanceWallet',
                'color' => '#063455',
                'route' => 'employees.reports.bank-transfer',
                'stats' => 'Bank Details'
            ],
        ];

        return Inertia::render('App/Admin/Employee/Reports/Index', [
            'reports' => $reports
        ]);
    }

    /**
     * Employee Details Report
     */
    public function employeeDetails(Request $request)
    {
        $query = Employee::with(['department', 'subdepartment', 'salaryStructure'])
            ->select('employees.*');

        // Apply filters
        if ($request->department_id) {
            $query->where('department_id', $request->department_id);
        }
        if ($request->employment_type) {
            $query->where('employment_type', $request->employment_type);
        }

        $employees = $query
            ->orderBy('name')
            ->get()
            ->map(function ($employee) {
                $employee->joining_date = $employee->joining_date ? Carbon::parse($employee->joining_date)->format('d/m/Y') : '-';
                return $employee;
            });
        $departments = Department::orderBy('name')->get();

        return Inertia::render('App/Admin/Employee/Reports/EmployeeDetails', [
            'employees' => $employees,
            'departments' => $departments,
            'filters' => $request->only(['department_id', 'status', 'employment_type'])
        ]);
    }

    public function employeeDetailsPrint(Request $request)
    {
        return Inertia::render('App/Admin/Employee/Reports/EmployeeDetailsPrint', [
            'filters' => $request->only(['department_id', 'status', 'employment_type']),
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }

    /**
     * New Hiring Report - Employees joined in last X months
     */
    public function newHiring(Request $request)
    {
        $months = $request->months ?? 3;
        $dateFrom = $request->date_from ?? Carbon::now()->subMonths($months)->format('Y-m-d');
        $dateTo = $request->date_to ?? Carbon::now()->format('Y-m-d');

        $employees = Employee::with(['department', 'subdepartment'])
            ->whereBetween('joining_date', [$dateFrom, $dateTo])
            ->orderBy('joining_date', 'desc')
            ->get()
            ->map(function ($employee) {
                $employee->joining_date = $employee->joining_date ? Carbon::parse($employee->joining_date)->format('d/m/Y') : '-';
                return $employee;
            });

        $departments = Department::orderBy('name')->get();

        // Stats
        $stats = [
            'total_new_hires' => $employees->count(),
            'by_department' => $employees->groupBy('department.name')->map->count(),
            'by_employment_type' => $employees->groupBy('employment_type')->map->count(),
        ];

        return Inertia::render('App/Admin/Employee/Reports/NewHiring', [
            'employees' => $employees,
            'departments' => $departments,
            'stats' => $stats,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'months' => $months
            ]
        ]);
    }

    public function newHiringPrint(Request $request)
    {
        $dateFrom = $request->date_from ?? Carbon::now()->subMonths(3)->format('Y-m-d');
        $dateTo = $request->date_to ?? Carbon::now()->format('Y-m-d');

        return Inertia::render('App/Admin/Employee/Reports/NewHiringPrint', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo
            ],
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }

    /**
     * Salary Sheet Report
     */
    public function salarySheet(Request $request)
    {
        $periodId = $request->period_id;
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->get()
            ->map(function ($period) {
                $period->start_date = $period->start_date ? \Carbon\Carbon::parse($period->start_date)->format('d/m/Y') : '-';
                $period->end_date = $period->end_date ? \Carbon\Carbon::parse($period->end_date)->format('d/m/Y') : '-';
                return $period;
            });

        $payslips = collect();
        $totals = null;

        if ($periodId) {
            $payslips = Payslip::with(['employee', 'employee.department'])
                ->where('payroll_period_id', $periodId)
                ->orderBy('employee_name')
                ->get();

            $totals = [
                'total_basic' => $payslips->sum('basic_salary'),
                'total_allowances' => $payslips->sum('total_allowances'),
                'total_deductions' => $payslips->sum('total_deductions'),
                'total_gross' => $payslips->sum('gross_salary'),
                'total_net' => $payslips->sum('net_salary'),
            ];
        }

        return Inertia::render('App/Admin/Employee/Reports/SalarySheet', [
            'payslips' => $payslips,
            'periods' => $periods,
            'totals' => $totals,
            'filters' => ['period_id' => $periodId]
        ]);
    }

    public function salarySheetPrint(Request $request)
    {
        $periodId = $request->period_id;
        $period = PayrollPeriod::find($periodId);

        return Inertia::render('App/Admin/Employee/Reports/SalarySheetPrint', [
            'period' => $period,
            'filters' => ['period_id' => $periodId],
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }

    /**
     * Deductions Report
     */
    public function deductions(Request $request)
    {
        $periodId = $request->period_id;
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->get()
            ->map(function ($period) {
                $period->start_date = $period->start_date ? \Carbon\Carbon::parse($period->start_date)->format('d/m/Y') : '-';
                $period->end_date = $period->end_date ? \Carbon\Carbon::parse($period->end_date)->format('d/m/Y') : '-';
                return $period;
            });

        $deductions = collect();
        $summary = null;

        if ($periodId) {
            $deductions = DB::table('payslip_deductions')
                ->join('payslips', 'payslip_deductions.payslip_id', '=', 'payslips.id')
                ->join('employees', 'payslips.employee_id', '=', 'employees.id')
                ->leftJoin('departments', 'employees.department_id', '=', 'departments.id')
                ->where('payslips.payroll_period_id', $periodId)
                ->select(
                    'payslip_deductions.*',
                    'payslips.employee_name',
                    'payslips.employee_id_number',
                    'departments.name as department_name'
                )
                ->orderBy('payslips.employee_name')
                ->get();

            $summary = $deductions->groupBy('deduction_name')->map(function ($group) {
                return [
                    'name' => $group->first()->deduction_name,
                    'total' => $group->sum('amount'),
                    'count' => $group->count()
                ];
            })->values();
        }

        return Inertia::render('App/Admin/Employee/Reports/Deductions', [
            'deductions' => $deductions,
            'periods' => $periods,
            'summary' => $summary,
            'filters' => ['period_id' => $periodId]
        ]);
    }

    public function deductionsPrint(Request $request)
    {
        $periodId = $request->period_id;
        $period = PayrollPeriod::find($periodId);

        return Inertia::render('App/Admin/Employee/Reports/DeductionsPrint', [
            'period' => $period,
            'filters' => ['period_id' => $periodId],
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }

    /**
     * Advances Report - Employee salary advances
     */
    public function advances(Request $request)
    {
        // Check if employee_advances table exists
        $hasAdvancesTable = Schema::hasTable('employee_advances');

        $advances = collect();
        $summary = null;
        $filters = $request->only(['employee_id', 'status', 'date_from', 'date_to']);

        if ($hasAdvancesTable) {
            $query = \App\Models\EmployeeAdvance::with(['employee', 'employee.department', 'approver']);

            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }
            if ($request->status) {
                $query->where('status', $request->status);
            }
            if ($request->date_from) {
                $query->whereDate('advance_date', '>=', $request->date_from);
            }
            if ($request->date_to) {
                $query->whereDate('advance_date', '<=', $request->date_to);
            }

            $advances = $query
                ->orderBy('advance_date', 'desc')
                ->get()
                ->map(function ($advance) {
                    $advance->advance_date = $advance->advance_date ? Carbon::parse($advance->advance_date)->format('d/m/Y') : '-';
                    return $advance;
                });

            $summary = [
                'total_amount' => $advances->sum('amount'),
                'total_remaining' => $advances->sum('remaining_amount'),
                'count' => $advances->count(),
                'pending_count' => $advances->where('status', 'pending')->count(),
                'paid_count' => $advances->where('status', 'paid')->count(),
            ];
        }

        $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_id']);

        return Inertia::render('App/Admin/Employee/Reports/Advances', [
            'advances' => $advances,
            'employees' => $employees,
            'summary' => $summary,
            'hasAdvancesTable' => $hasAdvancesTable,
            'filters' => $filters,
            'message' => !$hasAdvancesTable ? 'Advances module not configured. Please set up employee advances first.' : null
        ]);
    }

    public function advancesPrint(Request $request)
    {
        return Inertia::render('App/Admin/Employee/Reports/AdvancesPrint', [
            'filters' => $request->only(['employee_id', 'status', 'date_from', 'date_to']),
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }

    /**
     * Loans Report - Employee loans and recovery status
     */
    public function loans(Request $request)
    {
        // Check if employee_loans table exists
        $hasLoansTable = \Illuminate\Support\Facades\Schema::hasTable('employee_loans');

        $loans = collect();
        $summary = null;
        $filters = $request->only(['employee_id', 'status', 'date_from', 'date_to']);

        if ($hasLoansTable) {
            $query = \App\Models\EmployeeLoan::with(['employee', 'employee.department', 'approver']);

            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }
            if ($request->status) {
                $query->where('status', $request->status);
            }
            if ($request->date_from) {
                $query->whereDate('loan_date', '>=', $request->date_from);
            }
            if ($request->date_to) {
                $query->whereDate('loan_date', '<=', $request->date_to);
            }

            $loans = $query
                ->orderBy('loan_date', 'desc')
                ->get()
                ->map(function ($loan) {
                    $loan->loan_date = $loan->loan_date ? Carbon::parse($loan->loan_date)->format('d/m/Y') : '-';
                    return $loan;
                });

            $summary = [
                'total_amount' => $loans->sum('amount'),
                'total_remaining' => $loans->sum('remaining_amount'),
                'total_recovered' => $loans->sum('total_paid'),
                'count' => $loans->count(),
                'pending_count' => $loans->where('status', 'pending')->count(),
                'active_count' => $loans->where('status', 'disbursed')->where('remaining_amount', '>', 0)->count(),
            ];
        }

        $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_id']);

        return Inertia::render('App/Admin/Employee/Reports/Loans', [
            'loans' => $loans,
            'employees' => $employees,
            'summary' => $summary,
            'filters' => $filters,
            'hasLoansTable' => $hasLoansTable
        ]);
    }

    public function loansPrint(Request $request)
    {
        return Inertia::render('App/Admin/Employee/Reports/LoansPrint', [
            'filters' => $request->only(['employee_id', 'status', 'date_from', 'date_to']),
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }

    /**
     * Increments Report - Salary history changes
     */
    public function increments(Request $request)
    {
        $dateFrom = $request->date_from ?? Carbon::now()->subYear()->format('Y-m-d');
        $dateTo = $request->date_to ?? Carbon::now()->format('Y-m-d');

        // Get salary structure changes
        $increments = EmployeeSalaryStructure::with(['employee', 'employee.department'])
            ->whereBetween('effective_from', [$dateFrom, $dateTo])
            ->orderBy('effective_from', 'desc')
            ->get()
            ->map(function ($structure) {
                // Get previous salary structure for this employee
                $previous = EmployeeSalaryStructure::where('employee_id', $structure->employee_id)
                    ->where('effective_from', '<', $structure->effective_from)
                    ->orderBy('effective_from', 'desc')
                    ->first();

                return [
                    'id' => $structure->id,
                    'employee' => $structure->employee,
                    'effective_date' => $structure->effective_from ? Carbon::parse($structure->effective_from)->format('d/m/Y') : '-',
                    'current_salary' => $structure->basic_salary,
                    'previous_salary' => $previous?->basic_salary ?? 0,
                    'increment' => $structure->basic_salary - ($previous?->basic_salary ?? 0),
                    'increment_percentage' => $previous?->basic_salary
                        ? round((($structure->basic_salary - $previous->basic_salary) / $previous->basic_salary) * 100, 2)
                        : 100
                ];
            });

        return Inertia::render('App/Admin/Employee/Reports/Increments', [
            'increments' => $increments,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo
            ]
        ]);
    }

    public function incrementsPrint(Request $request)
    {
        $dateFrom = $request->date_from ?? Carbon::now()->subYear()->format('Y-m-d');
        $dateTo = $request->date_to ?? Carbon::now()->format('Y-m-d');

        return Inertia::render('App/Admin/Employee/Reports/IncrementsPrint', [
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo
            ],
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }

    /**
     * Bank Transfer Report
     */
    public function bankTransfer(Request $request)
    {
        $periodId = $request->period_id;
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->get()
            ->map(function ($period) {
                $period->start_date = $period->start_date ? \Carbon\Carbon::parse($period->start_date)->format('d/m/Y') : '-';
                $period->end_date = $period->end_date ? \Carbon\Carbon::parse($period->end_date)->format('d/m/Y') : '-';
                return $period;
            });

        $employees = collect();
        $totals = null;

        if ($periodId) {
            $employees = Payslip::with(['employee'])
                ->where('payroll_period_id', $periodId)
                ->get()
                ->map(function ($payslip) {
                    return [
                        'employee_id' => $payslip->employee_id,
                        'employee_name' => $payslip->employee_name,
                        'employee_id_number' => $payslip->employee_id_number,
                        'department' => $payslip->department,
                        'bank_name' => $payslip->employee->bank_name ?? '-',
                        'account_no' => $payslip->employee->account_no ?? '-',
                        'branch_code' => $payslip->employee->branch_code ?? '-',
                        'net_salary' => $payslip->net_salary,
                    ];
                });

            $totals = [
                'total_employees' => $employees->count(),
                'total_amount' => $employees->sum('net_salary')
            ];
        }

        return Inertia::render('App/Admin/Employee/Reports/BankTransfer', [
            'employees' => $employees,
            'periods' => $periods,
            'totals' => $totals,
            'filters' => ['period_id' => $periodId]
        ]);
    }

    public function bankTransferPrint(Request $request)
    {
        $periodId = $request->period_id;
        $period = PayrollPeriod::find($periodId);

        return Inertia::render('App/Admin/Employee/Reports/BankTransferPrint', [
            'period' => $period,
            'filters' => ['period_id' => $periodId],
            'generatedAt' => now()->format('d/m/Y, h:i A')
        ]);
    }
}
