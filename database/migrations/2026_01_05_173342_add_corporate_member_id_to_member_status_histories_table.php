<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('member_status_histories', function (Blueprint $table) {
            $table->unsignedBigInteger('corporate_member_id')->nullable()->after('member_id');
            $table->foreign('corporate_member_id')->references('id')->on('corporate_members')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_status_histories', function (Blueprint $table) {
            $table->dropForeign(['corporate_member_id']);
            $table->dropColumn('corporate_member_id');
        });
    }
};
