<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeAdvance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class EmployeeAdvanceController extends Controller
{
    /**
     * Display a listing of advances.
     */
    public function index(Request $request)
    {
        $query = EmployeeAdvance::with(['employee', 'employee.department', 'approver']);

        // Filters
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

        $advances = $query->orderBy('advance_date', 'desc')->paginate(15)->through(function ($advance) {
            $advanceArray = $advance->toArray();
            try {
                if ($advance->advance_date) {
                    $advanceArray['advance_date'] = \Carbon\Carbon::parse($advance->advance_date)->format('d/m/Y');
                } else {
                    $advanceArray['advance_date'] = '-';
                }
            } catch (\Exception $e) {
            }
            return $advanceArray;
        });
        $employees = Employee::orderBy('name')->get(['id', 'name', 'employee_id']);

        // Stats
        $stats = [
            'total_pending' => EmployeeAdvance::pending()->sum('amount'),
            'total_approved' => EmployeeAdvance::approved()->sum('amount'),
            'total_outstanding' => EmployeeAdvance::active()->sum('remaining_amount'),
            'pending_count' => EmployeeAdvance::pending()->count(),
        ];

        return Inertia::render('App/Admin/Employee/Advances/Index', [
            'advances' => $advances,
            'employees' => $employees,
            'stats' => $stats,
            'filters' => $request->only(['employee_id', 'status', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new advance.
     */
    public function create()
    {
        $employees = Employee::orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        return Inertia::render('App/Admin/Employee/Advances/Create', [
            'employees' => $employees,
        ]);
    }

    /**
     * Store a newly created advance.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => [
                'required',
                'numeric',
                'min:1',
                function ($attribute, $value, $fail) use ($request) {
                    if ($request->employee_id) {
                        $employee = \App\Models\Employee::with('salaryStructure')->find($request->employee_id);
                        $basicSalary = $employee->salaryStructure?->basic_salary ?? 0;
                        if ($value > $basicSalary) {
                            $fail("Advance amount cannot exceed basic salary ({$basicSalary}).");
                        }
                    }
                },
            ],
            'advance_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'deduction_months' => 'required|integer|min:1|max:24',
            'deduction_start_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $validated['monthly_deduction'] = $validated['amount'] / $validated['deduction_months'];
        $validated['remaining_amount'] = $validated['amount'];
        $validated['status'] = 'pending';

        EmployeeAdvance::create($validated);

        return redirect()
            ->route('employees.advances.index')
            ->with('success', 'Advance request created successfully.');
    }

    /**
     * Show the form for editing an advance.
     */
    public function edit($id)
    {
        $advance = EmployeeAdvance::with(['employee'])->findOrFail($id);

        $advanceArray = $advance->toArray();
        $advanceArray['advance_date'] = $advance->advance_date ? $advance->advance_date->format('Y-m-d') : '';
        $advanceArray['deduction_start_date'] = $advance->deduction_start_date ? $advance->deduction_start_date->format('Y-m-d') : '';

        $employees = Employee::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'employee_id']);

        return Inertia::render('App/Admin/Employee/Advances/Edit', [
            'advance' => $advanceArray,  // Send array instead of model
            'employees' => $employees,
        ]);
    }

    /**
     * Update the specified advance.
     */
    public function update(Request $request, $id)
    {
        $advance = EmployeeAdvance::findOrFail($id);

        // Can only edit pending advances
        if ($advance->status !== 'pending') {
            return back()->with('error', 'Cannot edit non-pending advances.');
        }

        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'amount' => 'required|numeric|min:1',
            'advance_date' => 'required|date',
            'reason' => 'nullable|string|max:255',
            'deduction_months' => 'required|integer|min:1|max:24',
            'deduction_start_date' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        $validated['monthly_deduction'] = $validated['amount'] / $validated['deduction_months'];
        $validated['remaining_amount'] = $validated['amount'];

        $advance->update($validated);

        return redirect()
            ->route('employees.advances.index')
            ->with('success', 'Advance updated successfully.');
    }

    /**
     * Approve an advance.
     */
    public function approve($id)
    {
        $advance = EmployeeAdvance::findOrFail($id);

        if ($advance->status !== 'pending') {
            return back()->with('error', 'Only pending advances can be approved.');
        }

        $advance->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Advance approved successfully.');
    }

    /**
     * Reject an advance.
     */
    public function reject(Request $request, $id)
    {
        $advance = EmployeeAdvance::findOrFail($id);

        if ($advance->status !== 'pending') {
            return back()->with('error', 'Only pending advances can be rejected.');
        }

        $advance->update([
            'status' => 'rejected',
            'notes' => $request->notes ?? $advance->notes,
        ]);

        return back()->with('success', 'Advance rejected.');
    }

    /**
     * Mark advance as paid (disbursed to employee).
     */
    public function markPaid($id)
    {
        $advance = EmployeeAdvance::findOrFail($id);

        if ($advance->status !== 'approved') {
            return back()->with('error', 'Only approved advances can be marked as paid.');
        }

        $advance->update(['status' => 'paid']);

        return back()->with('success', 'Advance marked as paid.');
    }

    /**
     * Delete an advance (only pending).
     */
    public function destroy($id)
    {
        $advance = EmployeeAdvance::findOrFail($id);

        if (!in_array($advance->status, ['pending', 'rejected'])) {
            return back()->with('error', 'Cannot delete approved or paid advances.');
        }

        $advance->delete();

        return back()->with('success', 'Advance deleted successfully.');
    }

    /**
     * Get advances for an employee (API).
     */
    public function getEmployeeAdvances($employeeId)
    {
        $advances = EmployeeAdvance::where('employee_id', $employeeId)
            ->orderBy('advance_date', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'advances' => $advances,
        ]);
    }

    /**
     * Get employee's salary for validation (API).
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
}
