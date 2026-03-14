<?php

namespace App\Http\Controllers;

use App\Models\CorporateCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CorporateCompanyController extends Controller
{
    public function __construct()
    {
        // Permissions can be added later if needed, for now assuming admin access or use existing permissions
        // $this->middleware('permission:corporate-companies.view')->only('index');
    }

    public function index()
    {
        $companies = CorporateCompany::all();
        return Inertia::render('App/Admin/CorporateMembership/Company/Index', compact('companies'));
    }

    public function create()
    {
        return Inertia::render('App/Admin/CorporateMembership/Company/AddEdit');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:corporate_companies,name',
            'status' => 'required|in:active,inactive',
        ]);

        CorporateCompany::create($request->all());

        return response()->json(['message' => 'Corporate Company created successfully']);
    }

    public function edit($id)
    {
        $company = CorporateCompany::findOrFail($id);
        return Inertia::render('App/Admin/CorporateMembership/Company/AddEdit', compact('company'));
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:corporate_companies,name,' . $id,
            'status' => 'required|in:active,inactive',
        ]);

        $company = CorporateCompany::findOrFail($id);
        $company->update($request->all());

        return response()->json(['message' => 'Corporate Company updated successfully']);
    }

    public function destroy($id)
    {
        $company = CorporateCompany::findOrFail($id);
        $company->delete();

        return response()->json(['message' => 'Corporate Company deleted successfully']);
    }

    public function trashed(Request $request)
    {
        $query = CorporateCompany::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $companies = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/CorporateMembership/Company/Trashed', [
            'companies' => $companies,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $company = CorporateCompany::withTrashed()->findOrFail($id);
        $company->restore();

        return redirect()->back()->with('success', 'Corporate Company restored successfully.');
    }
}
