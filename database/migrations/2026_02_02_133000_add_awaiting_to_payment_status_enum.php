<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     * Adds 'awaiting' status to payment_status ENUM for orders waiting for payment after invoice generation.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Modify ENUM to include 'awaiting' status
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_status ENUM('paid', 'unpaid', 'overdue', 'cancelled', 'refunded', 'awaiting') DEFAULT 'unpaid'");
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
        DB::statement("ALTER TABLE orders MODIFY COLUMN payment_status ENUM('paid', 'unpaid', 'overdue', 'cancelled', 'refunded') DEFAULT 'unpaid'");
    }
};
