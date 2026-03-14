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
            $table->string('ent_reason')->nullable()->after('payment_method');
            $table->text('ent_comment')->nullable()->after('ent_reason');
            $table->text('cts_comment')->nullable()->after('ent_comment');
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment', 'ent', 'cts'])->change()->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropColumn('ent_reason');
            $table->dropColumn('ent_comment');
            $table->dropColumn('cts_comment');
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment'])->change();
        });
    }
};