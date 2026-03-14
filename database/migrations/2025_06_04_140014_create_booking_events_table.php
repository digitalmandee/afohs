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
        Schema::create('booking_events', function (Blueprint $table) {
             $table->id();
            $table->string('event_name')->require();
            $table->string('date_time')->nullable();
            $table->bigInteger('max_capacity')->nullable();
            $table->enum('pricing_type',['fixed','per person'])->nullable();
            $table->bigInteger('price_per_person')->nullable();
            $table->enum('status',['pending','upcomming','completed'])->nullable();
            $table->string('location')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('booking_events');
    }
};
