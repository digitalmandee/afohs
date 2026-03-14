<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('pos_units')) {
            Schema::table('pos_units', function (Blueprint $table) {
                if (!Schema::hasColumn('pos_units', 'location_id')) {
                    $table->unsignedBigInteger('location_id')->nullable()->index()->after('tenant_id');
                }
            });
        }

        if (Schema::hasTable('pos_manufacturers')) {
            Schema::table('pos_manufacturers', function (Blueprint $table) {
                if (!Schema::hasColumn('pos_manufacturers', 'location_id')) {
                    $table->unsignedBigInteger('location_id')->nullable()->index()->after('tenant_id');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_units') && Schema::hasColumn('pos_units', 'location_id')) {
            Schema::table('pos_units', function (Blueprint $table) {
                $table->dropColumn('location_id');
            });
        }

        if (Schema::hasTable('pos_manufacturers') && Schema::hasColumn('pos_manufacturers', 'location_id')) {
            Schema::table('pos_manufacturers', function (Blueprint $table) {
                $table->dropColumn('location_id');
            });
        }
    }
};

