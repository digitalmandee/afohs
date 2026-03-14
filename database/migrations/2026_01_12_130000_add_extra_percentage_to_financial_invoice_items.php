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
            $table->decimal('extra_percentage', 5, 2)->default(0)->nullable()->after('additional_charges');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoice_items', function (Blueprint $table) {
            $table->dropColumn('extra_percentage');
        });
    }
};
