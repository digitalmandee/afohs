<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VerifyProductionMigrations extends Command
{
    protected $signature = 'deploy:verify-production-migrations';

    protected $description = 'Verify the production-safe migration footprint for the recent accounting backfill and procurement schema changes.';

    public function handle(): int
    {
        try {
            return $this->runVerification();
        } catch (QueryException $exception) {
            $this->error('Production migration verification failed because the database connection is unavailable.');
            $this->line('Connection error: ' . $exception->getMessage());
            $this->warn('Check database connectivity and rerun this command after deploy.');

            return self::FAILURE;
        }
    }

    private function runVerification(): int
    {
        $expectedMigrations = [
            '2026_03_26_150000_make_purchase_order_item_product_id_nullable',
            '2026_03_26_220000_create_accounting_backfill_runs_table',
            '2026_03_26_220100_create_accounting_backfill_records_table',
        ];

        $issues = [];

        if (!Schema::hasTable('migrations')) {
            $this->error('The migrations table is missing.');
            $this->warn('Do not use migrate:fresh on production. Repair the migration repository first.');

            return self::FAILURE;
        }

        $this->info('Migration Records');
        $ranMigrations = DB::table('migrations')->pluck('migration')->all();

        foreach ($expectedMigrations as $migration) {
            if (in_array($migration, $ranMigrations, true)) {
                $this->line("PASS migration {$migration}");
            } else {
                $issues[] = "Missing migration record: {$migration}";
                $this->line("FAIL migration {$migration}");
            }
        }

        $this->newLine();
        $this->info('Schema Objects');

        foreach (['accounting_backfill_runs', 'accounting_backfill_records'] as $table) {
            if (Schema::hasTable($table)) {
                $this->line("PASS table {$table}");
            } else {
                $issues[] = "Missing table: {$table}";
                $this->line("FAIL table {$table}");
            }
        }

        if (!Schema::hasTable('purchase_order_items')) {
            $issues[] = 'Missing table: purchase_order_items';
            $this->line('FAIL table purchase_order_items');
        } elseif (!Schema::hasColumn('purchase_order_items', 'product_id')) {
            $issues[] = 'Missing column: purchase_order_items.product_id';
            $this->line('FAIL column purchase_order_items.product_id');
        } else {
            $productColumn = collect(Schema::getColumns('purchase_order_items'))
                ->firstWhere('name', 'product_id');

            if (($productColumn['nullable'] ?? false) === true) {
                $this->line('PASS column purchase_order_items.product_id nullable');
            } else {
                $issues[] = 'Column purchase_order_items.product_id is not nullable';
                $this->line('FAIL column purchase_order_items.product_id nullable');
            }
        }

        $this->newLine();
        $this->info('Deployment Guidance');
        $this->line('Expected production flow: composer install --no-dev --optimize-autoloader');
        $this->line('Then run: php artisan migrate --force');
        $this->line('Then run: php artisan optimize:clear');
        $this->line('Optional: php artisan accounting:verify-module');
        $this->warn('Do not use migrate:fresh on production unless schema drift has already been proven and repaired outside production.');

        if (!empty($issues)) {
            $this->newLine();
            $this->error('Production migration verification failed.');
            foreach ($issues as $issue) {
                $this->line("- {$issue}");
            }

            return self::FAILURE;
        }

        $this->newLine();
        $this->info('Production migration verification passed.');

        return self::SUCCESS;
    }
}
