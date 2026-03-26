<?php

namespace App\Console\Commands;

use App\Models\AccountingPeriod;
use Carbon\Carbon;
use Illuminate\Console\Command;

class BootstrapAccountingPeriods extends Command
{
    protected $signature = 'accounting:periods:bootstrap {--year= : Year to initialize, defaults to current year}';

    protected $description = 'Ensure a baseline open accounting period exists for the requested year.';

    public function handle(): int
    {
        $year = (int) ($this->option('year') ?: now()->year);
        $start = Carbon::create($year, 1, 1)->startOfDay();
        $end = Carbon::create($year, 12, 31)->endOfDay();

        $period = AccountingPeriod::query()
            ->whereDate('start_date', $start->toDateString())
            ->whereDate('end_date', $end->toDateString())
            ->first();

        if (!$period) {
            $period = AccountingPeriod::create([
                'name' => "{$year} Fiscal Period",
                'start_date' => $start->toDateString(),
                'end_date' => $end->toDateString(),
                'status' => 'open',
            ]);

            $this->info("Created accounting period #{$period->id} for {$year}.");
            return self::SUCCESS;
        }

        if ($period->status !== 'open') {
            $period->update([
                'status' => 'open',
                'locked_at' => null,
                'locked_by' => null,
            ]);
            $this->info("Reopened accounting period #{$period->id} for {$year}.");
            return self::SUCCESS;
        }

        $this->info("Accounting period #{$period->id} for {$year} is already open.");
        return self::SUCCESS;
    }
}
