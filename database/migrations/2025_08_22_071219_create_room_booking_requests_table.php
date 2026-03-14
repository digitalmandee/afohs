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
        Schema::create('room_booking_requests', function (Blueprint $table) {
            $table->id();
            $table->date('booking_date');
            $table->string('booking_type');
            $table->foreignId('member_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('customer_id')->nullable()->constrained('customers')->onDelete('set null');
            $table->foreignId('family_member_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('room_id')->constrained('rooms')->onDelete('cascade');
            $table->foreignId('booking_category')->constrained('room_categories')->onDelete('cascade');
            $table->integer('persons');
            $table->decimal('per_day_charge', 10, 2);
            $table->decimal('security_deposit', 10, 2)->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('room_booking_requests');
    }
};