<?php

namespace App\Console\Commands;

use App\Models\CoaAccount;
use App\Models\JournalLine;
use App\Models\VendorBill;
use Illuminate\Console\Command;

class VerifySupplierLedgerConsistency extends Command
{
    protected $signature = 'accounting:verify-supplier-ledger {--tolerance=0.50 : Allowed absolute difference between AP GL and subledger}';

    protected $description = 'Compare supplier subledger outstanding against AP control account journal balance.';

    public function handle(): int
    {
        $tolerance = (float) $this->option('tolerance');

        $subledgerOutstanding = (float) VendorBill::query()
            ->whereIn('status', ['posted', 'partially_paid', 'paid'])
            ->selectRaw('COALESCE(SUM(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0)), 0) as outstanding')
            ->value('outstanding');

        $apAccount = CoaAccount::query()
            ->where(function ($q) {
                $q->where('full_code', '20-01-01-00-01')
                    ->orWhereRaw('LOWER(name) = ?', ['accounts payable']);
            })
            ->first();

        if (!$apAccount) {
            $this->error('Accounts Payable control account not found.');
            return self::FAILURE;
        }

        $apGlBalance = (float) JournalLine::query()
            ->where('account_id', $apAccount->id)
            ->selectRaw('COALESCE(SUM(credit - debit), 0) as balance')
            ->value('balance');

        $difference = $apGlBalance - $subledgerOutstanding;

        $this->table(
            ['metric', 'value'],
            [
                ['Subledger Outstanding', number_format($subledgerOutstanding, 2, '.', '')],
                ['AP GL Balance', number_format($apGlBalance, 2, '.', '')],
                ['Difference', number_format($difference, 2, '.', '')],
                ['Tolerance', number_format($tolerance, 2, '.', '')],
            ]
        );

        if (abs($difference) > $tolerance) {
            $this->error('Supplier ledger consistency check failed.');
            return self::FAILURE;
        }

        $this->info('Supplier ledger consistency check passed.');
        return self::SUCCESS;
    }
}
