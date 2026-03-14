<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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

        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN fee_type ENUM('membership_fee', 'maintenance_fee', 'subscription_fee', 'reinstating_fee')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN fee_type ENUM('membership_fee', 'maintenance_fee', 'subscription_fee')");
    }
};
