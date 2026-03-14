<?php

namespace App\Http\Controllers;

use App\Models\Subdepartment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmployeeSubdepartmentController extends Controller
{
    /**
     * Display a listing of subdepartments
     */
    public function index(Request $request)
    {
        $subdepartments = Subdepartment::with(['department:id,name'])
            ->select('id', 'name', 'department_id', 'status')
            ->withCount('employees')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('App/Admin/Employee/Subdepartment/Index', [
            'subdepartments' => $subdepartments,
        ]);
    }

    /**
     * List all subdepartments with optional filtering
     */
    public function listAll(Request $request)
    {
        try {
            $type = $request->query('type', 'list');
            $query = $request->query('query');
            $departmentId = $request->query('department_id');
            $status = $request->query('status', 'active');  // Default to active

            $subdepartmentsQuery = Subdepartment::with('department:id,name')
                ->select('id', 'name', 'department_id', 'status')
                ->withCount('employees');

            if ($status !== 'all') {
                $subdepartmentsQuery->where('status', $status);
            }

            if ($departmentId) {
                $subdepartmentsQuery->where('department_id', $departmentId);
            }

            if ($type == 'search') {
                // Search by name if query provided
                if (!empty($query)) {
                    $subdepartmentsQuery->where('name', 'like', "%$query%");
                } else {
                    $subdepartmentsQuery->latest()->take(5);
                }

                $subdepartments = $subdepartmentsQuery->get();

                return response()->json(['success' => true, 'results' => $subdepartments], 200);
            } else {
                $limit = $request->query('limit') ?? 10;
                $subdepartments = $subdepartmentsQuery->paginate($limit);
                return response()->json(['success' => true, 'message' => 'Subdepartments retrieved successfully', 'subdepartments' => $subdepartments], 200);
            }
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Store a newly created subdepartment
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'department_id' => 'required|exists:departments,id',
                'status' => 'nullable|in:active,inactive',
            ]);

            $subdepartment = Subdepartment::create([
                ...$validated,
                'status' => $request->status ?? 'active'
            ]);

            return response()->json(['success' => true, 'message' => 'Subdepartment created successfully', 'subdepartment' => $subdepartment], 201);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Update the specified subdepartment
     */
    public function update(Request $request, $id)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'department_id' => 'required|exists:departments,id',
                'status' => 'nullable|in:active,inactive',
            ]);

            $subdepartment = Subdepartment::findOrFail($id);
            $subdepartment->update($validated);

            return response()->json(['success' => true, 'message' => 'Subdepartment updated successfully', 'subdepartment' => $subdepartment], 200);
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
            $subdepartment = Subdepartment::findOrFail($id);
            $subdepartment->update(['status' => $request->status]);

            return response()->json(['success' => true, 'message' => 'Status updated successfully']);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Remove the specified subdepartment
     */
    public function destroy($id)
    {
        try {
            $subdepartment = Subdepartment::find($id);
            $subdepartment->delete();

            return response()->json(['success' => true, 'message' => 'Subdepartment deleted successfully'], 200);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Display a listing of trashed subdepartments.
     */
    public function trashed(Request $request)
    {
        $subdepartments = Subdepartment::onlyTrashed()
            ->with(['department:id,name'])
            ->select('id', 'name', 'department_id', 'deleted_at')
            ->orderByDesc('deleted_at')
            ->paginate(10);

        return Inertia::render('App/Admin/Employee/Subdepartment/Trashed', [
            'subdepartments' => $subdepartments,
        ]);
    }

    /**
     * Restore the specified trashed subdepartment.
     */
    public function restore($id)
    {
        try {
            $subdepartment = Subdepartment::onlyTrashed()->findOrFail($id);
            $subdepartment->restore();

            return redirect()->back()->with('success', 'Subdepartment restored successfully');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', $th->getMessage());
        }
    }

    /**
     * Permanently remove the specified subdepartment from storage.
     */
    public function forceDelete($id)
    {
        try {
            $subdepartment = Subdepartment::onlyTrashed()->findOrFail($id);
            $subdepartment->forceDelete();

            return redirect()->back()->with('success', 'Subdepartment permanently deleted');
        } catch (\Throwable $th) {
            return redirect()->back()->with('error', $th->getMessage());
        }
    }
}
