<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('pos_units')) {
            Schema::table('pos_units', function (Blueprint $table) {
                $table->dropUnique('pos_units_location_name_deleted_unique');
                $table->unique(['name', 'deleted_at'], 'pos_units_name_deleted_unique');
            });
        }

        if (Schema::hasTable('pos_manufacturers')) {
            Schema::table('pos_manufacturers', function (Blueprint $table) {
                $table->dropUnique('pos_manufacturers_location_name_deleted_unique');
                $table->unique(['name', 'deleted_at'], 'pos_manufacturers_name_deleted_unique');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_units')) {
            Schema::table('pos_units', function (Blueprint $table) {
                $table->dropUnique('pos_units_name_deleted_unique');
                $table->unique(['location_id', 'name', 'deleted_at'], 'pos_units_location_name_deleted_unique');
            });
        }

        if (Schema::hasTable('pos_manufacturers')) {
            Schema::table('pos_manufacturers', function (Blueprint $table) {
                $table->dropUnique('pos_manufacturers_name_deleted_unique');
                $table->unique(['location_id', 'name', 'deleted_at'], 'pos_manufacturers_location_name_deleted_unique');
            });
        }
    }
};

