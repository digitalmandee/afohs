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
        Schema::table('tenants', function (Blueprint $table) {
            // Kitchen Printer
            if (!Schema::hasColumn('tenants', 'printer_ip')) {
                $table->string('printer_ip')->nullable()->after('name');
            }
            if (!Schema::hasColumn('tenants', 'printer_port')) {
                $table->integer('printer_port')->default(9100)->after('printer_ip');
            }
            // Expeditor Printer
            if (!Schema::hasColumn('tenants', 'expeditor_printer_ip')) {
                $table->string('expeditor_printer_ip')->nullable()->after('printer_port');
            }
            if (!Schema::hasColumn('tenants', 'expeditor_printer_port')) {
                $table->integer('expeditor_printer_port')->default(9100)->after('expeditor_printer_ip');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['printer_ip', 'printer_port', 'expeditor_printer_ip', 'expeditor_printer_port']);
        });
    }
};
