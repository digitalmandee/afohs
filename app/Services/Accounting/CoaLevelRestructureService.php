<?php

namespace App\Services\Accounting;

use App\Models\CoaAccount;
use Illuminate\Support\Facades\DB;

class CoaLevelRestructureService
{
    public function preview(): array
    {
        return $this->run(true);
    }

    public function execute(): array
    {
        return DB::transaction(fn () => $this->run(false));
    }

    private function run(bool $dryRun): array
    {
        $report = [
            'dry_run' => $dryRun,
            'processed' => 0,
            'created_level3_headers' => 0,
            'created_headers' => 0,
            'moved_accounts' => 0,
            'repaired_headers' => 0,
            'skipped' => [],
        ];

        $accounts = CoaAccount::query()
            ->where('level', 3)
            ->where('is_postable', true)
            ->orderBy('full_code')
            ->get();

        foreach ($accounts as $account) {
            $report['processed']++;

            $baseSegments = [
                $account->segment1,
                $account->segment2,
                $account->segment3,
            ];

            if (in_array(null, $baseSegments, true) || in_array('', $baseSegments, true)) {
                $report['skipped'][] = "{$account->full_code}: missing required level-3 prefix segments.";
                continue;
            }

            $headerSegments = [...$baseSegments, '00'];
            $childSegments = [...$headerSegments, '01'];
            $level3HeaderCode = $account->full_code;
            $headerCode = implode('-', $headerSegments);
            $childCode = implode('-', $childSegments);

            $header = CoaAccount::query()->firstWhere('full_code', $headerCode);
            if ($header && ((int) $header->level !== 4 || $header->is_postable || $header->type !== $account->type)) {
                $report['skipped'][] = "{$account->full_code}: conflicting existing header {$headerCode}.";
                continue;
            }

            $existingChild = CoaAccount::query()->where('full_code', $childCode)->where('id', '!=', $account->id)->first();
            if ($existingChild) {
                $report['skipped'][] = "{$account->full_code}: target child code {$childCode} already belongs to another account.";
                continue;
            }

            if ($dryRun) {
                $report['created_level3_headers']++;
                if (!$header) {
                    $report['created_headers']++;
                }
                $report['moved_accounts']++;
                continue;
            }

            $originalParentId = $account->parent_id;
            $originalName = $account->name;
            $originalDescription = $account->description;
            $originalMetadata = (array) $account->metadata;

            if (!$header) {
                $account->update([
                    'segment4' => $headerSegments[3],
                    'segment5' => $childSegments[4],
                    'full_code' => $childCode,
                    'level' => 5,
                    'parent_id' => null,
                    'metadata' => array_merge($originalMetadata, [
                        'restructure_origin' => 'level3_to_level5_posting',
                        'former_full_code' => $level3HeaderCode,
                    ]),
                ]);

                $level3Header = CoaAccount::create([
                    'segment1' => $baseSegments[0],
                    'segment2' => $baseSegments[1],
                    'segment3' => $baseSegments[2],
                    'segment4' => null,
                    'segment5' => null,
                    'full_code' => $level3HeaderCode,
                    'name' => $originalName,
                    'type' => $account->type,
                    'normal_balance' => $account->normal_balance,
                    'level' => 3,
                    'parent_id' => $originalParentId,
                    'opening_balance' => 0,
                    'description' => 'Auto-generated level 3 header for ' . $originalName,
                    'is_postable' => false,
                    'is_active' => true,
                    'metadata' => array_merge($originalMetadata, [
                        'restructure_origin' => 'level3_to_level5_intermediate_header',
                        'source_account_id' => $account->id,
                    ]),
                ]);
                $report['created_level3_headers']++;

                $header = CoaAccount::create([
                    'segment1' => $headerSegments[0],
                    'segment2' => $headerSegments[1],
                    'segment3' => $headerSegments[2],
                    'segment4' => $headerSegments[3],
                    'segment5' => null,
                    'full_code' => $headerCode,
                    'name' => $originalName . ' Group',
                    'type' => $account->type,
                    'normal_balance' => $account->normal_balance,
                    'level' => 4,
                    'parent_id' => $level3Header->id,
                    'opening_balance' => 0,
                    'description' => 'Auto-generated level 4 header for ' . $originalName,
                    'is_postable' => false,
                    'is_active' => true,
                    'metadata' => array_merge($originalMetadata, [
                        'restructure_origin' => 'level3_to_level5_header',
                        'source_account_id' => $account->id,
                    ]),
                ]);
                $report['created_headers']++;
            }

            $account->update([
                'segment4' => $headerSegments[3],
                'segment5' => $childSegments[4],
                'full_code' => $childCode,
                'level' => 5,
                'parent_id' => $header->id,
                'description' => $originalDescription,
                'metadata' => array_merge((array) $account->metadata, [
                    'restructure_origin' => 'level3_to_level5_posting',
                    'former_full_code' => $level3HeaderCode,
                ]),
            ]);
            $report['moved_accounts']++;
        }

        $report['repaired_headers'] = $this->repairExistingHeaders($dryRun);

        return $report;
    }

    private function repairExistingHeaders(bool $dryRun): int
    {
        $repairs = 0;

        $accounts = CoaAccount::query()
            ->where('level', 5)
            ->orderBy('full_code')
            ->get()
            ->filter(fn (CoaAccount $account) => !empty(((array) $account->metadata)['former_full_code'] ?? null));

        foreach ($accounts as $account) {
            $metadata = (array) $account->metadata;
            $formerFullCode = (string) ($metadata['former_full_code'] ?? '');
            $header = $account->parent;

            if ($formerFullCode === '' || !$header) {
                continue;
            }

            $baseSegments = array_values(array_filter(explode('-', $formerFullCode), fn ($segment) => $segment !== ''));
            if (count($baseSegments) !== 3) {
                continue;
            }

            $level3Header = CoaAccount::query()->firstWhere('full_code', $formerFullCode);
            if ($level3Header && ((int) $level3Header->level !== 3 || $level3Header->is_postable || $level3Header->type !== $account->type)) {
                continue;
            }

            $shouldRepair = !$level3Header || (int) $header->parent_id !== (int) $level3Header->id;

            if (!$shouldRepair) {
                continue;
            }

            if ($dryRun) {
                $repairs++;
                continue;
            }

            if (!$level3Header) {
                $level3Header = CoaAccount::create([
                    'segment1' => $baseSegments[0],
                    'segment2' => $baseSegments[1],
                    'segment3' => $baseSegments[2],
                    'segment4' => null,
                    'segment5' => null,
                    'full_code' => $formerFullCode,
                    'name' => $account->name,
                    'type' => $account->type,
                    'normal_balance' => $account->normal_balance,
                    'level' => 3,
                    'parent_id' => $header->parent_id,
                    'opening_balance' => 0,
                    'description' => 'Auto-generated level 3 header for ' . $account->name,
                    'is_postable' => false,
                    'is_active' => true,
                    'metadata' => array_merge($metadata, [
                        'restructure_origin' => 'level3_to_level5_intermediate_header',
                        'source_account_id' => $account->id,
                    ]),
                ]);
            }

            if ((int) $header->parent_id !== (int) $level3Header->id) {
                $header->update(['parent_id' => $level3Header->id]);
            }

            $repairs++;
        }

        return $repairs;
    }
}
