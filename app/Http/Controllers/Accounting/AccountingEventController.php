<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEventQueue;
use App\Services\Accounting\AccountingEventDispatcher;

class AccountingEventController extends Controller
{
    public function retry(AccountingEventQueue $event, AccountingEventDispatcher $dispatcher)
    {
        $dispatcher->process($event);

        return redirect()->back()->with('success', "Accounting event #{$event->id} reprocessed.");
    }

    public function retryAll(AccountingEventDispatcher $dispatcher)
    {
        $events = AccountingEventQueue::query()
            ->where('status', 'failed')
            ->orderBy('id')
            ->limit(100)
            ->get();

        foreach ($events as $event) {
            $dispatcher->process($event);
        }

        return redirect()->back()->with('success', "Reprocessed {$events->count()} failed event(s).");
    }
}
