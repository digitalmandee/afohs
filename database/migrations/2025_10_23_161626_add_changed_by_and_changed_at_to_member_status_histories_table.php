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
            // Add changed_by and changed_at fields
            $table->unsignedBigInteger('changed_by')->nullable()->after('reason');
            $table->timestamp('changed_at')->nullable()->after('changed_by');
            
            // Add foreign key for changed_by
            $table->foreign('changed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_status_histories', function (Blueprint $table) {
            $table->dropForeign(['changed_by']);
            $table->dropColumn(['changed_by', 'changed_at']);
        });
    }
};
