<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     * Makes member_id nullable so profession can belong to either member or corporate_member
     */
    public function up(): void
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            $table->unsignedBigInteger('member_id')->nullable(false)->change();
        });
    }
};
