<?php

namespace App\Console\Commands;

use App\Models\AccountingEventQueue;
use App\Models\InventoryDocument;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Console\Command;

class VerifyOpeningBalancePostings extends Command
{
    protected $signature = 'accounting:verify-opening-balance-postings {--from= : Start date YYYY-MM-DD} {--to= : End date YYYY-MM-DD} {--limit=100 : Max rows to inspect}';

    protected $description = 'Reconcile opening balance inventory documents against posted opening balance journals.';

    public function handle(): int
    {
        $from = $this->option('from');
        $to = $this->option('to');
        $limit = max(1, (int) $this->option('limit'));

        $query = InventoryDocument::query()
            ->where('type', 'opening_balance')
            ->with(['lines', 'transactions']);

        if (!empty($from)) {
            $query->whereDate('transaction_date', '>=', $from);
        }

        if (!empty($to)) {
            $query->whereDate('transaction_date', '<=', $to);
        }

        $documents = $query->orderByDesc('id')->limit($limit)->get();
        if ($documents->isEmpty()) {
            $this->warn('No opening balance documents found for selected range.');
            return self::SUCCESS;
        }

        $rows = [];
        $missingJournal = 0;
        $mismatch = 0;

        foreach ($documents as $document) {
            $docAmount = (float) ($document->lines->sum('line_total') ?: 0);
            if ($docAmount <= 0) {
                $docAmount = (float) $document->transactions
                    ->where('type', 'adjustment_in')
                    ->sum('total_cost');
            }

            $journal = JournalEntry::query()
                ->where('module_type', 'opening_balance')
                ->where('module_id', $document->id)
                ->first();

            $journalAmount = 0.0;
            if ($journal) {
                $journalAmount = (float) JournalLine::query()
                    ->where('journal_entry_id', $journal->id)
                    ->sum('debit');
            }

            $status = 'ok';
            $latestQueueStatus = '-';
            $latestQueueError = '-';
            $latestQueueCorrelation = '-';
            if (!$journal) {
                $status = 'missing_journal';
                $missingJournal++;
                $latestQueue = AccountingEventQueue::query()
                    ->where('source_type', InventoryDocument::class)
                    ->where('source_id', $document->id)
                    ->latest('id')
                    ->first(['status', 'error_message', 'payload']);
                if ($latestQueue) {
                    $latestQueueStatus = (string) ($latestQueue->status ?? '-');
                    $latestQueueError = (string) ($latestQueue->error_message ?? '-');
                    $latestQueueCorrelation = (string) (($latestQueue->payload['correlation_id'] ?? '-') ?: '-');
                }
            } elseif (abs($docAmount - $journalAmount) > 0.01) {
                $status = 'amount_mismatch';
                $mismatch++;
            }

            $rows[] = [
                'document_no' => $document->document_no,
                'date' => optional($document->transaction_date)->toDateString(),
                'doc_amount' => number_format($docAmount, 2, '.', ''),
                'journal_entry' => $journal?->entry_no ?: '-',
                'journal_amount' => number_format($journalAmount, 2, '.', ''),
                'status' => $status,
                'queue_status' => $latestQueueStatus,
                'queue_error' => $latestQueueError,
                'queue_correlation_id' => $latestQueueCorrelation,
            ];
        }

        $this->table(
            ['document_no', 'date', 'doc_amount', 'journal_entry', 'journal_amount', 'status', 'queue_status', 'queue_error', 'queue_correlation_id'],
            $rows
        );

        $this->newLine();
        $this->line('Documents checked: ' . count($rows));
        $this->line('Missing journals: ' . $missingJournal);
        $this->line('Amount mismatches: ' . $mismatch);

        if ($missingJournal > 0 || $mismatch > 0) {
            $this->error('Opening balance reconciliation failed. Resolve gaps before signoff.');
            return self::FAILURE;
        }

        $this->info('Opening balance reconciliation passed.');
        return self::SUCCESS;
    }
}
