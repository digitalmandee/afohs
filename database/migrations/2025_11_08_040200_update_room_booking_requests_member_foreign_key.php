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
        Schema::table('room_booking_requests', function (Blueprint $table) {
            // Drop the existing foreign key constraint
            $table->dropForeign(['member_id']);
            
            // Add new foreign key constraint to members table
            $table->foreign('member_id')->references('id')->on('members')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('room_booking_requests', function (Blueprint $table) {
            // Drop the foreign key constraint to members table
            $table->dropForeign(['member_id']);
            
            // Restore the original foreign key constraint to users table
            $table->foreign('member_id')->references('id')->on('users')->onDelete('set null');
        });
    }
};
