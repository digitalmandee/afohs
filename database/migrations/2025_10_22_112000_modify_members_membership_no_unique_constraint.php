<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('members', function (Blueprint $table) {
            // Drop the existing unique constraint on membership_no
            $table->dropUnique(['membership_no']);
            
            // Add a composite unique constraint: membership_no + parent_id
            // This allows same membership_no for primary (parent_id = null) and family members (parent_id != null)
            $table->unique(['membership_no', 'parent_id'], 'members_membership_no_parent_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            // Drop the composite unique constraint
            $table->dropUnique('members_membership_no_parent_id_unique');
            
            // Restore the original unique constraint on membership_no
            $table->unique('membership_no', 'members_membership_no_unique');
        });
    }
};
