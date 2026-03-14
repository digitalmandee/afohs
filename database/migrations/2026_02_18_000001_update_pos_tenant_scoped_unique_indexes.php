<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (Schema::hasTable('pos_manufacturers')) {
            Schema::table('pos_manufacturers', function (Blueprint $table) {
                if (Schema::hasColumn('pos_manufacturers', 'name')) {
                    $table->dropUnique('pos_manufacturers_name_unique');
                }
                if (Schema::hasColumn('pos_manufacturers', 'tenant_id') && Schema::hasColumn('pos_manufacturers', 'deleted_at')) {
                    $table->unique(['tenant_id', 'name', 'deleted_at'], 'pos_manufacturers_tenant_name_deleted_unique');
                }
            });
        }

        if (Schema::hasTable('pos_units')) {
            Schema::table('pos_units', function (Blueprint $table) {
                if (Schema::hasColumn('pos_units', 'name')) {
                    $table->dropUnique('pos_units_name_unique');
                }
                if (Schema::hasColumn('pos_units', 'tenant_id') && Schema::hasColumn('pos_units', 'deleted_at')) {
                    $table->unique(['tenant_id', 'name', 'deleted_at'], 'pos_units_tenant_name_deleted_unique');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('pos_manufacturers')) {
            Schema::table('pos_manufacturers', function (Blueprint $table) {
                $table->dropUnique('pos_manufacturers_tenant_name_deleted_unique');
                $table->unique('name', 'pos_manufacturers_name_unique');
            });
        }

        if (Schema::hasTable('pos_units')) {
            Schema::table('pos_units', function (Blueprint $table) {
                $table->dropUnique('pos_units_tenant_name_deleted_unique');
                $table->unique('name', 'pos_units_name_unique');
            });
        }
    }
};

