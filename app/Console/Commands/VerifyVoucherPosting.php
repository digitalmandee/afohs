<?php

namespace App\Console\Commands;

use App\Models\AccountingVoucher;
use App\Models\CoaAccount;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\Setting;
use App\Models\Vendor;
use Illuminate\Console\Command;

class VerifyVoucherPosting extends Command
{
    protected $signature = 'accounting:verify-voucher-posting {--voucher_id= : Verify a single voucher id} {--limit=200 : Max posted vouchers to inspect (latest first)}';

    protected $description = 'Verify voucher-to-journal posting integrity and account-side matrix for CPV/CRV/BPV/BRV/JV.';

    public function handle(): int
    {
        $this->autoAssignVendorDefaults();

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

        $vendorMappingIssues = Vendor::query()
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereNull('payable_account_id')
                    ->orWhereNull('advance_account_id');
            })
            ->orderBy('id')
            ->limit(100)
            ->get(['id', 'code', 'name', 'payable_account_id', 'advance_account_id']);

        if ($vendorMappingIssues->isNotEmpty()) {
            $failures++;
            $this->newLine();
            $this->warn('Active vendors missing payable/advance defaults:');
            $this->table(
                ['vendor_id', 'code', 'name', 'payable_account_id', 'advance_account_id'],
                $vendorMappingIssues->map(fn ($vendor) => [
                    'vendor_id' => (int) $vendor->id,
                    'code' => (string) $vendor->code,
                    'name' => (string) $vendor->name,
                    'payable_account_id' => $vendor->payable_account_id ?: '-',
                    'advance_account_id' => $vendor->advance_account_id ?: '-',
                ])->all()
            );
        }

        $controlAccountIds = $this->vendorPayableAdvanceAccountIds();
        if (!empty($controlAccountIds)) {
            $subledgerTagIssues = JournalLine::query()
                ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
                ->leftJoin('coa_accounts', 'coa_accounts.id', '=', 'journal_lines.account_id')
                ->whereIn('journal_lines.account_id', $controlAccountIds)
                ->whereNull('journal_lines.vendor_id')
                ->where(function ($query) {
                    $query->where('journal_lines.debit', '>', 0)
                        ->orWhere('journal_lines.credit', '>', 0);
                })
                ->orderByDesc('journal_lines.id')
                ->limit(100)
                ->get([
                    'journal_lines.id as journal_line_id',
                    'journal_lines.journal_entry_id',
                    'journal_entries.module_type',
                    'journal_entries.module_id',
                    'journal_lines.account_id',
                    'coa_accounts.full_code',
                    'coa_accounts.name as account_name',
                    'journal_lines.debit',
                    'journal_lines.credit',
                    'journal_lines.reference_type',
                    'journal_lines.reference_id',
                ]);

            if ($subledgerTagIssues->isNotEmpty()) {
                $failures++;
                $this->newLine();
                $this->warn('Posted payable/advance lines missing vendor subledger tagging:');
                $this->table(
                    ['line_id', 'journal_id', 'module', 'module_id', 'account', 'debit', 'credit', 'reference'],
                    $subledgerTagIssues->map(function ($row) {
                        $accountLabel = trim((string) ($row->full_code ? ($row->full_code . ' - ' . $row->account_name) : ('#' . $row->account_id)));
                        $reference = $row->reference_type && $row->reference_id
                            ? class_basename((string) $row->reference_type) . '#' . $row->reference_id
                            : '-';

                        return [
                            'line_id' => (int) $row->journal_line_id,
                            'journal_id' => (int) $row->journal_entry_id,
                            'module' => (string) $row->module_type,
                            'module_id' => (int) $row->module_id,
                            'account' => $accountLabel,
                            'debit' => number_format((float) $row->debit, 2, '.', ''),
                            'credit' => number_format((float) $row->credit, 2, '.', ''),
                            'reference' => $reference,
                        ];
                    })->all()
                );
            }
        }

        return $failures > 0 ? self::FAILURE : self::SUCCESS;
    }

    private function vendorPayableAdvanceAccountIds(): array
    {
        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $ids = [
            (int) ($defaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0)),
            (int) ($defaults['default_advance_account_id'] ?? config('accounting.vouchers.default_advance_account_id', 0)),
        ];

        $vendors = Vendor::query()->get(['payable_account_id', 'advance_account_id']);
        foreach ($vendors as $vendor) {
            $ids[] = (int) ($vendor->payable_account_id ?? 0);
            $ids[] = (int) ($vendor->advance_account_id ?? 0);
        }

        $ids = array_values(array_unique(array_filter($ids, fn ($id) => (int) $id > 0)));
        if (empty($ids)) {
            return [];
        }

        return CoaAccount::query()
            ->whereIn('id', $ids)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
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
