<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEventQueue;
use App\Services\Accounting\AccountingEventDispatcher;
use Illuminate\Http\Request;

class AccountingEventController extends Controller
{
    public function retry(AccountingEventQueue $event, AccountingEventDispatcher $dispatcher)
    {
        $dispatcher->process($event);

        return redirect()->back()->with('success', "Accounting event #{$event->id} reprocessed.");
    }

    public function retryAll(Request $request, AccountingEventDispatcher $dispatcher)
    {
        $events = AccountingEventQueue::query()
            ->where('status', $request->input('status', 'failed'))
            ->when($request->filled('event_type'), fn ($query) => $query->where('event_type', $request->string('event_type')->toString()))
            ->when($request->filled('source_type'), fn ($query) => $query->where('source_type', $request->string('source_type')->toString()))
            ->when($request->filled('from'), fn ($query) => $query->whereDate('created_at', '>=', $request->input('from')))
            ->when($request->filled('to'), fn ($query) => $query->whereDate('created_at', '<=', $request->input('to')))
            ->orderBy('id')
            ->limit((int) min(500, max(1, $request->integer('limit', 100))))
            ->get();

        foreach ($events as $event) {
            $dispatcher->process($event);
        }

        return redirect()->back()->with('success', "Reprocessed {$events->count()} failed event(s).");
    }
}
