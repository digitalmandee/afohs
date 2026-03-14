<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->string('booking_id');
            $table->string('user_id');
            $table->enum('booking_type', ['room', 'event']);
            $table->enum('booking_For', ['main_guest', 'other']);
            $table->string('type_id');
            $table->string('persons')->nullable();
            $table->string('total_rooms')->nullable();
            $table->date('checkin');
            $table->date('checkout')->nullable();
            $table->string('event_name')->nullable();
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->bigInteger('total_payment');
            $table->enum('status', ['confirmed', 'pending', 'cancelled', 'completed', 'no_show'])->default('pending');

            $table->timestamps();
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};