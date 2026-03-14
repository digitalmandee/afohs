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
        Schema::table('member_profession_infos', function (Blueprint $table) {
            $table->unsignedBigInteger('nominee_id')->nullable()->after('nominee_contact');
            $table->unsignedBigInteger('referral_member_id')->nullable()->after('referral_contact');
            $table->boolean('referral_is_corporate')->default(false)->after('referral_member_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            $table->dropColumn(['nominee_id', 'referral_member_id', 'referral_is_corporate']);
        });
    }
};
