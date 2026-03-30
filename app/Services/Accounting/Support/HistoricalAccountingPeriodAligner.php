<?php

namespace App\Services\Accounting\Support;

use App\Models\AccountingPeriod;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class HistoricalAccountingPeriodAligner
{
    public function align(): array
    {
        $range = $this->detectRange();
        if (!$range) {
            return ['created' => 0, 'min_date' => null, 'max_date' => null];
        }

        $start = Carbon::parse($range['min_date'])->startOfMonth();
        $end = Carbon::parse($range['max_date'])->endOfMonth();
        $created = 0;

        while ($start->lte($end)) {
            $periodStart = $start->copy()->startOfMonth();
            $periodEnd = $start->copy()->endOfMonth();

            $overlap = AccountingPeriod::query()
                ->where(function ($query) use ($periodStart, $periodEnd) {
                    $query->whereBetween('start_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
                        ->orWhereBetween('end_date', [$periodStart->toDateString(), $periodEnd->toDateString()])
                        ->orWhere(function ($inside) use ($periodStart, $periodEnd) {
                            $inside->where('start_date', '<=', $periodStart->toDateString())
                                ->where('end_date', '>=', $periodEnd->toDateString());
                        });
                })
                ->exists();

            if (!$overlap) {
                AccountingPeriod::create([
                    'name' => $periodStart->format('M Y'),
                    'start_date' => $periodStart->toDateString(),
                    'end_date' => $periodEnd->toDateString(),
                    'status' => 'open',
                ]);
                $created++;
            }

            $start->addMonthNoOverflow();
        }

        return [
            'created' => $created,
            'min_date' => $range['min_date'],
            'max_date' => $range['max_date'],
        ];
    }

    public function missingCoverageCount(): int
    {
        $range = $this->detectRange();
        if (!$range) {
            return 0;
        }

        $missing = 0;
        $cursor = Carbon::parse($range['min_date'])->startOfMonth();
        $end = Carbon::parse($range['max_date'])->endOfMonth();

        while ($cursor->lte($end)) {
            $covered = AccountingPeriod::query()
                ->whereDate('start_date', '<=', $cursor->toDateString())
                ->whereDate('end_date', '>=', $cursor->copy()->endOfMonth()->toDateString())
                ->exists();

            if (!$covered) {
                $missing++;
            }

            $cursor->addMonthNoOverflow();
        }

        return $missing;
    }

    private function detectRange(): ?array
    {
        $dateCandidates = [];

        foreach ([
            ['table' => 'financial_invoices', 'column' => 'issue_date'],
            ['table' => 'financial_receipts', 'column' => 'receipt_date'],
            ['table' => 'journal_entries', 'column' => 'entry_date'],
            ['table' => 'vendor_bills', 'column' => 'bill_date'],
            ['table' => 'vendor_payments', 'column' => 'payment_date'],
            ['table' => 'goods_receipts', 'column' => 'received_date'],
        ] as $source) {
            if (!Schema::hasTable($source['table'])) {
                continue;
            }

            $result = DB::table($source['table'])
                ->selectRaw("MIN(DATE({$source['column']})) as min_date, MAX(DATE({$source['column']})) as max_date")
                ->first();

            if (!empty($result?->min_date)) {
                $dateCandidates[] = ['min' => $result->min_date, 'max' => $result->max_date];
            }
        }

        if (empty($dateCandidates)) {
            return null;
        }

        return [
            'min_date' => collect($dateCandidates)->min('min'),
            'max_date' => collect($dateCandidates)->max('max'),
        ];
    }
}
