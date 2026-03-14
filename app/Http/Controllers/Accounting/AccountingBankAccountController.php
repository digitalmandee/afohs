<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CoaAccount;
use App\Models\PaymentAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountingBankAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentAccount::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('method')) {
            $query->where('payment_method', $request->method);
        }

        return Inertia::render('App/Admin/Accounting/Banking/Accounts', [
            'accounts' => $query->orderByDesc('id')->paginate(25)->withQueryString(),
            'coaAccounts' => CoaAccount::orderBy('full_code')->get(['id', 'full_code', 'name']),
            'filters' => $request->only(['search', 'status', 'method']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'payment_method' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
            'coa_account_id' => 'nullable|exists:coa_accounts,id',
            'is_default' => 'boolean',
        ]);

        PaymentAccount::create($data);

        return redirect()->back()->with('success', 'Bank account created.');
    }

    public function update(Request $request, PaymentAccount $paymentAccount)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'payment_method' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
            'coa_account_id' => 'nullable|exists:coa_accounts,id',
            'is_default' => 'boolean',
        ]);

        $paymentAccount->update($data);

        return redirect()->back()->with('success', 'Bank account updated.');
    }

    public function destroy(PaymentAccount $paymentAccount)
    {
        $paymentAccount->delete();

        return redirect()->back()->with('success', 'Bank account removed.');
    }
}
