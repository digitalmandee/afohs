<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\Department;
use App\Models\Employee;
use App\Models\EmployeeSalaryStructure;
use App\Models\Subdepartment;
use App\Models\Media;
use App\Models\User;
use App\Models\UserLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class EmployeeController extends Controller
{
    public function dashboard(Request $request)
    {
        // Branch-wise (Company-wise) Statistics
        $currentDay = now()->format('Y-m-d');

        $companyStats = \App\Models\Branch::where('status', true)
            ->withCount(['employees' => function ($query) {
                // Count active employees in this branch
                $query->whereNull('deleted_at');
            }])
            ->get()
            ->map(function ($branch) use ($currentDay) {
                // Get attendance stats for this branch for today
                $attendance = \App\Models\Attendance::whereHas('employee', function ($q) use ($branch) {
                    $q->where('branch_id', $branch->id);
                })
                    ->where('date', $currentDay)
                    ->selectRaw("
                        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_absent,
                        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present,
                        SUM(CASE WHEN status = 'weekend' THEN 1 ELSE 0 END) as total_weekend
                    ")
                    ->first();

                return [
                    'id' => $branch->id,
                    'name' => $branch->name,
                    'total_employees' => $branch->employees_count,
                    'present' => $attendance->total_present ?? 0,
                    'absent' => $attendance->total_absent ?? 0,
                    'weekend' => $attendance->total_weekend ?? 0,
                ];
            });

        $attendanceTotals = \App\Models\Attendance::where('date', $currentDay)
            ->selectRaw("
                SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as total_absent,
                SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as total_present,
                SUM(CASE WHEN status = 'weekend' THEN 1 ELSE 0 END) as total_weekend
            ")
            ->first();

        $overviewStats = [
            'total_employees' => Employee::count(),
            'present_today' => $attendanceTotals->total_present ?? 0,
            'absent_today' => $attendanceTotals->total_absent ?? 0,
            'weekend_today' => $attendanceTotals->total_weekend ?? 0,
            'total_departments' => Department::count(),
            'total_subdepartments' => Subdepartment::count(),
            'active_salary_structures' => EmployeeSalaryStructure::where('is_active', true)->count(),
            'employees_without_salary_structure' => Employee::doesntHave('salaryStructure')->count(),
        ];

        $limit = $request->query('limit') ?? 10;
        $search = $request->query('search', '');
        $departmentId = $request->query('department_id');
        $subdepartmentId = $request->query('subdepartment_id');
        $branchId = $request->query('branch_id');
        $shiftId = $request->query('shift_id');
        $designationId = $request->query('designation_id');

        // Employees with pagination - include relationships
        $employeesQuery = Employee::with([
            'department' => function ($query) {
                $query->withTrashed();
            },
            'subdepartment' => function ($query) {
                $query->withTrashed();
            },
            'designation',
            'branch',
            'shift',
            'photo',
        ]);

        // Apply search filter if provided
        if (!empty($search)) {
            $employeesQuery->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', '%' . $search . '%')
                    ->orWhere('employee_id', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('national_id', 'like', '%' . $search . '%');
            });
        }

        // Apply individual filters
        if ($departmentId) {
            $employeesQuery->where('department_id', $departmentId);
        }
        if ($subdepartmentId) {
            $employeesQuery->where('subdepartment_id', $subdepartmentId);
        }
        if ($branchId) {
            $employeesQuery->where('branch_id', $branchId);
        }
        if ($shiftId) {
            $employeesQuery->where('shift_id', $shiftId);
        }
        if ($designationId) {
            $employeesQuery->where('designation_id', $designationId);
        }

        $employees = $employeesQuery
            ->paginate($limit)
            ->withQueryString()
            ->through(function ($employee) {
                $employee->joining_date = $employee->joining_date ? \Carbon\Carbon::parse($employee->joining_date)->format('d/m/Y') : '-';
                $employee->photo_url = $employee->photo ? asset($employee->photo->file_path) : null;
                return $employee;
            });

        // Get filter options
        $departments = Department::select('id', 'name')->get();

        return Inertia::render('App/Admin/Employee/Dashboard', [
            'companyStats' => $companyStats,
            'overviewStats' => $overviewStats,
            'employees' => $employees,
            'filters' => $request->only(['search', 'department_id', 'subdepartment_id', 'branch_id', 'shift_id', 'designation_id']),
            'departments' => $departments,
        ]);
    }

    public function create()
    {
        // Get dropdown data
        $shifts = \App\Models\Shift::where('status', true)->select('id', 'name', 'start_time', 'end_time')->get();
        $branches = \App\Models\Branch::where('status', true)->select('id', 'name')->get();

        // Calculate next Employee ID - only consider numeric employee_ids
        $maxId = \App\Models\Employee::whereRaw("employee_id REGEXP '^[0-9]+\$'")
            ->selectRaw('MAX(CAST(employee_id AS UNSIGNED)) as max_id')
            ->value('max_id');
        $nextEmployeeId = $maxId ? $maxId + 1 : 1;

        return Inertia::render('App/Admin/Employee/Create', [
            'shifts' => $shifts,
            'branches' => $branches,
            'next_employee_id' => (string) $nextEmployeeId
        ]);
    }

    public function edit($employeeId)
    {
        $employee = Employee::with([
            'department',
            'subdepartment',
            'photo',
            'documents'
        ])
            ->where('id', $employeeId)
            ->first();

        if (!$employee) {
            return abort(404, 'Employee not found');
        }

        return Inertia::render('App/Admin/Employee/Create', [
            'employee' => $employee,
            'isEdit' => true
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'employee_id' => 'required|unique:employees,employee_id',
            'email' => 'required|email|unique:employees,email',
            'designation_id' => 'nullable|exists:designations,id',
            'designation' => 'nullable|string',
            'phone_no' => 'required|regex:/^[0-9+\-\(\) ]+$/',
            'gender' => 'required|in:male,female',
            'marital_status' => 'nullable|in:single,married,divorced,widowed',
            'national_id' => 'nullable|regex:/^[0-9-]+$/',
            'account_no' => 'nullable|regex:/^[0-9]+$/',
            'address' => 'nullable|string',
            'emergency_no' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'department_id' => 'required|exists:departments,id',
            'subdepartment_id' => 'nullable|exists:subdepartments,id',
            'shift_id' => 'nullable|exists:shifts,id',
            'branch_id' => 'nullable|exists:branches,id',
            'salary' => 'nullable|numeric',
            'joining_date' => 'nullable|date',
            'employment_type' => 'required|in:full_time,part_time,contract',
            'date_of_birth' => 'nullable|date',
            // Additional fields validation
            'father_name' => 'nullable|string',
            'mob_b' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'tel_a' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'tel_b' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'cur_city' => 'nullable|string',
            'cur_country' => 'nullable|string',
            'per_address' => 'nullable|string',
            'per_city' => 'nullable|string',
            'per_country' => 'nullable|string',
            'license' => 'nullable|string',
            'license_no' => 'nullable|string',
            'vehicle_details' => 'nullable|string',
            'bank_details' => 'nullable|string',
            'learn_of_org' => 'nullable|string',
            'anyone_in_org' => 'nullable|string',
            'company' => 'nullable|string',
            'crime' => 'nullable|string',
            'crime_details' => 'nullable|string',
            'remarks' => 'nullable|string',
            'barcode' => 'nullable|string',
            // New enhanced fields
            'nationality' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'payment_method' => 'required|in:cash,bank',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date',
            'academic_qualification' => 'nullable|string',
            'academic_institution' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'work_experience_years' => 'nullable|integer',
            'previous_employer' => 'nullable|string',
            'previous_position' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            if (Employee::where('employee_id', $request->employee_id)->exists()) {
                return response()->json(['success' => false, 'message' => 'Employee ID already exists'], 400);
            }

            // Calculate age from date of birth if provided
            $age = null;
            if ($request->filled('date_of_birth')) {
                $birthDate = new \DateTime($request->date_of_birth);
                $today = new \DateTime();
                $age = $today->diff($birthDate)->y;
            }

            $employee = Employee::create([
                'department_id' => $request->department_id,
                'subdepartment_id' => $request->subdepartment_id,
                'shift_id' => $request->shift_id,
                'branch_id' => $request->branch_id,
                'employee_id' => $request->employee_id,
                'name' => $request->name,
                'email' => $request->email,
                'designation_id' => $request->designation_id,
                'designation' => $request->designation,
                'phone_no' => $request->phone_no,
                'gender' => $request->gender,
                'marital_status' => $request->marital_status,
                'national_id' => $request->national_id,
                'account_no' => $request->account_no,
                'address' => $request->address,
                'emergency_no' => $request->emergency_no,
                'salary' => $request->salary,
                'joining_date' => $request->joining_date,
                'employment_type' => $request->employment_type,
                'date_of_birth' => $request->date_of_birth,
                'age' => $age,
                // Additional fields
                'father_name' => $request->father_name,
                'mob_b' => $request->mob_b,
                'tel_a' => $request->tel_a,
                'tel_b' => $request->tel_b,
                'cur_city' => $request->cur_city,
                'cur_country' => $request->cur_country,
                'per_address' => $request->per_address,
                'per_city' => $request->per_city,
                'per_country' => $request->per_country,
                'license' => $request->license,
                'license_no' => $request->license_no,
                'vehicle_details' => $request->vehicle_details,
                'bank_details' => $request->bank_details,
                'learn_of_org' => $request->learn_of_org,
                'anyone_in_org' => $request->anyone_in_org,
                'company' => $request->company,
                'crime' => $request->crime,
                'crime_details' => $request->crime_details,
                'remarks' => $request->remarks,
                'barcode' => $request->barcode,
                // New enhanced fields
                'nationality' => $request->nationality,
                'status' => $request->status,
                'payment_method' => $request->payment_method,
                'contract_start_date' => $request->contract_start_date,
                'contract_end_date' => $request->contract_end_date,
                'academic_qualification' => $request->academic_qualification,
                'academic_institution' => $request->academic_institution,
                'academic_year' => $request->academic_year,
                'work_experience_years' => $request->work_experience_years,
                'previous_employer' => $request->previous_employer,
                'previous_position' => $request->previous_position,
            ]);

            // Auto-create salary structure if salary is provided
            if ($request->filled('salary') && $request->salary > 0) {
                $this->createOrUpdateSalaryStructure($employee, $request->salary);
            }

            // Handle photo upload
            if ($request->hasFile('photo')) {
                // Get file metadata BEFORE moving the file
                $photo = $request->file('photo');
                $mimeType = $photo->getMimeType();
                $fileSize = $photo->getSize();

                $photoPath = FileHelper::saveImage($photo, 'employees/photos');

                $employee->media()->create([
                    'type' => 'employee_photo',
                    'file_name' => basename($photoPath),
                    'file_path' => $photoPath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                    'created_by' => Auth::id(),
                ]);
            }

            // Handle document uploads
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $document) {
                    // Get file metadata BEFORE moving the file
                    $mimeType = $document->getMimeType();
                    $fileSize = $document->getSize();

                    $docPath = FileHelper::saveImage($document, 'employees/documents');

                    $employee->media()->create([
                        'type' => 'employee_document',
                        'file_name' => basename($docPath),
                        'file_path' => $docPath,
                        'mime_type' => $mimeType,
                        'file_size' => $fileSize,
                        'disk' => 'public',
                        'created_by' => Auth::id(),
                    ]);
                }
            }
            DB::commit();
            return response()->json(['success' => true, 'message' => 'Employee created successfully'], 201);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    public function employeeLog(Request $request)
    {
        $user = Auth::guard('tenant')->user() ?? Auth::user();
        if (!$user) {
            return response()->json([]);
        }

        $logs = UserLog::where('user_id', $user->id)
            ->orderByDesc('logged_at')
            ->limit(50)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_id' => $log->user_id,
                    'type' => $log->type,
                    'logged_at' => $log->logged_at ? $log->logged_at->toIso8601String() : null,
                ];
            });

        return response()->json($logs);
    }

    public function details($employeeId)
    {
        $employee = Employee::where('employee_id', $employeeId)->with(['user:id,name,email', 'department:id,name'])->first();
        if (!$employee)
            return abort(404);

        return Inertia::render('App/Admin/Employee/Detail', compact('employee'));
    }

    public function update(Request $request, $employeeId)
    {
        $request->validate([
            'name' => 'required|string',
            'employee_id' => 'required',
            'email' => 'required|email',
            'designation_id' => 'nullable|exists:designations,id',
            'designation' => 'nullable|string',
            'phone_no' => 'required|regex:/^[0-9+\-\(\) ]+$/',
            'gender' => 'required|in:male,female',
            'marital_status' => 'required|in:single,married,divorced,widowed',
            'national_id' => 'nullable|regex:/^[0-9-]+$/',
            'account_no' => 'nullable|regex:/^[0-9]+$/',
            'address' => 'nullable|string',
            'emergency_no' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'shift_id' => 'nullable|exists:shifts,id',
            'branch_id' => 'nullable|exists:branches,id',
            'salary' => 'nullable|numeric',
            'joining_date' => 'nullable|date',
            // Additional fields validation
            'father_name' => 'nullable|string',
            'mob_b' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'tel_a' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'tel_b' => 'nullable|regex:/^[0-9+\-\(\) ]+$/',
            'cur_city' => 'nullable|string',
            'cur_country' => 'nullable|string',
            'per_address' => 'nullable|string',
            'per_city' => 'nullable|string',
            'per_country' => 'nullable|string',
            'license' => 'nullable|string',
            'license_no' => 'nullable|string',
            'vehicle_details' => 'nullable|string',
            'bank_details' => 'nullable|string',
            'learn_of_org' => 'nullable|string',
            'anyone_in_org' => 'nullable|string',
            'company' => 'nullable|string',
            'crime' => 'nullable|string',
            'crime_details' => 'nullable|string',
            'remarks' => 'nullable|string',
            'barcode' => 'nullable|string',
            // New enhanced fields
            'nationality' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'payment_method' => 'required|in:cash,bank',
            'contract_start_date' => 'nullable|date',
            'contract_end_date' => 'nullable|date',
            'academic_qualification' => 'nullable|string',
            'academic_institution' => 'nullable|string',
            'academic_year' => 'nullable|string',
            'work_experience_years' => 'nullable|integer',
            'previous_employer' => 'nullable|string',
            'previous_position' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $employee = Employee::where('employee_id', $employeeId)->first();
            if (!$employee) {
                return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
            }

            // Check if employee_id is being changed and if it already exists
            if ($request->employee_id !== $employee->employee_id) {
                if (Employee::where('employee_id', $request->employee_id)->exists()) {
                    return response()->json(['success' => false, 'message' => 'Employee ID already exists'], 400);
                }
            }

            // Store old salary before updating
            $oldSalary = $employee->salary;

            // Calculate age from date of birth if provided
            $age = null;
            if ($request->filled('date_of_birth')) {
                $birthDate = new \DateTime($request->date_of_birth);
                $today = new \DateTime();
                $age = $today->diff($birthDate)->y;
            }

            // Update employee data
            $employee->update($request->only([
                'name',
                'department_id',
                'subdepartment_id',
                'shift_id',
                'branch_id',
                'employee_id',
                'email',
                'designation_id',
                'designation',
                'phone_no',
                'gender',
                'marital_status',
                'national_id',
                'account_no',
                'address',
                'emergency_no',
                'salary',
                'joining_date',
                'date_of_birth',
                // Additional fields
                'father_name',
                'mob_b',
                'tel_a',
                'tel_b',
                'cur_city',
                'cur_country',
                'per_address',
                'per_city',
                'per_country',
                'license',
                'license_no',
                'vehicle_details',
                'bank_details',
                'learn_of_org',
                'anyone_in_org',
                'company',
                'crime',
                'crime_details',
                'remarks',
                'barcode',
                // New enhanced fields
                'nationality',
                'status',
                'payment_method',
                'contract_start_date',
                'contract_end_date',
                'academic_qualification',
                'academic_institution',
                'academic_year',
                'work_experience_years',
                'previous_employer',
                'previous_position',
            ]));

            // Update age if date_of_birth was provided
            if ($age !== null) {
                $employee->update(['age' => $age]);
            }

            // Update associated user if exists
            if ($employee->user) {
                $employee->user->update([
                    'name' => $request->name,
                    'email' => $request->email,
                ]);
            }

            // Auto-create/update salary structure only if salary changed and > 0
            if ($request->filled('salary') && $request->salary > 0) {
                // Only update salary structure if salary actually changed
                if ($oldSalary != $request->salary) {
                    $this->createOrUpdateSalaryStructure($employee, $request->salary);
                }
            }

            // Handle photo upload - replace existing photo
            if ($request->hasFile('photo')) {
                // Delete old photo if exists
                $oldPhoto = $employee->photo;
                if ($oldPhoto) {
                    FileHelper::deleteImage($oldPhoto->file_path);
                    $oldPhoto->delete();
                }

                // Get file metadata BEFORE moving the file
                $photo = $request->file('photo');
                $mimeType = $photo->getMimeType();
                $fileSize = $photo->getSize();

                $photoPath = FileHelper::saveImage($photo, 'employees/photos');

                $employee->media()->create([
                    'type' => 'employee_photo',
                    'file_name' => basename($photoPath),
                    'file_path' => $photoPath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                    'created_by' => Auth::id(),
                ]);
            }

            // Handle document uploads - add to existing documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $document) {
                    // Get file metadata BEFORE moving the file
                    $mimeType = $document->getMimeType();
                    $fileSize = $document->getSize();

                    $docPath = FileHelper::saveImage($document, 'employees/documents');

                    $employee->media()->create([
                        'type' => 'employee_document',
                        'file_name' => basename($docPath),
                        'file_path' => $docPath,
                        'mime_type' => $mimeType,
                        'file_size' => $fileSize,
                        'disk' => 'public',
                        'created_by' => Auth::id(),
                    ]);
                }
            }

            // Handle deleted documents
            if ($request->has('deleted_documents')) {
                foreach ($request->deleted_documents as $mediaId) {
                    $media = Media::find($mediaId);
                    if ($media && $media->mediable_id === $employee->id && $media->mediable_type === get_class($employee)) {
                        FileHelper::deleteImage($media->file_path);
                        $media->delete();
                    }
                }
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Employee updated successfully'], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    private function createOrUpdateSalaryStructure($employee, $newSalary)
    {
        // Get current active salary structure
        $currentStructure = EmployeeSalaryStructure::where('employee_id', $employee->id)
            ->where('is_active', true)
            ->first();

        if ($currentStructure) {
            // If active structure exists, check if salary actually changed
            if ($currentStructure->basic_salary != $newSalary) {
                // Only update the basic_salary, preserve allowances and deductions
                $currentStructure->update([
                    'basic_salary' => $newSalary,
                    'updated_by' => Auth::id(),
                ]);
            }
            // If salary is same, do nothing - preserve existing structure
        } else {
            // No active structure exists, check if admin intentionally deactivated it
            $hasInactiveStructure = EmployeeSalaryStructure::where('employee_id', $employee->id)
                ->where('is_active', false)
                ->exists();

            if (!$hasInactiveStructure) {
                // No salary structure exists at all, create new one (first time)
                EmployeeSalaryStructure::create([
                    'employee_id' => $employee->id,
                    'basic_salary' => $newSalary,
                    'is_active' => true,
                    'effective_from' => now(),
                    'created_by' => Auth::id(),
                ]);
            }
            // If inactive structure exists, respect admin's decision - don't auto-create
        }
    }

    public function getBusinessDevelopers(Request $request)
    {
        $query = Employee::whereHas('subdepartment', function ($q) {
            $q->where('name', 'Business Developer');
        });

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('employee_id', 'like', "%{$search}%");
            });
        }

        $employees = $query->limit(10)->get(['id', 'name', 'employee_id']);

        return response()->json($employees);
    }

    /**
     * Remove the specified employee from storage (Soft Delete).
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            $employee = Employee::find($id);

            if (!$employee) {
                return response()->json(['success' => false, 'message' => 'Employee not found'], 404);
            }

            if ($employee->user) {
                $employee->user->delete();  // Soft delete associated user
            }

            $employee->delete();  // Soft delete employee

            DB::commit();
            return back()->with('success', 'Employee deleted successfully');  // Inertia redirect
            // return response()->json(['success' => true, 'message' => 'Employee deleted successfully'], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            return back()->with('error', $th->getMessage());
        }
    }

    /**
     * Display a listing of trashed employees.
     */
    public function trashed(Request $request)
    {
        $employees = Employee::onlyTrashed()
            ->with(['branch'])  // Eager load relationships if needed for display
            ->orderByDesc('deleted_at')
            ->paginate(10);

        return Inertia::render('App/Admin/Employee/Trashed', [
            'employees' => $employees,
        ]);
    }

    /**
     * Restore the specified trashed employee.
     */
    public function restore($id)
    {
        try {
            DB::beginTransaction();
            $employee = Employee::onlyTrashed()->find($id);

            if (!$employee) {
                return back()->with('error', 'Employee not found in trash');
            }

            if ($employee->user()->withTrashed()->exists()) {
                $employee->user()->withTrashed()->restore();  // Restore associated user
            }

            $employee->restore();

            DB::commit();
            return back()->with('success', 'Employee restored successfully');
        } catch (\Throwable $th) {
            DB::rollBack();
            return back()->with('error', $th->getMessage());
        }
    }

    /**
     * Permanently remove the specified employee from storage.
     */
    public function forceDelete($id)
    {
        try {
            DB::beginTransaction();
            $employee = Employee::onlyTrashed()->find($id);

            if (!$employee) {
                return back()->with('error', 'Employee not found in trash');
            }

            // Permanently delete associated user
            if ($employee->user()->withTrashed()->exists()) {
                $employee->user()->withTrashed()->forceDelete();
            }

            // Delete associated media (photos, documents)
            foreach ($employee->media as $media) {
                FileHelper::deleteImage($media->file_path);
                $media->delete();
            }

            $employee->forceDelete();

            DB::commit();
            return back()->with('success', 'Employee permanently deleted');
        } catch (\Throwable $th) {
            DB::rollBack();
            return back()->with('error', $th->getMessage());
        }
    }
}
