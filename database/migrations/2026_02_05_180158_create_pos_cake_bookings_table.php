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
        Schema::create('pos_cake_bookings', function (Blueprint $table) {
            $table->id();
            $table->integer('booking_number')->nullable()->unique();  // User requested integer
            $table->string('branch_id')->nullable();
            $table->string('tenant_id')->nullable();

            // Customer Linkage (Specific IDs as requested)
            $table->unsignedBigInteger('member_id')->nullable();
            $table->unsignedBigInteger('corporate_id')->nullable();
            $table->unsignedBigInteger('customer_id')->nullable();  // Guest/Walk-in
            $table->unsignedBigInteger('employee_id')->nullable();

            $table->string('customer_type')->nullable();  // Member, Corporate, Guest, Employee
            $table->string('customer_name')->nullable();
            $table->string('customer_phone')->nullable();  // Contact

            // Family Member (from screenshot)
            $table->unsignedBigInteger('family_member_id')->nullable();

            // Booking Details
            $table->date('booking_date');
            $table->date('delivery_date')->nullable();
            $table->string('pickup_time')->nullable();

            // Cake Details
            $table->foreignId('cake_type_id')->nullable()->constrained('products')->nullOnDelete();
            $table->decimal('weight', 8, 2)->nullable();
            $table->string('flavor')->nullable();
            $table->string('topping')->nullable();
            $table->string('filling')->nullable();
            $table->string('icing')->nullable();
            $table->string('color')->nullable();
            $table->text('message')->nullable();
            $table->text('special_instructions')->nullable();
            $table->text('special_display')->nullable();

            // Attachment
            $table->string('attachment_path')->nullable();
            $table->boolean('has_attachment')->default(false);

            // Financials
            $table->decimal('total_price', 10, 2)->default(0);
            $table->decimal('tax_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('advance_amount', 10, 2)->default(0);
            $table->decimal('balance_amount', 10, 2)->default(0);

            // Payment & Status
            $table->string('payment_mode')->nullable();
            $table->string('status')->default('pending');

            // Delivery Info
            $table->string('receiver_name')->nullable();
            $table->string('receiver_address')->nullable();
            $table->string('delivery_note')->nullable();

            // Meta
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('order_id')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pos_cake_bookings');
    }
};
