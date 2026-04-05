<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('accounting_voucher_allocations')) {
            Schema::create('accounting_voucher_allocations', function (Blueprint $table) {
                $table->id();
                $table->foreignId('voucher_id')->constrained('accounting_vouchers')->cascadeOnDelete();
                $table->foreignId('voucher_line_id')->nullable()->constrained('accounting_voucher_lines')->nullOnDelete();
                $table->string('invoice_type', 80);
                $table->unsignedBigInteger('invoice_id');
                $table->string('party_type', 40)->nullable();
                $table->unsignedBigInteger('party_id')->nullable();
                $table->decimal('allocated_amount', 14, 2);
                $table->string('currency_code', 12)->default('PKR');
                $table->decimal('exchange_rate', 18, 6)->default(1);
                $table->timestamp('allocated_at')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->string('idempotency_key')->nullable()->unique();
                $table->timestamps();

                $table->unique(['voucher_id', 'invoice_type', 'invoice_id'], 'acct_voucher_alloc_unique');
                $table->index(['invoice_type', 'invoice_id'], 'acct_voucher_alloc_invoice_idx');
                $table->index(['party_type', 'party_id'], 'acct_voucher_alloc_party_idx');
            });
        }

        Schema::table('accounting_voucher_lines', function (Blueprint $table) {
            if (!Schema::hasColumn('accounting_voucher_lines', 'party_type')) {
                $table->string('party_type', 40)->nullable()->after('employee_id');
            }
            if (!Schema::hasColumn('accounting_voucher_lines', 'party_id')) {
                $table->unsignedBigInteger('party_id')->nullable()->after('party_type');
                $table->index(['party_type', 'party_id'], 'acct_voucher_lines_party_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('accounting_voucher_lines', function (Blueprint $table) {
            if (Schema::hasColumn('accounting_voucher_lines', 'party_id')) {
                $table->dropIndex('acct_voucher_lines_party_idx');
                $table->dropColumn('party_id');
            }
            if (Schema::hasColumn('accounting_voucher_lines', 'party_type')) {
                $table->dropColumn('party_type');
            }
        });

        Schema::dropIfExists('accounting_voucher_allocations');
    }
};

