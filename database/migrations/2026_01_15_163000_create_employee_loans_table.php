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
        Schema::create('employee_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->date('loan_date');
            $table->string('reason')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected', 'disbursed', 'completed'])->default('pending');
            $table->integer('installments')->default(1)->comment('Number of monthly installments');
            $table->decimal('monthly_deduction', 12, 2)->nullable();
            $table->decimal('total_paid', 12, 2)->default(0);
            $table->decimal('remaining_amount', 12, 2)->nullable();
            $table->date('next_deduction_date')->nullable();
            $table->integer('installments_paid')->default(0);
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_loans');
    }
};
