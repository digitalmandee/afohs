<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class VerifyWarehouseSchema extends Command
{
    protected $signature = 'inventory:verify-warehouse-schema';

    protected $description = 'Verify required warehouse module schema for strict-mode pages (master, coverage, categories).';

    public function handle(): int
    {
        try {
            return $this->runVerification();
        } catch (QueryException $exception) {
            $this->error('Warehouse schema verification failed because database connection is unavailable.');
            $this->line('Connection error: ' . $exception->getMessage());
            $this->warn('Ensure database credentials/network are correct, then rerun this command.');
            Log::channel('inventory')->error('inventory.schema.verify.failed', [
                'event' => 'inventory.schema.verify.failed',
                'reason_code' => 'db_connection_unavailable',
                'message' => $exception->getMessage(),
                'environment' => app()->environment(),
                'database_connection' => config('database.default'),
            ]);

            return self::FAILURE;
        }
    }

    protected function runVerification(): int
    {
        $missing = [];
        $requiredCategorySlugs = ['central', 'back-store', 'sellable'];

        $requiredTables = [
            'warehouses',
            'warehouse_categories',
            'warehouse_restaurants',
            'warehouse_locations',
        ];

        foreach ($requiredTables as $table) {
            if (!Schema::hasTable($table)) {
                $missing[] = "Missing table: {$table}";
                $this->line("FAIL table {$table}");
            } else {
                $this->line("PASS table {$table}");
            }
        }

        if (!Schema::hasColumn('warehouses', 'all_restaurants')) {
            $missing[] = 'Missing column: warehouses.all_restaurants';
            $this->line('FAIL column warehouses.all_restaurants');
        } else {
            $this->line('PASS column warehouses.all_restaurants');
        }

        if (!Schema::hasColumn('warehouses', 'category_id')) {
            $missing[] = 'Missing column: warehouses.category_id';
            $this->line('FAIL column warehouses.category_id');
        } else {
            $this->line('PASS column warehouses.category_id');
        }

        if (!Schema::hasColumn('warehouse_restaurants', 'warehouse_id')) {
            $missing[] = 'Missing column: warehouse_restaurants.warehouse_id';
            $this->line('FAIL column warehouse_restaurants.warehouse_id');
        } else {
            $this->line('PASS column warehouse_restaurants.warehouse_id');
        }

        if (!Schema::hasColumn('warehouse_restaurants', 'restaurant_id')) {
            $missing[] = 'Missing column: warehouse_restaurants.restaurant_id';
            $this->line('FAIL column warehouse_restaurants.restaurant_id');
        } else {
            $this->line('PASS column warehouse_restaurants.restaurant_id');
        }

        if (Schema::hasTable('warehouse_categories')) {
            $existingSlugs = DB::table('warehouse_categories')->pluck('slug')->filter()->values()->all();
            $count = count($existingSlugs);
            if ($count === 0) {
                $missing[] = 'Missing baseline data: warehouse_categories has no rows';
                $this->line('FAIL baseline warehouse_categories rows');
            } else {
                $this->line("PASS baseline warehouse_categories rows ({$count})");
            }

            $missingSlugs = array_values(array_diff($requiredCategorySlugs, $existingSlugs));
            if (!empty($missingSlugs)) {
                $missing[] = 'Missing baseline category slugs: ' . implode(', ', $missingSlugs);
                $this->line('FAIL baseline warehouse_categories slugs ' . implode(', ', $missingSlugs));
            } else {
                $this->line('PASS baseline warehouse_categories slugs');
            }
        }

        if (!empty($missing)) {
            $this->error('Warehouse schema verification failed.');
            foreach ($missing as $issue) {
                $this->line("- {$issue}");
            }

            $this->line('');
            $this->warn('Run: php artisan migrate --force');
            $this->warn('Then: php artisan optimize:clear');
            Log::channel('inventory')->error('inventory.schema.verify.failed', [
                'event' => 'inventory.schema.verify.failed',
                'reason_code' => 'missing_schema_objects',
                'missing' => $missing,
                'required_category_slugs' => $requiredCategorySlugs,
                'environment' => app()->environment(),
                'database_connection' => config('database.default'),
            ]);

            return self::FAILURE;
        }

        $this->info('Warehouse schema verification passed.');
        Log::channel('inventory')->info('inventory.schema.verify.passed', [
            'event' => 'inventory.schema.verify.passed',
            'environment' => app()->environment(),
            'database_connection' => config('database.default'),
        ]);

        return self::SUCCESS;
    }
}
