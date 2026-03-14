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
        Schema::create('card_payments', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->json('member_type')->nullable();
            $table->enum('subscription_type', ['one_time', 'monthly', 'yearly'])->nullable();
            $table->decimal('amount_paid', 10, 2);
            $table->decimal('customer_charges', 10, 2)->default(0);
            $table->bigInteger('total_amount');
            $table->date('paid_for_month')->nullable();
            $table->date('expiry_date')->nullable();
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment']);
            $table->dateTime('payment_date');
            $table->string('reciept')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_payments');
    }
};
