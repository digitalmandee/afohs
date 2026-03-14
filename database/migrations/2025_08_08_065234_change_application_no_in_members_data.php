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
        // Set application_no = null for all family members
        DB::table('members')
            ->whereNotNull('parent_id')
            ->update(['application_no' => null]);

        // Start application number counter
        $counter = 1;

        // Get all members without parent_id (main members), ordered by ID
        $mainMembers = DB::table('members')
            ->whereNull('parent_id')
            ->orderBy('id')
            ->get();

        foreach ($mainMembers as $mainMember) {
            // Assign sequential application_no
            DB::table('members')
                ->where('id', $mainMember->id)
                ->update(['application_no' => $counter]);

            $counter++;
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            //
        });
    }
};
