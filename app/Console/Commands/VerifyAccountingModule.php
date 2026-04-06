<?php

namespace App\Console\Commands;

use App\Models\AccountingEventQueue;
use App\Models\AccountingEntityAccountMapping;
use App\Models\AccountingExpenseType;
use App\Models\AccountingPeriod;
use App\Models\AccountingPostingLog;
use App\Models\AccountingRule;
use App\Models\CoaAccount;
use App\Models\InventoryDocumentTypeConfig;
use App\Models\PaymentAccount;
use App\Models\Setting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class VerifyAccountingModule extends Command
{
    protected $signature = 'accounting:verify-module {--limit=25 : Number of recent failed logs/events to inspect}';

    protected $description = 'Run a reusable health verification pass for accounting tables, rules, queues, periods, and COA integrity.';

    public function handle(): int
    {
        $requiredTables = [
            'coa_accounts',
            'journal_entries',
            'journal_lines',
            'accounting_rules',
            'accounting_event_queues',
            'accounting_periods',
            'payment_accounts',
            'bank_reconciliation_sessions',
            'bank_reconciliation_lines',
            'accounting_voucher_allocations',
        ];

        $optionalTables = [
            'financial_invoices',
            'financial_receipts',
            'vendor_bills',
            'vendor_payments',
            'goods_receipts',
            'supplier_advances',
            'accounting_posting_logs',
        ];

        $missingRequired = array_values(array_filter($requiredTables, fn (string $table) => !Schema::hasTable($table)));
        $missingOptional = array_values(array_filter($optionalTables, fn (string $table) => !Schema::hasTable($table)));

        $this->components->twoColumnDetail('Required tables', empty($missingRequired) ? 'OK' : 'Missing');
        if (!empty($missingRequired)) {
            $this->components->error('Missing required accounting tables: ' . implode(', ', $missingRequired));
            return self::FAILURE;
        }

        $this->components->twoColumnDetail('Optional tables', empty($missingOptional) ? 'OK' : 'Partial');
        if (!empty($missingOptional)) {
            $this->line('Missing optional tables: ' . implode(', ', $missingOptional));
        }

        $this->newLine();
        $this->info('Accounting Rules');

        $expectedRules = [
            'membership_invoice',
            'membership_receipt',
            'maintenance_invoice',
            'maintenance_receipt',
            'subscription_invoice',
            'subscription_receipt',
            'pos_invoice',
            'pos_receipt',
            'room_invoice',
            'room_receipt',
            'event_invoice',
            'event_receipt',
            'purchase_receipt',
            'vendor_bill',
            'vendor_payment',
        ];

        $presentRules = AccountingRule::query()->pluck('code')->all();
        $missingRules = array_values(array_diff($expectedRules, $presentRules));
        $inactiveRules = AccountingRule::query()->where('is_active', false)->pluck('code')->all();
        $invalidRuleTargets = AccountingRule::query()->get()->filter(function (AccountingRule $rule) {
            foreach ((array) $rule->lines as $line) {
                if (!empty($line['use_payment_account'])) {
                    continue;
                }

                $accountId = $line['account_id'] ?? null;
                if (!$accountId) {
                    return true;
                }

                $account = CoaAccount::find($accountId);
                if (!$account || !$account->is_active) {
                    return true;
                }
            }

            return false;
        })->pluck('code')->values()->all();

        $this->line('Configured rules: ' . count($presentRules));
        $this->line('Missing expected rules: ' . count($missingRules));
        $this->line('Inactive rules: ' . count($inactiveRules));
        $this->line('Rules with invalid targets: ' . count($invalidRuleTargets));

        if (!empty($missingRules)) {
            $this->warn('Missing rules: ' . implode(', ', $missingRules));
        }

        if (!empty($invalidRuleTargets)) {
            $this->warn('Rules with invalid or inactive COA links: ' . implode(', ', $invalidRuleTargets));
        }

        $this->newLine();
        $this->info('Event Queue');

        $this->newLine();
        $this->info('Procurement Policy');
        $policy = Setting::getGroup('procurement_policy');
        $this->line('bill_requires_grn: ' . (!empty($policy['bill_requires_grn']) ? 'yes' : 'no'));
        $this->line('valuation_method: ' . ($policy['valuation_method'] ?? 'fifo'));
        $this->line('po_amendment_mode: ' . ($policy['po_amendment_mode'] ?? 'admin_prospective'));

        if (Schema::hasTable('inventory_document_type_configs')) {
            $this->newLine();
            $this->info('Inventory Document Posting Matrix');

            $matrixCodes = ['cash_purchase', 'purchase_return', 'opening_balance', 'stock_adjustment'];
            $supportedByAdapter = ['cash_purchase', 'purchase_return', 'opening_balance', 'stock_adjustment'];
            $configs = InventoryDocumentTypeConfig::query()
                ->whereIn('code', $matrixCodes)
                ->get()
                ->keyBy('code');

            $rows = [];
            foreach ($matrixCodes as $code) {
                $config = $configs->get($code);
                $rows[] = [
                    'code' => $code,
                    'auto_post' => $config?->auto_post ? 'yes' : 'no',
                    'approval_required' => $config?->approval_required ? 'yes' : 'no',
                    'accounting_enabled' => $config?->accounting_enabled ? 'yes' : 'no',
                    'adapter_supported' => in_array($code, $supportedByAdapter, true) ? 'yes' : 'no',
                ];
            }

            $this->table(
                ['code', 'auto_post', 'approval_required', 'accounting_enabled', 'adapter_supported'],
                $rows
            );
        }

        $queueCounts = AccountingEventQueue::query()
            ->selectRaw('status, COUNT(*) as aggregate')
            ->groupBy('status')
            ->pluck('aggregate', 'status');

        foreach (['pending', 'processing', 'posted', 'skipped', 'failed'] as $status) {
            $this->line(sprintf('%s: %d', $status, (int) ($queueCounts[$status] ?? 0)));
        }

        $limit = max(1, (int) $this->option('limit'));
        $recentFailures = Schema::hasTable('accounting_posting_logs')
            ? AccountingPostingLog::query()->where('status', 'failed')->latest('id')->limit($limit)->get(['id', 'event_type', 'source_type', 'message'])
            : collect();

        if ($recentFailures->isNotEmpty()) {
            $this->warn('Recent posting failures');
            foreach ($recentFailures as $failure) {
                $this->line(sprintf(
                    '- #%d %s %s :: %s',
                    $failure->id,
                    $failure->event_type,
                    class_basename((string) $failure->source_type),
                    (string) $failure->message
                ));
            }
        }

        $recentFailedEvents = AccountingEventQueue::query()
            ->where('status', 'failed')
            ->latest('id')
            ->limit($limit)
            ->get(['id', 'event_type', 'source_type', 'source_id', 'error_message', 'payload']);

        if ($recentFailedEvents->isNotEmpty()) {
            $this->newLine();
            $this->warn('Recent failed queue events (with correlation IDs)');
            foreach ($recentFailedEvents as $event) {
                $this->line(sprintf(
                    '- #%d %s %s#%d [corr=%s] :: %s',
                    $event->id,
                    (string) $event->event_type,
                    class_basename((string) $event->source_type),
                    (int) $event->source_id,
                    (string) (($event->payload['correlation_id'] ?? '-') ?: '-'),
                    (string) ($event->error_message ?: '-')
                ));
            }
        }

        $this->newLine();
        $this->info('Voucher Mapping Health');
        $voucherDefaults = Setting::getGroup('accounting_voucher_defaults');
        $defaultPayableId = (int) ($voucherDefaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0));
        $defaultAdvanceId = (int) ($voucherDefaults['default_advance_account_id'] ?? config('accounting.vouchers.default_advance_account_id', 0));
        $defaultExpenseId = (int) ($voucherDefaults['default_expense_account_id'] ?? config('accounting.vouchers.default_expense_account_id', 0));
        $defaultReceivableId = (int) ($voucherDefaults['default_receivable_account_id'] ?? config('accounting.vouchers.default_receivable_account_id', 0));

        $entityMappings = AccountingEntityAccountMapping::query()->with('account:id,is_active,is_postable')->get();
        $inactiveMappings = $entityMappings->filter(fn ($mapping) => !$mapping->account || !$mapping->account->is_active || !$mapping->account->is_postable)->count();
        $missingExpenseMappings = AccountingExpenseType::query()
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expense_account_id')
                    ->orWhereNotIn('expense_account_id', CoaAccount::query()->where('is_active', true)->where('is_postable', true)->select('id'));
            })
            ->count();

        $this->line('Entity account mappings: ' . $entityMappings->count());
        $this->line('Invalid/inactive mapping accounts: ' . $inactiveMappings);
        $this->line('Active expense types missing valid account map: ' . $missingExpenseMappings);
        $this->line('Default payable fallback: ' . ($defaultPayableId > 0 ? ('set #' . $defaultPayableId) : 'missing'));
        $this->line('Default advance fallback: ' . ($defaultAdvanceId > 0 ? ('set #' . $defaultAdvanceId) : 'missing'));
        $this->line('Default expense fallback: ' . ($defaultExpenseId > 0 ? ('set #' . $defaultExpenseId) : 'missing'));
        $this->line('Default receivable fallback: ' . ($defaultReceivableId > 0 ? ('set #' . $defaultReceivableId) : 'missing'));

        $this->newLine();
        $this->info('Periods and Bank Accounts');

        $openPeriods = AccountingPeriod::query()->where('status', 'open')->count();
        $closedPeriods = AccountingPeriod::query()->where('status', 'closed')->count();
        $paymentAccounts = PaymentAccount::query()->count();
        $mappedPaymentAccounts = PaymentAccount::query()->whereNotNull('coa_account_id')->count();

        $this->line("Open periods: {$openPeriods}");
        $this->line("Closed periods: {$closedPeriods}");
        $this->line("Payment accounts: {$paymentAccounts}");
        $this->line("Payment accounts with COA mapping: {$mappedPaymentAccounts}");

        $this->newLine();
        $this->info('COA Integrity');

        $accounts = CoaAccount::query()->orderBy('full_code')->get();
        $levelMismatches = 0;
        $codeMismatches = 0;
        $parentMismatches = 0;

        foreach ($accounts as $account) {
            $segments = array_values(array_filter([
                $account->segment1,
                $account->segment2,
                $account->segment3,
                $account->segment4,
                $account->segment5,
            ], fn ($segment) => $segment !== null && $segment !== ''));

            $expectedLevel = count($segments);
            $expectedCode = implode('-', $segments);

            if ((int) $account->level !== $expectedLevel) {
                $levelMismatches++;
            }

            if ((string) $account->full_code !== $expectedCode) {
                $codeMismatches++;
            }

            if ($account->parent_id) {
                $expectedParentCode = $expectedLevel > 1 ? implode('-', array_slice($segments, 0, -1)) : null;
                $parent = $accounts->firstWhere('id', $account->parent_id);
                if (
                    !$parent
                    || (int) $parent->level !== ($expectedLevel - 1)
                    || (string) $parent->full_code !== (string) $expectedParentCode
                ) {
                    $parentMismatches++;
                }
            }
        }

        $this->line('Accounts scanned: ' . $accounts->count());
        $this->line('Level mismatches: ' . $levelMismatches);
        $this->line('Code mismatches: ' . $codeMismatches);
        $this->line('Parent mismatches: ' . $parentMismatches);

        $hasWarnings = !empty($missingRules)
            || !empty($inactiveRules)
            || !empty($invalidRuleTargets)
            || ($queueCounts['failed'] ?? 0) > 0
            || $inactiveMappings > 0
            || $missingExpenseMappings > 0
            || $defaultPayableId <= 0
            || $defaultAdvanceId <= 0
            || $defaultExpenseId <= 0
            || $defaultReceivableId <= 0
            || $levelMismatches > 0
            || $codeMismatches > 0
            || $parentMismatches > 0
            || $openPeriods === 0
            || $mappedPaymentAccounts === 0;

        if ($hasWarnings) {
            $this->warn('Accounting verification completed with warnings. Review the sections above before signoff.');
            return self::SUCCESS;
        }

        $this->components->info('Accounting verification passed with no blocking warnings.');
        return self::SUCCESS;
    }
}
