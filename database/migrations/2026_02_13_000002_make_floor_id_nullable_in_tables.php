<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('tables', 'floor_id')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('tables', function (Blueprint $table) {
            $table->dropForeign(['floor_id']);
        });

        DB::statement('ALTER TABLE `tables` MODIFY `floor_id` BIGINT UNSIGNED NULL');

        Schema::table('tables', function (Blueprint $table) {
            $table->foreign('floor_id')->references('id')->on('floors')->nullOnDelete();
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('tables', 'floor_id')) {
            return;
        }

        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        Schema::table('tables', function (Blueprint $table) {
            $table->dropForeign(['floor_id']);
        });

        DB::statement('ALTER TABLE `tables` MODIFY `floor_id` BIGINT UNSIGNED NOT NULL');

        Schema::table('tables', function (Blueprint $table) {
            $table->foreign('floor_id')->references('id')->on('floors')->cascadeOnDelete();
        });
    }
};

