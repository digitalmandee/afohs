<?php

namespace App\Console\Commands;

use App\Models\JournalEntry;
use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;

class DiagnoseJournalEntriesVisibility extends Command
{
    protected $signature = 'accounting:diagnose-journal-visibility';

    protected $description = 'Diagnose why the journal entries UI may show zero rows even when accounting data exists.';

    public function handle(): int
    {
        try {
            return $this->runDiagnosis();
        } catch (QueryException $exception) {
            $this->error('Journal visibility diagnosis failed because the database connection is unavailable.');
            $this->line('Connection error: ' . $exception->getMessage());
            $this->warn('Verify production database connectivity and rerun the diagnosis.');

            return self::FAILURE;
        }
    }

    private function runDiagnosis(): int
    {
        $issues = [];

        $this->info('Environment');
        $this->line('App environment: ' . app()->environment());
        $this->line('Default DB connection: ' . config('database.default'));
        $this->line('Configured database name: ' . (string) config('database.connections.mysql.database'));
        $currentDatabase = DB::selectOne('select database() as current_database');
        $this->line('Connected database name: ' . (string) ($currentDatabase->current_database ?? 'unknown'));

        $this->newLine();
        $this->info('Route and Schema');

        if (Route::has('accounting.journals.index')) {
            $this->line('PASS route accounting.journals.index');
        } else {
            $issues[] = 'Route accounting.journals.index is missing';
            $this->line('FAIL route accounting.journals.index');
        }

        foreach (['journal_entries', 'journal_lines', 'accounting_event_queues', 'accounting_posting_logs'] as $table) {
            if (Schema::hasTable($table)) {
                $this->line("PASS table {$table}");
            } else {
                $issues[] = "Missing table: {$table}";
                $this->line("FAIL table {$table}");
            }
        }

        if (!Schema::hasTable('journal_entries')) {
            $this->newLine();
            $this->error('Cannot continue because journal_entries is missing.');

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Raw Table Counts');

        $journalEntries = (int) DB::table('journal_entries')->count();
        $journalLines = Schema::hasTable('journal_lines') ? (int) DB::table('journal_lines')->count() : 0;
        $eventQueues = Schema::hasTable('accounting_event_queues') ? (int) DB::table('accounting_event_queues')->count() : 0;
        $postingLogs = Schema::hasTable('accounting_posting_logs') ? (int) DB::table('accounting_posting_logs')->count() : 0;

        $this->line("journal_entries: {$journalEntries}");
        $this->line("journal_lines: {$journalLines}");
        $this->line("accounting_event_queues: {$eventQueues}");
        $this->line("accounting_posting_logs: {$postingLogs}");

        $range = DB::table('journal_entries')
            ->selectRaw('MIN(id) as min_id, MAX(id) as max_id, MIN(entry_date) as min_entry_date, MAX(entry_date) as max_entry_date')
            ->first();

        $this->line('journal_entries id range: ' . (($range->min_id ?? 'null')) . ' -> ' . (($range->max_id ?? 'null')));
        $this->line('journal_entries date range: ' . (($range->min_entry_date ?? 'null')) . ' -> ' . (($range->max_entry_date ?? 'null')));

        $this->newLine();
        $this->info('JournalEntry Model Query');

        $modelCount = JournalEntry::query()->count();
        $draftCount = JournalEntry::query()->where('status', 'draft')->count();
        $postedCount = JournalEntry::query()->where('status', 'posted')->count();
        $reversedCount = JournalEntry::query()->where('status', 'reversed')->count();

        $this->line("JournalEntry model count: {$modelCount}");
        $this->line("Draft count: {$draftCount}");
        $this->line("Posted count: {$postedCount}");
        $this->line("Reversed count: {$reversedCount}");

        if ($modelCount !== $journalEntries) {
            $issues[] = "JournalEntry model count {$modelCount} does not match raw table count {$journalEntries}";
            $this->line('FAIL model count mismatch');
        } else {
            $this->line('PASS model count matches raw table count');
        }

        $sampleEntries = JournalEntry::query()
            ->orderByDesc('entry_date')
            ->orderByDesc('id')
            ->limit(5)
            ->get(['id', 'entry_no', 'entry_date', 'status', 'tenant_id']);

        if ($sampleEntries->isEmpty()) {
            $this->warn('No sample entries were returned by the JournalEntry model query.');
        } else {
            $this->line('Recent sample entries:');
            foreach ($sampleEntries as $entry) {
                $this->line(sprintf(
                    '- #%d %s | %s | %s | tenant_id=%s',
                    $entry->id,
                    (string) ($entry->entry_no ?? '-'),
                    optional($entry->entry_date)->toDateString() ?? '-',
                    (string) ($entry->status ?? '-'),
                    (string) ($entry->tenant_id ?? 'null')
                ));
            }
        }

        $this->newLine();
        $this->info('Interpretation');

        if ($journalEntries === 0) {
            $this->warn('Raw journal_entries count is zero. This strongly suggests the application is connected to the wrong or empty database, or the production data is actually absent.');
        } elseif ($modelCount === 0) {
            $this->warn('Raw journal_entries has data but the JournalEntry model returned zero rows. This suggests a model connection, global scope, or bootstrapping issue.');
        } else {
            $this->info('Both raw table counts and the JournalEntry model query return data. If the UI still shows zero, investigate production config cache, deployed code mismatch, or page-level runtime behavior.');
        }

        $this->warn('Next production steps: php artisan migrate:status, php artisan deploy:verify-production-migrations, php artisan accounting:verify-module, php artisan optimize:clear, then reload app workers/processes.');

        if (!empty($issues)) {
            $this->newLine();
            $this->error('Journal visibility diagnosis completed with issues.');
            foreach ($issues as $issue) {
                $this->line("- {$issue}");
            }

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Journal visibility diagnosis completed without internal mismatches.');

        return self::SUCCESS;
    }
}
