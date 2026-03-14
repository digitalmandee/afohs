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
        // Update Membership Fee (ID 3) to Type 3
        DB::table('transaction_types')->where('id', 3)->update(['type' => 3]);

        // Update Maintenance Fee (ID 4) to Type 4
        DB::table('transaction_types')->where('id', 4)->update(['type' => 4]);

        // Update Subscription Fee (ID 5) to Type 5
        DB::table('transaction_types')->where('id', 5)->update(['type' => 5]);

        // Update Charges Fee (ID 6) to Type 6
        DB::table('transaction_types')->where('id', 6)->update(['type' => 6]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert types to null or previous state (optional, can be skipped for data updates)
        DB::table('transaction_types')->whereIn('id', [3, 4, 5, 6])->update(['type' => null]);
    }
};
