<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        DB::transaction(function () {
            if (Schema::hasTable('floors') && Schema::hasColumn('floors', 'tenant_id') && Schema::hasColumn('floors', 'location_id')) {
                DB::table('floors')
                    ->whereNotNull('location_id')
                    ->update(['tenant_id' => DB::raw('location_id')]);
            }

            if (Schema::hasTable('tables') && Schema::hasColumn('tables', 'tenant_id') && Schema::hasColumn('tables', 'location_id')) {
                DB::table('tables')
                    ->whereNotNull('location_id')
                    ->update(['tenant_id' => DB::raw('location_id')]);
            }
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            if (Schema::hasTable('floors') && Schema::hasColumn('floors', 'tenant_id') && Schema::hasColumn('floors', 'location_id')) {
                DB::table('floors')
                    ->whereNotNull('location_id')
                    ->whereColumn('tenant_id', 'location_id')
                    ->update(['tenant_id' => null]);
            }

            if (Schema::hasTable('tables') && Schema::hasColumn('tables', 'tenant_id') && Schema::hasColumn('tables', 'location_id')) {
                DB::table('tables')
                    ->whereNotNull('location_id')
                    ->whereColumn('tenant_id', 'location_id')
                    ->update(['tenant_id' => null]);
            }
        });
    }
};

