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

        Schema::table('financial_invoices', function (Blueprint $table) {
            // Make fee_type nullable or allow 'mixed'/'general'
            // Since we can't easily modify ENUMs in some SQL versions without raw SQL,
            // and we want to support multi-items, we should interpret the invoice header's fee_type
            // as the 'primary' type or 'mixed'.

            // We will modify the enum to include 'mixed' and 'general'
        });

        DB::statement("ALTER TABLE financial_invoices MODIFY COLUMN fee_type ENUM('membership_fee', 'maintenance_fee', 'subscription_fee', 'reinstating_fee', 'general', 'mixed') NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Warn: Reverting enums can be tricky if data exists
    }
};
