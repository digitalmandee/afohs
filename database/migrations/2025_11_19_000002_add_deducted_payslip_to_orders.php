<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->unsignedBigInteger('deducted_in_payslip_id')->nullable()->after('paid_at');
            $table->index('deducted_in_payslip_id');
            $table->foreign('deducted_in_payslip_id')->references('id')->on('payslips')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['deducted_in_payslip_id']);
            $table->dropIndex(['deducted_in_payslip_id']);
            $table->dropColumn('deducted_in_payslip_id');
        });
    }
};
