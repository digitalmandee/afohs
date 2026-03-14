<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        $tables = [
            'pos_categories',
            'floors',
            'tables',
            'orders',
            'order_items',
            'reservations',
            'pos_categories',
            'pos_shifts',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'location_id')) {
                    $table->unsignedBigInteger('location_id')->nullable()->index();
                }
            });
        }

        foreach ($tables as $tableName) {
            if (Schema::hasColumn($tableName, 'tenant_id') && Schema::hasColumn($tableName, 'location_id')) {
                DB::table($tableName)
                    ->whereNull('location_id')
                    ->whereNotNull('tenant_id')
                    ->update(['location_id' => DB::raw('tenant_id')]);
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'pos_categories',
            'floors',
            'tables',
            'orders',
            'order_items',
            'reservations',
            'pos_categories',
            'pos_shifts',
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'location_id')) {
                    $table->dropColumn('location_id');
                }
            });
        }
    }
};
