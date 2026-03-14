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
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Change payment_frequency to varchar to accommodate longer values
            $table->string('payment_frequency', 20)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Revert back to enum if needed
            $table->enum('payment_frequency', ['quarterly', 'half_yearly', 'three_quarters', 'annually'])->nullable()->change();
        });
    }
};
