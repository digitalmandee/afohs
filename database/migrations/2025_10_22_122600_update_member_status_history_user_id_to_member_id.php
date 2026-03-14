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
        Schema::table('member_status_histories', function (Blueprint $table) {
            // Drop the existing foreign key constraint on user_id
            $table->dropForeign(['user_id']);
            
            // Rename user_id column to member_id
            $table->renameColumn('user_id', 'member_id');
        });

        // Add the new foreign key constraint in a separate schema call
        // (required for some database systems when renaming columns)
        Schema::table('member_status_histories', function (Blueprint $table) {
            // Add foreign key constraint referencing members table
            $table->foreign('member_id')->references('id')->on('members')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_status_histories', function (Blueprint $table) {
            // Drop the foreign key constraint on member_id
            $table->dropForeign(['member_id']);
            
            // Rename member_id column back to user_id
            $table->renameColumn('member_id', 'user_id');
        });

        // Add back the original foreign key constraint
        Schema::table('member_status_histories', function (Blueprint $table) {
            // Add foreign key constraint referencing users table
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
        });
    }
};
