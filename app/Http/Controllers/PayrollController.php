<?php

namespace App\Http\Controllers;

use App\Models\AllowanceType;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeSalaryStructure;
use App\Models\FinancialInvoice;
use App\Models\Order;
use App\Models\PayrollPeriod;
use App\Models\PayrollSetting;
use App\Models\Payslip;
use App\Services\PayrollProcessingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class PayrollController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollProcessingService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    /**
     * Display the payroll dashboard
     */
    public function dashboard()
    {
        return Inertia::render('App/Admin/Employee/Payroll/Dashboard');
    }

    /**
     * Display payroll settings page
     */
    public function settings()
    {
        $settings = PayrollSetting::first();

        return Inertia::render('App/Admin/Employee/Payroll/Settings', [
            'settings' => $settings
        ]);
    }

    /**
     * Display allowance types management
     */
    public function allowanceTypes()
    {
        $allowanceTypes = AllowanceType::where('is_active', true)->get();

        return Inertia::render('App/Admin/Employee/Payroll/AllowanceTypes', [
            'allowanceTypes' => $allowanceTypes
        ]);
    }

    /**
     * Display deduction types management
     */
    public function deductionTypes()
    {
        $deductionTypes = DeductionType::where('is_active', true)->get();

        return Inertia::render('App/Admin/Employee/Payroll/DeductionTypes', [
            'deductionTypes' => $deductionTypes
        ]);
    }

    /**
     * Display employee salaries management
     */
    public function employeeSalaries()
    {
        $employees = Employee::with([
            'salaryStructure' => function ($query) {
                $query->where('is_active', true)->latest();
            },
            'department:id,name',
        ])->get();

        return Inertia::render('App/Admin/Employee/Payroll/EmployeeSalaries', [
            'employees' => $employees
        ]);
    }

    /**
     * Create salary structure for employee
     */
    public function createSalaryStructure($employeeId)
    {
        $employee = Employee::with(['department'])->findOrFail($employeeId);
        $allowanceTypes = AllowanceType::all();
        $deductionTypes = DeductionType::all();

        return Inertia::render('App/Admin/Employee/Payroll/CreateSalaryStructure', [
            'employeeId' => $employeeId,
            'employee' => $employee,
            'allowanceTypes' => $allowanceTypes,
            'deductionTypes' => $deductionTypes
        ]);
    }

    /**
     * Edit salary structure for employee
     */
    public function editSalaryStructure($employeeId)
    {
        $employee = Employee::with([
            'user',
            'salaryStructure',
            'allowances.allowanceType',
            'deductions.deductionType',
            'department',
        ])->findOrFail($employeeId);

        $allowanceTypes = AllowanceType::all();
        $deductionTypes = DeductionType::all();

        return Inertia::render('App/Admin/Employee/Payroll/EditSalaryStructure', [
            'employeeId' => $employeeId,
            'employee' => $employee,
            'allowanceTypes' => $allowanceTypes,
            'deductionTypes' => $deductionTypes
        ]);
    }

    /**
     * View salary structure for employee
     */
    public function viewSalaryStructure($employeeId)
    {
        $employee = Employee::with([
            'user',
            'salaryStructure',
            'allowances.allowanceType',
            'deductions.deductionType',
            'department',
        ])->findOrFail($employeeId);

        return Inertia::render('App/Admin/Employee/Payroll/ViewSalaryStructure', [
            'employee' => $employee
        ]);
    }

    /**
     * Display payroll processing page
     */
    public function processPayroll()
    {
        $currentPeriod = PayrollPeriod::where('status', 'processing')->first();
        $employees = Employee::with(['salaryStructure', 'department'])->get();

        return Inertia::render('App/Admin/Employee/Payroll/ProcessPayroll', [
            'currentPeriod' => $currentPeriod,
            'employees' => $employees
        ]);
    }

    /**
     * Display payroll preview page (full page with pagination)
     */
    public function previewPayrollPage(Request $request)
    {
        $periodId = $request->query('period_id');
        $token = $request->query('token');

        $period = null;
        if ($periodId) {
            $period = PayrollPeriod::find($periodId);
        } elseif ($token) {
            // try to resolve period from cached preview session
            $session = \Illuminate\Support\Facades\Cache::get('payroll_preview_' . $token);
            if ($session && !empty($session['period_id'])) {
                $period = PayrollPeriod::find($session['period_id']);
            }
        } else {
            $period = PayrollPeriod::where('status', 'processing')->first();
        }

        return Inertia::render('App/Admin/Employee/Payroll/PayrollPreview', [
            'period' => $period,
            'token' => $token ?? null
        ]);
    }

    /**
     * Display payroll periods
     */
    public function payrollPeriods()
    {
        return Inertia::render('App/Admin/Employee/Payroll/PayrollPeriods');
    }

    /**
     * Create a new payroll period
     */
    public function createPeriod()
    {
        $lastPeriod = PayrollPeriod::orderBy('end_date', 'desc')->first();

        return Inertia::render('App/Admin/Employee/Payroll/CreatePeriod', [
            'lastPeriod' => $lastPeriod
        ]);
    }

    /**
     * Edit a payroll period
     */
    public function editPeriod($periodId)
    {
        $period = PayrollPeriod::findOrFail($periodId);

        return Inertia::render('App/Admin/Employee/Payroll/EditPeriod', [
            'period' => $period
        ]);
    }

    /**
     * Display payslips overview
     */
    public function payslips()
    {
        $periods = PayrollPeriod::orderBy('start_date', 'desc')->paginate(15);

        // For each period attach total CTS order deductions (batch query)
        $periods->getCollection()->transform(function ($period) {
            $periodStart = Carbon::parse($period->start_date)->startOfDay();
            $periodEnd = Carbon::parse($period->end_date)->endOfDay();

            $totalOrderDeductions = (float) (Order::whereBetween('paid_at', [$periodStart, $periodEnd])
                ->where(function ($q) {
                    $q
                        ->where('payment_method', 'cts')
                        ->orWhereExists(function ($sub) {
                            $sub
                                ->select(DB::raw(1))
                                ->from('financial_invoices')
                                ->where('invoice_type', 'food_order')
                                ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR)")
                                ->where('cts_amount', '>', 0);
                        });
                })
                ->selectRaw("SUM(COALESCE((SELECT cts_amount FROM financial_invoices WHERE invoice_type = 'food_order' AND JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR) ORDER BY CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END, id DESC LIMIT 1), 0)) as total")
                ->value('total') ?? 0);

            $period->total_order_deductions = $totalOrderDeductions;

            // Format dates for display
            $period->start_date = $period->start_date ? Carbon::parse($period->start_date)->format('d/m/Y') : '-';
            $period->end_date = $period->end_date ? Carbon::parse($period->end_date)->format('d/m/Y') : '-';

            return $period;
        });

        return Inertia::render('App/Admin/Employee/Payroll/Payslips', [
            'periods' => $periods
        ]);
    }

    /**
     * Display payslips for specific period
     */
    public function periodPayslips($periodId)
    {
        $period = PayrollPeriod::findOrFail($periodId);
        $period->start_date = $period->start_date ? Carbon::parse($period->start_date)->format('d/m/Y') : '-';
        $period->end_date = $period->end_date ? Carbon::parse($period->end_date)->format('d/m/Y') : '-';
        $payslips = Payslip::with(['employee:id,name,employee_id'])
            ->where('payroll_period_id', $periodId)
            ->paginate(20);

        // Batch fetch CTS orders for employees in these payslips
        $payslipIds = $payslips->pluck('id')->toArray();
        $ordersByPayslip = collect();

        if (!empty($payslipIds)) {
            $ctsOrders = Order::whereIn('deducted_in_payslip_id', $payslipIds)
                ->addSelect([
                    'orders.*',
                    'invoice_cts_amount' => FinancialInvoice::select('cts_amount')
                        ->where('invoice_type', 'food_order')
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR)")
                        ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                        ->orderByDesc('id')
                        ->limit(1),
                ])
                ->get()
                ->groupBy('deducted_in_payslip_id');

            $ordersByPayslip = $ctsOrders;
        }

        // Attach order deduction summaries to each payslip
        $payslips->getCollection()->transform(function ($payslip) use ($ordersByPayslip) {
            $empOrders = $ordersByPayslip->get($payslip->id, collect());
            $totalOrderDeductions = $empOrders->sum(function ($o) {
                return max(0, (float) ($o->invoice_cts_amount ?? 0));
            });
            $payslip->order_deductions = $empOrders->map(function ($o) {
                return [
                    'id' => $o->id,
                    'paid_at' => $o->paid_at ? \Carbon\Carbon::parse($o->paid_at)->format('d/m/Y h:i A') : null,
                    'amount' => max(0, (float) ($o->invoice_cts_amount ?? 0)),
                    'note' => $o->payment_note ?? $o->remark ?? null,
                    'deducted_at' => $o->deducted_at ? \Carbon\Carbon::parse($o->deducted_at)->format('d/m/Y h:i A') : null
                ];
            })->values();
            $payslip->total_order_deductions = $totalOrderDeductions;
            return $payslip;
        });

        return Inertia::render('App/Admin/Employee/Payroll/PeriodPayslips', [
            'period' => $period,
            'payslips' => $payslips
        ]);
    }

    /**
     * View individual payslip
     */
    public function viewPayslip($payslipId)
    {
        $payslip = Payslip::with([
            'employee',
            'payrollPeriod',
            'allowances.allowanceType',
            'deductions.deductionType'
        ])->findOrFail($payslipId);

        // Attach CTS order deductions related to this payslip
        $ctsOrders = Order::where('deducted_in_payslip_id', $payslip->id)
            ->addSelect([
                'orders.*',
                'invoice_cts_amount' => FinancialInvoice::select('cts_amount')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
            ])
            ->get();

        $payslip->order_deductions = $ctsOrders->map(function ($o) {
            return [
                'id' => $o->id,
                'paid_at' => $o->paid_at ? (string) $o->paid_at : null,
                'amount' => max(0, (float) ($o->invoice_cts_amount ?? 0)),
                'note' => $o->payment_note ?? $o->remark ?? null,
                'deducted_at' => $o->deducted_at ? (string) $o->deducted_at : null
            ];
        })->values();
        $payslip->total_order_deductions = $payslip->order_deductions->sum('amount');

        if ($payslip->payrollPeriod) {
            $payslip->payrollPeriod->start_date = $payslip->payrollPeriod->start_date ? Carbon::parse($payslip->payrollPeriod->start_date)->format('d/m/Y') : '-';
            $payslip->payrollPeriod->end_date = $payslip->payrollPeriod->end_date ? Carbon::parse($payslip->payrollPeriod->end_date)->format('d/m/Y') : '-';
        }

        return Inertia::render('App/Admin/Employee/Payroll/ViewPayslip', [
            'payslip' => $payslip
        ]);
    }

    /**
     * Display payroll reports
     */
    public function reports()
    {
        $periods = PayrollPeriod::orderBy('start_date', 'desc')->take(12)->get();

        return Inertia::render('App/Admin/Employee/Payroll/Reports', [
            'periods' => $periods
        ]);
    }

    /**
     * Generate summary report
     */
    public function summaryReport(Request $request, $periodId = null)
    {
        // Handle both query parameter and route parameter
        $periodId = $periodId ?: $request->query('period_id');

        if (!$periodId) {
            return redirect()->route('employees.payroll.reports')->with('error', 'Period ID is required');
        }

        $period = PayrollPeriod::findOrFail($periodId);

        // For now, return basic summary data until PayrollProcessingService is available
        $summary = [
            'total_employees' => $period->total_employees ?? 0,
            'total_gross_amount' => $period->total_gross_amount ?? 0,
            'total_deductions' => $period->total_deductions ?? 0,
            'total_net_amount' => $period->total_net_amount ?? 0,
        ];

        return Inertia::render('App/Admin/Employee/Payroll/SummaryReport', [
            'period' => $period,
            'summary' => $summary
        ]);
    }

    /**
     * Generate detailed report
     */
    public function detailedReport(Request $request, $periodId = null)
    {
        // Handle both query parameter and route parameter
        $periodId = $periodId ?: $request->query('period_id');

        if (!$periodId) {
            return redirect()->route('employees.payroll.reports')->with('error', 'Period ID is required');
        }

        $period = PayrollPeriod::findOrFail($periodId);

        $payslips = Payslip::with(['employee', 'allowances', 'deductions'])
            ->where('payroll_period_id', $periodId)
            ->get();

        return Inertia::render('App/Admin/Employee/Payroll/DetailedReport', [
            'period' => $period,
            'payslips' => $payslips
        ]);
    }

    /**
     * Print summary report
     */
    public function summaryReportPrint($periodId)
    {
        $period = PayrollPeriod::findOrFail($periodId);

        // For now, return basic summary data until PayrollProcessingService is available
        $summary = [
            'total_employees' => $period->total_employees ?? 0,
            'total_gross_amount' => $period->total_gross_amount ?? 0,
            'total_deductions' => $period->total_deductions ?? 0,
            'total_net_amount' => $period->total_net_amount ?? 0,
        ];

        return Inertia::render('App/Admin/Employee/Payroll/PrintSummaryReport', [
            'period' => $period,
            'summary' => $summary
        ]);
    }

    /**
     * Print detailed report
     */
    public function detailedReportPrint($periodId)
    {
        $period = PayrollPeriod::findOrFail($periodId);

        $payslips = Payslip::with(['employee', 'allowances', 'deductions'])
            ->where('payroll_period_id', $periodId)
            ->get();

        return Inertia::render('App/Admin/Employee/Payroll/PrintDetailedReport', [
            'period' => $period,
            'payslips' => $payslips
        ]);
    }

    /**
     * Print individual payslip
     */
    public function printPayslip($payslipId)
    {
        $payslip = Payslip::with([
            'employee:id,name,employee_id,department_id,joining_date,designation',
            'employee.department:id,name',
            'employee.user:id,name',
            'payrollPeriod:id,period_name,start_date,end_date',
            'allowances.allowanceType:id,name',
            'deductions.deductionType:id,name'
        ])->findOrFail($payslipId);

        // Attach CTS order deductions for print view
        $ctsOrders = Order::where('deducted_in_payslip_id', $payslip->id)
            ->addSelect([
                'orders.*',
                'invoice_cts_amount' => FinancialInvoice::select('cts_amount')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
            ])
            ->get();

        $payslip->order_deductions = $ctsOrders->map(function ($o) {
            return [
                'id' => $o->id,
                'paid_at' => $o->paid_at ? (string) $o->paid_at : null,
                'amount' => max(0, (float) ($o->invoice_cts_amount ?? 0)),
                'note' => $o->payment_note ?? $o->remark ?? null
            ];
        })->values();
        $payslip->total_order_deductions = $payslip->order_deductions->sum('amount');

        if ($payslip->payrollPeriod) {
            $payslip->payrollPeriod->start_date = $payslip->payrollPeriod->start_date ? Carbon::parse($payslip->payrollPeriod->start_date)->format('d/m/Y') : '-';
            $payslip->payrollPeriod->end_date = $payslip->payrollPeriod->end_date ? Carbon::parse($payslip->payrollPeriod->end_date)->format('d/m/Y') : '-';
        }

        return Inertia::render('App/Admin/Employee/Payroll/PrintPayslip', [
            'payslip' => $payslip
        ]);
    }

    /**
     * Display salary sheet editor
     */
    public function salarySheet()
    {
        return Inertia::render('App/Admin/Employee/Payroll/SalarySheet');
    }

    /**
     * Display payroll history page
     */
    public function history()
    {
        return Inertia::render('App/Admin/Employee/Payroll/History');
    }
}
