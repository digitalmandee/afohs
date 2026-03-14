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
        // Change payment_method to string to allow any value (cheque, online, etc.)
        // We use DB::statement for ENUM to String conversion to be safe across DB versions where Doctrine might fail on Enums
        // But Laravel's Schema builder might handle it if we just use string()->change()
        // Let's try standard way first, if it fails we might need raw SQL.

        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->string('payment_method')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Reverting to ENUM (approximate list from previous migrations)
            // Note: Data might be lost if it contains values not in this list.
            // In a real scenario, we might want to keep it as string or be careful.
            // For now, let's just attempt to revert to the last known state if needed.
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment', 'ent', 'cts'])->nullable()->change();
        });
    }
};
