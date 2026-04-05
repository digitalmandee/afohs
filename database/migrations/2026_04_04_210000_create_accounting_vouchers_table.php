<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('accounting_vouchers', function (Blueprint $table) {
            $table->id();
            $table->string('voucher_no')->unique();
            $table->enum('voucher_type', ['CPV', 'CRV', 'BPV', 'BRV', 'JV']);
            $table->date('voucher_date');
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('payment_account_id')->nullable()->constrained('payment_accounts')->nullOnDelete();
            $table->foreignId('period_id')->nullable()->constrained('accounting_periods')->nullOnDelete();
            $table->string('status', 30)->default('draft');
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('submitted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('submitted_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();

            $table->index(['voucher_type', 'status']);
            $table->index(['voucher_date', 'status']);
        });

        Schema::create('accounting_voucher_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('accounting_voucher_id')->constrained('accounting_vouchers')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('coa_accounts')->restrictOnDelete();
            $table->decimal('debit', 14, 2)->default(0);
            $table->decimal('credit', 14, 2)->default(0);
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->foreignId('employee_id')->nullable()->constrained('employees')->nullOnDelete();
            $table->text('description')->nullable();
            $table->unsignedInteger('line_order')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_voucher_lines');
        Schema::dropIfExists('accounting_vouchers');
    }
};

