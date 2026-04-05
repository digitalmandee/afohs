<?php

namespace App\Console\Commands;

use App\Models\AccountingEventQueue;
use App\Models\JournalEntry;
use App\Services\Accounting\AccountingSyncPolicyService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AccountingReleaseGate extends Command
{
    protected $signature = 'accounting:release-gate
        {--days=30 : Lookback window for failed events}
        {--max-critical-failed=0 : Allowed failed strict events after allowlist}
        {--allow-pattern=*amount is zero* : Comma-separated wildcard patterns to ignore known historical failures}';

    protected $description = 'Fail release gate if critical accounting failures or duplicate posted journals are detected.';

    public function handle(AccountingSyncPolicyService $policyService): int
    {
        $days = max(1, (int) $this->option('days'));
        $threshold = max(0, (int) $this->option('max-critical-failed'));
        $cutoff = Carbon::now()->subDays($days);
        $allowOption = $this->option('allow-pattern');
        $allowPatterns = collect(is_array($allowOption) ? $allowOption : explode(',', (string) $allowOption))
            ->flatMap(fn ($value) => explode(',', (string) $value))
            ->map(fn ($value) => trim((string) $value))
            ->filter()
            ->values();

        $strictTypes = collect((array) ($policyService->all()['strict_event_types'] ?? []))
            ->filter()
            ->values();

        $failedEvents = AccountingEventQueue::query()
            ->where('status', 'failed')
            ->whereIn('event_type', $strictTypes->all())
            ->where('updated_at', '>=', $cutoff)
            ->orderByDesc('id')
            ->get(['id', 'event_type', 'source_type', 'source_id', 'error_message', 'updated_at']);

        $unallowlisted = $failedEvents->filter(function ($event) use ($allowPatterns) {
            $message = Str::lower((string) ($event->error_message ?: ''));
            if ($message === '') {
                return true;
            }

            foreach ($allowPatterns as $pattern) {
                $normalizedPattern = Str::lower((string) $pattern);
                if (Str::is($normalizedPattern, $message)) {
                    return false;
                }
            }

            return true;
        })->values();

        $duplicates = JournalEntry::query()
            ->selectRaw('module_type, module_id, COUNT(*) as duplicates')
            ->whereNotNull('module_type')
            ->whereNotNull('module_id')
            ->groupBy('module_type', 'module_id')
            ->having('duplicates', '>', 1)
            ->get();

        $this->table(
            ['Metric', 'Value'],
            [
                ['Lookback Days', $days],
                ['Strict Event Types', $strictTypes->count()],
                ['Failed Strict Events (Raw)', $failedEvents->count()],
                ['Failed Strict Events (After Allowlist)', $unallowlisted->count()],
                ['Allowed Threshold', $threshold],
                ['Duplicate Journal Groups', $duplicates->count()],
            ]
        );

        if ($unallowlisted->isNotEmpty()) {
            $this->warn('Critical failed strict events:');
            foreach ($unallowlisted->take(20) as $event) {
                $this->line(sprintf(
                    '- #%d %s %s::%d %s',
                    $event->id,
                    $event->event_type,
                    class_basename((string) $event->source_type),
                    (int) $event->source_id,
                    (string) ($event->error_message ?: 'No error message')
                ));
            }
        }

        if ($duplicates->isNotEmpty()) {
            $this->warn('Duplicate journal groups:');
            foreach ($duplicates->take(20) as $dup) {
                $this->line(sprintf(
                    '- %s::%d duplicates=%d',
                    (string) $dup->module_type,
                    (int) $dup->module_id,
                    (int) $dup->duplicates
                ));
            }
        }

        if ($unallowlisted->count() > $threshold || $duplicates->isNotEmpty()) {
            $this->error('Accounting release gate failed.');
            return self::FAILURE;
        }

        $this->info('Accounting release gate passed.');
        return self::SUCCESS;
    }
}
