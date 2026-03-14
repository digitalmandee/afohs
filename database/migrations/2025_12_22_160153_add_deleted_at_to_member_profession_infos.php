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
            if (!Schema::hasColumn('member_profession_infos', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('member_profession_infos', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
