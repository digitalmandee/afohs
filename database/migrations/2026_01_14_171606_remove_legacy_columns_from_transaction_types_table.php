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
        Schema::table('transaction_types', function (Blueprint $table) {
            $table->dropColumn([
                'type',
                'is_system',
                'default_amount',
                'is_fixed',
                'cash_or_payment'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_types', function (Blueprint $table) {
            $table->enum('type', ['debit', 'credit', 'both'])->default('debit')->after('name');
            $table->boolean('is_system')->default(false)->after('status');
            $table->decimal('default_amount', 10, 2)->nullable();
            $table->boolean('is_fixed')->default(false);
            $table->tinyInteger('cash_or_payment')->default(0);
        });
    }
};
