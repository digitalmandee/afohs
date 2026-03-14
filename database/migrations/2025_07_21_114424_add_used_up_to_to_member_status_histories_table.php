<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('member_status_histories', function (Blueprint $table) {
            $table->date('used_up_to')->nullable()->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('member_status_histories', function (Blueprint $table) {
            $table->dropColumn('used_up_to');
        });
    }
};
