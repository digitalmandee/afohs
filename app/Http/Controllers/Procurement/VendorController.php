<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\CoaAccount;
use App\Models\PaymentAccount;
use App\Models\Tenant;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = Vendor::query()->with(['tenant:id,name', 'payableAccount:id,full_code,name', 'advanceAccount:id,full_code,name', 'defaultPaymentAccount:id,name']);

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

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        $summary = [
            'count' => (int) (clone $query)->count(),
            'active' => (int) (clone $query)->where('status', 'active')->count(),
            'inactive' => (int) (clone $query)->where('status', 'inactive')->count(),
            'opening_balance' => (float) ((clone $query)->sum('opening_balance') ?? 0),
            'approved' => (int) (clone $query)->where('approval_status', 'approved')->count(),
        ];

        $vendors = $query->orderBy('name')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/Procurement/Vendors/Index', [
            'vendors' => $vendors,
            'summary' => $summary,
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'coaAccounts' => Schema::hasTable('coa_accounts')
                ? CoaAccount::query()->where('is_postable', true)->where('is_active', true)->orderBy('full_code')->get(['id', 'full_code', 'name'])
                : collect(),
            'paymentAccounts' => PaymentAccount::query()->orderBy('name')->get(['id', 'name', 'tenant_id']),
            'filters' => $request->only(['search', 'status', 'tenant_id', 'per_page']),
            'error' => !Schema::hasTable('coa_accounts') ? 'Chart of Accounts is not configured yet. Vendor finance defaults are temporarily unavailable.' : null,
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('coa_accounts')) {
            $request->merge([
                'payable_account_id' => null,
                'advance_account_id' => null,
            ]);
        }

        $data = $request->validate([
            'code' => 'required|string|max:32|unique:vendors,code',
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tenant_id' => 'nullable|exists:tenants,id',
            'payment_terms_days' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:8',
            'opening_balance' => 'nullable|numeric',
            'payable_account_id' => 'nullable|exists:coa_accounts,id',
            'advance_account_id' => 'nullable|exists:coa_accounts,id',
            'default_payment_account_id' => 'nullable|exists:payment_accounts,id',
            'tax_treatment' => 'nullable|string|max:50',
            'approval_status' => 'required|in:approved,pending,blocked',
            'status' => 'required|in:active,inactive',
        ]);

        $data['created_by'] = $request->user()?->id;

        Vendor::create($data);

        return redirect()->back()->with('success', 'Vendor created.');
    }

    public function update(Request $request, Vendor $vendor)
    {
        if (!Schema::hasTable('coa_accounts')) {
            $request->merge([
                'payable_account_id' => null,
                'advance_account_id' => null,
            ]);
        }

        $data = $request->validate([
            'code' => 'required|string|max:32|unique:vendors,code,' . $vendor->id,
            'name' => 'required|string|max:255',
            'tax_id' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'tenant_id' => 'nullable|exists:tenants,id',
            'payment_terms_days' => 'nullable|integer|min:0',
            'currency' => 'nullable|string|max:8',
            'opening_balance' => 'nullable|numeric',
            'payable_account_id' => 'nullable|exists:coa_accounts,id',
            'advance_account_id' => 'nullable|exists:coa_accounts,id',
            'default_payment_account_id' => 'nullable|exists:payment_accounts,id',
            'tax_treatment' => 'nullable|string|max:50',
            'approval_status' => 'required|in:approved,pending,blocked',
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
