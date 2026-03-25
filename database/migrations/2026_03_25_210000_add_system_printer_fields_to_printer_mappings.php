<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            if (!Schema::hasColumn('tenants', 'printer_source')) {
                $table->string('printer_source')->nullable()->after('printer_port');
            }

            if (!Schema::hasColumn('tenants', 'printer_name')) {
                $table->string('printer_name')->nullable()->after('printer_source');
            }

            if (!Schema::hasColumn('tenants', 'printer_connector')) {
                $table->string('printer_connector')->nullable()->after('printer_name');
            }
        });

        Schema::table('kitchen_details', function (Blueprint $table) {
            if (!Schema::hasColumn('kitchen_details', 'printer_source')) {
                $table->string('printer_source')->nullable()->after('printer_port');
            }

            if (!Schema::hasColumn('kitchen_details', 'printer_name')) {
                $table->string('printer_name')->nullable()->after('printer_source');
            }

            if (!Schema::hasColumn('kitchen_details', 'printer_connector')) {
                $table->string('printer_connector')->nullable()->after('printer_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $drop = [];

            foreach (['printer_source', 'printer_name', 'printer_connector'] as $column) {
                if (Schema::hasColumn('tenants', $column)) {
                    $drop[] = $column;
                }
            }

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });

        Schema::table('kitchen_details', function (Blueprint $table) {
            $drop = [];

            foreach (['printer_source', 'printer_name', 'printer_connector'] as $column) {
                if (Schema::hasColumn('kitchen_details', $column)) {
                    $drop[] = $column;
                }
            }

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
