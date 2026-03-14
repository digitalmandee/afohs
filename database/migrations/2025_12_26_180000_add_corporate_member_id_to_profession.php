<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Adds corporate_member_id to member_profession_info for linking profession data to corporate members
     */
    public function up(): void
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            if (!Schema::hasColumn('member_profession_infos', 'corporate_member_id')) {
                $table->unsignedBigInteger('corporate_member_id')->nullable()->after('member_id');
                $table->foreign('corporate_member_id')->references('id')->on('corporate_members')->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            if (Schema::hasColumn('member_profession_infos', 'corporate_member_id')) {
                $table->dropForeign(['corporate_member_id']);
                $table->dropColumn('corporate_member_id');
            }
        });
    }
};
