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
            if (!Schema::hasColumn('members', 'old_family_id')) {
                $table->bigInteger('old_family_id')->nullable()->after('id')->comment('Original family member ID from mem_families table');
            }
            
            if (!Schema::hasIndex('members', 'old_family_id')) {
                $table->index('old_family_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('members', function (Blueprint $table) {
            if (Schema::hasColumn('members', 'old_family_id')) {
                $table->dropColumn('old_family_id');
            }
            
            if (Schema::hasIndex('members', 'old_family_id')) {
                $table->dropIndex('old_family_id');
            }
        });
    }
};
