<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            $table->unsignedBigInteger('business_developer_id')->nullable()->after('id');
            $table->foreign('business_developer_id')->references('id')->on('employees')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            $table->dropForeign(['business_developer_id']);
            $table->dropColumn('business_developer_id');
        });
    }
};
