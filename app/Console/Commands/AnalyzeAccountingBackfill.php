<?php

namespace App\Console\Commands;

use App\Services\Accounting\AccountingHistoricalBackfillService;
use Illuminate\Console\Command;

class AnalyzeAccountingBackfill extends Command
{
    protected $signature = 'accounting:backfill:analyze
        {--family=all : Family or comma-separated families to analyze}
        {--from= : Inclusive source date lower bound}
        {--to= : Inclusive source date upper bound}
        {--start-id= : Inclusive source id lower bound}
        {--end-id= : Inclusive source id upper bound}
        {--chunk=100 : Chunk size}
        {--include-deleted-receipts : Include soft-deleted receipts in analysis}
        {--sample-limit=10 : Maximum sample ids shown per reason code}';

    protected $description = 'Analyze historical finance accounting backfill eligibility without posting journals.';

    public function handle(AccountingHistoricalBackfillService $service): int
    {
        $result = $service->analyze($this->options(), function (array $chunkStats, array $familySummary) {
            $this->line(sprintf(
                '[%s] scanned=%d posted=%d already_posted=%d skipped=%d failed=%d unsupported=%d',
                $chunkStats['family'],
                $chunkStats['scanned'],
                $chunkStats['posted'],
                $chunkStats['already_posted'],
                $chunkStats['skipped'],
                $chunkStats['failed'],
                $chunkStats['unsupported']
            ));
        }, $this->laravel->bound('auth') ? auth()->id() : null);

        $this->components->info('Accounting historical backfill analysis completed.');
        $this->line('Run ID: ' . $result['run']->id);
        $this->renderSummary($result['summary']);

        return self::SUCCESS;
    }

    private function renderSummary(array $summary): void
    {
        foreach ($summary as $family => $row) {
            $this->newLine();
            $this->info($family);
            $this->line('  total_source_count: ' . $row['total_source_count']);
            $this->line('  total_amount: ' . number_format((float) $row['total_amount'], 2, '.', ''));
            $this->line('  eligible_count: ' . $row['eligible_count']);
            $this->line('  already_posted_count: ' . $row['already_posted_count']);
            $this->line('  skipped_count: ' . $row['skipped_count']);
            $this->line('  failed_count: ' . $row['failed_count']);
            $this->line('  unsupported_count: ' . $row['unsupported_count']);
            $this->line('  missing_mapping_count: ' . $row['missing_mapping_count']);
            $this->line('  deleted_orphaned_count: ' . $row['deleted_orphaned_count']);
            $this->line('  date_range: ' . (($row['date_range']['from'] ?? 'n/a') . ' -> ' . ($row['date_range']['to'] ?? 'n/a')));

            if (!empty($row['samples'])) {
                $this->line('  sample_ids:');
                foreach ($row['samples'] as $reasonCode => $ids) {
                    $this->line(sprintf('    - %s: %s', $reasonCode, implode(', ', $ids)));
                }
            }
        }
    }
}
