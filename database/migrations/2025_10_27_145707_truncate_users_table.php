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
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            DB::table('users')->truncate();
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            return;
        }

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
            DB::table('users')->truncate();
            DB::statement('PRAGMA foreign_keys = ON;');
            return;
        }

        DB::table('users')->truncate();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Cannot reverse a truncate operation
        // This is intentionally left empty as deleted data cannot be recovered
    }
};
