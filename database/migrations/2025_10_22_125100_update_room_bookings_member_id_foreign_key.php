<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // First, let's check and drop any existing foreign key constraints on member_id
        $foreignKeys = DB::select("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'room_bookings' 
            AND COLUMN_NAME = 'member_id' 
            AND REFERENCED_TABLE_NAME IS NOT NULL
        ");

        // Drop existing foreign key constraints if they exist
        foreach ($foreignKeys as $fk) {
            DB::statement("ALTER TABLE room_bookings DROP FOREIGN KEY {$fk->CONSTRAINT_NAME}");
        }

        // Add the new foreign key constraint
        Schema::table('room_bookings', function (Blueprint $table) {
            $table->foreign('member_id')->references('id')->on('members')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('room_bookings', function (Blueprint $table) {
            // Drop the foreign key constraint on member_id
            $table->dropForeign(['member_id']);
        });

        // Add back the original foreign key constraint to users table
        Schema::table('room_bookings', function (Blueprint $table) {
            // Add foreign key constraint referencing users table
            $table->foreign('member_id')->references('id')->on('users')->onDelete('set null');
        });
    }
};
