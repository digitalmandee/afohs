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

        // Use raw SQL for modification to avoid doctrine/dbal dependency issues
        // and handle ENUM to STRING conversion reliably
        DB::statement("ALTER TABLE order_items MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverting back to ENUM is risky if data contains values outside the ENUM list.
        // We will keep it as VARCHAR for safety in down(), or attempt providing the original definition.
        // DB::statement("ALTER TABLE order_items MODIFY COLUMN status ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending'");
    }
};
