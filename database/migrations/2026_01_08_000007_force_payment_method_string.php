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

        // Force change payment_method to VARCHAR(255) using raw SQL
        // This bypasses doctrine/dbal requirement and handles ENUM to String conversion reliably on MySQL
        DB::statement('ALTER TABLE financial_invoices MODIFY COLUMN payment_method VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Revert to ENUM
        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN payment_method ENUM('cash', 'credit_card', 'bank', 'split_payment', 'ent', 'cts') NULL");
    }
};
