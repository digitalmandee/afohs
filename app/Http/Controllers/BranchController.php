<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index()
    {
        $branches = Branch::latest()->paginate(10);
        return Inertia::render('App/Admin/Employee/Branch/Index', ['branches' => $branches]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Employee/Branch/Create');
    }

    public function store(Request $request)
    {
        $request->validate(['name' => 'required|string|max:255']);
        Branch::create($request->all());
        return redirect()->route('branches.index')->with('success', 'Branch created successfully.');
    }

    public function edit(Branch $branch)
    {
        return Inertia::render('App/Admin/Employee/Branch/Edit', ['branch' => $branch]);
    }

    public function update(Request $request, Branch $branch)
    {
        $request->validate(['name' => 'required|string|max:255']);
        $branch->update($request->all());
        return redirect()->route('branches.index')->with('success', 'Branch updated successfully.');
    }

    public function destroy(Branch $branch)
    {
        $branch->delete();
        return redirect()->back()->with('success', 'Branch deleted successfully.');
    }

    public function list()
    {
        $branches = Branch::where('status', true)->select('id', 'name')->get();
        return response()->json(['success' => true, 'branches' => $branches]);
    }

    public function trashed()
    {
        $branches = Branch::onlyTrashed()->paginate(10);
        return Inertia::render('App/Admin/Employee/Branch/Trashed', ['branches' => $branches]);
    }

    public function restore($id)
    {
        Branch::withTrashed()->find($id)->restore();
        return redirect()->back()->with('success', 'Branch restored successfully.');
    }

    public function forceDelete($id)
    {
        Branch::withTrashed()->find($id)->forceDelete();
        return redirect()->back()->with('success', 'Branch permanently deleted.');
    }
}
