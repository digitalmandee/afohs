<?php

namespace App\Services\Accounting;

use App\Models\JournalEntry;
use App\Models\JournalLine;
use Illuminate\Support\Facades\DB;

class PostingService
{
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
        return DB::transaction(function () use ($moduleType, $moduleId, $entryDate, $description, $lines, $createdBy, $tenantId) {
            $entry = JournalEntry::create([
                'entry_no' => $this->generateEntryNo(),
                'entry_date' => $entryDate,
                'description' => $description,
                'status' => 'posted',
                'module_type' => $moduleType,
                'module_id' => $moduleId,
                'tenant_id' => $tenantId,
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

            return $entry;
        });
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
}
