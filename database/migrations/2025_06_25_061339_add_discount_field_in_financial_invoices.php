<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Remove old column
            $table->dropColumn('discount_amount');

            // Add discount type
            $table->enum('discount_type', ['percentage', 'fixed'])->nullable()->after('invoice_type');

            // Add new column with decimal type
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
        });
    }

    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            // Drop new columns
            $table->dropColumn(['discount_value', 'discount_type']);

            // Re-add old column
            $table->decimal('discount_amount', 8, 2)->nullable()->after('invoice_type');
        });
    }
};