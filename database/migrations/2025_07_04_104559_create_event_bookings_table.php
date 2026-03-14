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
        Schema::create('event_bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_no')->unique();
            $table->unsignedBigInteger('customer_id')->nullable();
            $table->unsignedBigInteger('member_id')->nullable();
            $table->foreignId('event_venue_id')->nullable()->constrained('event_venues')->onDelete('set null');
            $table->unsignedBigInteger('family_id')->nullable();
            $table->date('booking_date')->nullable();
            $table->string('booking_type')->nullable();
            $table->string('name')->nullable();
            $table->string('address')->nullable();
            $table->string('cnic')->nullable();
            $table->string('mobile')->nullable();
            $table->string('email')->nullable();
            $table->string('ledger_amount')->nullable();
            $table->string('booked_by')->nullable();
            $table->string('nature_of_event')->nullable();
            $table->date('event_date')->nullable();
            $table->time('event_time_from')->nullable();
            $table->time('event_time_to')->nullable();

            // booking metadata
            $table->decimal('menu_charges', 10, 2)->nullable();
            $table->decimal('addons_charges', 10, 2)->nullable();
            $table->decimal('total_per_person_charges', 10, 2)->nullable();
            $table->bigInteger('no_of_guests')->default(0);
            $table->bigInteger('guest_charges')->default(0);
            $table->bigInteger('extra_guests')->default(0);
            $table->bigInteger('extra_guest_charges')->default(0);
            $table->bigInteger('total_food_charges')->default(0);
            $table->bigInteger('total_other_charges')->default(0);
            $table->bigInteger('total_charges')->default(0);
            $table->enum('surcharge_type', ['fixed', 'percentage'])->default('percentage');
            $table->decimal('surcharge_amount', 10, 2)->default(0);
            $table->string('surcharge_note')->nullable();
            $table->enum('reduction_type', ['fixed', 'percentage'])->default('percentage');
            $table->decimal('reduction_amount', 10, 2)->default(0);
            $table->string('reduction_note')->nullable();
            $table->decimal('total_price', 10, 2)->nullable();
            $table->bigInteger('paid_amount')->default(0);
            $table->text('booking_docs')->nullable();
            $table->text('additional_notes')->nullable();
            $table->json('additional_data')->nullable();
            $table->enum('status', ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'refunded'])->default('pending');

            $table->bigInteger('created_by')->nullable();
            $table->bigInteger('updated_by')->nullable();
            $table->bigInteger('deleted_by')->nullable();

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_bookings');
    }
};
