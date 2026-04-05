<?php

namespace App\Services\Accounting;

use App\Models\AccountingEventQueue;
use Illuminate\Validation\ValidationException;

class StrictAccountingSyncService
{
    public function __construct(
        private readonly AccountingSyncPolicyService $policyService
    ) {
    }

    public function enforceOrFail(AccountingEventQueue $event, string $contextLabel): void
    {
        if (!$this->policyService->isStrictForEvent((string) $event->event_type)) {
            return;
        }

        if ($event->status === 'posted') {
            return;
        }

        throw ValidationException::withMessages([
            'accounting' => "{$contextLabel} could not be posted to GL. " . ($event->error_message ?: 'Unknown accounting posting error.'),
        ]);
    }
}

