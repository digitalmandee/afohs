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
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_code')->unique();
            $table->string('voucher_name');
            $table->text('description')->nullable();
            $table->decimal('amount', 10, 2);
            $table->enum('voucher_type', ['member', 'employee']);
            $table->unsignedBigInteger('member_id')->nullable();
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->date('valid_from');
            $table->date('valid_to');
            $table->enum('status', ['active', 'inactive', 'expired', 'used'])->default('active');
            $table->boolean('is_used')->default(false);
            $table->timestamp('used_at')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->unsignedBigInteger('deleted_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Foreign key constraints
            $table->foreign('member_id')->references('id')->on('members')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');

            // Indexes
            $table->index(['voucher_type', 'status']);
            $table->index(['valid_from', 'valid_to']);
            $table->index('voucher_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
