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
        Schema::table('membership_invoices', function (Blueprint $table) {
            $table->string('invoice_no')->unique()->nullable()->after('id');
            $table->string('invoice_type')->after('invoice_no');
            $table->string('discount_amount')->nullable()->after('subscription_type');
            $table->string('discount_details')->nullable()->after('discount_amount');
            $table->date('paid_for_month')->nullable()->after('customer_charges');
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment'])->after('paid_for_month')->nullable();
            $table->dateTime('payment_date')->after('payment_method')->nullable();
            $table->string('reciept')->after('payment_date')->nullable();
            $table->json('data')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('membership_invoices', function (Blueprint $table) {
            $table->dropColumn('invoice_no');
            $table->dropColumn('invoice_type');
            $table->dropColumn('discount_amount');
            $table->dropColumn('discount_details');
            $table->dropColumn('paid_for_month');
            $table->dropColumn('payment_method');
            $table->dropColumn('payment_date');
            $table->dropColumn('reciept');
            $table->dropColumn('data');
        });
    }
};
