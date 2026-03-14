<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CorporateCompany;
use Illuminate\Http\Request;

class CorporateCompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = CorporateCompany::query();

        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->has('status')) {
            $query->where('status', $request->input('status'));
        }

        $companies = $query->orderBy('name')->get();

        return response()->json($companies);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:corporate_companies,name',
            'status' => 'required|in:active,inactive',
        ]);

        $company = CorporateCompany::create([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Corporate Company created successfully.',
            'company' => $company,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $company = CorporateCompany::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:corporate_companies,name,' . $id,
            'status' => 'required|in:active,inactive',
        ]);

        $company->update([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Corporate Company updated successfully.',
            'company' => $company,
        ]);
    }

    public function destroy($id)
    {
        $company = CorporateCompany::findOrFail($id);
        $company->delete();

        return response()->json([
            'message' => 'Corporate Company deleted successfully.',
        ]);
    }
}
