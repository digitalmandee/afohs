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
            $table->string('table_name')->nullable();
            $table->text('details')->nullable();
            $table->string('account')->nullable();  // Account Code/ID
            $table->tinyInteger('cash_or_payment')->default(0);  // 0 for cash, 1 for payment
            $table->date('cashrec_due')->nullable();
            $table->integer('mod_id')->nullable();  // Legacy module ID
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaction_types', function (Blueprint $table) {
            $table->dropColumn(['table_name', 'details', 'account', 'cash_or_payment', 'cashrec_due', 'mod_id']);
        });
    }
};
