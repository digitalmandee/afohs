<?php

namespace App\Http\Controllers;

use App\Models\AllowanceType;
use App\Models\DeductionType;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\EmployeeDeduction;
use App\Models\EmployeeSalaryStructure;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\FinancialReceipt;
use App\Models\Order;
use App\Models\PayrollPeriod;
use App\Models\PayrollSetting;
use App\Models\Payslip;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Services\PayrollProcessingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PayrollApiController extends Controller
{
    protected $payrollService;

    public function __construct(PayrollProcessingService $payrollService)
    {
        $this->payrollService = $payrollService;
    }

    // Settings Management
    public function getSettings()
    {
        $settings = PayrollSetting::first();
        return response()->json(['success' => true, 'settings' => $settings]);
    }

    public function updateSettings(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'company_name' => 'required|string|max:255',
            'pay_frequency' => 'required|in:monthly,bi-weekly,weekly',
            'currency' => 'required|string|max:10',
            'working_days_per_month' => 'required|integer|min:20|max:31',
            'working_hours_per_day' => 'required|numeric|min:6|max:12',
            'overtime_rate_multiplier' => 'required|numeric|min:1|max:3',
            'late_deduction_per_minute' => 'required|numeric|min:0',
            'absent_deduction_type' => 'required|in:full_day,hourly,fixed_amount',
            'absent_deduction_amount' => 'required|numeric|min:0',
            'max_allowed_absents' => 'required|integer|min:0|max:10',
            'grace_period_minutes' => 'required|integer|min:0|max:60',
            'tax_slabs' => 'nullable|array',
            'tax_slabs.*.name' => 'required|string',
            'tax_slabs.*.frequency' => 'required|in:monthly,yearly',
            'tax_slabs.*.min_salary' => 'required|numeric|min:0',
            'tax_slabs.*.max_salary' => 'nullable|numeric|gt:tax_slabs.*.min_salary',
            'tax_slabs.*.tax_rate' => 'required|numeric|min:0|max:100',
            'tax_slabs.*.fixed_amount' => 'nullable|numeric|min:0'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $settings = PayrollSetting::first();
        if ($settings) {
            $settings->update($request->all());
        } else {
            $settings = PayrollSetting::create($request->all());
        }

        return response()->json(['success' => true, 'settings' => $settings]);
    }

    // Allowance Types Management
    public function getAllowanceTypes()
    {
        $allowanceTypes = AllowanceType::all();
        return response()->json(['success' => true, 'allowanceTypes' => $allowanceTypes]);
    }

    public function storeAllowanceType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:allowance_types,name',
            'type' => 'required|in:fixed,percentage,conditional',
            'is_taxable' => 'boolean',
            'is_global' => 'boolean',
            'default_amount' => 'nullable|numeric|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $allowanceType = AllowanceType::create($request->all());
        return response()->json(['success' => true, 'allowanceType' => $allowanceType], 201);
    }

    public function updateAllowanceType(Request $request, $id)
    {
        $allowanceType = AllowanceType::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:allowance_types,name,' . $id,
            'type' => 'required|in:fixed,percentage,conditional',
            'is_taxable' => 'boolean',
            'is_active' => 'boolean',
            'is_global' => 'boolean',
            'default_amount' => 'nullable|numeric|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $allowanceType->update($request->all());
        return response()->json(['success' => true, 'allowanceType' => $allowanceType]);
    }

    public function deleteAllowanceType($id)
    {
        $allowanceType = AllowanceType::findOrFail($id);
        $allowanceType->delete();

        return response()->json(['success' => true, 'message' => 'Allowance type deactivated successfully']);
    }

    // Deduction Types Management
    public function getDeductionTypes()
    {
        $deductionTypes = DeductionType::all();
        return response()->json(['success' => true, 'deductionTypes' => $deductionTypes]);
    }

    public function storeDeductionType(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:deduction_types,name',
            'type' => 'required|in:fixed,percentage,conditional',
            'is_mandatory' => 'boolean',
            'calculation_base' => 'required|in:basic_salary,gross_salary',
            'is_active' => 'boolean',
            'is_global' => 'boolean',
            'default_amount' => 'nullable|numeric|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $deductionType = DeductionType::create($request->all());
        return response()->json(['success' => true, 'deductionType' => $deductionType], 201);
    }

    public function updateDeductionType(Request $request, $id)
    {
        $deductionType = DeductionType::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:deduction_types,name,' . $id,
            'type' => 'required|in:fixed,percentage,conditional',
            'is_mandatory' => 'boolean',
            'calculation_base' => 'required|in:basic_salary,gross_salary',
            'is_active' => 'boolean',
            'is_global' => 'boolean',
            'default_amount' => 'nullable|numeric|min:0',
            'percentage' => 'nullable|numeric|min:0|max:100',
            'description' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $deductionType->update($request->all());
        return response()->json(['success' => true, 'deductionType' => $deductionType]);
    }

    public function deleteDeductionType($id)
    {
        $deductionType = DeductionType::findOrFail($id);
        $deductionType->delete();

        return response()->json(['success' => true, 'message' => 'Deduction type deleted successfully']);
    }

    // Employee Salary Management
    public function getEmployeeSalaries(Request $request)
    {
        $query = Employee::with([
            'salaryStructure',
            'allowances.allowanceType',
            'deductions.deductionType',
            'department:id,name',
        ]);

        // Server-side search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        // Optionally filter only employees that have a salary structure
        if ($request->has('has_salary') && $request->get('has_salary')) {
            $query->whereHas('salaryStructure');
        }

        // Optionally filter only employees with active salary structure
        if ($request->has('active_salary') && $request->get('active_salary')) {
            $query->whereHas('salaryStructure', function ($q) {
                $q->where('is_active', true);
            });
        }

        $perPage = $request->get('per_page', 15);
        // If per_page is 0 or negative, fetch a large number (treat as 'all')
        if ((int) $perPage <= 0) {
            $perPage = 100000;
        }

        $employees = $query->paginate($perPage);

        $globalAllowanceTypes = AllowanceType::where('is_active', true)
            ->where('is_global', true)
            ->get();

        $globalDeductionTypes = DeductionType::where('is_active', true)
            ->where('is_global', true)
            ->get();

        $employees->getCollection()->transform(function ($employee) use ($globalAllowanceTypes, $globalDeductionTypes) {
            $basicSalary = (float) (optional($employee->salaryStructure)->basic_salary ?? 0);

            $allowances = collect($employee->allowances ?? [])->map(function ($employeeAllowance) use ($basicSalary) {
                $type = $employeeAllowance->allowanceType;
                $amount = 0.0;

                if (($type->type ?? null) === 'percentage') {
                    $percentage = (float) ($employeeAllowance->percentage ?? $employeeAllowance->amount ?? 0);
                    $amount = ($basicSalary * $percentage) / 100;
                } else {
                    $amount = (float) ($employeeAllowance->amount ?? 0);
                }

                return [
                    'type_id' => (int) $employeeAllowance->allowance_type_id,
                    'amount' => $amount,
                ];
            });

            $existingAllowanceTypeIds = $allowances->pluck('type_id')->unique()->values();
            $globalAllowances = $globalAllowanceTypes
                ->whereNotIn('id', $existingAllowanceTypeIds)
                ->map(function ($globalType) use ($basicSalary) {
                    $amount = 0.0;
                    if (($globalType->type ?? null) === 'percentage') {
                        $amount = ($basicSalary * (float) ($globalType->percentage ?? 0)) / 100;
                    } else {
                        $amount = (float) ($globalType->default_amount ?? 0);
                    }

                    return [
                        'type_id' => (int) $globalType->id,
                        'amount' => $amount,
                    ];
                })
                ->values();

            $allAllowances = $allowances->concat($globalAllowances);
            $totalAllowances = (float) $allAllowances->sum('amount');
            $grossSalary = $basicSalary + $totalAllowances;

            $deductions = collect($employee->deductions ?? [])->map(function ($employeeDeduction) use ($basicSalary, $grossSalary) {
                $type = $employeeDeduction->deductionType;
                $base = (($type->calculation_base ?? 'basic_salary') === 'gross_salary') ? $grossSalary : $basicSalary;
                $amount = 0.0;

                if (($type->type ?? null) === 'percentage') {
                    $percentage = (float) ($employeeDeduction->percentage ?? $employeeDeduction->amount ?? 0);
                    $amount = ($base * $percentage) / 100;
                } else {
                    $amount = (float) ($employeeDeduction->amount ?? 0);
                }

                return [
                    'type_id' => (int) $employeeDeduction->deduction_type_id,
                    'amount' => $amount,
                ];
            });

            $existingDeductionTypeIds = $deductions->pluck('type_id')->unique()->values();
            $globalDeductions = $globalDeductionTypes
                ->whereNotIn('id', $existingDeductionTypeIds)
                ->map(function ($globalType) use ($basicSalary, $grossSalary) {
                    $base = (($globalType->calculation_base ?? 'basic_salary') === 'gross_salary') ? $grossSalary : $basicSalary;
                    $amount = 0.0;

                    if (($globalType->type ?? null) === 'percentage') {
                        $amount = ($base * (float) ($globalType->percentage ?? 0)) / 100;
                    } else {
                        $amount = (float) ($globalType->default_amount ?? 0);
                    }

                    return [
                        'type_id' => (int) $globalType->id,
                        'amount' => $amount,
                    ];
                })
                ->values();

            $allDeductions = $deductions->concat($globalDeductions);
            $totalDeductions = (float) $allDeductions->sum('amount');
            $netSalary = $grossSalary - $totalDeductions;

            $employee->setAttribute('computed_salary', [
                'basic_salary' => $basicSalary,
                'total_allowances' => $totalAllowances,
                'total_deductions' => $totalDeductions,
                'gross_salary' => $grossSalary,
                'net_salary' => $netSalary,
            ]);

            return $employee;
        });

        return response()->json(['success' => true, 'employees' => $employees]);
    }

    public function storeSalaryStructure(Request $request, $employeeId)
    {
        $validator = Validator::make($request->all(), [
            'basic_salary' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
            'allowances' => 'array',
            'allowances.*.allowance_type_id' => 'required|exists:allowance_types,id',
            'allowances.*.amount' => 'nullable|numeric|min:0',
            'allowances.*.percentage' => 'nullable|numeric|min:0|max:100',
            'deductions' => 'array',
            'deductions.*.deduction_type_id' => 'required|exists:deduction_types,id',
            'deductions.*.amount' => 'nullable|numeric|min:0',
            'deductions.*.percentage' => 'nullable|numeric|min:0|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $manualErrors = [];
        if (is_array($request->allowances)) {
            foreach ($request->allowances as $index => $allowance) {
                $hasAmount = array_key_exists('amount', $allowance) && $allowance['amount'] !== null && $allowance['amount'] !== '';
                $hasPercentage = array_key_exists('percentage', $allowance) && $allowance['percentage'] !== null && $allowance['percentage'] !== '';

                if (!$hasAmount && !$hasPercentage) {
                    $manualErrors["allowances.$index.amount"] = ['Amount or percentage is required.'];
                }
            }
        }
        if (is_array($request->deductions)) {
            foreach ($request->deductions as $index => $deduction) {
                $hasAmount = array_key_exists('amount', $deduction) && $deduction['amount'] !== null && $deduction['amount'] !== '';
                $hasPercentage = array_key_exists('percentage', $deduction) && $deduction['percentage'] !== null && $deduction['percentage'] !== '';

                if (!$hasAmount && !$hasPercentage) {
                    $manualErrors["deductions.$index.amount"] = ['Amount or percentage is required.'];
                }
            }
        }
        if (!empty($manualErrors)) {
            return response()->json(['success' => false, 'errors' => $manualErrors], 422);
        }

        $employee = Employee::findOrFail($employeeId);

        DB::beginTransaction();
        try {
            // Deactivate existing salary structure
            EmployeeSalaryStructure::where('employee_id', $employeeId)
                ->where('is_active', true)
                ->update(['is_active' => false, 'effective_to' => Carbon::parse($request->effective_from)->subDay()]);

            // Create new salary structure
            $salaryStructure = EmployeeSalaryStructure::create([
                'employee_id' => $employeeId,
                'basic_salary' => $request->basic_salary,
                'effective_from' => $request->effective_from,
                'effective_to' => $request->effective_to,
                'is_active' => true,
                'created_by' => Auth::id()
            ]);

            // Remove existing allowances and deductions for this employee
            EmployeeAllowance::where('employee_id', $employeeId)->delete();
            EmployeeDeduction::where('employee_id', $employeeId)->delete();

            // Create allowances
            if ($request->has('allowances') && is_array($request->allowances)) {
                foreach ($request->allowances as $allowance) {
                    EmployeeAllowance::create([
                        'employee_id' => $employeeId,
                        'allowance_type_id' => $allowance['allowance_type_id'],
                        'amount' => $allowance['amount'] ?? null,
                        'percentage' => $allowance['percentage'] ?? null,
                        'effective_from' => $request->effective_from,
                        'effective_to' => $request->effective_to,
                        'is_active' => true,
                        'created_by' => Auth::id()
                    ]);
                }
            }

            // Create deductions
            if ($request->has('deductions') && is_array($request->deductions)) {
                foreach ($request->deductions as $deduction) {
                    EmployeeDeduction::create([
                        'employee_id' => $employeeId,
                        'deduction_type_id' => $deduction['deduction_type_id'],
                        'amount' => $deduction['amount'] ?? null,
                        'percentage' => $deduction['percentage'] ?? null,
                        'effective_from' => $request->effective_from,
                        'effective_to' => $request->effective_to,
                        'is_active' => true,
                        'created_by' => Auth::id()
                    ]);
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'salaryStructure' => $salaryStructure], 201);
        } catch (\Exception $e) {
            DB::rollback();
            return response()->json(['success' => false, 'message' => 'Error creating salary structure: ' . $e->getMessage()], 500);
        }
    }

    public function updateSalaryStructure(Request $request, $employeeId)
    {
        $validator = Validator::make($request->all(), [
            'basic_salary' => 'required|numeric|min:0',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
            'allowances' => 'array',
            'allowances.*.allowance_type_id' => 'required|exists:allowance_types,id',
            'allowances.*.amount' => 'nullable|numeric|min:0',
            'allowances.*.percentage' => 'nullable|numeric|min:0|max:100',
            'deductions' => 'array',
            'deductions.*.deduction_type_id' => 'required|exists:deduction_types,id',
            'deductions.*.amount' => 'nullable|numeric|min:0',
            'deductions.*.percentage' => 'nullable|numeric|min:0|max:100'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $manualErrors = [];
        if (is_array($request->allowances)) {
            foreach ($request->allowances as $index => $allowance) {
                $hasAmount = array_key_exists('amount', $allowance) && $allowance['amount'] !== null && $allowance['amount'] !== '';
                $hasPercentage = array_key_exists('percentage', $allowance) && $allowance['percentage'] !== null && $allowance['percentage'] !== '';

                if (!$hasAmount && !$hasPercentage) {
                    $manualErrors["allowances.$index.amount"] = ['Amount or percentage is required.'];
                }
            }
        }
        if (is_array($request->deductions)) {
            foreach ($request->deductions as $index => $deduction) {
                $hasAmount = array_key_exists('amount', $deduction) && $deduction['amount'] !== null && $deduction['amount'] !== '';
                $hasPercentage = array_key_exists('percentage', $deduction) && $deduction['percentage'] !== null && $deduction['percentage'] !== '';

                if (!$hasAmount && !$hasPercentage) {
                    $manualErrors["deductions.$index.amount"] = ['Amount or percentage is required.'];
                }
            }
        }
        if (!empty($manualErrors)) {
            return response()->json(['success' => false, 'errors' => $manualErrors], 422);
        }

        $salaryStructure = EmployeeSalaryStructure::where('employee_id', $employeeId)
            ->where('is_active', true)
            ->firstOrFail();

        DB::beginTransaction();
        try {
            $salaryStructure->update([
                'basic_salary' => $request->basic_salary,
                'effective_from' => $request->effective_from,
                'effective_to' => $request->effective_to,
                'updated_by' => Auth::id()
            ]);

            EmployeeAllowance::where('employee_id', $employeeId)->delete();
            EmployeeDeduction::where('employee_id', $employeeId)->delete();

            if ($request->has('allowances') && is_array($request->allowances)) {
                foreach ($request->allowances as $allowance) {
                    EmployeeAllowance::create([
                        'employee_id' => $employeeId,
                        'allowance_type_id' => $allowance['allowance_type_id'],
                        'amount' => $allowance['amount'] ?? null,
                        'percentage' => $allowance['percentage'] ?? null,
                        'effective_from' => $request->effective_from,
                        'effective_to' => $request->effective_to,
                        'is_active' => true,
                    ]);
                }
            }

            if ($request->has('deductions') && is_array($request->deductions)) {
                foreach ($request->deductions as $deduction) {
                    EmployeeDeduction::create([
                        'employee_id' => $employeeId,
                        'deduction_type_id' => $deduction['deduction_type_id'],
                        'amount' => $deduction['amount'] ?? null,
                        'percentage' => $deduction['percentage'] ?? null,
                        'effective_from' => $request->effective_from,
                        'effective_to' => $request->effective_to,
                        'is_active' => true,
                    ]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error updating salary structure: ' . $e->getMessage()], 500);
        }

        return response()->json(['success' => true, 'salaryStructure' => $salaryStructure]);
    }

    public function getEmployeeSalaryDetails($employeeId)
    {
        $employee = Employee::with([
            'salaryStructure',
            'allowances.allowanceType',
            'deductions.deductionType',
            'department',
            'activeLoans',
            'activeAdvances'
        ])->findOrFail($employeeId);

        return response()->json(['success' => true, 'employee' => $employee]);
    }

    // Employee Allowances Management
    public function storeEmployeeAllowance(Request $request, $employeeId)
    {
        $validator = Validator::make($request->all(), [
            'allowance_type_id' => 'required|exists:allowance_types,id',
            'amount' => 'required_without:percentage|nullable|numeric|min:0',
            'percentage' => 'required_without:amount|nullable|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $allowance = EmployeeAllowance::create([
            'employee_id' => $employeeId,
            'allowance_type_id' => $request->allowance_type_id,
            'amount' => $request->amount,
            'percentage' => $request->percentage,
            'effective_from' => $request->effective_from,
            'effective_to' => $request->effective_to,
            'is_active' => true
        ]);

        $allowance->load('allowanceType');
        return response()->json(['success' => true, 'allowance' => $allowance], 201);
    }

    public function updateEmployeeAllowance(Request $request, $id)
    {
        $allowance = EmployeeAllowance::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'amount' => 'required_without:percentage|nullable|numeric|min:0',
            'percentage' => 'required_without:amount|nullable|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $allowance->update($request->all());
        $allowance->load('allowanceType');

        return response()->json(['success' => true, 'allowance' => $allowance]);
    }

    public function deleteEmployeeAllowance($id)
    {
        $allowance = EmployeeAllowance::findOrFail($id);
        $allowance->update(['is_active' => false, 'effective_to' => now()]);

        return response()->json(['success' => true, 'message' => 'Employee allowance deactivated successfully']);
    }

    // Employee Deductions Management
    public function storeEmployeeDeduction(Request $request, $employeeId)
    {
        $validator = Validator::make($request->all(), [
            'deduction_type_id' => 'required|exists:deduction_types,id',
            'amount' => 'required_without:percentage|nullable|numeric|min:0',
            'percentage' => 'required_without:amount|nullable|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $deduction = EmployeeDeduction::create([
            'employee_id' => $employeeId,
            'deduction_type_id' => $request->deduction_type_id,
            'amount' => $request->amount,
            'percentage' => $request->percentage,
            'effective_from' => $request->effective_from,
            'effective_to' => $request->effective_to,
            'is_active' => true
        ]);

        $deduction->load('deductionType');
        return response()->json(['success' => true, 'deduction' => $deduction], 201);
    }

    public function updateEmployeeDeduction(Request $request, $id)
    {
        $deduction = EmployeeDeduction::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'amount' => 'required_without:percentage|nullable|numeric|min:0',
            'percentage' => 'required_without:amount|nullable|numeric|min:0|max:100',
            'effective_from' => 'required|date',
            'effective_to' => 'nullable|date|after:effective_from',
            'is_active' => 'boolean'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $deduction->update($request->all());
        $deduction->load('deductionType');

        return response()->json(['success' => true, 'deduction' => $deduction]);
    }

    public function deleteEmployeeDeduction($id)
    {
        $deduction = EmployeeDeduction::findOrFail($id);
        $deduction->update(['is_active' => false, 'effective_to' => now()]);

        return response()->json(['success' => true, 'message' => 'Employee deduction deactivated successfully']);
    }

    // Payroll Periods Management
    public function getPayrollPeriods(Request $request)
    {
        $periods = PayrollPeriod::orderBy('start_date', 'desc')
            ->paginate($request->get('per_page', 15))
            ->through(function ($period) {
                $period->start_date = $period->start_date ? Carbon::parse($period->start_date)->format('d/m/Y') : '-';
                $period->end_date = $period->end_date ? Carbon::parse($period->end_date)->format('d/m/Y') : '-';
                $period->pay_date = $period->pay_date ? Carbon::parse($period->pay_date)->format('d/m/Y') : null;
                return $period;
            });

        return response()->json(['success' => true, 'periods' => $periods]);
    }

    public function storePayrollPeriod(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'period_name' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'pay_date' => 'nullable|date|after_or_equal:end_date',
            'status' => 'nullable|in:draft,active,processing,completed,paid',
            'description' => 'nullable|string|max:1000'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        // Check for overlapping periods
        $overlapping = PayrollPeriod::where(function ($query) use ($request) {
            $query
                ->whereBetween('start_date', [$request->start_date, $request->end_date])
                ->orWhereBetween('end_date', [$request->start_date, $request->end_date])
                ->orWhere(function ($q) use ($request) {
                    $q
                        ->where('start_date', '<=', $request->start_date)
                        ->where('end_date', '>=', $request->end_date);
                });
        })->exists();

        if ($overlapping) {
            return response()->json([
                'success' => false,
                'message' => 'Payroll period overlaps with existing period'
            ], 422);
        }

        $periodName = $request->period_name ?: PayrollPeriod::generatePeriodName($request->start_date, $request->end_date);

        $period = PayrollPeriod::create([
            'period_name' => $periodName,
            'start_date' => $request->start_date,
            'end_date' => $request->end_date,
            'pay_date' => $request->pay_date,
            'status' => $request->status ?: 'draft',
            'description' => $request->description,
            'created_by' => Auth::id()
        ]);

        return response()->json(['success' => true, 'period' => $period], 201);
    }

    public function updatePayrollPeriod(Request $request, $id)
    {
        $period = PayrollPeriod::findOrFail($id);

        if (!$period->isEditable()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot edit processed payroll period'
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'period_name' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'pay_date' => 'nullable|date|after_or_equal:end_date'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $period->update($request->all());
        return response()->json(['success' => true, 'period' => $period]);
    }

    public function deletePayrollPeriod($id)
    {
        $period = PayrollPeriod::findOrFail($id);

        if ($period->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete paid payroll period'
            ], 422);
        }

        $period->delete();
        return response()->json(['success' => true, 'message' => 'Payroll period deleted successfully']);
    }

    public function markPeriodAsPaid($id)
    {
        $period = PayrollPeriod::findOrFail($id);

        // Validate period can be marked as paid
        if ($period->status !== 'completed') {
            return response()->json([
                'success' => false,
                'message' => 'Only completed periods can be marked as paid'
            ], 422);
        }

        // Check if all payslips are approved
        $unapprovedPayslips = $period->payslips()->where('status', '!=', 'approved')->count();
        if ($unapprovedPayslips > 0) {
            return response()->json([
                'success' => false,
                'message' => "Cannot mark as paid. {$unapprovedPayslips} payslips are not yet approved."
            ], 422);
        }

        DB::beginTransaction();

        try {
            // Update Loan and Advance Ledgers
            $payslips = $period->payslips()->with(['deductions.employeeLoan', 'deductions.employeeAdvance'])->get();

            foreach ($payslips as $payslip) {
                foreach ($payslip->deductions as $deduction) {
                    // Handle Loan Repayment
                    if ($deduction->employee_loan_id && $deduction->employeeLoan) {
                        $loan = $deduction->employeeLoan;
                        $amount = $deduction->amount;

                        $loan->remaining_amount -= $amount;
                        $loan->total_paid += $amount;
                        $loan->installments_paid += 1;

                        // Set next deduction date to same day next month
                        if ($loan->next_deduction_date) {
                            $loan->next_deduction_date = Carbon::parse($loan->next_deduction_date)->addMonth();
                        }

                        // Complete loan if fully paid
                        if ($loan->remaining_amount <= 0) {
                            $loan->status = 'completed';
                            $loan->remaining_amount = 0;  // ensure non-negative
                            $loan->next_deduction_date = null;
                        }

                        $loan->save();
                    }

                    // Handle Advance Repayment
                    if ($deduction->employee_advance_id && $deduction->employeeAdvance) {
                        $advance = $deduction->employeeAdvance;
                        $amount = $deduction->amount;

                        $advance->remaining_amount -= $amount;
                        // Advance model doesn't track total_paid or installments_paid explicitly in the shown code,
                        // but updating remaining_amount is critical.

                        if ($advance->remaining_amount <= 0) {
                            $advance->status = 'paid';  // 'paid' in Advance indicates completion
                            $advance->remaining_amount = 0;
                        }

                        $advance->save();
                    }
                }
            }

            foreach ($payslips as $payslip) {
                $this->settleEmployeeCtsOrdersForPayslip($payslip, $period);
            }

            // Mark period as paid
            $period->update(['status' => 'paid']);

            // Optionally mark all payslips as paid too
            $period->payslips()->update(['status' => 'paid']);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Period marked as paid successfully',
                'period' => $period
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error marking period as paid: ' . $e->getMessage()
            ], 500);
        }
    }

    // Payroll Processing
    public function processPayroll(Request $request, $periodId)
    {
        $validator = Validator::make($request->all(), [
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:employees,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $employeeIds = $request->get('employee_ids');

        // If a token is provided, resolve employee ids from cache
        if ($request->has('token')) {
            $session = Cache::get('payroll_preview_' . $request->get('token'));
            if ($session && isset($session['employee_ids'])) {
                $employeeIds = $session['employee_ids'];
            }
        }

        $result = $this->payrollService->processPayrollForPeriod($periodId, $employeeIds);

        return response()->json($result);
    }

    /**
     * Create a short-lived preview session and return a token.
     */
    public function createPreviewSession(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'period_id' => 'nullable|exists:payroll_periods,id',
            'employee_ids' => 'nullable|array',
            'employee_ids.*' => 'exists:employees,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $token = Str::random(40);
        $payload = [
            'period_id' => $request->get('period_id'),
            'employee_ids' => $request->get('employee_ids', [])
        ];

        Cache::put('payroll_preview_' . $token, $payload, now()->addMinutes(30));

        return response()->json(['success' => true, 'token' => $token]);
    }

    public function previewPayroll(Request $request, $periodId)
    {
        $period = PayrollPeriod::findOrFail($periodId);

        $employeeIds = $request->get('employee_ids');

        // If a preview session token is provided, try to read employee_ids from cache
        if ($request->has('token')) {
            $session = Cache::get('payroll_preview_' . $request->get('token'));
            if ($session && isset($session['employee_ids'])) {
                $employeeIds = $session['employee_ids'];
            }

            // If session contains period_id and route param is empty, use it
            if ($session && empty($periodId) && isset($session['period_id'])) {
                $periodId = $session['period_id'];
                $period = PayrollPeriod::findOrFail($periodId);
            }
        }

        $query = Employee::with(['salaryStructure', 'allowances.allowanceType', 'deductions.deductionType', 'department', 'activeLoans', 'activeAdvances']);

        if ($employeeIds) {
            $query->whereIn('id', $employeeIds);
        }

        $employees = $query->get();
        $preview = [];
        $globalAllowanceTypes = AllowanceType::where('is_active', true)->where('is_global', true)->get();
        $globalDeductionTypes = DeductionType::where('is_active', true)->where('is_global', true)->get();

        // Batch fetch CTS orders for all employees in the preview to avoid per-employee queries
        $ordersByEmployee = collect();
        try {
            if ($employees->count() > 0) {
                $employeeIdsList = $employees->pluck('id')->toArray();
                $periodStart = Carbon::parse($period->start_date)->startOfDay();
                $periodEnd = Carbon::parse($period->end_date)->endOfDay();

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
                                    ->where('invoice_type', 'food_order')
                                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.order_id')) = CAST(orders.id AS CHAR)")
                                    ->where('cts_amount', '>', 0);
                            });
                    })
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
                    ->groupBy('employee_id');

                $ordersByEmployee = $ctsOrders;
            }
        } catch (\Exception $ex) {
            $ordersByEmployee = collect();
        }

        foreach ($employees as $employee) {
            if (!$employee->salaryStructure)
                continue;

            // Calculate preview data (simplified version)
            $basicSalary = $employee->salaryStructure->basic_salary;
            $allowancesBreakdown = [];
            $totalAllowances = 0;

            foreach ($employee->allowances as $employeeAllowance) {
                $amount = $employeeAllowance->calculateAmount($basicSalary);
                $allowancesBreakdown[] = [
                    'type_id' => $employeeAllowance->allowance_type_id,
                    'name' => $employeeAllowance->allowanceType->name ?? 'Allowance',
                    'amount' => $amount,
                    'source' => 'employee'
                ];
                $totalAllowances += $amount;
            }

            $existingAllowanceTypeIds = $employee->allowances->pluck('allowance_type_id')->toArray();
            foreach ($globalAllowanceTypes as $globalType) {
                if (in_array($globalType->id, $existingAllowanceTypeIds)) {
                    continue;
                }

                $amount = 0;
                if ($globalType->type === 'fixed') {
                    $amount = $globalType->default_amount ?? 0;
                } elseif ($globalType->type === 'percentage') {
                    $amount = ($basicSalary * ($globalType->percentage ?? 0)) / 100;
                }

                if ($amount > 0) {
                    $allowancesBreakdown[] = [
                        'type_id' => $globalType->id,
                        'name' => $globalType->name . ' (Global)',
                        'amount' => $amount,
                        'source' => 'global'
                    ];
                    $totalAllowances += $amount;
                }
            }

            $grossSalary = $basicSalary + $totalAllowances;

            $deductionsBreakdown = [];
            $totalDeductions = 0;

            foreach ($employee->deductions as $employeeDeduction) {
                $amount = $employeeDeduction->calculateAmount($basicSalary, $grossSalary);
                $deductionsBreakdown[] = [
                    'type_id' => $employeeDeduction->deduction_type_id,
                    'name' => $employeeDeduction->deductionType->name ?? 'Deduction',
                    'amount' => $amount,
                    'source' => 'employee'
                ];
                $totalDeductions += $amount;
            }

            $existingDeductionTypeIds = $employee->deductions->pluck('deduction_type_id')->toArray();
            foreach ($globalDeductionTypes as $globalType) {
                if (in_array($globalType->id, $existingDeductionTypeIds)) {
                    continue;
                }

                $calculationBase = ($globalType->calculation_base ?? 'basic_salary') === 'basic_salary'
                    ? $basicSalary
                    : $grossSalary;

                $amount = 0;
                if ($globalType->type === 'fixed') {
                    $amount = $globalType->default_amount ?? 0;
                } elseif ($globalType->type === 'percentage') {
                    $amount = ($calculationBase * ($globalType->percentage ?? 0)) / 100;
                }

                if ($amount > 0) {
                    $deductionsBreakdown[] = [
                        'type_id' => $globalType->id,
                        'name' => $globalType->name . ' (Global)',
                        'amount' => $amount,
                        'source' => 'global'
                    ];
                    $totalDeductions += $amount;
                }
            }

            // Calculate Loan Deductions
            $loanDeductions = [];
            $totalLoanDeductions = 0;
            $periodEnd = Carbon::parse($period->end_date);

            if ($employee->activeLoans) {
                foreach ($employee->activeLoans as $loan) {
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

            // Calculate Advance Deductions (Simplified)
            $advanceDeductions = [];
            $totalAdvanceDeductions = 0;
            if ($employee->activeAdvances) {
                foreach ($employee->activeAdvances as $advance) {
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

            // CTS Orders (Using the batch fetched collection)
            $employeeOrders = $ordersByEmployee->get($employee->id, collect());
            $ctsDeductions = $employeeOrders->map(function ($o) {
                return [
                    'id' => $o->id,
                    'paid_at' => $o->paid_at ?? null,
                    'amount' => max(0, (float) ($o->invoice_cts_amount ?? 0)),
                    'name' => 'CTS Order #' . $o->id
                ];
            });
            $totalCtsDeductions = $ctsDeductions->sum('amount');

            $totalDeductions += $totalLoanDeductions + $totalAdvanceDeductions + $totalCtsDeductions;
            $netSalary = $basicSalary + $totalAllowances - $totalDeductions;

            $preview[] = [
                'employee_id' => $employee->id,
                'employee_name' => $employee->name,
                'employee_number' => $employee->employee_id,
                'department' => $employee->department->name ?? 'N/A',
                'basic_salary' => $basicSalary,
                'total_allowances' => $totalAllowances,  // CTS is not an allowance
                'total_deductions' => $totalDeductions,
                'total_order_deductions' => $ctsDeductions->sum('amount'),  // Explicit separate field
                'gross_salary' => $grossSalary,  // Explicitly send gross
                'net_salary' => $netSalary,
                'allowances' => $employee->allowances,
                'allowances_breakdown' => $allowancesBreakdown,
                'deductions' => $employee->deductions,
                'deductions_breakdown' => $deductionsBreakdown,
                'loan_deductions' => $loanDeductions,
                'advance_deductions' => $advanceDeductions,
                'order_deductions' => $ctsDeductions->values()  // Send as details
            ];
        }

        // Support pagination for preview results
        $page = (int) $request->get('page', 1);
        $perPage = (int) $request->get('per_page', 15);

        $collection = collect($preview);
        $slice = $collection->forPage($page, $perPage)->values();

        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $slice,
            $collection->count(),
            $perPage,
            $page,
            ['path' => url()->current(), 'query' => request()->query()]
        );

        return response()->json(['success' => true, 'preview' => $paginator]);
    }

    // Salary Sheet Management
    // Salary Sheet Management
    public function getSalarySheetData(Request $request)
    {
        $month = $request->get('month');  // YYYY-MM
        if (!$month) {
            return response()->json(['success' => false, 'message' => 'Month is required']);
        }

        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $endDate = Carbon::createFromFormat('Y-m', $month)->endOfMonth();

        // 1. Find or Create Period
        $period = PayrollPeriod::firstOrCreate(
            [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d')
            ],
            [
                'period_name' => PayrollPeriod::generatePeriodName($startDate, $endDate),
                'status' => 'draft',
                'created_by' => Auth::id()
            ]
        );

        // 2. Fetch existing payslips or Generate Drafts
        $payslipsCount = Payslip::where('payroll_period_id', $period->id)->count();

        if ($payslipsCount === 0) {
            // Generate Drafts for ALL active employees
            $activeEmployees = Employee::pluck('id');
            $this->payrollService->processPayrollForPeriod($period->id, $activeEmployees->toArray());
        }

        // 3. Prepare Query for Grid
        $query = Payslip::with(['allowances', 'deductions', 'employee'])  // Added employee relation for CNIC/Location
            ->where('payroll_period_id', $period->id);

        // Apply Filters
        if ($request->get('employee_type') && $request->get('employee_type') !== 'all') {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('employment_type', $request->get('employee_type'));
            });
        }

        if ($request->get('designation') && $request->get('designation') !== 'all') {
            $query->where('designation', $request->get('designation'));
        }

        if ($request->get('location') && $request->get('location') !== 'all') {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('cur_city', $request->get('location'));  // Mapping Location to Current City
            });
        }

        if ($request->get('department') && $request->get('department') !== 'all') {
            $query->where('department', $request->get('department'));
        }

        $payslips = $query->get();

        // 4. Meta Data for Columns
        $allowanceHeaders = AllowanceType::where('is_active', true)->select('id', 'name')->get();
        $deductionHeaders = DeductionType::where('is_active', true)->select('id', 'name')->get();

        // 5. Meta Data for Filters
        // We fetch distinct values from Payslip (snapshot) or Employee (current) depending on need.
        // For consistency in filtering, we'll try to get distinct values relevant to the current period's data.
        $designations = Payslip::where('payroll_period_id', $period->id)->distinct()->pluck('designation')->filter()->values();

        // Locations (Cities) - Fetched from Employees associated with these payslips
        $locations = Employee::whereIn('id', $payslips->pluck('employee_id')->toArray())
            ->distinct()
            ->pluck('cur_city')
            ->filter()
            ->values();

        // Employee Types
        $employeeTypes = Employee::whereIn('id', $payslips->pluck('employee_id')->toArray())
            ->distinct()
            ->pluck('employment_type')
            ->filter()
            ->values();

        return response()->json([
            'success' => true,
            'payslips' => $payslips,
            'allowance_headers' => $allowanceHeaders,
            'deduction_headers' => $deductionHeaders,
            'designations' => $designations,
            'locations' => $locations,
            'employee_types' => $employeeTypes,
            'period_status' => $period->status
        ]);
    }

    public function updateSalarySheet(Request $request)
    {
        $payslipsData = $request->get('payslips');

        DB::beginTransaction();
        try {
            foreach ($payslipsData as $data) {
                $payslip = Payslip::find($data['id']);
                if (!$payslip)
                    continue;

                // Update Allowances
                $totalAllowances = 0;
                if (isset($data['allowances'])) {
                    foreach ($data['allowances'] as $allowanceData) {
                        $pa = \App\Models\PayslipAllowance::where('payslip_id', $payslip->id)
                            ->where('allowance_type_id', $allowanceData['allowance_type_id'])
                            ->first();

                        $amount = (float) $allowanceData['amount'];

                        if ($pa) {
                            $pa->amount = $amount;
                            $pa->save();
                        } else {
                            // Create if didn't exist (e.g. was 0 or not applicable initially but added in grid)
                            // Need allowance name if creating fresh
                            $type = AllowanceType::find($allowanceData['allowance_type_id']);
                            if ($type) {
                                \App\Models\PayslipAllowance::create([
                                    'payslip_id' => $payslip->id,
                                    'allowance_type_id' => $type->id,
                                    'allowance_name' => $type->name,
                                    'amount' => $amount,
                                    'is_taxable' => $type->is_taxable
                                ]);
                            }
                        }
                        $totalAllowances += $amount;
                    }
                }

                // Update Deductions
                $totalDeductions = 0;
                if (isset($data['deductions'])) {
                    foreach ($data['deductions'] as $deductionData) {
                        $pd = \App\Models\PayslipDeduction::where('payslip_id', $payslip->id)
                            ->where('deduction_type_id', $deductionData['deduction_type_id'])
                            ->first();

                        $amount = (float) $deductionData['amount'];

                        if ($pd) {
                            $pd->amount = $amount;
                            $pd->save();
                        } else {
                            $type = DeductionType::find($deductionData['deduction_type_id']);
                            if ($type) {
                                \App\Models\PayslipDeduction::create([
                                    'payslip_id' => $payslip->id,
                                    'deduction_type_id' => $type->id,
                                    'deduction_name' => $type->name,
                                    'amount' => $amount
                                    // Special fields like advance_id/loan_id omitted for manual overrides
                                ]);
                            }
                        }
                        $totalDeductions += $amount;
                    }
                }

                // Update Payslip Totals
                $payslip->basic_salary = $data['basic_salary'] ?? $payslip->basic_salary;  // If basic editable
                $payslip->total_allowances = $totalAllowances;
                $payslip->gross_salary = $payslip->basic_salary + $totalAllowances;
                $payslip->total_deductions = $totalDeductions;
                $payslip->net_salary = $payslip->gross_salary - $totalDeductions;
                $payslip->save();
            }
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Salary sheet updated successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Error updating salary sheet: ' . $e->getMessage()], 500);
        }
    }

    // Payslips Management
    public function getPeriodPayslips(Request $request, $periodId)
    {
        $query = Payslip::with([
            'employee:id,name,employee_id,department_id',
            'employee.department:id,name',
            'employee.user:id,name'
        ])->where('payroll_period_id', $periodId);

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->whereHas('employee', function ($q) use ($searchTerm) {
                $q
                    ->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('employee_id', 'like', "%{$searchTerm}%")
                    ->orWhereHas('user', function ($userQuery) use ($searchTerm) {
                        $userQuery->where('name', 'like', "%{$searchTerm}%");
                    });
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $payslips = $query->paginate($request->get('per_page', 15));

        // Attach CTS order deductions to each payslip (batch fetch) so front-end can display them
        try {
            $period = PayrollPeriod::find($periodId);
            if ($period) {
                $periodStart = Carbon::parse($period->start_date)->startOfDay();
                $periodEnd = Carbon::parse($period->end_date)->endOfDay();

                $employeeIds = collect($payslips->items())->pluck('employee_id')->unique()->filter()->values()->toArray();
                if (!empty($employeeIds)) {
                    $ctsOrders = Order::whereIn('employee_id', $employeeIds)
                        ->whereNull('deducted_in_payslip_id')
                        ->whereBetween('paid_at', [$periodStart, $periodEnd])
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
                        ->groupBy('employee_id');

                    // Attach per-payslip
                    $payslips->getCollection()->transform(function ($payslip) use ($ctsOrders) {
                        $empOrders = $ctsOrders->get($payslip->employee_id, collect());
                        $payslip->order_deductions = $empOrders->map(function ($o) {
                            return [
                                'id' => $o->id,
                                'paid_at' => $o->paid_at ? (string) $o->paid_at : null,
                                'amount' => max(0, (float) ($o->invoice_cts_amount ?? 0)),
                                'note' => $o->payment_note ?? $o->remark ?? null,
                                'deducted_at' => $o->deducted_at ? (string) $o->deducted_at : null
                            ];
                        })->values();
                        $payslip->total_order_deductions = (float) collect($payslip->order_deductions)->sum('amount');
                        return $payslip;
                    });
                }
            }
        } catch (\Exception $e) {
            // fail silently - don't break the API if orders lookup fails
        }

        return response()->json(['success' => true, 'payslips' => $payslips]);
    }

    public function getPayslip($payslipId)
    {
        $payslip = Payslip::with([
            'employee',
            'payrollPeriod',
            'allowances.allowanceType',
            'deductions.deductionType'
        ])->findOrFail($payslipId);

        // Attach CTS order deductions for this payslip (employee + period)
        try {
            $period = $payslip->payrollPeriod;
            if ($period && $payslip->employee_id) {
                $periodStart = Carbon::parse($period->start_date)->startOfDay();
                $periodEnd = Carbon::parse($period->end_date)->endOfDay();

                $ctsOrders = Order::where('employee_id', $payslip->employee_id)
                    ->whereNull('deducted_in_payslip_id')
                    ->whereBetween('paid_at', [$periodStart, $periodEnd])
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
            } else {
                $payslip->order_deductions = collect();
                $payslip->total_order_deductions = 0;
            }
        } catch (\Exception $e) {
            $payslip->order_deductions = collect();
            $payslip->total_order_deductions = 0;
        }

        return response()->json(['success' => true, 'payslip' => $payslip]);
    }

    public function approvePayslip($payslipId)
    {
        $payslip = Payslip::findOrFail($payslipId);

        if (!$payslip->canBeApproved()) {
            return response()->json([
                'success' => false,
                'message' => 'Payslip cannot be approved in current status'
            ], 422);
        }

        $payslip->approve();
        return response()->json(['success' => true, 'payslip' => $payslip]);
    }

    public function rejectPayslip($payslipId)
    {
        $payslip = Payslip::findOrFail($payslipId);

        if ($payslip->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reject a paid payslip'
            ], 422);
        }

        $payslip->update(['status' => 'rejected']);
        return response()->json(['success' => true, 'payslip' => $payslip]);
    }

    public function revertPayslipToDraft($payslipId)
    {
        $payslip = Payslip::findOrFail($payslipId);

        if ($payslip->status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot revert a paid payslip'
            ], 422);
        }

        if ($payslip->status === 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Payslip is already in draft status'
            ], 422);
        }

        $payslip->update(['status' => 'draft']);
        return response()->json(['success' => true, 'payslip' => $payslip]);
    }

    public function bulkApprovePayslips(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payslip_ids' => 'required|array',
            'payslip_ids.*' => 'exists:payslips,id'
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        $approved = 0;
        foreach ($request->payslip_ids as $payslipId) {
            $payslip = Payslip::find($payslipId);
            if ($payslip && $payslip->canBeApproved()) {
                $payslip->approve();
                $approved++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "{$approved} payslips approved successfully"
        ]);
    }

    public function markPayslipAsPaid($payslipId)
    {
        $payslip = Payslip::findOrFail($payslipId);

        if (!$payslip->canBePaid()) {
            return response()->json([
                'success' => false,
                'message' => 'Payslip must be approved before marking as paid'
            ], 422);
        }

        $period = PayrollPeriod::find($payslip->payroll_period_id);
        if ($period) {
            DB::beginTransaction();
            try {
                $this->settleEmployeeCtsOrdersForPayslip($payslip, $period);
                $payslip->markAsPaid();
                DB::commit();
            } catch (\Exception $e) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Error marking payslip as paid: ' . $e->getMessage()
                ], 500);
            }
            return response()->json(['success' => true, 'payslip' => $payslip->fresh()]);
        }

        $payslip->markAsPaid();
        return response()->json(['success' => true, 'payslip' => $payslip]);
    }

    private function settleEmployeeCtsOrdersForPayslip(Payslip $payslip, PayrollPeriod $period): void
    {
        $orders = Order::where('employee_id', $payslip->employee_id)
            ->where('deducted_in_payslip_id', $payslip->id)
            ->get(['id']);

        if ($orders->isEmpty()) {
            return;
        }

        $allocations = [];
        $totalReceiptAmount = 0;
        $orderIds = [];

        foreach ($orders as $order) {
            $invoice = FinancialInvoice::with('items')
                ->where('invoice_type', 'food_order')
                ->whereJsonContains('data', ['order_id' => $order->id])
                ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                ->orderByDesc('id')
                ->first();

            if (!$invoice) {
                continue;
            }

            $ctsAmount = (float) ($invoice->cts_amount ?? ($invoice->data['cts_amount'] ?? 0));
            if ($ctsAmount <= 0) {
                continue;
            }

            $paidCredits = (float) Transaction::where('invoice_id', $invoice->id)
                ->where('type', 'credit')
                ->sum('amount');

            $remaining = max(0, (float) ($invoice->total_price ?? 0) - $paidCredits);
            if ($remaining <= 0) {
                continue;
            }

            $applyAmount = min($ctsAmount, $remaining);
            if ($applyAmount <= 0) {
                continue;
            }

            $invoiceItem = $invoice->items->first();
            if (!$invoiceItem) {
                continue;
            }

            $allocations[] = [
                'invoice_id' => $invoice->id,
                'invoice_item_id' => $invoiceItem->id,
                'amount' => $applyAmount,
            ];
            $totalReceiptAmount += $applyAmount;
            $orderIds[] = $order->id;
        }

        if ($totalReceiptAmount <= 0 || empty($allocations)) {
            return;
        }

        $receipt = FinancialReceipt::create([
            'receipt_no' => 'REC-' . time() . '-P' . $period->id . '-E' . $payslip->employee_id,
            'payer_type' => Employee::class,
            'payer_id' => $payslip->employee_id,
            'employee_id' => $payslip->employee_id,
            'amount' => $totalReceiptAmount,
            'payment_method' => 'cts',
            'payment_details' => json_encode([
                'payroll_period_id' => $period->id,
                'payslip_id' => $payslip->id,
                'order_ids' => $orderIds,
            ]),
            'receipt_date' => now(),
            'remarks' => 'CTS Settlement via Payroll',
            'created_by' => Auth::id(),
        ]);

        foreach ($allocations as $allocation) {
            TransactionRelation::create([
                'invoice_id' => $allocation['invoice_id'],
                'receipt_id' => $receipt->id,
                'amount' => $allocation['amount'],
                'created_by' => Auth::id(),
            ]);

            Transaction::create([
                'type' => 'credit',
                'amount' => $allocation['amount'],
                'date' => now(),
                'description' => "CTS Settlement via Payroll (Payslip #{$payslip->id})",
                'payable_type' => Employee::class,
                'payable_id' => $payslip->employee_id,
                'reference_type' => FinancialInvoiceItem::class,
                'reference_id' => $allocation['invoice_item_id'],
                'invoice_id' => $allocation['invoice_id'],
                'receipt_id' => $receipt->id,
                'created_by' => Auth::id(),
            ]);
        }
    }

    // Reports
    public function getSummaryReport($periodId)
    {
        $period = PayrollPeriod::findOrFail($periodId);

        // Get payslips for this period
        $payslips = Payslip::with(['employee', 'employee.department'])
            ->where('payroll_period_id', $periodId)
            ->get();

        // Calculate summary data
        $summary = [
            'total_employees' => $payslips->count(),
            'total_gross_salary' => $payslips->sum('gross_salary'),
            'total_deductions' => $payslips->sum('total_deductions'),
            'total_net_salary' => $payslips->sum('net_salary'),
            'total_allowances' => $payslips->sum('total_allowances'),
            'department_breakdown' => $this->getDepartmentBreakdown($payslips)
        ];

        return response()->json(['success' => true, 'report' => $summary]);
    }

    private function getDepartmentBreakdown($payslips)
    {
        $breakdown = [];

        foreach ($payslips as $payslip) {
            $deptName = $payslip->employee->department->name ?? 'No Department';

            if (!isset($breakdown[$deptName])) {
                $breakdown[$deptName] = [
                    'employee_count' => 0,
                    'total_gross_salary' => 0,
                    'total_deductions' => 0,
                    'total_net_salary' => 0,
                    'total_allowances' => 0
                ];
            }

            $breakdown[$deptName]['employee_count']++;
            $breakdown[$deptName]['total_gross_salary'] += $payslip->gross_salary ?? 0;
            $breakdown[$deptName]['total_deductions'] += $payslip->total_deductions ?? 0;
            $breakdown[$deptName]['total_net_salary'] += $payslip->net_salary ?? 0;
            $breakdown[$deptName]['total_allowances'] += $payslip->total_allowances ?? 0;
        }

        return $breakdown;
    }

    public function getDetailedReport($periodId)
    {
        $period = PayrollPeriod::findOrFail($periodId);

        $payslips = Payslip::with([
            'employee:id,name,employee_id,department_id',
            'employee.department:id,name',
            'employee.user:id,name',
            'allowances.allowanceType:id,name',
            'deductions.deductionType:id,name'
        ])->where('payroll_period_id', $periodId)->get();

        // Calculate totals for the report
        $totals = [
            'total_employees' => $payslips->count(),
            'total_gross_salary' => $payslips->sum('gross_salary'),
            'total_deductions' => $payslips->sum('total_deductions'),
            'total_net_salary' => $payslips->sum('net_salary'),
            'total_allowances' => $payslips->sum('total_allowances'),
        ];

        return response()->json([
            'success' => true,
            'report' => [
                'period' => $period,
                'payslips' => $payslips,
                'totals' => $totals
            ]
        ]);
    }

    public function getDepartmentWiseReport($periodId)
    {
        $payslips = Payslip::where('payroll_period_id', $periodId)->get();
        $departmentWise = $payslips->groupBy('department')->map(function ($departmentPayslips) {
            return [
                'employee_count' => $departmentPayslips->count(),
                'total_basic_salary' => $departmentPayslips->sum('basic_salary'),
                'total_allowances' => $departmentPayslips->sum('total_allowances'),
                'total_deductions' => $departmentPayslips->sum('total_deductions'),
                'total_gross_salary' => $departmentPayslips->sum('gross_salary'),
                'total_net_salary' => $departmentPayslips->sum('net_salary')
            ];
        });

        return response()->json(['success' => true, 'departmentWise' => $departmentWise]);
    }

    public function getEmployeePayrollHistory($employeeId)
    {
        $payslips = Payslip::with('payrollPeriod')
            ->where('employee_id', $employeeId)
            ->orderBy('created_at', 'desc')
            ->paginate(12);

        return response()->json(['success' => true, 'payslips' => $payslips]);
    }

    // Dashboard Stats
    public function getDashboardStats()
    {
        $stats = [
            'total_employees' => Employee::count(),
            'employees_with_salary' => Employee::whereHas('salaryStructure')->count(),
            'current_period' => PayrollPeriod::where('status', 'processing')->first(),
            'pending_payslips' => Payslip::where('status', 'draft')->count(),
            'this_month_payroll' => PayrollPeriod::whereMonth('start_date', now()->month)
                ->whereYear('start_date', now()->year)
                ->first(),
            'recent_periods' => PayrollPeriod::orderBy('start_date', 'desc')->take(5)->get()
        ];

        return response()->json(['success' => true, 'stats' => $stats]);
    }

    public function importSalarySheet(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'month' => 'required'
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $header = fgetcsv($handle);  // Read header

        // Month for fallback
        $month = $request->get('month');
        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $period = PayrollPeriod::whereDate('start_date', $startDate->format('Y-m-d'))->first();

        // Parse Headers to map indices to Types
        $columnMap = [];
        foreach ($header as $index => $colName) {
            if (preg_match('/\(A-(\d+)\)/', $colName, $matches)) {
                $columnMap[$index] = ['type' => 'allowance', 'id' => $matches[1]];
            } elseif (preg_match('/\(D-(\d+)\)/', $colName, $matches)) {
                $columnMap[$index] = ['type' => 'deduction', 'id' => $matches[1]];
            } elseif ($colName === 'Payslip ID') {
                $columnMap[$index] = ['type' => 'payslip_id'];
            } elseif ($colName === 'Employee ID') {
                $columnMap[$index] = ['type' => 'employee_id'];
            }
        }

        // Pre-fetch Types for fast lookup
        $allowanceTypes = AllowanceType::all()->keyBy('id');
        $deductionTypes = DeductionType::all()->keyBy('id');

        DB::beginTransaction();
        try {
            while (($row = fgetcsv($handle)) !== false) {
                // Find Payslip
                $payslip = null;

                // 1. Try Payslip ID
                $payslipId = null;
                foreach ($columnMap as $idx => $meta) {
                    if ($meta['type'] === 'payslip_id') {
                        $payslipId = $row[$idx] ?? null;
                        break;
                    }
                }
                if ($payslipId) {
                    $payslip = Payslip::find($payslipId);
                }

                // 2. Try Employee ID if Payslip not found (and Period exists)
                if (!$payslip && $period) {
                    $employeeIdNum = null;
                    foreach ($columnMap as $idx => $meta) {
                        if ($meta['type'] === 'employee_id') {
                            $employeeIdNum = $row[$idx] ?? null;
                            break;
                        }
                    }
                    if ($employeeIdNum) {
                        // Find Employee by custom ID
                        $employee = Employee::where('employee_id', $employeeIdNum)->first();
                        if ($employee) {
                            $payslip = Payslip::where('payroll_period_id', $period->id)
                                ->where('employee_id', $employee->id)
                                ->first();
                        }
                    }
                }

                if (!$payslip)
                    continue;

                foreach ($columnMap as $index => $meta) {
                    $amount = isset($row[$index]) ? (float) $row[$index] : 0;

                    if ($meta['type'] === 'allowance') {
                        $type = $allowanceTypes[$meta['id']] ?? null;
                        if ($type) {
                            \App\Models\PayslipAllowance::updateOrCreate(
                                ['payslip_id' => $payslip->id, 'allowance_type_id' => $meta['id']],
                                [
                                    'amount' => $amount,
                                    'allowance_name' => $type->name,
                                    'is_taxable' => $type->is_taxable
                                ]
                            );
                        }
                    } elseif ($meta['type'] === 'deduction') {
                        $type = $deductionTypes[$meta['id']] ?? null;
                        if ($type) {
                            \App\Models\PayslipDeduction::updateOrCreate(
                                ['payslip_id' => $payslip->id, 'deduction_type_id' => $meta['id']],
                                [
                                    'amount' => $amount,
                                    'deduction_name' => $type->name
                                ]
                            );
                        }
                    }
                }

                // Recalculate Totals
                $payslip->refresh();
                $payslip->total_allowances = $payslip->allowances->sum('amount');
                $payslip->total_deductions = $payslip->deductions->sum('amount');
                $payslip->gross_salary = $payslip->basic_salary + $payslip->total_allowances;
                $payslip->net_salary = $payslip->gross_salary - $payslip->total_deductions;
                $payslip->save();
            }

            // Recalculate Period Totals
            if ($period) {
                $period->total_gross_amount = Payslip::where('payroll_period_id', $period->id)->sum('gross_salary');
                $period->total_deductions = Payslip::where('payroll_period_id', $period->id)->sum('total_deductions');
                $period->total_net_amount = Payslip::where('payroll_period_id', $period->id)->sum('net_salary');

                // If posted, update financials immediately
                if ($period->status === 'posted') {
                    $this->payrollService->postToFinancials($period);
                }

                $period->save();
            }

            DB::commit();
            fclose($handle);
            return response()->json(['success' => true, 'message' => 'Salary sheet imported successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            fclose($handle);
            return response()->json(['success' => false, 'message' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    public function postPayroll(Request $request)
    {
        $month = $request->get('month');
        if (!$month)
            return response()->json(['message' => 'Month required'], 400);

        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $period = PayrollPeriod::whereDate('start_date', $startDate->format('Y-m-d'))->first();

        if (!$period) {
            return response()->json(['success' => false, 'message' => 'Payroll period not found'], 404);
        }

        return $this->payrollService->postToFinancials($period);
    }

    public function downloadImportTemplate()
    {
        $allowanceTypes = AllowanceType::where('is_active', true)->orderBy('id')->get();
        $deductionTypes = DeductionType::where('is_active', true)->orderBy('id')->get();

        $filename = 'salary_import_template.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($allowanceTypes, $deductionTypes) {
            $file = fopen('php://output', 'w');

            // Header Row
            $headerRow = ['Payslip ID', 'Employee ID', 'Name'];  // Simplified
            foreach ($allowanceTypes as $type)
                $headerRow[] = $type->name . ' (A-' . $type->id . ')';
            foreach ($deductionTypes as $type)
                $headerRow[] = $type->name . ' (D-' . $type->id . ')';

            fputcsv($file, $headerRow);

            // Example Row (Optional)
            // $exampleRow = ['', 'EMP-001', 'John Doe'];
            // ... zeros ...
            // fputcsv($file, $exampleRow);

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function exportSalarySheet(Request $request)
    {
        $month = $request->get('month');
        if (!$month)
            return response()->json(['message' => 'Month required'], 400);

        $startDate = Carbon::createFromFormat('Y-m', $month)->startOfMonth();

        $period = PayrollPeriod::whereDate('start_date', $startDate->format('Y-m-d'))->first();
        if (!$period)
            return response()->json(['message' => 'Payroll period not found'], 400);

        // Fetch Payslips with details
        $payslips = Payslip::with(['allowances', 'deductions', 'employee'])
            ->where('payroll_period_id', $period->id)
            ->get();

        // Fetch Types for Headers
        $allowanceTypes = AllowanceType::where('is_active', true)->orderBy('id')->get();
        $deductionTypes = DeductionType::where('is_active', true)->orderBy('id')->get();

        $filename = 'salary_sheet_' . $month . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($payslips, $allowanceTypes, $deductionTypes) {
            $file = fopen('php://output', 'w');

            // Header Row
            $headerRow = ['Payslip ID', 'Employee ID', 'Name', 'CNIC', 'Designation', 'Department', 'Basic Salary'];
            foreach ($allowanceTypes as $type)
                $headerRow[] = $type->name . ' (A-' . $type->id . ')';
            $headerRow[] = 'Gross Salary';
            foreach ($deductionTypes as $type)
                $headerRow[] = $type->name . ' (D-' . $type->id . ')';
            $headerRow[] = 'Net Salary';

            fputcsv($file, $headerRow);

            foreach ($payslips as $payslip) {
                $row = [
                    $payslip->id,
                    $payslip->employee_id_number,
                    $payslip->employee_name,
                    $payslip->employee->national_id ?? '-',
                    $payslip->designation,
                    $payslip->department,
                    $payslip->basic_salary
                ];

                // Allowances
                foreach ($allowanceTypes as $type) {
                    $amt = $payslip->allowances->where('allowance_type_id', $type->id)->first()?->amount ?? 0;
                    $row[] = $amt;
                }

                $row[] = $payslip->gross_salary;

                // Deductions
                foreach ($deductionTypes as $type) {
                    $amt = $payslip->deductions->where('deduction_type_id', $type->id)->first()?->amount ?? 0;
                    $row[] = $amt;
                }

                $row[] = $payslip->net_salary;

                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Get list of employees for dropdowns
     */
    public function getEmployeesList(Request $request)
    {
        $query = Employee::select('id', 'name', 'employee_id');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        $employees = $query->limit(50)->get();

        return response()->json(['success' => true, 'employees' => $employees]);
    }
}
