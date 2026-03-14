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
        Schema::create('payroll_settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name')->default('Afohs Club');
            $table->enum('pay_frequency', ['monthly', 'bi-weekly', 'weekly'])->default('monthly');
            $table->string('currency', 10)->default('PKR');
            $table->integer('working_days_per_month')->default(26);
            $table->decimal('working_hours_per_day', 4, 2)->default(8.00);
            $table->decimal('overtime_rate_multiplier', 4, 2)->default(1.5);
            $table->decimal('late_deduction_per_minute', 8, 2)->default(0.00);
            $table->enum('absent_deduction_type', ['full_day', 'hourly', 'fixed_amount'])->default('full_day');
            $table->decimal('absent_deduction_amount', 10, 2)->default(0.00);
            $table->integer('max_allowed_absents')->default(3);
            $table->integer('grace_period_minutes')->default(15);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payroll_settings');
    }
};
