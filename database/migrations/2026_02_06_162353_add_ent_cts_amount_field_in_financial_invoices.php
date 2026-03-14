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
            $table->decimal('ent_amount', 10, 2)->default(0)->after('cts_comment');
            $table->decimal('cts_amount', 10, 2)->default(0)->after('ent_amount');
            $table->string('cts_payment_method')->nullable()->after('cts_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropColumn('ent_amount');
            $table->dropColumn('cts_amount');
            $table->dropColumn('cts_payment_method');
        });
    }
};
