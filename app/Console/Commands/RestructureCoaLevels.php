<?php

namespace App\Console\Commands;

use App\Services\Accounting\CoaLevelRestructureService;
use Illuminate\Console\Command;

class RestructureCoaLevels extends Command
{
    protected $signature = 'accounting:coa:restructure-levels {--dry-run : Preview the level-3 to level-5 restructure without saving changes}';

    protected $description = 'Deepen current level-3 posting accounts into a level-4 header plus level-5 posting structure.';

    public function handle(CoaLevelRestructureService $service): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $report = $dryRun ? $service->preview() : $service->execute();

        $this->components->info($dryRun ? 'COA restructure preview complete.' : 'COA restructure complete.');
        $this->line('Processed level-3 posting accounts: ' . $report['processed']);
        $this->line('Created level-3 headers: ' . ($report['created_level3_headers'] ?? 0));
        $this->line('Created level-4 headers: ' . $report['created_headers']);
        $this->line('Moved accounts to level 5: ' . $report['moved_accounts']);
        $this->line('Repaired existing headers: ' . ($report['repaired_headers'] ?? 0));
        $this->line('Skipped accounts: ' . count($report['skipped']));

        if (!empty($report['skipped'])) {
            $this->newLine();
            $this->warn('Skipped / manual review items');
            foreach ($report['skipped'] as $item) {
                $this->line('- ' . $item);
            }
        }

        return self::SUCCESS;
    }
}
