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
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'deducted_in_payslip_id')) {
                $table->unsignedBigInteger('deducted_in_payslip_id')->nullable()->after('updated_at');
            }
            if (!Schema::hasColumn('orders', 'deducted_at')) {
                $table->timestamp('deducted_at')->nullable()->after('deducted_in_payslip_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['deducted_in_payslip_id', 'deducted_at']);
        });
    }
};
