<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('pos_sub_categories')) {
            return;
        }

        Schema::table('pos_sub_categories', function (Blueprint $table) {
            if (!Schema::hasColumn('pos_sub_categories', 'location_id')) {
                $table->unsignedBigInteger('location_id')->nullable()->index()->after('tenant_id');
            }

            if (Schema::hasColumn('pos_sub_categories', 'location_id')) {
                $table->foreign('location_id')->references('id')->on('tenants')->nullOnDelete();
            }
        });

        if (Schema::hasColumn('pos_sub_categories', 'tenant_id') && Schema::hasColumn('pos_sub_categories', 'location_id')) {
            DB::table('pos_sub_categories')
                ->whereNull('location_id')
                ->whereNotNull('tenant_id')
                ->update(['location_id' => DB::raw('CAST(tenant_id AS UNSIGNED)')]);
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('pos_sub_categories')) {
            return;
        }

        Schema::table('pos_sub_categories', function (Blueprint $table) {
            if (Schema::hasColumn('pos_sub_categories', 'location_id')) {
                $table->dropForeign(['location_id']);
                $table->dropColumn('location_id');
            }
        });
    }
};
