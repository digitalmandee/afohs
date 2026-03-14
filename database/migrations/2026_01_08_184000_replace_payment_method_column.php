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
        // Aggressive fix: Swap column strategy
        // 1. Add temp column
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->string('payment_method_tmp')->nullable()->after('payment_method');
        });

        // 2. Copy data
        DB::statement('UPDATE financial_invoices SET payment_method_tmp = payment_method');

        // 3. Drop old enum column
        // We need to use array syntax for dropColumn to ensure it handles multiple if needed, but here it's one.
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropColumn('payment_method');
        });

        // 4. Rename temp to original
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->renameColumn('payment_method_tmp', 'payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No simple revert for this destructive operation, but we can try to recreate enum
        // This is just a safety stubs
    }
};
