<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payroll_period_id')->constrained('payroll_periods')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->string('employee_name');
            $table->string('employee_id_number', 50);
            $table->string('designation');
            $table->string('department');
            
            // Salary Components
            $table->decimal('basic_salary', 12, 2);
            $table->decimal('total_allowances', 12, 2)->default(0.00);
            $table->decimal('total_deductions', 12, 2)->default(0.00);
            $table->decimal('gross_salary', 12, 2);
            $table->decimal('net_salary', 12, 2);
            
            // Attendance Data
            $table->integer('total_working_days');
            $table->integer('days_present');
            $table->integer('days_absent');
            $table->integer('days_late');
            $table->decimal('overtime_hours', 6, 2)->default(0.00);
            
            // Calculations
            $table->decimal('absent_deduction', 10, 2)->default(0.00);
            $table->decimal('late_deduction', 10, 2)->default(0.00);
            $table->decimal('overtime_amount', 10, 2)->default(0.00);
            
            // Status
            $table->enum('status', ['draft', 'approved', 'paid'])->default('draft');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            
            $table->timestamps();

            $table->index(['payroll_period_id', 'employee_id']);
            $table->index('status');
            $table->unique(['payroll_period_id', 'employee_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payslips');
    }
};
