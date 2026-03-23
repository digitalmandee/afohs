<?php

namespace App\Console\Commands;

use App\Models\CoaAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

class AuditCoaHierarchy extends Command
{
    protected $signature = 'accounting:coa:audit';

    protected $description = 'Audit chart of accounts hierarchy consistency for level, full code, and parent prefix alignment.';

    public function handle(): int
    {
        if (!Schema::hasTable('coa_accounts')) {
            $this->components->error('coa_accounts table is not available.');
            return self::FAILURE;
        }

        $rows = CoaAccount::query()->orderBy('full_code')->get();

        $levelMismatches = [];
        $codeMismatches = [];
        $parentMismatches = [];
        $levelFiveBlocked = [];

        foreach ($rows as $account) {
            $segments = array_values(array_filter([
                $account->segment1,
                $account->segment2,
                $account->segment3,
                $account->segment4,
                $account->segment5,
            ], fn ($segment) => $segment !== null && $segment !== ''));

            $expectedLevel = count($segments);
            $expectedCode = implode('-', $segments);

            if ((int) $account->level !== $expectedLevel) {
                $levelMismatches[] = "{$account->id}: {$account->full_code} stored level {$account->level}, expected {$expectedLevel}";
            }

            if ((string) $account->full_code !== $expectedCode) {
                $codeMismatches[] = "{$account->id}: stored {$account->full_code}, expected {$expectedCode}";
            }

            if ($account->parent_id) {
                $parent = $rows->firstWhere('id', $account->parent_id);
                $expectedParentCode = $expectedLevel > 1 ? implode('-', array_slice($segments, 0, -1)) : null;

                if (
                    !$parent
                    || (int) $parent->level !== ($expectedLevel - 1)
                    || (string) $parent->full_code !== (string) $expectedParentCode
                ) {
                    $parentMismatches[] = "{$account->id}: {$account->full_code} parent mismatch";
                }
            }

            if ((int) $account->level === 4 && !$account->segment5 && !$account->is_postable) {
                $levelFiveBlocked[] = "{$account->id}: {$account->full_code} is a non-postable level-4 account and can accept level-5 children";
            }
        }

        $this->components->info('COA audit complete.');
        $this->line('Accounts scanned: ' . $rows->count());
        $this->line('Level mismatches: ' . count($levelMismatches));
        $this->line('Code mismatches: ' . count($codeMismatches));
        $this->line('Parent mismatches: ' . count($parentMismatches));
        $this->line('Level-4 parents available for level-5 children: ' . count($levelFiveBlocked));

        foreach ([
            'Level mismatches' => $levelMismatches,
            'Code mismatches' => $codeMismatches,
            'Parent mismatches' => $parentMismatches,
        ] as $label => $items) {
            if (empty($items)) {
                continue;
            }

            $this->newLine();
            $this->warn($label);
            foreach (array_slice($items, 0, 20) as $item) {
                $this->line('- ' . $item);
            }
        }

        return self::SUCCESS;
    }
}
