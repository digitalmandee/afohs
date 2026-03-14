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
        Schema::create('event_booking_menus', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_booking_id')->constrained('event_bookings')->onDelete('cascade');
            $table->unsignedBigInteger('event_menu_id');
            $table->string('name');
            $table->string('amount');
            $table->json('items')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_booking_menus');
    }
};
