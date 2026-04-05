<?php

namespace App\Services\Accounting;

use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\User;
use App\Services\Accounting\Support\AccountingPeriodGate;
use App\Services\OperationalAuditLogger;
use Illuminate\Support\Facades\DB;

class PostingService
{
    public function __construct(
        private readonly AccountingPeriodGate $accountingPeriodGate,
        private readonly OperationalAuditLogger $operationalAuditLogger
    )
    {
    }

    public function post(
        string $moduleType,
        int $moduleId,
        string $entryDate,
        string $description,
        array $lines,
        ?int $createdBy = null,
        ?int $tenantId = null
    ): JournalEntry
    {
        $createdBy = $this->resolveCreatedBy($createdBy);
        $correlationId = request()?->attributes->get('correlation_id') ?: request()?->header('X-Correlation-ID');

        $this->operationalAuditLogger->record([
            'correlation_id' => is_string($correlationId) ? $correlationId : null,
            'module' => 'accounting',
            'entity_type' => $moduleType,
            'entity_id' => (string) $moduleId,
            'action' => 'accounting.posting_service.post.attempted',
            'status' => 'attempted',
            'severity' => 'info',
            'message' => 'Posting service started journal posting.',
            'context' => [
                'entry_date' => $entryDate,
                'line_count' => count($lines),
                'tenant_id' => $tenantId,
            ],
        ]);

        try {
            $this->assertBalancedLines($lines);

            return DB::transaction(function () use ($moduleType, $moduleId, $entryDate, $description, $lines, $createdBy, $tenantId, $correlationId) {
                $postingUniqueKey = "{$moduleType}|{$moduleId}";
                $existing = JournalEntry::query()
                    ->where('posting_unique_key', $postingUniqueKey)
                    ->first();

                if ($existing) {
                    $this->operationalAuditLogger->record([
                        'correlation_id' => is_string($correlationId) ? $correlationId : null,
                        'module' => 'accounting',
                        'entity_type' => $moduleType,
                        'entity_id' => (string) $moduleId,
                        'action' => 'accounting.posting_service.post.idempotent',
                        'status' => 'posted',
                        'severity' => 'info',
                        'message' => 'Posting deduplicated via posting_unique_key.',
                        'context' => [
                            'journal_entry_id' => $existing->id,
                            'posting_unique_key' => $postingUniqueKey,
                        ],
                    ]);
                    return $existing;
                }

                $periodId = $this->accountingPeriodGate->resolveOpenPeriodId($entryDate);

                $entry = JournalEntry::create([
                    'entry_no' => $this->generateEntryNo(),
                    'entry_date' => $entryDate,
                    'description' => $description,
                    'status' => 'posted',
                    'module_type' => $moduleType,
                    'module_id' => $moduleId,
                    'posting_unique_key' => $postingUniqueKey,
                    'tenant_id' => $tenantId,
                    'period_id' => $periodId,
                    'created_by' => $createdBy,
                    'posted_by' => $createdBy,
                    'posted_at' => now(),
                ]);

                foreach ($lines as $line) {
                    JournalLine::create([
                        'journal_entry_id' => $entry->id,
                        'account_id' => $line['account_id'],
                        'description' => $line['description'] ?? null,
                        'debit' => $line['debit'] ?? 0,
                        'credit' => $line['credit'] ?? 0,
                        'vendor_id' => $line['vendor_id'] ?? null,
                        'member_id' => $line['member_id'] ?? null,
                        'employee_id' => $line['employee_id'] ?? null,
                        'product_id' => $line['product_id'] ?? null,
                        'warehouse_id' => $line['warehouse_id'] ?? null,
                        'warehouse_location_id' => $line['warehouse_location_id'] ?? null,
                        'reference_type' => $line['reference_type'] ?? null,
                        'reference_id' => $line['reference_id'] ?? null,
                    ]);
                }

                $this->operationalAuditLogger->record([
                    'correlation_id' => is_string($correlationId) ? $correlationId : null,
                    'module' => 'accounting',
                    'entity_type' => $moduleType,
                    'entity_id' => (string) $moduleId,
                    'action' => 'accounting.posting_service.post.posted',
                    'status' => 'posted',
                    'severity' => 'info',
                    'message' => 'Journal posted by posting service.',
                    'context' => [
                        'journal_entry_id' => $entry->id,
                        'posting_unique_key' => $postingUniqueKey,
                        'entry_date' => $entryDate,
                    ],
                ]);

                return $entry;
            });
        } catch (\Throwable $e) {
            $this->operationalAuditLogger->record([
                'correlation_id' => is_string($correlationId) ? $correlationId : null,
                'module' => 'accounting',
                'entity_type' => $moduleType,
                'entity_id' => (string) $moduleId,
                'action' => 'accounting.posting_service.post.failed',
                'status' => 'failed',
                'severity' => 'error',
                'message' => $e->getMessage(),
                'context' => [
                    'entry_date' => $entryDate,
                    'line_count' => count($lines),
                ],
            ]);
            throw $e;
        }
    }

    private function resolveCreatedBy(?int $createdBy): ?int
    {
        if (!$createdBy) {
            return null;
        }

        return User::query()->whereKey($createdBy)->exists() ? $createdBy : null;
    }

    private function generateEntryNo(): string
    {
        $attempts = 0;

        do {
            $attempts++;
            $candidate = sprintf('JE-%s-%04d', now()->format('YmdHis'), random_int(1, 9999));
        } while (JournalEntry::query()->where('entry_no', $candidate)->exists() && $attempts < 20);

        return $candidate;
    }

    private function assertBalancedLines(array $lines): void
    {
        if (empty($lines)) {
            throw new \InvalidArgumentException('Journal posting requires at least one line.');
        }

        $debit = 0.0;
        $credit = 0.0;
        foreach ($lines as $idx => $line) {
            if (empty($line['account_id'])) {
                throw new \InvalidArgumentException("Journal line at index {$idx} is missing account_id.");
            }
            $debit += (float) ($line['debit'] ?? 0);
            $credit += (float) ($line['credit'] ?? 0);
        }

        if (abs($debit - $credit) > 0.0001) {
            throw new \InvalidArgumentException('Journal lines are unbalanced and cannot be posted.');
        }
    }
}
