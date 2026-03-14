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
            if (!Schema::hasColumn('financial_invoices', 'credit_card_type')) {
                // Add credit card type field
                $table->string('credit_card_type')->nullable()->after('payment_method');
            }
            
            if (Schema::hasColumn('financial_invoices', 'reciept')) {
                // Rename misspelled 'reciept' to 'receipt'
                $table->renameColumn('reciept', 'receipt');
            } else if (!Schema::hasColumn('financial_invoices', 'receipt')) {
                // Rename back to original misspelled name
                $table->renameColumn('receipt', 'reciept');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            if (Schema::hasColumn('financial_invoices', 'credit_card_type')) {
                // Drop credit card type field
                $table->dropColumn('credit_card_type');
            }
            
            if (Schema::hasColumn('financial_invoices', 'receipt')) {
                // Rename back to original misspelled name
                $table->renameColumn('receipt', 'reciept');
            } else if (!Schema::hasColumn('financial_invoices', 'reciept')) {
                // Rename misspelled 'reciept' to 'receipt'
                $table->renameColumn('reciept', 'receipt');
            }
        });
    }
};
