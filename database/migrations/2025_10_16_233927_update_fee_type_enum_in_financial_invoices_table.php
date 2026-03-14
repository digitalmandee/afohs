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

        // Update the fee_type enum to include subscription_fee
        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN fee_type ENUM('membership_fee', 'maintenance_fee', 'subscription_fee')");
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
        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN fee_type ENUM('membership_fee', 'maintenance_fee')");
    }
};
