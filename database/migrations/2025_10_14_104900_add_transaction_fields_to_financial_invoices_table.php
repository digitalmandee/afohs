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
            // Transaction system fields
            $table->enum('fee_type', ['membership_fee', 'maintenance_fee'])->nullable()->after('invoice_type');
            $table->enum('payment_frequency', ['quarterly', 'half_yearly', 'three_quarters', 'annually'])->nullable()->after('fee_type');
            $table->integer('quarter_number')->nullable()->after('payment_frequency');
            
            // Universal validity period (covers both membership and maintenance fees)
            $table->date('valid_from')->nullable()->after('quarter_number');
            $table->date('valid_to')->nullable()->after('valid_from');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropColumn([
                'fee_type',
                'payment_frequency',
                'quarter_number',
                'valid_from',
                'valid_to'
            ]);
        });
    }
};
