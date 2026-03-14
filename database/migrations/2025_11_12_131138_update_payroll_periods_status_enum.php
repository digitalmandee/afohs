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

        // Update the status enum to include 'active'
        DB::statement("ALTER TABLE payroll_periods MODIFY COLUMN status ENUM('draft', 'active', 'processing', 'completed', 'paid') DEFAULT 'draft'");
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
        DB::statement("ALTER TABLE payroll_periods MODIFY COLUMN status ENUM('draft', 'processing', 'completed', 'paid') DEFAULT 'draft'");
    }
};
