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
        Schema::create('employee_advances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->date('advance_date');
            $table->string('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'paid', 'deducted'])->default('pending');
            $table->date('deduction_start_date')->nullable();
            $table->integer('deduction_months')->default(1)->comment('Number of months to deduct');
            $table->decimal('monthly_deduction', 12, 2)->nullable();
            $table->decimal('remaining_amount', 12, 2)->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_advances');
    }
};
