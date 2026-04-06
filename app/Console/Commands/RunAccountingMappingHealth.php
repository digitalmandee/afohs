<?php

namespace App\Console\Commands;

use App\Models\AccountingExpenseType;
use App\Models\CoaAccount;
use App\Models\Setting;
use App\Models\Vendor;
use App\Services\OperationalAuditLogger;
use Illuminate\Console\Command;

class RunAccountingMappingHealth extends Command
{
    protected $signature = 'accounting:mappings:health {--heal : Auto-apply deterministic fixes}';

    protected $description = 'Verify voucher mapping defaults and optionally auto-heal vendor/expense mappings.';

    public function __construct(
        private readonly OperationalAuditLogger $auditLogger
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $heal = (bool) $this->option('heal');
        $defaults = Setting::getGroup('accounting_voucher_defaults');

        $defaultPayable = $this->validPostableId((int) ($defaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0)));
        $defaultAdvance = $this->validPostableId((int) ($defaults['default_advance_account_id'] ?? config('accounting.vouchers.default_advance_account_id', 0)));
        $defaultExpense = $this->validPostableId((int) ($defaults['default_expense_account_id'] ?? config('accounting.vouchers.default_expense_account_id', 0)));
        $defaultReceivable = $this->validPostableId((int) ($defaults['default_receivable_account_id'] ?? config('accounting.vouchers.default_receivable_account_id', 0)));

        $this->table(
            ['Default', 'Status', 'Account ID'],
            [
                ['Payable', $defaultPayable ? 'OK' : 'Missing/Invalid', $defaultPayable ?: '-'],
                ['Advance', $defaultAdvance ? 'OK' : 'Missing/Invalid', $defaultAdvance ?: '-'],
                ['Expense', $defaultExpense ? 'OK' : 'Missing/Invalid', $defaultExpense ?: '-'],
                ['Receivable', $defaultReceivable ? 'OK' : 'Missing/Invalid', $defaultReceivable ?: '-'],
            ]
        );

        $activeVendors = Vendor::query()->where('status', 'active')->get(['id', 'name', 'payable_account_id', 'advance_account_id']);
        $missingVendorPayable = $activeVendors->filter(fn (Vendor $vendor) => !$this->validPostableId((int) ($vendor->payable_account_id ?? 0)));
        $missingVendorAdvance = $activeVendors->filter(fn (Vendor $vendor) => !$this->validPostableId((int) ($vendor->advance_account_id ?? 0)));

        $expenseTypes = AccountingExpenseType::query()->where('is_active', true)->get(['id', 'code', 'name', 'expense_account_id']);
        $missingExpenseMap = $expenseTypes->filter(fn (AccountingExpenseType $type) => !$this->validPostableId((int) ($type->expense_account_id ?? 0)));

        $healedVendors = 0;
        $healedExpenseTypes = 0;

        if ($heal) {
            foreach ($activeVendors as $vendor) {
                $updates = [];
                if (!$this->validPostableId((int) ($vendor->payable_account_id ?? 0)) && $defaultPayable) {
                    $updates['payable_account_id'] = $defaultPayable;
                }
                if (!$this->validPostableId((int) ($vendor->advance_account_id ?? 0)) && $defaultAdvance) {
                    $updates['advance_account_id'] = $defaultAdvance;
                }
                if (!empty($updates)) {
                    $vendor->update($updates);
                    $healedVendors++;
                }
            }

            if ($defaultExpense) {
                foreach ($expenseTypes as $type) {
                    if (!$this->validPostableId((int) ($type->expense_account_id ?? 0))) {
                        $type->update(['expense_account_id' => $defaultExpense]);
                        $healedExpenseTypes++;
                    }
                }
            }

            $this->line("Auto-heal applied: vendors={$healedVendors}, expense_types={$healedExpenseTypes}");
        }

        $this->auditLogger->record([
            'module' => 'accounting',
            'entity_type' => 'mapping_health',
            'entity_id' => 'voucher_defaults',
            'action' => 'accounting.mappings.health.checked',
            'status' => 'validated',
            'severity' => ($missingVendorPayable->isEmpty() && $missingVendorAdvance->isEmpty() && $missingExpenseMap->isEmpty()) ? 'info' : 'warning',
            'message' => 'Accounting mapping health check completed.',
            'context' => [
                'heal_mode' => $heal,
                'defaults' => [
                    'payable' => $defaultPayable,
                    'advance' => $defaultAdvance,
                    'expense' => $defaultExpense,
                    'receivable' => $defaultReceivable,
                ],
                'missing_vendor_payable' => $missingVendorPayable->count(),
                'missing_vendor_advance' => $missingVendorAdvance->count(),
                'missing_expense_mapping' => $missingExpenseMap->count(),
                'healed_vendors' => $healedVendors,
                'healed_expense_types' => $healedExpenseTypes,
            ],
        ]);

        $this->line('Active vendors missing payable mapping: ' . $missingVendorPayable->count());
        $this->line('Active vendors missing advance mapping: ' . $missingVendorAdvance->count());
        $this->line('Active expense types missing valid account: ' . $missingExpenseMap->count());

        $hasBlocking = !$defaultPayable || !$defaultAdvance || !$defaultExpense || !$defaultReceivable;
        $hasWarnings = $hasBlocking || $missingVendorPayable->isNotEmpty() || $missingVendorAdvance->isNotEmpty() || $missingExpenseMap->isNotEmpty();

        if ($hasBlocking) {
            $this->error('One or more default mapping accounts are missing/invalid. Configure Voucher Mappings defaults.');
            return self::FAILURE;
        }

        if ($hasWarnings) {
            $this->warn('Mapping health completed with warnings.');
            return self::SUCCESS;
        }

        $this->info('Mapping health is clean.');
        return self::SUCCESS;
    }

    private function validPostableId(int $accountId): int
    {
        if ($accountId <= 0) {
            return 0;
        }

        return CoaAccount::query()
            ->whereKey($accountId)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->exists()
            ? $accountId
            : 0;
    }
}

