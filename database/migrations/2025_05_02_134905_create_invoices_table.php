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
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->bigInteger('invoice_no')->unique();
            $table->foreignId('user_id')->constrained();
            $table->foreignId('cashier_id')->nullable()->constrained('users');
            $table->foreignId('order_id')->nullable()->constrained();
            $table->decimal('amount', 10, 2);
            $table->decimal('tax', 10, 2)->default(0);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total_price', 10, 2)->default(0);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('customer_change', 10, 2)->default(0);
            $table->enum('payment_method', ['cash', 'credit_card', 'bank', 'split_payment'])->nullable();
            $table->enum('status', ['paid', 'unpaid', 'refund', 'cancelled'])->default('unpaid');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
