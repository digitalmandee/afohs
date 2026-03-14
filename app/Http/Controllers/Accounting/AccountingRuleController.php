<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingRule;
use App\Models\CoaAccount;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AccountingRuleController extends Controller
{
    public function index()
    {
        return Inertia::render('App/Admin/Accounting/Rules/Index', [
            'rules' => AccountingRule::orderBy('code')->paginate(25),
            'coaAccounts' => CoaAccount::query()
                ->where('is_active', true)
                ->orderBy('full_code')
                ->get(['id', 'full_code', 'name', 'type', 'level', 'is_postable']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'code' => 'required|string|max:255|unique:accounting_rules,code',
            'name' => 'required|string|max:255',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'nullable|exists:coa_accounts,id',
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
        $data = $request->validate([
            'code' => 'required|string|max:255|unique:accounting_rules,code,' . $accountingRule->id,
            'name' => 'required|string|max:255',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'nullable|exists:coa_accounts,id',
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
