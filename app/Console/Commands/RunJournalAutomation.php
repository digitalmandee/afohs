<?php

namespace App\Console\Commands;

use App\Services\JournalApprovalAutomationService;
use Illuminate\Console\Command;

class RunJournalAutomation extends Command
{
    protected $signature = 'accounting:journals:automation 
                            {--overdue-limit=200 : Max draft journals to inspect for overdue reminders}
                            {--retry-limit=100 : Max failed delivery rows to retry}';

    protected $description = 'Run journal approval automation (overdue reminders + failed delivery retries).';

    public function handle(JournalApprovalAutomationService $service): int
    {
        $overdueLimit = max(1, (int) $this->option('overdue-limit'));
        $retryLimit = max(1, (int) $this->option('retry-limit'));

        $overdue = $service->remindOverdue($overdueLimit);
        $retry = $service->retryFailedDeliveries($retryLimit);

        $this->info(
            sprintf(
                'Overdue reminders: checked=%d, overdue=%d, reminded=%d, notifications_sent=%d',
                $overdue['checked'] ?? 0,
                $overdue['overdue'] ?? 0,
                $overdue['reminded'] ?? 0,
                $overdue['sent'] ?? 0
            )
        );

        $this->info(
            sprintf(
                'Delivery retries: checked=%d, retried=%d, succeeded=%d',
                $retry['checked'] ?? 0,
                $retry['retried'] ?? 0,
                $retry['succeeded'] ?? 0
            )
        );

        return self::SUCCESS;
    }
}

