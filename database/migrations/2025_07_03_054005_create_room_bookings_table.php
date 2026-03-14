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
        Schema::create('room_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_no')->unique();
            $table->foreignId('customer_id')->nullable()->constrained('users')->onDelete('set null');
            $table->date('booking_date')->nullable();
            $table->date('check_in_date')->nullable();
            $table->string('arrival_details')->nullable();
            $table->date('check_out_date')->nullable();
            $table->string('departure_details')->nullable();
            // guest details
            $table->string('guest_first_name')->nullable();
            $table->string('guest_last_name')->nullable();
            $table->string('guest_company')->nullable();
            $table->text('guest_address')->nullable();
            $table->string('guest_country')->nullable();
            $table->string('guest_city')->nullable();
            $table->string('guest_mob')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('guest_cnic')->nullable();
            $table->string('accompanied_guest')->nullable();
            $table->string('acc_relationship')->nullable();
            // booking metadata
            $table->string('booked_by')->nullable();
            $table->string('booking_type')->nullable();
            $table->string('room_id')->nullable();
            $table->string('category')->nullable();
            $table->unsignedInteger('nights')->nullable();
            $table->decimal('per_day_charge', 10, 2)->nullable();
            $table->decimal('room_charge', 10, 2)->nullable();
            $table->decimal('security_deposit', 10, 2)->nullable();
            $table->decimal('total_other_charges', 10, 2)->nullable();
            $table->decimal('total_mini_bar', 10, 2)->nullable();
            $table->string('discount_type')->nullable();
            $table->decimal('discount_value', 10, 2)->nullable();
            $table->decimal('grand_total', 10, 2)->nullable();
            $table->json('additional_data')->nullable();
            $table->text('booking_docs')->nullable();
            $table->text('additional_notes')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show', 'refunded'])->default('pending');

            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_bookings');
    }
};