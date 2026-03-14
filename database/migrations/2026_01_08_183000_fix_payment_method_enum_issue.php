<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Robust update:
        // 1. Rename old enum column
        // 2. Add new string column
        // 3. update data
        // 4. drop old

        // However, renaming enum can be tricky if DB strict mode.
        // Let's try raw ALTER specifically for changing type, but turning off strict mode for the session first.

        DB::statement("SET SESSION sql_mode = ''");

        // Direct modify is usually safest for Enum -> Varchar
        DB::statement('ALTER TABLE financial_invoices MODIFY COLUMN payment_method VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No going back to restrictive enum
    }
};
