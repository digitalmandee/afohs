<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query()->latest();
        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('branch_code', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }
        $branches = $query->paginate(10)->withQueryString();
        return Inertia::render('App/Admin/Employee/Branch/Index', ['branches' => $branches]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Employee/Branch/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'branch_code' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9]+$/', Rule::unique('branches', 'branch_code')],
            'address' => 'nullable|string|max:500',
            'status' => 'required|boolean',
        ]);
        $data['branch_code'] = strtoupper(trim((string) $data['branch_code']));

        Branch::create($data);
        return redirect()->route('branches.index')->with('success', 'Branch created successfully.');
    }

    public function edit(Branch $branch)
    {
        return Inertia::render('App/Admin/Employee/Branch/Edit', ['branch' => $branch]);
    }

    public function update(Request $request, Branch $branch)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'branch_code' => ['required', 'string', 'max:20', 'regex:/^[A-Za-z0-9]+$/', Rule::unique('branches', 'branch_code')->ignore($branch->id)],
            'address' => 'nullable|string|max:500',
            'status' => 'required|boolean',
        ]);
        $data['branch_code'] = strtoupper(trim((string) $data['branch_code']));

        $branch->update($data);
        return redirect()->route('branches.index')->with('success', 'Branch updated successfully.');
    }

    public function destroy(Branch $branch)
    {
        $branch->delete();
        return redirect()->back()->with('success', 'Branch deleted successfully.');
    }

    public function list()
    {
        $branches = Branch::where('status', true)->select('id', 'name', 'branch_code')->get();
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
