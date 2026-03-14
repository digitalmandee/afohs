<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalaryStructure;
use App\Models\PayrollPeriod;
use App\Models\Payslip;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class EmployeeReportApiController extends Controller
{
    /**
     * Employee Details Report - JSON API
     */
    public function employeeDetails(Request $request)
    {
        $query = Employee::with(['department', 'subdepartment', 'salaryStructure'])
            ->select('employees.*');

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

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => $employees,
                'departments' => $departments,
                'total' => $employees->count()
            ]
        ]);
    }

    /**
     * New Hiring Report - JSON API
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

        $stats = [
            'total_new_hires' => $employees->count(),
            'by_department' => $employees->groupBy('department.name')->map->count(),
            'by_employment_type' => $employees->groupBy('employment_type')->map->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => $employees,
                'stats' => $stats,
                'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo]
            ]
        ]);
    }

    /**
     * Salary Sheet - JSON API
     */
    public function salarySheet(Request $request)
    {
        $periodId = $request->period_id;
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->get()
            ->map(function ($period) {
                $period->start_date = $period->start_date ? Carbon::parse($period->start_date)->format('d/m/Y') : '-';
                $period->end_date = $period->end_date ? Carbon::parse($period->end_date)->format('d/m/Y') : '-';
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

        return response()->json([
            'success' => true,
            'data' => [
                'payslips' => $payslips,
                'periods' => $periods,
                'totals' => $totals
            ]
        ]);
    }

    /**
     * Deductions Report - JSON API
     */
    public function deductions(Request $request)
    {
        $periodId = $request->period_id;
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->get()
            ->map(function ($period) {
                $period->start_date = $period->start_date ? Carbon::parse($period->start_date)->format('d/m/Y') : '-';
                $period->end_date = $period->end_date ? Carbon::parse($period->end_date)->format('d/m/Y') : '-';
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

        return response()->json([
            'success' => true,
            'data' => [
                'deductions' => $deductions,
                'periods' => $periods,
                'summary' => $summary
            ]
        ]);
    }

    /**
     * Advances Report - JSON API
     */
    public function advances(Request $request)
    {
        $hasAdvancesTable = Schema::hasTable('employee_advances');
        $advances = collect();
        $summary = null;

        if ($hasAdvancesTable) {
            $query = \App\Models\EmployeeAdvance::with(['employee', 'employee.department']);

            if ($request->employee_id) {
                $query->where('employee_id', $request->employee_id);
            }
            if ($request->status) {
                $query->where('status', $request->status);
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
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'advances' => $advances,
                'summary' => $summary,
                'hasAdvancesTable' => $hasAdvancesTable,
                'message' => !$hasAdvancesTable ? 'Advances module not configured.' : null
            ]
        ]);
    }

    /**
     * Increments Report - JSON API
     */
    public function increments(Request $request)
    {
        $dateFrom = $request->date_from ?? Carbon::now()->subYear()->format('Y-m-d');
        $dateTo = $request->date_to ?? Carbon::now()->format('Y-m-d');

        $increments = EmployeeSalaryStructure::with(['employee', 'employee.department'])
            ->whereBetween('effective_from', [$dateFrom, $dateTo])
            ->orderBy('effective_from', 'desc')
            ->get()
            ->map(function ($structure) {
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

        return response()->json([
            'success' => true,
            'data' => [
                'increments' => $increments,
                'filters' => ['date_from' => $dateFrom, 'date_to' => $dateTo]
            ]
        ]);
    }

    /**
     * Bank Transfer Report - JSON API
     */
    public function bankTransfer(Request $request)
    {
        $periodId = $request->period_id;
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->get()
            ->map(function ($period) {
                $period->start_date = $period->start_date ? Carbon::parse($period->start_date)->format('d/m/Y') : '-';
                $period->end_date = $period->end_date ? Carbon::parse($period->end_date)->format('d/m/Y') : '-';
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

        return response()->json([
            'success' => true,
            'data' => [
                'employees' => $employees,
                'periods' => $periods,
                'totals' => $totals
            ]
        ]);
    }

    // ========================================
    // EXPORT METHODS (Excel/PDF)
    // ========================================

    /**
     * Export Employee Details to Excel
     */
    public function exportEmployeeDetailsExcel(Request $request)
    {
        $query = Employee::with(['department', 'subdepartment'])
            ->select('employees.*');

        if ($request->department_id)
            $query->where('department_id', $request->department_id);
        if ($request->status)
            $query->where('status', $request->status);
        if ($request->employment_type)
            $query->where('employment_type', $request->employment_type);

        $employees = $query->orderBy('name')->get();

        // Generate CSV (simple Excel-compatible format)
        $filename = 'employee_details_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($employees) {
            $file = fopen('php://output', 'w');
            // Header row
            fputcsv($file, ['ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Joining Date', 'Status', 'Employment Type']);

            foreach ($employees as $emp) {
                fputcsv($file, [
                    $emp->employee_id ?? $emp->id,
                    $emp->name,
                    $emp->email ?? '-',
                    $emp->phone ?? '-',
                    $emp->department?->name ?? '-',
                    $emp->designation ?? '-',
                    $emp->joining_date ? Carbon::parse($emp->joining_date)->format('d/m/Y') : '-',
                    $emp->status ?? 'active',
                    $emp->employment_type ?? 'full_time'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export Salary Sheet to Excel
     */
    public function exportSalarySheetExcel(Request $request)
    {
        $periodId = $request->period_id;
        if (!$periodId) {
            return response()->json(['success' => false, 'message' => 'Period ID required'], 400);
        }

        $payslips = Payslip::with(['employee'])
            ->where('payroll_period_id', $periodId)
            ->orderBy('employee_name')
            ->get();

        $filename = 'salary_sheet_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($payslips) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee ID', 'Name', 'Department', 'Basic Salary', 'Allowances', 'Deductions', 'Gross Salary', 'Net Salary']);

            foreach ($payslips as $payslip) {
                fputcsv($file, [
                    $payslip->employee_id_number,
                    $payslip->employee_name,
                    $payslip->department ?? '-',
                    $payslip->basic_salary,
                    $payslip->total_allowances,
                    $payslip->total_deductions,
                    $payslip->gross_salary,
                    $payslip->net_salary
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export Bank Transfer to Excel
     */
    public function exportBankTransferExcel(Request $request)
    {
        $periodId = $request->period_id;
        if (!$periodId) {
            return response()->json(['success' => false, 'message' => 'Period ID required'], 400);
        }

        $employees = Payslip::with(['employee'])
            ->where('payroll_period_id', $periodId)
            ->get();

        $filename = 'bank_transfer_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($employees) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee ID', 'Name', 'Bank Name', 'Account No', 'Branch Code', 'Net Salary']);

            foreach ($employees as $payslip) {
                fputcsv($file, [
                    $payslip->employee_id_number,
                    $payslip->employee_name,
                    $payslip->employee->bank_name ?? '-',
                    $payslip->employee->account_no ?? '-',
                    $payslip->employee->branch_code ?? '-',
                    $payslip->net_salary
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export New Hiring to Excel
     */
    public function exportNewHiringExcel(Request $request)
    {
        $dateFrom = $request->date_from ?? Carbon::now()->subMonths(3)->format('Y-m-d');
        $dateTo = $request->date_to ?? Carbon::now()->format('Y-m-d');

        $employees = Employee::with(['department'])
            ->whereBetween('joining_date', [$dateFrom, $dateTo])
            ->orderBy('joining_date', 'desc')
            ->get();

        $filename = 'new_hiring_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($employees) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee ID', 'Name', 'Department', 'Designation', 'Joining Date', 'Employment Type', 'Email', 'Phone']);

            foreach ($employees as $emp) {
                fputcsv($file, [
                    $emp->employee_id ?? $emp->id,
                    $emp->name,
                    $emp->department?->name ?? '-',
                    $emp->designation ?? '-',
                    $emp->joining_date ? Carbon::parse($emp->joining_date)->format('d/m/Y') : '-',
                    $emp->employment_type ?? 'full_time',
                    $emp->email ?? '-',
                    $emp->phone ?? '-'
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export Deductions to Excel
     */
    public function exportDeductionsExcel(Request $request)
    {
        $periodId = $request->period_id;
        if (!$periodId) {
            return response()->json(['success' => false, 'message' => 'Period ID required'], 400);
        }

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

        $filename = 'deductions_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($deductions) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee ID', 'Name', 'Department', 'Deduction Type', 'Amount']);

            foreach ($deductions as $ded) {
                fputcsv($file, [
                    $ded->employee_id_number,
                    $ded->employee_name,
                    $ded->department_name ?? '-',
                    $ded->deduction_name,
                    $ded->amount
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export Increments to Excel
     */
    public function exportIncrementsExcel(Request $request)
    {
        $dateFrom = $request->date_from ?? Carbon::now()->subYear()->format('Y-m-d');
        $dateTo = $request->date_to ?? Carbon::now()->format('Y-m-d');

        $increments = EmployeeSalaryStructure::with(['employee', 'employee.department'])
            ->whereBetween('effective_from', [$dateFrom, $dateTo])
            ->orderBy('effective_from', 'desc')
            ->get()
            ->map(function ($structure) {
                $previous = EmployeeSalaryStructure::where('employee_id', $structure->employee_id)
                    ->where('effective_from', '<', $structure->effective_from)
                    ->orderBy('effective_from', 'desc')
                    ->first();

                return [
                    'employee_name' => $structure->employee?->name ?? '-',
                    'department' => $structure->employee?->department?->name ?? '-',
                    'effective_date' => $structure->effective_from,
                    'previous_salary' => $previous?->basic_salary ?? 0,
                    'current_salary' => $structure->basic_salary,
                    'increment' => $structure->basic_salary - ($previous?->basic_salary ?? 0),
                ];
            });

        $filename = 'increments_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($increments) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Name', 'Department', 'Effective Date', 'Previous Salary', 'Current Salary', 'Increment']);

            foreach ($increments as $inc) {
                fputcsv($file, [
                    $inc['employee_name'],
                    $inc['department'],
                    $inc['effective_date'] ? Carbon::parse($inc['effective_date'])->format('d/m/Y') : '-',
                    $inc['previous_salary'],
                    $inc['current_salary'],
                    $inc['increment']
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Loans Report - JSON API
     */
    public function loans(Request $request)
    {
        $hasLoansTable = Schema::hasTable('employee_loans');
        $loans = collect();
        $summary = null;

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

        return response()->json([
            'success' => true,
            'data' => [
                'loans' => $loans,
                'summary' => $summary,
                'hasLoansTable' => $hasLoansTable,
                'message' => !$hasLoansTable ? 'Loans module not configured.' : null
            ]
        ]);
    }

    /**
     * Export Advances to Excel
     */
    public function exportAdvancesExcel(Request $request)
    {
        $hasAdvancesTable = Schema::hasTable('employee_advances');
        $advances = collect();

        if ($hasAdvancesTable) {
            $query = \App\Models\EmployeeAdvance::with(['employee', 'employee.department']);

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

            $advances = $query->orderBy('advance_date', 'desc')->get();
        }

        $filename = 'advances_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($advances) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee ID', 'Name', 'Department', 'Amount', 'Remaining', 'Detailed Reason', 'Date', 'Status']);

            foreach ($advances as $adv) {
                fputcsv($file, [
                    $adv->employee?->employee_id ?? $adv->employee_id,
                    $adv->employee?->name ?? '-',
                    $adv->employee?->department?->name ?? '-',
                    $adv->amount,
                    $adv->remaining_amount,
                    $adv->reason,
                    $adv->advance_date,
                    $adv->status
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export Loans to Excel
     */
    public function exportLoansExcel(Request $request)
    {
        $hasLoansTable = Schema::hasTable('employee_loans');
        $loans = collect();

        if ($hasLoansTable) {
            $query = \App\Models\EmployeeLoan::with(['employee', 'employee.department']);

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

            $loans = $query->orderBy('loan_date', 'desc')->get();
        }

        $filename = 'loans_' . date('Y-m-d_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($loans) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee ID', 'Name', 'Department', 'Amount', 'Remaining', 'Paid', 'Reason', 'Date', 'Status']);

            foreach ($loans as $loan) {
                fputcsv($file, [
                    $loan->employee?->employee_id ?? $loan->employee_id,
                    $loan->employee?->name ?? '-',
                    $loan->employee?->department?->name ?? '-',
                    $loan->amount,
                    $loan->remaining_amount,
                    $loan->total_paid,
                    $loan->reason,
                    $loan->loan_date,
                    $loan->status
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
