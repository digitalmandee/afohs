<?php

namespace App\Console\Commands;

use App\Models\AccountingEventQueue;
use App\Services\Accounting\AccountingEventDispatcher;
use Illuminate\Console\Command;

class ProcessAccountingEvents extends Command
{
    protected $signature = 'accounting:process-events {--limit=100 : Max events to process}';

    protected $description = 'Process pending/failed accounting events and attempt posting.';

    public function handle(AccountingEventDispatcher $dispatcher): int
    {
        $limit = max(1, (int) $this->option('limit'));

        $events = AccountingEventQueue::query()
            ->whereIn('status', ['pending', 'failed'])
            ->orderBy('id')
            ->limit($limit)
            ->get();

        if ($events->isEmpty()) {
            $this->info('No accounting events to process.');
            return self::SUCCESS;
        }

        foreach ($events as $event) {
            $dispatcher->process($event);
            $this->line("Processed event {$event->id} ({$event->event_type})");
        }

        $this->info("Processed {$events->count()} accounting event(s).");
        return self::SUCCESS;
    }
}
