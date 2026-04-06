<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntityAccountMapping;
use App\Models\AccountingExpenseType;
use App\Models\CoaAccount;
use App\Models\CorporateMember;
use App\Models\Customer;
use App\Models\Member;
use App\Models\Setting;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class AccountingVoucherMappingController extends Controller
{
    public function index()
    {
        $this->autoAssignVendorDefaults();

        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $payableDefault = (int) ($defaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0));
        $advanceDefault = (int) ($defaults['default_advance_account_id'] ?? config('accounting.vouchers.default_advance_account_id', 0));
        $expenseDefault = (int) ($defaults['default_expense_account_id'] ?? config('accounting.vouchers.default_expense_account_id', 0));
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
        $mappingIndex = AccountingEntityAccountMapping::query()
            ->where('is_active', true)
            ->get(['id', 'entity_type', 'entity_id', 'role', 'account_id'])
            ->keyBy(fn ($row) => "{$row->entity_type}:{$row->entity_id}:{$row->role}");

        $memberNameColumn = $this->firstExistingColumn('members', ['name', 'full_name', 'first_name']);
        $corporateMemberNameColumn = $this->firstExistingColumn('corporate_members', ['name', 'full_name', 'first_name']);

        $entityCandidates = collect()
            ->concat(
                Vendor::query()
                    ->orderBy('name')
                    ->get(['id', 'code', 'name', 'status', 'payable_account_id', 'advance_account_id'])
                    ->flatMap(function ($vendor) use ($mappingIndex) {
                        $payableMapping = $mappingIndex->get("vendor:{$vendor->id}:payable");
                        $advanceMapping = $mappingIndex->get("vendor:{$vendor->id}:advance");
                        $payableAccountId = $payableMapping?->account_id ?: $vendor->payable_account_id;
                        $advanceAccountId = $advanceMapping?->account_id ?: $vendor->advance_account_id;

                        return [
                            [
                                'entity_type' => 'vendor',
                                'entity_id' => (int) $vendor->id,
                                'entity_code' => (string) ($vendor->code ?: ''),
                                'entity_name' => (string) $vendor->name,
                                'status' => (string) ($vendor->status ?: 'active'),
                                'role' => 'payable',
                                'mapping_id' => $payableMapping?->id,
                                'account_id' => $payableAccountId ? (int) $payableAccountId : null,
                                'is_mapped' => (bool) ($payableAccountId),
                                'mapping_source' => $payableMapping ? 'entity_mapping' : ($vendor->payable_account_id ? 'vendor_default' : null),
                            ],
                            [
                                'entity_type' => 'vendor',
                                'entity_id' => (int) $vendor->id,
                                'entity_code' => (string) ($vendor->code ?: ''),
                                'entity_name' => (string) $vendor->name,
                                'status' => (string) ($vendor->status ?: 'active'),
                                'role' => 'advance',
                                'mapping_id' => $advanceMapping?->id,
                                'account_id' => $advanceAccountId ? (int) $advanceAccountId : null,
                                'is_mapped' => (bool) ($advanceAccountId),
                                'mapping_source' => $advanceMapping ? 'entity_mapping' : ($vendor->advance_account_id ? 'vendor_default' : null),
                            ],
                        ];
                    })
            )
            ->concat(
                Customer::query()->orderBy('name')->get(['id', 'name'])->map(function ($customer) use ($mappingIndex) {
                    $mapping = $mappingIndex->get("customer:{$customer->id}:receivable");
                    return [
                        'entity_type' => 'customer',
                        'entity_id' => (int) $customer->id,
                        'entity_code' => '',
                        'entity_name' => (string) $customer->name,
                        'status' => 'active',
                        'role' => 'receivable',
                        'mapping_id' => $mapping?->id,
                        'account_id' => $mapping?->account_id ? (int) $mapping->account_id : null,
                        'is_mapped' => (bool) ($mapping?->account_id),
                        'mapping_source' => $mapping ? 'entity_mapping' : null,
                    ];
                })
            )
            ->concat(
                Member::query()
                    ->orderBy($memberNameColumn ?: 'id')
                    ->get(array_values(array_unique(['id', $memberNameColumn ?: 'id'])))
                    ->map(function ($member) use ($mappingIndex, $memberNameColumn) {
                    $mapping = $mappingIndex->get("member:{$member->id}:receivable");
                    $memberName = $memberNameColumn ? data_get($member, $memberNameColumn) : "Member #{$member->id}";
                    return [
                        'entity_type' => 'member',
                        'entity_id' => (int) $member->id,
                        'entity_code' => '',
                        'entity_name' => (string) ($memberName ?: "Member #{$member->id}"),
                        'status' => 'active',
                        'role' => 'receivable',
                        'mapping_id' => $mapping?->id,
                        'account_id' => $mapping?->account_id ? (int) $mapping->account_id : null,
                        'is_mapped' => (bool) ($mapping?->account_id),
                        'mapping_source' => $mapping ? 'entity_mapping' : null,
                    ];
                })
            )
            ->concat(
                CorporateMember::query()
                    ->orderBy($corporateMemberNameColumn ?: 'id')
                    ->get(array_values(array_unique(['id', $corporateMemberNameColumn ?: 'id'])))
                    ->map(function ($corp) use ($mappingIndex, $corporateMemberNameColumn) {
                    $mapping = $mappingIndex->get("corporate_member:{$corp->id}:receivable");
                    $corpName = $corporateMemberNameColumn ? data_get($corp, $corporateMemberNameColumn) : "Corporate Member #{$corp->id}";
                    return [
                        'entity_type' => 'corporate_member',
                        'entity_id' => (int) $corp->id,
                        'entity_code' => '',
                        'entity_name' => (string) ($corpName ?: "Corporate Member #{$corp->id}"),
                        'status' => 'active',
                        'role' => 'receivable',
                        'mapping_id' => $mapping?->id,
                        'account_id' => $mapping?->account_id ? (int) $mapping->account_id : null,
                        'is_mapped' => (bool) ($mapping?->account_id),
                        'mapping_source' => $mapping ? 'entity_mapping' : null,
                    ];
                })
            )
            ->sortBy([
                ['entity_type', 'asc'],
                ['entity_name', 'asc'],
                ['role', 'asc'],
            ])
            ->values();

        $expenseTypes = AccountingExpenseType::query()
            ->with('expenseAccount:id,full_code,name,is_active,is_postable')
            ->orderBy('name')
            ->get();

        $health = [
            'unmapped_vendors' => Vendor::query()
                ->where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('payable_account_id')
                        ->orWhereNull('advance_account_id');
                })
                ->count(),
            'inactive_or_non_postable_mappings' => $mappings->filter(fn ($m) => !$m->account || !$m->account->is_active || !$m->account->is_postable)->count(),
            'missing_default_payable' => $payableDefault <= 0,
            'missing_default_advance' => $advanceDefault <= 0,
            'missing_default_expense' => $expenseDefault <= 0,
            'missing_default_receivable' => $receivableDefault <= 0,
        ];

        return Inertia::render('App/Admin/Accounting/VoucherMappings/Index', [
            'accounts' => $accounts,
            'mappings' => $mappings,
            'entityCandidates' => $entityCandidates,
            'expenseTypes' => $expenseTypes,
            'defaults' => [
                'default_payable_account_id' => $payableDefault > 0 ? $payableDefault : '',
                'default_advance_account_id' => $advanceDefault > 0 ? $advanceDefault : '',
                'default_expense_account_id' => $expenseDefault > 0 ? $expenseDefault : '',
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
            'role' => 'required|in:payable,advance,receivable',
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
            'expense_account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
            'is_active' => 'nullable|boolean',
        ]);

        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $defaultExpenseId = (int) ($defaults['default_expense_account_id'] ?? config('accounting.vouchers.default_expense_account_id', 0));
        $resolvedExpenseAccountId = (int) ($data['expense_account_id'] ?? 0);
        if ($resolvedExpenseAccountId <= 0 && $defaultExpenseId > 0) {
            $resolvedExpenseAccountId = $defaultExpenseId;
        }
        if ($resolvedExpenseAccountId <= 0) {
            return redirect()->back()->withErrors([
                'expense_account_id' => 'Select expense account or configure Default Expense Account in Voucher Mappings.',
            ]);
        }

        AccountingExpenseType::query()->updateOrCreate(
            ['id' => $data['id'] ?? null],
            [
                'code' => $data['code'],
                'name' => $data['name'],
                'expense_account_id' => $resolvedExpenseAccountId,
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
            'default_advance_account_id' => ['required', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
            'default_expense_account_id' => ['required', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
            'default_receivable_account_id' => ['required', Rule::exists('coa_accounts', 'id')->where(fn ($q) => $q->where('is_active', true)->where('is_postable', true))],
        ]);

        Setting::updateGroup('accounting_voucher_defaults', [
            'default_payable_account_id' => (int) $data['default_payable_account_id'],
            'default_advance_account_id' => (int) $data['default_advance_account_id'],
            'default_expense_account_id' => (int) $data['default_expense_account_id'],
            'default_receivable_account_id' => (int) $data['default_receivable_account_id'],
        ]);

        $this->autoAssignVendorDefaults();

        return redirect()->back()->with('success', 'Voucher default accounts updated.');
    }

    private function firstExistingColumn(string $table, array $candidates): ?string
    {
        foreach ($candidates as $column) {
            if (Schema::hasColumn($table, $column)) {
                return $column;
            }
        }

        return null;
    }

    private function autoAssignVendorDefaults(): void
    {
        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $payableDefault = (int) ($defaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0));
        $advanceDefault = (int) ($defaults['default_advance_account_id'] ?? config('accounting.vouchers.default_advance_account_id', 0));

        $payableValid = $this->isValidPostableAccountId($payableDefault);
        $advanceValid = $this->isValidPostableAccountId($advanceDefault);

        if (!$payableValid && !$advanceValid) {
            return;
        }

        Vendor::query()
            ->where('status', 'active')
            ->where(function ($query) use ($payableValid, $advanceValid) {
                if ($payableValid) {
                    $query->whereNull('payable_account_id');
                }
                if ($advanceValid) {
                    $method = $payableValid ? 'orWhereNull' : 'whereNull';
                    $query->{$method}('advance_account_id');
                }
            })
            ->chunkById(100, function ($vendors) use ($payableDefault, $advanceDefault, $payableValid, $advanceValid) {
                foreach ($vendors as $vendor) {
                    $updates = [];
                    if ($payableValid && !$vendor->payable_account_id) {
                        $updates['payable_account_id'] = $payableDefault;
                    }
                    if ($advanceValid && !$vendor->advance_account_id) {
                        $updates['advance_account_id'] = $advanceDefault;
                    }
                    if (!empty($updates)) {
                        $vendor->update($updates);
                    }
                }
            });
    }

    private function isValidPostableAccountId(int $accountId): bool
    {
        if ($accountId <= 0) {
            return false;
        }

        return CoaAccount::query()
            ->whereKey($accountId)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->exists();
    }
}
