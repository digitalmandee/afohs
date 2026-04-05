<?php

namespace App\Console\Commands;

use App\Models\AccountingVoucher;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Console\Command;

class VerifyVoucherPosting extends Command
{
    protected $signature = 'accounting:verify-voucher-posting {--voucher_id= : Verify a single voucher id} {--limit=200 : Max posted vouchers to inspect (latest first)}';

    protected $description = 'Verify voucher-to-journal posting integrity and account-side matrix for CPV/CRV/BPV/BRV/JV.';

    public function handle(): int
    {
        $voucherId = $this->option('voucher_id');
        $limit = max(1, (int) $this->option('limit'));

        $query = AccountingVoucher::query()
            ->where('status', 'posted')
            ->with(['lines', 'paymentAccount.coaAccount']);

        if (!empty($voucherId)) {
            $query->whereKey((int) $voucherId);
        } else {
            $query->latest('id')->limit($limit);
        }

        $vouchers = $query->get();
        if ($vouchers->isEmpty()) {
            $this->warn('No posted vouchers found for verification.');
            return self::SUCCESS;
        }

        $rows = [];
        $failures = 0;

        foreach ($vouchers as $voucher) {
            $errors = [];
            $voucherDebit = round((float) $voucher->lines->sum('debit'), 2);
            $voucherCredit = round((float) $voucher->lines->sum('credit'), 2);
            if (abs($voucherDebit - $voucherCredit) > 0.009) {
                $errors[] = sprintf('Voucher lines unbalanced (Dr %.2f / Cr %.2f)', $voucherDebit, $voucherCredit);
            }

            $entries = JournalEntry::query()
                ->where('module_type', 'accounting_voucher')
                ->where('module_id', (int) $voucher->id)
                ->orderBy('id')
                ->get(['id', 'entry_date']);

            if ($entries->count() !== 1) {
                $errors[] = $entries->count() === 0
                    ? 'No journal entry found.'
                    : sprintf('Duplicate journals found (%d).', $entries->count());
            }

            $journalId = $entries->first()?->id;
            $journalDebit = 0.0;
            $journalCredit = 0.0;
            $paymentDebit = 0.0;
            $paymentCredit = 0.0;
            $paymentAccountCode = (string) ($voucher->paymentAccount?->coaAccount?->full_code ?: '-');
            $paymentAccountName = (string) ($voucher->paymentAccount?->coaAccount?->name ?: '-');

            if ($journalId) {
                $journalLines = JournalLine::query()
                    ->where('journal_entry_id', (int) $journalId)
                    ->get(['account_id', 'debit', 'credit']);

                $journalDebit = round((float) $journalLines->sum('debit'), 2);
                $journalCredit = round((float) $journalLines->sum('credit'), 2);

                if (abs($journalDebit - $journalCredit) > 0.009) {
                    $errors[] = sprintf('Journal lines unbalanced (Dr %.2f / Cr %.2f)', $journalDebit, $journalCredit);
                }

                if (abs($voucherDebit - $journalDebit) > 0.009 || abs($voucherCredit - $journalCredit) > 0.009) {
                    $errors[] = sprintf(
                        'Voucher/journal totals mismatch (V Dr/Cr %.2f/%.2f vs J Dr/Cr %.2f/%.2f)',
                        $voucherDebit,
                        $voucherCredit,
                        $journalDebit,
                        $journalCredit
                    );
                }

                if (in_array((string) $voucher->voucher_type, ['CPV', 'CRV', 'BPV', 'BRV'], true)) {
                    $paymentCoaId = (int) ($voucher->paymentAccount?->coa_account_id ?? 0);
                    if ($paymentCoaId <= 0) {
                        $errors[] = 'Payment account COA mapping missing on voucher.';
                    } else {
                        $paymentDebit = round((float) $journalLines->where('account_id', $paymentCoaId)->sum('debit'), 2);
                        $paymentCredit = round((float) $journalLines->where('account_id', $paymentCoaId)->sum('credit'), 2);
                        $amount = round((float) ($voucher->amount ?? $voucherDebit), 2);

                        if (in_array((string) $voucher->voucher_type, ['CPV', 'BPV'], true)) {
                            if ($paymentCredit <= 0.009 || abs($paymentCredit - $amount) > 0.009) {
                                $errors[] = sprintf(
                                    'Expected payment side credit %.2f; got %.2f on %s %s.',
                                    $amount,
                                    $paymentCredit,
                                    $paymentAccountCode,
                                    $paymentAccountName
                                );
                            }
                            if ($paymentDebit > 0.009) {
                                $errors[] = sprintf(
                                    'Expected payment side debit 0.00; got %.2f on %s %s.',
                                    $paymentDebit,
                                    $paymentAccountCode,
                                    $paymentAccountName
                                );
                            }
                        } else {
                            if ($paymentDebit <= 0.009 || abs($paymentDebit - $amount) > 0.009) {
                                $errors[] = sprintf(
                                    'Expected payment side debit %.2f; got %.2f on %s %s.',
                                    $amount,
                                    $paymentDebit,
                                    $paymentAccountCode,
                                    $paymentAccountName
                                );
                            }
                            if ($paymentCredit > 0.009) {
                                $errors[] = sprintf(
                                    'Expected payment side credit 0.00; got %.2f on %s %s.',
                                    $paymentCredit,
                                    $paymentAccountCode,
                                    $paymentAccountName
                                );
                            }
                        }
                    }
                }
            }

            if ($entries->first()?->entry_date && optional($voucher->posting_date)->toDateString()) {
                $journalEntryDate = (string) date('Y-m-d', strtotime((string) $entries->first()->entry_date));
                $voucherPostingDate = (string) optional($voucher->posting_date)->toDateString();
                if ($journalEntryDate !== $voucherPostingDate) {
                    $errors[] = sprintf(
                        'Posting date mismatch (voucher %s vs journal %s).',
                        $voucherPostingDate,
                        $journalEntryDate
                    );
                }
            }

            $status = empty($errors) ? 'PASS' : 'FAIL';
            if ($status === 'FAIL') {
                $failures++;
            }

            $rows[] = [
                'voucher_id' => (int) $voucher->id,
                'voucher_no' => (string) $voucher->voucher_no,
                'type' => (string) $voucher->voucher_type,
                'journal_id' => $journalId ?: '-',
                'status' => $status,
                'notes' => empty($errors) ? '-' : implode(' | ', $errors),
            ];
        }

        $this->table(
            ['voucher_id', 'voucher_no', 'type', 'journal_id', 'status', 'notes'],
            $rows
        );

        $this->line(sprintf(
            'Checked %d posted voucher(s): %d pass, %d fail.',
            count($rows),
            count($rows) - $failures,
            $failures
        ));

        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }
}
