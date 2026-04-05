<?php

namespace App\Console\Commands;

use App\Models\OperationalAuditLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class VerifyOperationalLogging extends Command
{
    protected $signature = 'ops:verify-logging
        {--hours=24 : Lookback window in hours}
        {--limit=30 : Maximum rows to display}
        {--max-missing-correlation=0 : Allowed rows with missing correlation id}
        {--max-missing-context-ratio=0.10 : Allowed ratio (0-1) of empty context rows}';

    protected $description = 'Verify operational logging quality: correlation IDs, context coverage, and module error volume.';

    public function handle(): int
    {
        if (!Schema::hasTable('operational_audit_logs')) {
            $this->error('Table operational_audit_logs not found. Run migrations first.');
            return self::FAILURE;
        }

        $hours = max(1, (int) $this->option('hours'));
        $limit = max(1, (int) $this->option('limit'));
        $maxMissingCorrelation = max(0, (int) $this->option('max-missing-correlation'));
        $maxMissingContextRatio = max(0.0, min(1.0, (float) $this->option('max-missing-context-ratio')));

        $since = now()->subHours($hours);
        $query = OperationalAuditLog::query()->where('created_at', '>=', $since);
        $total = (int) $query->count();

        if ($total === 0) {
            $this->warn("No operational audit rows found in last {$hours} hours.");
            return self::FAILURE;
        }

        $missingCorrelation = (int) (clone $query)->where(function ($q) {
            $q->whereNull('correlation_id')->orWhere('correlation_id', '');
        })->count();

        $missingContext = (int) (clone $query)->where(function ($q) {
            $q->whereNull('context_json')->orWhereRaw('JSON_LENGTH(context_json) = 0');
        })->count();

        $failedByModule = (clone $query)
            ->where('status', 'failed')
            ->selectRaw('module, COUNT(*) as total')
            ->groupBy('module')
            ->orderByDesc('total')
            ->get();

        $recentFailed = (clone $query)
            ->where('status', 'failed')
            ->latest('id')
            ->limit($limit)
            ->get(['id', 'module', 'action', 'message', 'correlation_id', 'created_at']);

        $missingContextRatio = $total > 0 ? ($missingContext / $total) : 0.0;

        $this->table(
            ['Metric', 'Value'],
            [
                ['Rows scanned', $total],
                ['Missing correlation IDs', $missingCorrelation],
                ['Missing context rows', $missingContext],
                ['Missing context ratio', number_format($missingContextRatio * 100, 2) . '%'],
            ]
        );

        if ($failedByModule->isNotEmpty()) {
            $this->line('');
            $this->info('Failed events by module:');
            $this->table(
                ['Module', 'Failed Count'],
                $failedByModule->map(fn ($row) => [$row->module, (int) $row->total])->all()
            );
        }

        if ($recentFailed->isNotEmpty()) {
            $this->line('');
            $this->warn('Recent failed events:');
            $this->table(
                ['ID', 'Module', 'Action', 'Message', 'Correlation ID', 'At'],
                $recentFailed->map(fn ($row) => [
                    $row->id,
                    $row->module,
                    $row->action,
                    mb_strimwidth((string) $row->message, 0, 80, '...'),
                    $row->correlation_id ?: '-',
                    optional($row->created_at)->toDateTimeString(),
                ])->all()
            );
        }

        $failed = false;
        if ($missingCorrelation > $maxMissingCorrelation) {
            $this->error("Missing correlation IDs exceed threshold ({$missingCorrelation} > {$maxMissingCorrelation}).");
            $failed = true;
        }
        if ($missingContextRatio > $maxMissingContextRatio) {
            $this->error('Missing context ratio exceeds threshold (' . number_format($missingContextRatio, 3) . ' > ' . number_format($maxMissingContextRatio, 3) . ').');
            $failed = true;
        }

        if ($failed) {
            $this->error('Operational logging verification failed.');
            return self::FAILURE;
        }

        $this->info('Operational logging verification passed.');
        return self::SUCCESS;
    }
}
