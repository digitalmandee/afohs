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
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('cashier_id')->nullable()->constrained('users')->onDelete('set null')->after('user_id');
            $table->bigInteger('cash_amount')->default(0);
            $table->bigInteger('credit_card_amount')->default(0);
            $table->bigInteger('bank_amount')->default(0);
            $table->bigInteger('paid_amount')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('cashier_id');
            $table->dropColumn('cash_amount');
            $table->dropColumn('credit_card_amount');
            $table->dropColumn('bank_amount');
            $table->dropColumn('paid_amount');
        });
    }
};
