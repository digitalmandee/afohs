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
        Schema::create('payslip_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payslip_id')->constrained('payslips')->onDelete('cascade');
            $table->foreignId('deduction_type_id')->constrained('deduction_types')->onDelete('cascade');
            $table->string('deduction_name');
            $table->decimal('amount', 10, 2);
            $table->timestamps();

            $table->index('payslip_id');
            $table->index('deduction_type_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payslip_deductions');
    }
};
