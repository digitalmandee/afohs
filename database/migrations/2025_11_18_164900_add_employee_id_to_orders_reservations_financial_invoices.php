<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add employee_id to orders table
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('employee_id')->nullable()->after('waiter_id')->constrained('employees')->nullOnDelete();
        });

        // Add employee_id to reservations table
        Schema::table('reservations', function (Blueprint $table) {
            $table->foreignId('employee_id')->nullable()->after('customer_id')->constrained('employees')->nullOnDelete();
        });

        // Add employee_id to financial_invoices table
        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->foreignId('employee_id')->nullable()->after('member_id')->constrained('employees')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['employee_id']);
            $table->dropColumn('employee_id');
        });

        Schema::table('reservations', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['employee_id']);
            $table->dropColumn('employee_id');
        });

        Schema::table('financial_invoices', function (Blueprint $table) {
            $table->dropForeignKeyIfExists(['employee_id']);
            $table->dropColumn('employee_id');
        });
    }
};
