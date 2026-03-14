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
        Schema::create('financial_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique()->nullable();
            $table->bigInteger('customer_id')->unsigned()->nullable();
            $table->bigInteger('member_id')->unsigned()->nullable();
            $table->string('subscription_type')->nullable();
            $table->string('invoice_type');
            $table->string('discount_amount')->nullable();
            $table->string('discount_details')->nullable();
            $table->bigInteger('amount')->default(0);
            $table->bigInteger('total_price')->default(0);
            $table->bigInteger('customer_charges')->default(0);
            $table->date('issue_date')->nullable();
            $table->date('due_date')->nullable();
            $table->date('paid_for_month')->nullable();
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment'])->nullable();
            $table->dateTime('payment_date')->nullable();
            $table->string('reciept')->nullable();
            $table->json('data')->nullable();
            $table->enum('status', ['paid', 'unpaid', 'overdue', 'cancelled'])->default('unpaid');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_invoices');
    }
};