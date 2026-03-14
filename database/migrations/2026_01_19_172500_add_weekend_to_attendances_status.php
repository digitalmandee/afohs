<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Modify the ENUM column to include 'weekend'
        DB::statement("ALTER TABLE attendances MODIFY status ENUM('present', 'absent', 'leave', 'late', 'weekend') DEFAULT 'present'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Revert back to original ENUM values
        DB::statement("ALTER TABLE attendances MODIFY status ENUM('present', 'absent', 'leave', 'late') DEFAULT 'present'");
    }
};
