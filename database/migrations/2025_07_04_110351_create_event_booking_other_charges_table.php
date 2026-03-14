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
        Schema::create('event_booking_other_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_booking_id')->constrained('event_bookings')->onDelete('cascade');
            $table->string('type');
            $table->text('details')->nullable();
            $table->decimal('amount', 10, 2);
            $table->boolean('is_complementary')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('event_booking_other_charges');
    }
};
