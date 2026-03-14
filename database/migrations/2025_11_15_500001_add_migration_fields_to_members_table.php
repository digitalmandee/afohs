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
            if (!Schema::hasColumn('members', 'old_member_id')) {
                // Add fields to help with migration tracking
                $table->bigInteger('old_member_id')->nullable()->after('id')->comment('Original ID from old system');
                
                // Add index for faster lookups during migration
                $table->index('old_member_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            if (Schema::hasColumn('members', 'old_member_id')) {
                $table->dropIndex(['old_member_id']);
                $table->dropColumn(['old_member_id']);
            }
        });
    }
};
