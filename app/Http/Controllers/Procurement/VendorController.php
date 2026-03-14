<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = Vendor::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('status', $request->status);
        }

        $summary = [
            'count' => (int) (clone $query)->count(),
            'active' => (int) (clone $query)->where('status', 'active')->count(),
            'inactive' => (int) (clone $query)->where('status', 'inactive')->count(),
            'opening_balance' => (float) ((clone $query)->sum('opening_balance') ?? 0),
        ];

        $vendors = $query->orderBy('name')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/Procurement/Vendors/Index', [
            'vendors' => $vendors,
            'summary' => $summary,
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:32|unique:vendors,code',
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'payment_terms_days' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:8',
            'opening_balance' => 'nullable|numeric',
            'status' => 'required|in:active,inactive',
        ]);

        $data['created_by'] = $request->user()?->id;

        Vendor::create($data);

        return redirect()->back()->with('success', 'Vendor created.');
    }

    public function update(Request $request, Vendor $vendor)
    {
        $data = $request->validate([
            'code' => 'required|string|max:32|unique:vendors,code,' . $vendor->id,
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'payment_terms_days' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:8',
            'opening_balance' => 'nullable|numeric',
            'status' => 'required|in:active,inactive',
        ]);

        $data['updated_by'] = $request->user()?->id;

        $vendor->update($data);

        return redirect()->back()->with('success', 'Vendor updated.');
    }

    public function destroy(Vendor $vendor)
    {
        $vendor->delete();

        return redirect()->back()->with('success', 'Vendor removed.');
    }
}
