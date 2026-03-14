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

        // Add 'extended' and 'expired' to the status enum
        DB::statement("ALTER TABLE member_status_histories MODIFY COLUMN status ENUM('active', 'suspended', 'cancelled', 'absent', 'extended', 'expired', 'pause')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Revert back to original enum values
        DB::statement("ALTER TABLE member_status_histories MODIFY COLUMN status ENUM('active', 'suspended', 'cancelled', 'absent')");
    }
};
