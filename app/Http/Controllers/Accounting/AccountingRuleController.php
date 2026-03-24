<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingRule;
use App\Models\CoaAccount;
use App\Services\Accounting\Support\AccountingHealth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountingRuleController extends Controller
{
    public function index(Request $request)
    {
        $health = app(AccountingHealth::class);
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
        $query = AccountingRule::query();

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['active', 'inactive'], true)) {
            $query->where('is_active', $request->status === 'active');
        }

        return Inertia::render('App/Admin/Accounting/Rules/Index', [
            'rules' => $query->orderBy('code')->paginate($perPage)->withQueryString(),
            'coaAccounts' => Schema::hasTable('coa_accounts')
                ? CoaAccount::query()
                    ->operationalPosting()
                    ->orderBy('full_code')
                    ->get(['id', 'full_code', 'name', 'type', 'normal_balance', 'level', 'is_postable'])
                : collect(),
            'filters' => $request->only(['search', 'status', 'per_page']),
            'error' => !Schema::hasTable('coa_accounts') ? $health->setupMessage('Accounting Rules', [], ['coa_accounts']) : null,
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('coa_accounts')) {
            return redirect()->back()->with('error', 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.');
        }

        $data = $request->validate([
            'code' => 'required|string|max:255|unique:accounting_rules,code',
            'name' => 'required|string|max:255',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
            'lines.*.side' => 'required|in:debit,credit',
            'lines.*.ratio' => 'nullable|numeric|min:0',
            'lines.*.use_payment_account' => 'nullable|boolean',
            'is_active' => 'boolean',
        ]);

        $data['lines'] = $this->normalizeAndValidateLines($data['lines']);
        $data['created_by'] = $request->user()?->id;
        $data['updated_by'] = $request->user()?->id;
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        AccountingRule::create($data);

        return redirect()->back()->with('success', 'Posting rule created.');
    }

    public function update(Request $request, AccountingRule $accountingRule)
    {
        if (!Schema::hasTable('coa_accounts')) {
            return redirect()->back()->with('error', 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.');
        }

        $data = $request->validate([
            'code' => 'required|string|max:255|unique:accounting_rules,code,' . $accountingRule->id,
            'name' => 'required|string|max:255',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
            'lines.*.side' => 'required|in:debit,credit',
            'lines.*.ratio' => 'nullable|numeric|min:0',
            'lines.*.use_payment_account' => 'nullable|boolean',
            'is_active' => 'boolean',
        ]);

        $data['lines'] = $this->normalizeAndValidateLines($data['lines']);
        $data['updated_by'] = $request->user()?->id;
        $data['is_active'] = (bool) ($data['is_active'] ?? true);

        $accountingRule->update($data);

        return redirect()->back()->with('success', 'Posting rule updated.');
    }

    public function destroy(AccountingRule $accountingRule)
    {
        $accountingRule->delete();

        return redirect()->back()->with('success', 'Posting rule removed.');
    }

    private function normalizeAndValidateLines(array $lines): array
    {
        $normalized = [];
        $hasDebit = false;
        $hasCredit = false;

        foreach ($lines as $index => $line) {
            $usePaymentAccount = (bool) ($line['use_payment_account'] ?? false);
            $accountId = $line['account_id'] ?? null;
            $side = (string) ($line['side'] ?? '');
            $ratio = (float) ($line['ratio'] ?? 1);

            if (!$usePaymentAccount && empty($accountId)) {
                throw ValidationException::withMessages([
                    "lines.{$index}.account_id" => 'Account is required unless Bank Map is enabled for this line.',
                ]);
            }

            if ($ratio <= 0) {
                throw ValidationException::withMessages([
                    "lines.{$index}.ratio" => 'Ratio must be greater than zero.',
                ]);
            }

            if ($side === 'debit') {
                $hasDebit = true;
            }
            if ($side === 'credit') {
                $hasCredit = true;
            }

            $normalized[] = [
                'account_id' => $accountId ? (int) $accountId : null,
                'side' => $side,
                'ratio' => $ratio,
                'use_payment_account' => $usePaymentAccount,
            ];
        }

        if (!$hasDebit || !$hasCredit) {
            throw ValidationException::withMessages([
                'lines' => 'Each posting rule must contain at least one debit and one credit line.',
            ]);
        }

        return $normalized;
    }
}
