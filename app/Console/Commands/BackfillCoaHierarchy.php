<?php

namespace App\Console\Commands;

use App\Services\Accounting\CoaBackfillService;
use Illuminate\Console\Command;

class BackfillCoaHierarchy extends Command
{
    protected $signature = 'accounting:coa:backfill
        {--source=auto : Source to inspect (auto,current,legacy,dump or comma-separated combination)}
        {--dry-run : Preview the hierarchy and mappings without saving records}';

    protected $description = 'Backfill chart of accounts hierarchy from legacy finance account codes and reconcile core mappings.';

    public function handle(CoaBackfillService $service): int
    {
        $source = (string) $this->option('source');
        $dryRun = (bool) $this->option('dry-run');

        $report = $dryRun
            ? $service->dryRun($source)
            : $service->backfill($source);

        $this->components->info($dryRun ? 'COA backfill dry run complete.' : 'COA backfill complete.');
        $this->line('Source: ' . $report['source']);
        $this->line('Discovery sources: ' . implode(', ', $report['discovery_sources'] ?: ['none']));
        $this->line('Discovered codes: ' . $report['discovered_codes']);
        $this->line('Fallback accounts: ' . $report['fallback_accounts']);
        $this->line('Proposed hierarchy rows: ' . $report['proposed_accounts']);
        $this->line('Accounts by level: ' . json_encode($report['accounts_by_level']));
        $this->line('Accounts by type: ' . json_encode($report['accounts_by_type']));

        if (!$dryRun) {
            $this->line('Created accounts: ' . $report['created']);
            $this->line('Updated accounts: ' . $report['updated']);
            $this->line('Payment accounts linked: ' . $report['payment_accounts_linked']);
            $this->line('Vendors linked: ' . $report['vendors_linked']);
            $this->line('Accounting rules linked: ' . $report['rules_linked']);
        }

        if (!empty($report['conflicts'])) {
            $this->newLine();
            $this->warn('Conflicts / warnings');
            foreach ($report['conflicts'] as $conflict) {
                $this->line('- ' . $conflict);
            }
        }

        if (!empty($report['unresolved_codes'])) {
            $this->newLine();
            $this->warn('Unresolved legacy codes');
            foreach (array_slice($report['unresolved_codes'], 0, 20) as $row) {
                $this->line(sprintf('- %s (%s) [%s]', $row['legacy_code'], $row['reason'], $row['source']));
            }
        }

        if (!empty($report['unresolved_mappings'])) {
            $this->newLine();
            $this->warn('Unresolved operational mappings');
            foreach (array_slice($report['unresolved_mappings'], 0, 20) as $row) {
                $this->line(sprintf('- %s #%s: %s', $row['entity'], $row['id'], $row['reason']));
            }
        }

        if (!empty($report['sample_accounts'])) {
            $this->newLine();
            $this->info('Sample hierarchy rows');
            foreach ($report['sample_accounts'] as $row) {
                $this->line(sprintf(
                    '- %s | %s | %s | %s',
                    $row['full_code'],
                    strtoupper($row['type']),
                    $row['is_postable'] ? 'POSTABLE' : 'HEADER',
                    $row['name']
                ));
            }
        }

        return self::SUCCESS;
    }
}
