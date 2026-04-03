<?php

namespace App\Console\Commands;

use App\Models\InventoryDocument;
use App\Models\InventoryDocumentLine;
use App\Models\InventoryTransaction;
use App\Models\JournalEntry;
use App\Services\Accounting\AccountingEventDispatcher;
use Illuminate\Console\Command;

class BackfillOpeningBalancePostings extends Command
{
    protected $signature = 'accounting:backfill-opening-balance-postings {--from= : Start date YYYY-MM-DD} {--to= : End date YYYY-MM-DD} {--limit=100 : Max documents to process} {--dry-run : Only report missing journals without dispatching} {--repair-lines : Rebuild missing inventory_document_lines from opening inventory transactions before dispatch}';

    protected $description = 'Backfill missing opening balance journals by re-dispatching accounting events idempotently.';

    public function handle(): int
    {
        $from = $this->option('from');
        $to = $this->option('to');
        $limit = max(1, (int) $this->option('limit'));
        $dryRun = (bool) $this->option('dry-run');
        $repairLines = (bool) $this->option('repair-lines');

        $query = InventoryDocument::query()
            ->where('type', 'opening_balance')
            ->whereNotIn('id', JournalEntry::query()->where('module_type', 'opening_balance')->select('module_id'))
            ->orderBy('id');

        if (!empty($from)) {
            $query->whereDate('transaction_date', '>=', $from);
        }
        if (!empty($to)) {
            $query->whereDate('transaction_date', '<=', $to);
        }

        $documents = $query->limit($limit)->get();
        if ($documents->isEmpty()) {
            $this->info('No missing opening balance journals found.');
            return self::SUCCESS;
        }

        $this->info('Missing opening balance journals: ' . $documents->count());
        $dispatcher = app(AccountingEventDispatcher::class);
        $processed = 0;
        $repaired = 0;

        foreach ($documents as $document) {
            $this->line(" - {$document->document_no} ({$document->id})");
            if ($repairLines) {
                $didRepair = $this->repairMissingLines($document, $dryRun);
                if ($didRepair) {
                    $repaired++;
                }
            }

            if ($dryRun) {
                continue;
            }
            $dispatcher->dispatch(
                'document_posted',
                InventoryDocument::class,
                (int) $document->id,
                [
                    'document_no' => $document->document_no,
                    'document_type' => $document->type,
                    'tenant_id' => $document->tenant_id,
                ],
                $document->created_by,
                $document->tenant_id
            );
            $processed++;
        }

        if ($dryRun) {
            $this->warn('Dry run only. No events were dispatched.');
            if ($repairLines) {
                $this->line("Repair candidates found: {$repaired}.");
            }
            return self::SUCCESS;
        }

        if ($repairLines) {
            $this->info("Documents repaired with reconstructed lines: {$repaired}.");
        }
        $this->info("Backfill dispatch complete. Events processed: {$processed}.");
        return self::SUCCESS;
    }

    private function repairMissingLines(InventoryDocument $document, bool $dryRun): bool
    {
        $existingCount = InventoryDocumentLine::query()
            ->where('inventory_document_id', $document->id)
            ->count();

        if ($existingCount > 0) {
            return false;
        }

        $fallbackTransactions = InventoryTransaction::query()
            ->where('reference_type', InventoryDocument::class)
            ->where('reference_id', $document->id)
            ->where('type', 'adjustment_in')
            ->where('qty_in', '>', 0)
            ->get();

        if ($fallbackTransactions->isEmpty()) {
            return false;
        }

        if ($dryRun) {
            $this->line('   > would repair missing lines from fallback inventory transactions');
            return true;
        }

        foreach ($fallbackTransactions as $transaction) {
            $lineTotal = (float) $transaction->total_cost;
            if ($lineTotal <= 0) {
                continue;
            }

            InventoryDocumentLine::query()->create([
                'inventory_document_id' => $document->id,
                'inventory_item_id' => $transaction->inventory_item_id,
                'quantity' => (float) $transaction->qty_in,
                'unit_cost' => (float) $transaction->unit_cost,
                'line_total' => $lineTotal,
            ]);
        }

        $this->line('   > repaired missing lines from fallback inventory transactions');
        return true;
    }
}
