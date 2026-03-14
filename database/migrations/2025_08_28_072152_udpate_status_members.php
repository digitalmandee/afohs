<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /** Run the migrations. */

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('members', function (Blueprint $table) {
            // DB::table('members')
            //     ->whereNotIn('status', [
            //         'active', 'inactive', 'suspended', 'cancelled', 'absent', 'expired', 'terminated', 'not_assign', 'in_suspension_process'
            //     ])
            //     ->update(['status' => 'active']);

            // Step 3: Now safely convert column to new ENUM
            DB::statement("ALTER TABLE members MODIFY COLUMN status ENUM('active', 'inactive', 'suspended', 'cancelled', 'absent', 'expired', 'terminated', 'not_assign', 'in_suspension_process') NULL DEFAULT 'active'");
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

        // Revert ENUM to original values
        // DB::statement('ALTER TABLE members MODIFY COLUMN status VARCHAR(50) NULL');

        // DB::table('members')
        //     ->whereNotIn('status', [
        //         'active', 'inactive', 'suspended', 'cancelled', 'absent'
        //     ])
        //     ->update(['status' => 'inactive']);

        DB::statement("ALTER TABLE members MODIFY COLUMN status ENUM('active', 'inactive', 'suspended', 'cancelled', 'absent') NULL DEFAULT 'inactive'");
    }
};
