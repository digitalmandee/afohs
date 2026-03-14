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
        // First, drop foreign key constraint from members table if it exists
        Schema::table('members', function (Blueprint $table) {
            if (Schema::hasColumn('members', 'payment_id')) {
                $table->dropForeign(['payment_id']);
                $table->dropColumn('payment_id');
            }
        });
        
        // Drop CardPayment table if it exists
        Schema::dropIfExists('card_payments');
        
        // Drop MembershipInvoice table if it exists
        Schema::dropIfExists('membership_invoices');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate membership_invoices table
        Schema::create('membership_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_no')->unique();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->enum('invoice_type', ['membership_fee', 'subscription_fee', 'other'])->default('subscription_fee');
            $table->decimal('amount', 10, 2);
            $table->decimal('discount', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->enum('payment_status', ['paid', 'unpaid', 'partial'])->default('unpaid');
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->date('invoice_date');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Recreate card_payments table
        Schema::create('card_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->onDelete('cascade');
            $table->foreignId('invoice_id')->nullable()->constrained('membership_invoices')->onDelete('set null');
            $table->string('card_type')->nullable(); // MasterCard, Visa, etc.
            $table->decimal('amount', 10, 2);
            $table->date('payment_date');
            $table->string('receipt_file')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        // Restore payment_id foreign key to members table
        Schema::table('members', function (Blueprint $table) {
            $table->foreignId('payment_id')->nullable()->constrained('card_payments')->onDelete('set null');
        });
    }
};
