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
        Schema::create('kitchen_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kitchen_id')->constrained('users')->onDelete('cascade');
            $table->string('printer_ip')->nullable();
            $table->string('printer_port')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kitchen_details');
    }
};