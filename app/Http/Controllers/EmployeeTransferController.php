<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Department;
use App\Models\Designation;
use App\Models\Employee;
use App\Models\EmployeeTransfer;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EmployeeTransferController extends Controller
{
    public function index()
    {
        $transfers = EmployeeTransfer::with([
            'employee',
            'fromDepartment', 'toDepartment',
            'fromBranch', 'toBranch',
            'fromDesignation', 'toDesignation',
            'fromShift', 'toShift'
        ])->latest()->paginate(20)->through(function ($transfer) {
            $transferArray = $transfer->toArray();
            try {
                $transferArray['transfer_date'] = $transferArray['transfer_date'] ? \Carbon\Carbon::parse($transferArray['transfer_date'])->format('d/m/Y') : '-';
            } catch (\Exception $e) {
            }
            return $transferArray;
        });

        return Inertia::render('App/Admin/Employee/Transfers/Index', [
            'transfers' => $transfers
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'to_department_id' => 'nullable|exists:departments,id',
            'to_branch_id' => 'nullable|exists:branches,id',
            'to_designation_id' => 'nullable|exists:designations,id',
            'to_shift_id' => 'nullable|exists:shifts,id',
            'transfer_date' => 'required|date',
            'reason' => 'nullable|string'
        ]);

        DB::beginTransaction();
        try {
            $employee = Employee::findOrFail($request->employee_id);

            // Create Transfer Record
            EmployeeTransfer::create([
                'employee_id' => $employee->id,
                'from_department_id' => $employee->department_id,
                'from_subdepartment_id' => $employee->subdepartment_id,
                'from_designation_id' => $employee->designation_id,
                'from_branch_id' => $employee->branch_id,
                'from_shift_id' => $employee->shift_id,
                'to_department_id' => $request->to_department_id ?? $employee->department_id,
                'to_subdepartment_id' => $request->to_subdepartment_id ?? $employee->subdepartment_id,  // assuming simple transfers usually keep user selected
                'to_designation_id' => $request->to_designation_id ?? $employee->designation_id,
                'to_branch_id' => $request->to_branch_id ?? $employee->branch_id,
                'to_shift_id' => $request->to_shift_id ?? $employee->shift_id,
                'transfer_date' => $request->transfer_date,
                'reason' => $request->reason,
                'transferred_by' => Auth::id()
            ]);

            // Update Employee Record
            $employee->update([
                'department_id' => $request->to_department_id ?? $employee->department_id,
                'subdepartment_id' => $request->to_subdepartment_id ?? $employee->subdepartment_id,
                'designation_id' => $request->to_designation_id ?? $employee->designation_id,
                'branch_id' => $request->to_branch_id ?? $employee->branch_id,
                'shift_id' => $request->to_shift_id ?? $employee->shift_id
            ]);

            DB::commit();
            return redirect()->back()->with('success', 'Employee transferred successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->withErrors(['error' => 'Transfer failed: ' . $e->getMessage()]);
        }
    }
}
