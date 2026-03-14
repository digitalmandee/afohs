<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // DB::statement("ALTER TABLE invoices MODIFY COLUMN payment_method ENUM('cash', 'credit_card', 'bank_transfer', 'split_payment') NOT NULL");

        Schema::table('invoices', function (Blueprint $table) {
            $table->bigInteger('cash')->default(0)->after('payment_method');
            $table->bigInteger('credit_card')->default(0)->after('cash');
            $table->bigInteger('bank_transfer')->default(0)->after('credit_card');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // DB::statement("ALTER TABLE invoices MODIFY COLUMN payment_method ENUM('cash', 'credit_card', 'bank_transfer') NOT NULL");

        Schema::table('invoices', function (Blueprint $table) {
            $table->dropColumn('cash');
            $table->dropColumn('credit_card');
            $table->dropColumn('bank_transfer');
        });
    }
};
