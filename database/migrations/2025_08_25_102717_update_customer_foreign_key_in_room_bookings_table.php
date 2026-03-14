<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Step 1: Nullify invalid customer_id values
        DB::table('room_bookings')->update(['customer_id' => null]);

        // Step 2: Drop old FK if exists (manual check)
        $exists = DB::select("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'room_bookings'
              AND COLUMN_NAME = 'customer_id'
              AND CONSTRAINT_SCHEMA = DATABASE()
        ");

        if (!empty($exists)) {
            $fkName = $exists[0]->CONSTRAINT_NAME;
            DB::statement("ALTER TABLE room_bookings DROP FOREIGN KEY `$fkName`");
        }

        // Step 3: Add new foreign key
        Schema::table('room_bookings', function (Blueprint $table) {
            $table
                ->foreign('customer_id')
                ->references('id')
                ->on('customers')
                ->onDelete('set null');

            if (!Schema::hasColumn('room_bookings', 'member_id')) {
                $table
                    ->foreignId('member_id')
                    ->nullable()
                    ->constrained('users')
                    ->onDelete('set null')
                    ->after('customer_id');
            }
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Drop new FK for customer_id
        $exists = DB::select("
            SELECT CONSTRAINT_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'room_bookings'
              AND COLUMN_NAME = 'customer_id'
              AND CONSTRAINT_SCHEMA = DATABASE()
        ");

        if (!empty($exists)) {
            $fkName = $exists[0]->CONSTRAINT_NAME;
            DB::statement("ALTER TABLE room_bookings DROP FOREIGN KEY `$fkName`");
        }

        Schema::table('room_bookings', function (Blueprint $table) {
            if (Schema::hasColumn('room_bookings', 'member_id')) {
                $table->dropForeign(['member_id']);
                $table->dropColumn('member_id');
            }

            // Revert to users table
            $table
                ->foreign('customer_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');
        });
    }
};
