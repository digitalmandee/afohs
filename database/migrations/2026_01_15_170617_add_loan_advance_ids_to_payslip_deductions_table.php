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
        Schema::table('payslip_deductions', function (Blueprint $table) {
            if (!Schema::hasColumn('payslip_deductions', 'employee_loan_id')) {
                $table->foreignId('employee_loan_id')->nullable()->constrained('employee_loans')->nullOnDelete();
            }
            if (!Schema::hasColumn('payslip_deductions', 'employee_advance_id')) {
                $table->foreignId('employee_advance_id')->nullable()->constrained('employee_advances')->nullOnDelete();
            }
            if (!Schema::hasColumn('payslip_deductions', 'order_id')) {
                $table->foreignId('order_id')->nullable()->constrained('orders')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payslip_deductions', function (Blueprint $table) {
            $table->dropForeign(['employee_loan_id']);
            $table->dropColumn('employee_loan_id');
            $table->dropForeign(['employee_advance_id']);
            $table->dropColumn('employee_advance_id');
            if (Schema::hasColumn('payslip_deductions', 'order_id')) {
                $table->dropForeign(['order_id']);
                $table->dropColumn('order_id');
            }
        });
    }
};
