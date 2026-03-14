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
        Schema::table('members', function (Blueprint $table) {
            DB::table('members')
                ->whereNotIn('status', [
                    'active', 'inactive', 'suspended', 'cancelled', 'absent'
                ])
                ->update(['status' => 'active']);

            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE members MODIFY COLUMN status ENUM('active', 'inactive', 'suspended', 'cancelled', 'absent') NULL DEFAULT 'active'");
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE members MODIFY COLUMN status VARCHAR(50) NULL');

            DB::table('members')
                ->whereNotIn('status', [
                    'active', 'inactive', 'suspended', 'cancelled', 'pause'
                ])
                ->update(['status' => 'inactive']);

            DB::statement("ALTER TABLE members MODIFY COLUMN status ENUM('active', 'inactive', 'suspended', 'cancelled', 'pause') NULL DEFAULT 'inactive'");
        }
    }
};
