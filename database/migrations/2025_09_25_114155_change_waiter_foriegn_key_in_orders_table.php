<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Step 1: Drop the old foreign key if it exists
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['waiter_id']);
        });

        // Step 2: Nullify invalid waiter_id
        DB::table('orders')->update(['waiter_id' => null]);

        // Step 3: Add new foreign key to employees table
        Schema::table('orders', function (Blueprint $table) {
            $table
                ->foreign('waiter_id')
                ->references('id')
                ->on('employees')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['waiter_id']);
        });
    }
};