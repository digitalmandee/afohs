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
            $table->date('paid_at')->nullable();
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment'])->nullable();
            $table->string('credit_card_type')->nullable();
            $table->string('reciept')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('paid_at');
            $table->dropColumn('payment_method');
            $table->dropColumn('credit_card_type');
            $table->dropColumn('reciept');
        });
    }
};
