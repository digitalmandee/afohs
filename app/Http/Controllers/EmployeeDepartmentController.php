<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class EmployeeDepartmentController extends Controller
{
    public function index(Request $request)
    {
        $departments = Department::select('id', 'name', 'status', 'branch_id')
            ->with(['branch:id,name'])
            ->withCount('employees')
            ->when($request->branch_id, function ($query, $branchId) {
                return $query->where('branch_id', $branchId);
            })
            ->when($request->search, function ($query, $search) {
                return $query->where('name', 'like', "%{$search}%");
            })
            ->paginate(10)
            ->withQueryString();

        $branches = \App\Models\Branch::where('status', true)->select('id', 'name')->orderBy('name')->get();

        return Inertia::render('App/Admin/Employee/Department/Index', [
            'departments' => $departments,
            'branches' => $branches,
            'filters' => $request->only(['branch_id', 'search']),
        ]);
    }

    public function listAll(Request $request)
    {
        try {
            $type = $request->query('type', 'list');
            $query = $request->query('query');
            $status = $request->query('status', 'active');
            $branchId = $request->query('branch_id');  // Add branch filter

            if ($type == 'search') {
                $deptQuery = Department::select('id', 'name', 'status', 'branch_id');

                if ($status !== 'all') {
                    $deptQuery->where('status', $status);
                }

                if ($branchId) {
                    $deptQuery->where('branch_id', $branchId);
                }

                if (empty($query)) {
                    $departments = $deptQuery->latest()->take(5)->get();
                } else {
                    $departments = $deptQuery->where('name', 'like', "%$query%")->get();
                }

                return response()->json(['success' => true, 'results' => $departments], 200);
            } else {
                $limit = $request->query('limit') ?? 10;

                $deptQuery = Department::select('id', 'name', 'status', 'branch_id');

                if ($status !== 'all') {
                    $deptQuery->where('status', $status);
                }

                if ($branchId) {
                    $deptQuery->where('branch_id', $branchId);
                }

                $departments = $deptQuery->withCount('employees')->paginate($limit);
                return response()->json(['success' => true, 'message' => 'Departments retrieved successfully', 'deparments' => $departments], 200);
            }
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'branch_id' => 'required|exists:branches,id',
            'status' => 'nullable|in:active,inactive',
        ]);

        try {
            $department = Department::create([
                'name' => $request->name,
                'branch_id' => $request->branch_id,
                'status' => $request->status ?? 'active',
                'created_by' => auth()->id(),
            ]);

            return response()->json(['success' => true, 'message' => 'Department created successfully', 'department' => $department], 200);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string',
            'branch_id' => 'required|exists:branches,id',
            'status' => 'nullable|in:active,inactive',
        ]);

        try {
            $department = Department::find($id);
            $department->update([
                'name' => $request->name,
                'branch_id' => $request->branch_id,
                'status' => $request->status ?? $department->status,
                'updated_by' => auth()->id(),
            ]);

            return response()->json(['success' => true, 'message' => 'Department updated successfully', 'department' => $department], 200);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    public function changeStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:active,inactive',
        ]);

        try {
            $department = Department::findOrFail($id);
            $department->update(['status' => $request->status]);

            return response()->json(['success' => true, 'message' => 'Status updated successfully']);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        try {
            $department = Department::find($id);
            $department->delete();

            return response()->json(['success' => true, 'message' => 'Department deleted successfully'], 200);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Display a listing of trashed departments.
     */
    public function trashed(Request $request)
    {
        $departments = Department::onlyTrashed()
            ->select('id', 'name', 'deleted_at')
            ->orderByDesc('deleted_at')
            ->paginate(10);

        return Inertia::render('App/Admin/Employee/Department/Trashed', [
            'departments' => $departments,
        ]);
    }

    /**
     * Restore the specified trashed department.
     */
    public function restore($id)
    {
        try {
            $department = Department::onlyTrashed()->findOrFail($id);
            $department->restore();

            return redirect()->back()->with('success', 'Department restored successfully');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', $th->getMessage());
        }
    }

    /**
     * Permanently remove the specified department from storage.
     */
    public function forceDelete($id)
    {
        try {
            $department = Department::onlyTrashed()->findOrFail($id);
            $department->forceDelete();

            return redirect()->back()->with('success', 'Department permanently deleted');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', $th->getMessage());
        }
    }
}
