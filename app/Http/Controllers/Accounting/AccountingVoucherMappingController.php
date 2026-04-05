<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntityAccountMapping;
use App\Models\AccountingExpenseType;
use App\Models\CoaAccount;
use App\Models\Setting;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountingVoucherMappingController extends Controller
{
    public function index()
    {
        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $payableDefault = (int) ($defaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0));
        $receivableDefault = (int) ($defaults['default_receivable_account_id'] ?? config('accounting.vouchers.default_receivable_account_id', 0));

        $accounts = CoaAccount::query()
            ->where('is_active', true)
            ->where('is_postable', true)
            ->orderBy('full_code')
            ->get(['id', 'full_code', 'name', 'type']);

        $mappings = AccountingEntityAccountMapping::query()
            ->with('account:id,full_code,name,is_active,is_postable')
            ->latest('id')
            ->limit(250)
            ->get();

        $expenseTypes = AccountingExpenseType::query()
            ->with('expenseAccount:id,full_code,name,is_active,is_postable')
            ->orderBy('name')
            ->get();

        $health = [
            'unmapped_vendors' => Vendor::query()->where('status', 'active')->whereNull('payable_account_id')->count(),
            'inactive_or_non_postable_mappings' => $mappings->filter(fn ($m) => !$m->account || !$m->account->is_active || !$m->account->is_postable)->count(),
            'missing_default_payable' => $payableDefault <= 0,
            'missing_default_receivable' => $receivableDefault <= 0,
        ];

        return Inertia::render('App/Admin/Accounting/VoucherMappings/Index', [
            'accounts' => $accounts,
            'mappings' => $mappings,
            'expenseTypes' => $expenseTypes,
            'defaults' => [
                'default_payable_account_id' => $payableDefault > 0 ? $payableDefault : '',
                'default_receivable_account_id' => $receivableDefault > 0 ? $receivableDefault : '',
            ],
            'health' => $health,
        ]);
    }

    public function upsertEntityMapping(Request $request)
    {
        $data = $request->validate([
            'entity_type' => 'required|in:vendor,customer,member,corporate_member',
            'entity_id' => 'required|integer|min:1',
            'role' => 'required|in:payable,receivable',
            'account_id' => ['required', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
            'is_active' => 'nullable|boolean',
        ]);

        AccountingEntityAccountMapping::query()->updateOrCreate(
            [
                'entity_type' => $data['entity_type'],
                'entity_id' => (int) $data['entity_id'],
                'role' => $data['role'],
            ],
            [
                'account_id' => (int) $data['account_id'],
                'is_active' => (bool) ($data['is_active'] ?? true),
                'created_by' => $request->user()?->id,
                'updated_by' => $request->user()?->id,
            ]
        );

        return redirect()->back()->with('success', 'Entity mapping saved.');
    }

    public function upsertExpenseType(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|exists:accounting_expense_types,id',
            'code' => 'required|string|max:30',
            'name' => 'required|string|max:120',
            'expense_account_id' => ['required', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
            'is_active' => 'nullable|boolean',
        ]);

        AccountingExpenseType::query()->updateOrCreate(
            ['id' => $data['id'] ?? null],
            [
                'code' => $data['code'],
                'name' => $data['name'],
                'expense_account_id' => (int) $data['expense_account_id'],
                'is_active' => (bool) ($data['is_active'] ?? true),
                'created_by' => $request->user()?->id,
                'updated_by' => $request->user()?->id,
            ]
        );

        return redirect()->back()->with('success', 'Expense type mapping saved.');
    }

    public function updateDefaults(Request $request)
    {
        $data = $request->validate([
            'default_payable_account_id' => ['required', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
            'default_receivable_account_id' => ['required', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
        ]);

        Setting::updateGroup('accounting_voucher_defaults', [
            'default_payable_account_id' => (int) $data['default_payable_account_id'],
            'default_receivable_account_id' => (int) $data['default_receivable_account_id'],
        ]);

        return redirect()->back()->with('success', 'Voucher default accounts updated.');
    }
}

