<?php

namespace App\Services;

use App\Models\ApprovalAction;
use App\Models\JournalEntry;
use App\Models\JournalRecurringProfile;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class JournalRecurringRunnerService
{
    public function runDue(int $limit = 100): array
    {
        if (!Schema::hasTable('journal_templates') || !Schema::hasTable('journal_recurring_profiles')) {
            return ['profiles' => 0, 'created' => 0];
        }

        $today = Carbon::today()->toDateString();
        $profiles = JournalRecurringProfile::query()
            ->with('template')
            ->where('is_active', true)
            ->whereDate('next_run_date', '<=', $today)
            ->orderBy('next_run_date')
            ->limit(max(1, $limit))
            ->get();

        $created = 0;
        DB::transaction(function () use (&$created, $profiles) {
            foreach ($profiles as $profile) {
                if (!$profile->template || !$profile->template->is_active) {
                    continue;
                }

                $entry = JournalEntry::create([
                    'entry_no' => $this->generateEntryNo('JE'),
                    'entry_date' => $profile->next_run_date?->toDateString() ?? Carbon::today()->toDateString(),
                    'description' => 'Recurring from template: ' . $profile->template->name,
                    'status' => 'draft',
                    'module_type' => JournalRecurringProfile::class,
                    'module_id' => $profile->id,
                    'created_by' => $profile->created_by,
                ]);

                $entry->lines()->createMany(collect($profile->template->lines)
                    ->map(fn($line) => [
                        'account_id' => $line['account_id'] ?? null,
                        'description' => $line['description'] ?? null,
                        'debit' => $line['debit'] ?? 0,
                        'credit' => $line['credit'] ?? 0,
                        'vendor_id' => $line['vendor_id'] ?? null,
                        'member_id' => $line['member_id'] ?? null,
                        'employee_id' => $line['employee_id'] ?? null,
                        'product_id' => $line['product_id'] ?? null,
                        'warehouse_id' => $line['warehouse_id'] ?? null,
                        'reference_type' => $line['reference_type'] ?? null,
                        'reference_id' => $line['reference_id'] ?? null,
                    ])
                    ->filter(fn($line) => !empty($line['account_id']))
                    ->values()
                    ->all());

                $profile->update([
                    'last_run_at' => now(),
                    'next_run_date' => $this->nextRunDate($profile->next_run_date?->toDateString(), $profile->frequency),
                ]);

                if (Schema::hasTable('approval_actions')) {
                    ApprovalAction::create([
                        'document_type' => JournalEntry::class,
                        'document_id' => $entry->id,
                        'action' => 'submitted',
                        'remarks' => '[created] Draft journal created from recurring profile.',
                        'action_by' => $profile->created_by,
                    ]);
                }

                $created++;
            }
        });

        return ['profiles' => $profiles->count(), 'created' => $created];
    }

    private function nextRunDate(?string $currentDate, string $frequency): string
    {
        $date = $currentDate ? Carbon::parse($currentDate) : Carbon::today();

        return match ($frequency) {
            'weekly' => $date->addWeek()->toDateString(),
            'monthly' => $date->addMonth()->toDateString(),
            'quarterly' => $date->addMonths(3)->toDateString(),
            'yearly' => $date->addYear()->toDateString(),
            default => $date->addMonth()->toDateString(),
        };
    }

    private function generateEntryNo(string $prefix): string
    {
        $attempts = 0;
        do {
            $attempts++;
            $candidate = sprintf('%s-%s-%04d', $prefix, now()->format('Ymd'), random_int(1, 9999));
        } while (JournalEntry::where('entry_no', $candidate)->exists() && $attempts < 20);

        return $candidate;
    }
}
