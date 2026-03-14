<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLoan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeLoanController extends Controller
{
    /**
     * Display a listing of loans with history and stats.
     */
    public function index(Request $request)
    {
        $query = EmployeeLoan::with(['employee', 'employee.department', 'approver']);

        // Filters
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

        // Sorting
        $sortBy = $request->sort_by ?? 'loan_date';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $loans = $query->paginate(15)->through(function ($loan) {
            $loanArray = $loan->toArray();
            try {
                if ($loan->loan_date) {
                    $loanArray['loan_date'] = \Carbon\Carbon::parse($loan->loan_date)->format('d/m/Y');
                } else {
                    $loanArray['loan_date'] = '-';
                }
            } catch (\Exception $e) {
                // Keep original value on error
            }
            return $loanArray;
        });
        $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_id']);

        // Stats
        $stats = [
            'total_loans' => EmployeeLoan::count(),
            'pending_count' => EmployeeLoan::pending()->count(),
            'active_count' => EmployeeLoan::active()->count(),
            'total_disbursed' => EmployeeLoan::whereIn('status', ['disbursed', 'completed'])->sum('amount'),
            'total_outstanding' => EmployeeLoan::active()->sum('remaining_amount'),
            'total_recovered' => EmployeeLoan::sum('total_paid'),
        ];

        return Inertia::render('App/Admin/Employee/Loans/Index', [
            'loans' => $loans,
            'employees' => $employees,
            'stats' => $stats,
            'filters' => $request->only(['employee_id', 'status', 'date_from', 'date_to', 'sort_by', 'sort_order']),
        ]);
    }

    /**
     * Show the form for creating a new loan.
     */
    public function create()
    {
        $employees = Employee::with(['salaryStructure'])
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        return Inertia::render('App/Admin/Employee/Loans/Create', [
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly created loan.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:1',
            'loan_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'installments' => 'required|integer|min:1|max:60',
            'notes' => 'nullable|string',
        ]);

        // Calculate monthly deduction
        $validated['monthly_deduction'] = round($validated['amount'] / $validated['installments']);
        $validated['remaining_amount'] = $validated['amount'];
        $validated['total_paid'] = 0;
        $validated['installments_paid'] = 0;
        $validated['status'] = 'pending';

        EmployeeLoan::create($validated);

        return redirect()
            ->route('employees.loans.index')
            ->with('success', 'Loan application submitted successfully.');
    }

    /**
     * Show the form for editing a loan.
     */
    public function edit($id)
    {
        $loan = EmployeeLoan::with(['employee', 'employee.salaryStructure'])->findOrFail($id);

        if ($loan->status !== 'pending') {
            return redirect()
                ->route('employees.loans.index')
                ->with('error', 'Only pending loans can be edited.');
        }

        $employees = Employee::with(['salaryStructure'])
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        return Inertia::render('App/Admin/Employee/Loans/Edit', [
            'loan' => $loan,
            'employees' => $employees,
        ]);
    }

    /**
     * Update the specified loan.
     */
    public function update(Request $request, $id)
    {
        $loan = EmployeeLoan::findOrFail($id);

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Cannot edit non-pending loans.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:1',
            'loan_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'installments' => 'required|integer|min:1|max:60',
            'notes' => 'nullable|string',
        ]);

        $validated['monthly_deduction'] = round($validated['amount'] / $validated['installments']);
        $validated['remaining_amount'] = $validated['amount'];

        $loan->update($validated);

        return redirect()
            ->route('employees.loans.index')
            ->with('success', 'Loan updated successfully.');
    }

    /**
     * Approve a loan.
     */
    public function approve($id)
    {
        $loan = EmployeeLoan::findOrFail($id);

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Only pending loans can be approved.');
        }

        $loan->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Loan approved successfully.');
    }

    /**
     * Reject a loan.
     */
    public function reject(Request $request, $id)
    {
        $loan = EmployeeLoan::findOrFail($id);

        if ($loan->status !== 'pending') {
            return back()->with('error', 'Only pending loans can be rejected.');
        }

        $loan->update([
            'status' => 'rejected',
            'notes' => $request->notes ?? $loan->notes,
        ]);

        return back()->with('success', 'Loan rejected.');
    }

    /**
     * Mark loan as disbursed (money given to employee).
     */
    public function disburse($id)
    {
        $loan = EmployeeLoan::findOrFail($id);

        if ($loan->status !== 'approved') {
            return back()->with('error', 'Only approved loans can be disbursed.');
        }

        // Set next deduction to next month's 1st
        $nextMonth = now()->addMonth()->startOfMonth();

        $loan->update([
            'status' => 'disbursed',
            'disbursed_at' => now(),
            'next_deduction_date' => $nextMonth,
        ]);

        return back()->with('success', 'Loan marked as disbursed. Deductions will start from ' . $nextMonth->format('F Y') . '.');
    }

    /**
     * Delete a loan (only pending/rejected).
     */
    public function destroy($id)
    {
        $loan = EmployeeLoan::findOrFail($id);

        if (!in_array($loan->status, ['pending', 'rejected'])) {
            return back()->with('error', 'Cannot delete approved or disbursed loans.');
        }

        $loan->delete();

        return back()->with('success', 'Loan deleted successfully.');
    }

    /**
     * Get employee's salary for loan form (API).
     */
    public function getEmployeeSalary($employeeId)
    {
        $employee = Employee::with('salaryStructure')->findOrFail($employeeId);
        $salary = $employee->salaryStructure?->basic_salary ?? 0;

        return response()->json([
            'success' => true,
            'salary' => $salary,
            'employee_name' => $employee->name,
        ]);
    }

    /**
     * Get loan history for employee (API).
     */
    public function getEmployeeLoans($employeeId)
    {
        $loans = EmployeeLoan::where('employee_id', $employeeId)
            ->orderBy('loan_date', 'desc')
            ->get()
            ->map(function ($loan) {
                $loanArray = $loan->toArray();
                try {
                    if ($loan->loan_date) {
                        $loanArray['loan_date'] = \Carbon\Carbon::parse($loan->loan_date)->format('d/m/Y');
                    } else {
                        $loanArray['loan_date'] = '-';
                    }
                } catch (\Exception $e) {
                }
                return $loanArray;
            });

        $activeLoans = $loans->where('status', 'disbursed')->sum('remaining_amount');

        return response()->json([
            'success' => true,
            'loans' => $loans,
            'active_outstanding' => $activeLoans,
        ]);
    }
}
