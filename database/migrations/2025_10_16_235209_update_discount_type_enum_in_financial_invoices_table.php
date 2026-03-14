<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Update the discount_type enum to include 'percent' and 'fixed' (matching frontend)
        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN discount_type ENUM('percentage', 'fixed', 'percent')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Revert back to original enum values
        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN discount_type ENUM('percentage', 'fixed')");
    }
};
