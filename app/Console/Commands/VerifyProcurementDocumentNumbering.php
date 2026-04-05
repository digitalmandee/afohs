<?php

namespace App\Console\Commands;

use App\Models\Branch;
use Illuminate\Console\Command;

class VerifyProcurementDocumentNumbering extends Command
{
    protected $signature = 'procurement:verify-document-numbering';

    protected $description = 'Verify branch codes required for branch-based PO/GRN/PINV numbering';

    public function handle(): int
    {
        $missing = Branch::query()
            ->where(function ($query) {
                $query->whereNull('branch_code')
                    ->orWhere('branch_code', '');
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        if ($missing->isEmpty()) {
            $this->info('OK: All branches have branch_code for procurement document numbering.');
            return self::SUCCESS;
        }

        $this->error('Missing branch_code on the following branches:');
        foreach ($missing as $branch) {
            $this->line("- [{$branch->id}] {$branch->name}");
        }

        return self::FAILURE;
    }
}

