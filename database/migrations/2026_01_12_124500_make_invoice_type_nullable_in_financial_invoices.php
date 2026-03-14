<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->string('invoice_type')->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            // We cannot easily revert to NOT NULL without knowing which values to fill,
            // but syntactically we can try.
            // However, typically we just leave it nullable in down or don't reverse strict constraints.
            // For now, let's just make it nullable in Up.
            // $table->string('invoice_type')->nullable(false)->change();
        });
    }
};
