<?php

namespace App\Console\Commands;

use App\Services\JournalRecurringRunnerService;
use Illuminate\Console\Command;

class RunJournalRecurringProfiles extends Command
{
    protected $signature = 'accounting:journals:run-recurring {--limit=100 : Max recurring profiles to process}';

    protected $description = 'Generate due draft journal entries from recurring profiles.';

    public function handle(JournalRecurringRunnerService $service): int
    {
        $limit = max(1, (int) $this->option('limit'));
        $result = $service->runDue($limit);

        $this->info(sprintf(
            'Recurring journals: profiles_checked=%d, drafts_created=%d',
            $result['profiles'] ?? 0,
            $result['created'] ?? 0
        ));

        return self::SUCCESS;
    }
}

