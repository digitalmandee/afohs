<?php

namespace App\Services\Accounting\Contracts;

use App\Models\AccountingEventQueue;
use App\Models\JournalEntry;

interface PostingAdapter
{
    public function supports(AccountingEventQueue $event): bool;

    public function post(AccountingEventQueue $event): ?JournalEntry;
}
