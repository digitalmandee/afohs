<?php

namespace App\Http\Controllers;

use App\Models\Designation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

class DesignationController extends Controller
{
    public function index(Request $request)
    {
        return \Inertia\Inertia::render('App/Admin/Employee/Designation');
    }

    public function fetchData(Request $request)
    {
        $query = Designation::query()->withCount('employees');

        if ($request->has('search')) {
            $search = $request->get('search');
            $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $designations = $query->orderBy('name')->paginate(10);

        return response()->json([
            'success' => true,
            'data' => $designations
        ]);
    }

    public function list()
    {
        $designations = Designation::where('status', 'active')
            ->orderBy('name')
            ->select('id', 'name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $designations
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:designations,name',
            'status' => 'required|in:active,inactive'
        ]);

        $designation = Designation::create([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
            'created_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Designation created successfully',
            'data' => $designation
        ]);
    }

    public function update(Request $request, Designation $designation)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:255', Rule::unique('designations')->ignore($designation->id)],
            'status' => 'required|in:active,inactive'
        ]);

        $designation->update([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
            'updated_by' => Auth::id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Designation updated successfully',
            'data' => $designation
        ]);
    }

    public function destroy(Designation $designation)
    {
        $designation->update(['deleted_by' => Auth::id()]);
        $designation->delete();

        return response()->json([
            'success' => true,
            'message' => 'Designation deleted successfully'
        ]);
    }

    public function trashed(Request $request)
    {
        $query = Designation::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->get('search');
            $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        }

        $designations = $query->orderBy('name')->paginate(10);

        return \Inertia\Inertia::render('App/Admin/Employee/DesignationTrashed', [
            'designations' => $designations
        ]);
    }

    public function restore($id)
    {
        $designation = Designation::onlyTrashed()->findOrFail($id);
        $designation->restore();

        return redirect()->back()->with('success', 'Designation restored successfully');
    }

    public function forceDelete($id)
    {
        $designation = Designation::onlyTrashed()->findOrFail($id);
        $designation->forceDelete();

        return redirect()->back()->with('success', 'Designation permanently deleted');
    }
}
