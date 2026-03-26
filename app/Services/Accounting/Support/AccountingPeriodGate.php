<?php

namespace App\Services\Accounting\Support;

use App\Models\AccountingPeriod;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class AccountingPeriodGate
{
    public function resolveOpenPeriodId(string $entryDate, ?int $periodId = null): int
    {
        $date = Carbon::parse($entryDate)->toDateString();

        if ($periodId) {
            $period = AccountingPeriod::query()->find($periodId);

            if (!$period) {
                throw new RuntimeException('Selected accounting period could not be found.');
            }

            if ($period->status !== 'open') {
                throw new RuntimeException('Selected accounting period is closed/locked.');
            }

            if ($date < $period->start_date->toDateString() || $date > $period->end_date->toDateString()) {
                throw new RuntimeException('Entry date falls outside the selected accounting period.');
            }

            return (int) $period->id;
        }

        $period = AccountingPeriod::query()
            ->where('status', 'open')
            ->whereDate('start_date', '<=', $date)
            ->whereDate('end_date', '>=', $date)
            ->orderBy('start_date')
            ->first();

        if (!$period) {
            throw new RuntimeException("No open accounting period covers {$date}.");
        }

        return (int) $period->id;
    }

    public function assertOpenForRequest(string $entryDate, ?int $periodId = null): int
    {
        try {
            return $this->resolveOpenPeriodId($entryDate, $periodId);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'period_id' => $exception->getMessage(),
            ]);
        }
    }
}
