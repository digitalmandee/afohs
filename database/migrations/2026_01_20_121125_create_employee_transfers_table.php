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
        Schema::create('employee_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');

            // From Details
            $table->foreignId('from_department_id')->nullable()->constrained('departments')->onDelete('set null');
            $table->foreignId('from_subdepartment_id')->nullable()->constrained('subdepartments')->onDelete('set null');
            $table->foreignId('from_designation_id')->nullable()->constrained('designations')->onDelete('set null');
            $table->foreignId('from_branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->foreignId('from_shift_id')->nullable()->constrained('shifts')->onDelete('set null');  // Optional

            // To Details (New)
            $table->foreignId('to_department_id')->nullable()->constrained('departments')->onDelete('set null');
            $table->foreignId('to_subdepartment_id')->nullable()->constrained('subdepartments')->onDelete('set null');
            $table->foreignId('to_designation_id')->nullable()->constrained('designations')->onDelete('set null');
            $table->foreignId('to_branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->foreignId('to_shift_id')->nullable()->constrained('shifts')->onDelete('set null');  // Optional

            $table->date('transfer_date');
            $table->text('reason')->nullable();

            $table->foreignId('transferred_by')->nullable()->constrained('users')->onDelete('set null');

            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('deleted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_transfers');
    }
};
