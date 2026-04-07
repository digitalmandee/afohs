<?php

namespace App\Services\Accounting\Vouchers;

use App\Models\AccountingEntityAccountMapping;
use App\Models\AccountingExpenseType;
use App\Models\CoaAccount;
use App\Models\Setting;
use App\Models\Vendor;
use Illuminate\Validation\ValidationException;

class AccountingVoucherMappingResolver
{
    public function resolveCounterpartyAccountId(array $data): int
    {
        if (!empty($data['expense_type_id'])) {
            return $this->resolveExpenseAccountId((int) ($data['expense_type_id'] ?? 0));
        }

        $isExpensePayment = in_array((string) ($data['voucher_type'] ?? ''), ['CPV', 'BPV'], true)
            && (string) ($data['payment_for'] ?? '') === 'expense';
        if ($isExpensePayment) {
            $defaultExpenseId = $this->resolveDefaultExpenseAccountId();
            if ($defaultExpenseId > 0) {
                return $defaultExpenseId;
            }

            throw ValidationException::withMessages([
                'expense_type_id' => 'Select Expense Type or configure Default Expense Account in Voucher Mappings.',
            ]);
        }

        $partyType = (string) ($data['party_type'] ?? 'none');
        $partyId = (int) ($data['party_id'] ?? 0);
        $role = in_array((string) ($data['voucher_type'] ?? ''), ['CPV', 'BPV'], true) ? 'payable' : 'receivable';

        if ($partyType === 'vendor') {
            $vendor = Vendor::query()->find($partyId);
            if ($vendor?->payable_account_id && $this->isActivePostableAccount((int) $vendor->payable_account_id)) {
                return (int) $vendor->payable_account_id;
            }
        }

        $mappedId = AccountingEntityAccountMapping::query()
            ->where('entity_type', $partyType)
            ->where('entity_id', $partyId)
            ->where('role', $role)
            ->where('is_active', true)
            ->value('account_id');

        if ($mappedId) {
            return (int) $mappedId;
        }

        $fallbackId = $this->resolveDefaultRoleAccountId($role);
        if ($fallbackId > 0) {
            return $fallbackId;
        }

        throw ValidationException::withMessages([
            'party_id' => $this->buildMissingRoleMessage($role, $partyType),
        ]);
    }

    public function resolveExpenseAccountId(int $expenseTypeId): int
    {
        $type = AccountingExpenseType::query()
            ->whereKey($expenseTypeId)
            ->where('is_active', true)
            ->first();

        if (!$type?->expense_account_id) {
            throw ValidationException::withMessages([
                'expense_type_id' => 'Selected expense type has no mapped expense account.',
            ]);
        }

        if (!CoaAccount::query()->whereKey($type->expense_account_id)->where('is_active', true)->where('is_postable', true)->exists()) {
            throw ValidationException::withMessages([
                'expense_type_id' => 'Selected expense type is mapped to an inactive or non-postable account.',
            ]);
        }

        return (int) $type->expense_account_id;
    }

    public function resolveDefaultExpenseAccountId(): int
    {
        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $fallbackId = (int) ($defaults['default_expense_account_id'] ?? config('accounting.vouchers.default_expense_account_id', 0));
        if ($fallbackId > 0 && $this->isActivePostableAccount($fallbackId)) {
            return $fallbackId;
        }

        return 0;
    }

    public function resolveDefaultRoleAccountId(string $role): int
    {
        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $fallbackConfigKey = $role === 'payable' ? 'default_payable_account_id' : 'default_receivable_account_id';
        $fallbackId = (int) ($defaults[$fallbackConfigKey] ?? config('accounting.vouchers.' . $fallbackConfigKey, 0));

        return $fallbackId > 0 && $this->isActivePostableAccount($fallbackId) ? $fallbackId : 0;
    }

    private function isActivePostableAccount(int $accountId): bool
    {
        return CoaAccount::query()
            ->whereKey($accountId)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->exists();
    }

    private function buildMissingRoleMessage(string $role, string $partyType): string
    {
        $entityLabel = match ($partyType) {
            'customer' => 'customer',
            'member' => 'member',
            'corporate_member' => 'corporate member',
            'vendor' => 'vendor',
            default => 'selected entity',
        };

        $defaultLabel = $role === 'receivable' ? 'Default Receivable Account' : 'Default Payable Account';

        return "No active {$role} account mapping was found for the selected {$entityLabel}. Add an entity mapping in Voucher Mappings or configure {$defaultLabel}.";
    }
}
