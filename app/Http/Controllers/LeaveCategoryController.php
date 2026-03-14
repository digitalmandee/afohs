<?php

namespace App\Http\Controllers;

use App\Models\LeaveCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LeaveCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        $leaveCategories = LeaveCategory::orderByDesc('created_at')->paginate(10);

        return Inertia::render('App/Admin/Employee/Attendance/LeaveCategory/Index', [
            'leaveCategories' => $leaveCategories
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Employee/Attendance/LeaveCategory/Create');
    }

    public function edit($id)
    {
        $leaveCategory = LeaveCategory::findOrFail($id);

        return Inertia::render('App/Admin/Employee/Attendance/LeaveCategory/Edit', [
            'leaveCategory' => $leaveCategory
        ]);
    }

    public function getAll(Request $request)
    {
        $leaveCategories = LeaveCategory::where('status', 'published')->select('id', 'color', 'name')->orderByDesc('created_at')->get();

        return response()->json(['success' => true, 'categories' => $leaveCategories]);
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
            'color' => 'required|string',
            'description' => 'required|string',
            'short_code' => 'required|string|max:50',
        ]);

        try {
            LeaveCategory::create([
                'name' => $request->name,
                'color' => $request->color,
                'description' => $request->description,
                'short_code' => $request->short_code
            ]);

            return response()->json(['success' => true, 'message' => 'Leave Category created successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $leaveCategory = LeaveCategory::find($id);

        return response()->json(['success' => true, 'leave_category' => $leaveCategory]);
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
            'color' => 'required|string',
            'description' => 'required|string',
            'short_code' => 'required|string|max:50',
            'status' => 'required|in:published,draft',
        ]);

        try {
            LeaveCategory::find($id)->update([
                'name' => $request->name,
                'color' => $request->color,
                'description' => $request->description,
                'short_code' => $request->short_code,
                'status' => $request->status,
            ]);

            return response()->json(['success' => true, 'message' => 'Leave Category updated successfully'], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
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
            LeaveCategory::find($id)->delete();
            return response()->json(['success' => true, 'message' => 'Leave Category deleted successfully'], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
