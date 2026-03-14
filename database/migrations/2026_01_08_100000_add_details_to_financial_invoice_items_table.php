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
        Schema::table('financial_invoice_items', function (Blueprint $table) {
            $table->decimal('additional_charges', 15, 2)->default(0)->after('amount');
            $table->text('remarks')->nullable()->after('description');
            $table->decimal('overdue_percentage', 5, 2)->default(0)->after('tax_percentage');
            $table->string('discount_type')->nullable()->after('discount_amount');  // 'percent', 'fixed'
            $table->decimal('discount_value', 15, 2)->default(0)->after('discount_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoice_items', function (Blueprint $table) {
            $table->dropColumn([
                'additional_charges',
                'remarks',
                'overdue_percentage',
                'discount_type',
                'discount_value'
            ]);
        });
    }
};
