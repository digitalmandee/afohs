<?php

namespace App\Console\Commands;

use App\Services\Accounting\AccountingHistoricalBackfillService;
use Illuminate\Console\Command;

class ReconcileAccountingBackfill extends Command
{
    protected $signature = 'accounting:backfill:reconcile
        {--family=all : Family or comma-separated families to reconcile}
        {--from= : Inclusive source date lower bound}
        {--to= : Inclusive source date upper bound}
        {--start-id= : Inclusive source id lower bound}
        {--end-id= : Inclusive source id upper bound}
        {--chunk=100 : Chunk size for live reconciliation scans}
        {--run-id= : Existing backfill run id to summarize}
        {--include-details : Show anomaly details}
        {--sample-limit=10 : Maximum sample ids shown per reason code}';

    protected $description = 'Reconcile historical finance source populations against accounting journals and backfill outcomes.';

    public function handle(AccountingHistoricalBackfillService $service): int
    {
        $result = $service->reconcile($this->options(), function (array $chunkStats, array $familySummary) {
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
        });

        if (!empty($result['run'])) {
            $this->line('Run ID: ' . $result['run']->id);
        }

        foreach ($result['summary'] as $family => $row) {
            $this->newLine();
            $this->info($family);
            foreach ($row as $key => $value) {
                if (is_array($value)) {
                    continue;
                }

                $display = is_float($value) ? number_format($value, 2, '.', '') : (string) $value;
                $this->line("  {$key}: {$display}");
            }

            if (!empty($row['failures_by_reason'])) {
                $this->line('  failures_by_reason:');
                foreach ($row['failures_by_reason'] as $reason => $count) {
                    $this->line(sprintf('    - %s: %d', $reason ?: 'none', $count));
                }
            }
        }

        if (!empty($this->option('include-details'))) {
            $this->newLine();
            $this->warn('Anomalies');
            foreach ($result['anomalies'] as $key => $rows) {
                $this->line($key . ': ' . json_encode($rows));
            }
        }

        return self::SUCCESS;
    }
}
