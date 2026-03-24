<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\CoaAccount;
use App\Models\PaymentAccount;
use App\Services\Accounting\Support\AccountingHealth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountingBankAccountController extends Controller
{
    public function index(Request $request)
    {
        $health = app(AccountingHealth::class);
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
        $status = $health->status(
            requiredTables: ['payment_accounts'],
            optionalTables: ['coa_accounts']
        );

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/Banking/Accounts', [
                'accounts' => $health->emptyPaginator($request, $perPage),
                'coaAccounts' => collect(),
                'filters' => $request->only(['search', 'status', 'method', 'per_page']),
                'error' => $health->setupMessage('Bank Accounts', $status['missing_required'], $status['missing_optional']),
            ]);
        }

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
            'accounts' => $query->orderByDesc('id')->paginate($perPage)->withQueryString(),
            'coaAccounts' => Schema::hasTable('coa_accounts')
                ? CoaAccount::query()->operationalPosting()->orderBy('full_code')->get(['id', 'full_code', 'name', 'type', 'normal_balance', 'level', 'is_postable'])
                : collect(),
            'filters' => $request->only(['search', 'status', 'method', 'per_page']),
            'error' => !empty($status['missing_optional'])
                ? $health->setupMessage('Bank Accounts', [], $status['missing_optional'])
                : null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'payment_method' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
            'coa_account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
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
            'coa_account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
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
