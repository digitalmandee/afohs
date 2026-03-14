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
        Schema::create('financial_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('invoice_id')->constrained('financial_invoices')->onDelete('cascade');

            $table->string('fee_type');  // 'membership_fee', 'maintenance_fee', 'general', 'custom'
            $table->unsignedBigInteger('financial_charge_type_id')->nullable();  // Future proofing

            $table->string('description')->nullable();
            $table->decimal('qty', 10, 2)->default(1);
            $table->bigInteger('amount')->default(0);  // Unit Price
            $table->decimal('sub_total', 15, 2);

            // Tax & Discount (Per Item) - Matching old system parity
            $table->decimal('tax_percentage', 5, 2)->default(0);  // e.g. 5.00
            $table->decimal('tax_amount', 15, 2)->default(0);

            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->string('discount_details')->nullable();  // Description of discount

            $table->decimal('total', 15, 2);  // Final amount after tax/discount

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            // Specific Relations needed for logic
            $table->unsignedBigInteger('family_member_id')->nullable();
            $table->unsignedBigInteger('subscription_type_id')->nullable();
            $table->unsignedBigInteger('subscription_category_id')->nullable();

            $table->json('data')->nullable();  // For any extra metadata

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('financial_invoice_items');
    }
};
