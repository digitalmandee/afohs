<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // ✅ Rename user_id to member_id
            if (Schema::hasColumn('orders', 'user_id')) {
                $table->renameColumn('user_id', 'member_id');
            }

            // ✅ Add new columns
            $table->unsignedBigInteger('member_id')->nullable()->change();
            $table->unsignedBigInteger('customer_id')->nullable()->after('member_id');
            $table->unsignedBigInteger('room_booking_id')->nullable()->after('customer_id');
            $table->unsignedBigInteger('event_booking_id')->nullable()->after('room_booking_id');

            // ✅ Add foreign keys
            $table->foreign('member_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->foreign('room_booking_id')->references('id')->on('room_bookings')->onDelete('set null');
            $table->foreign('event_booking_id')->references('id')->on('event_bookings')->onDelete('set null');
        });

        // ✅ Copy existing user_id data into member_id (safe if rename done)
        DB::statement('UPDATE orders SET member_id = member_id');  // no change needed if rename worked
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['member_id']);
            $table->dropForeign(['customer_id']);
            $table->dropForeign(['room_booking_id']);
            $table->dropForeign(['event_booking_id']);

            // Drop new columns
            $table->dropColumn(['customer_id', 'room_booking_id', 'event_booking_id']);

            // Rename back
            $table->renameColumn('member_id', 'user_id');
        });
    }
};
