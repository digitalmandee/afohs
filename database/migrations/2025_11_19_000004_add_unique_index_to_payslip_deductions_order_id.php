<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('payslip_deductions', function (Blueprint $table) {
            // ensure the column exists
            if (Schema::hasColumn('payslip_deductions', 'order_id')) {
                $table->unique('order_id', 'payslip_deductions_order_id_unique');
            }
        });
    }

    public function down()
    {
        Schema::table('payslip_deductions', function (Blueprint $table) {
            $table->dropUnique('payslip_deductions_order_id_unique');
        });
    }
};