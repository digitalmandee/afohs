<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounting_vouchers', function (Blueprint $table) {
            $table->date('posting_date')->nullable()->after('voucher_date');
            $table->foreignId('department_id')->nullable()->after('tenant_id')->constrained('departments')->nullOnDelete();
            $table->string('reference_no')->nullable()->after('department_id');
            $table->string('external_reference_no')->nullable()->after('reference_no');
            $table->string('currency_code', 12)->default('PKR')->after('external_reference_no');
            $table->decimal('exchange_rate', 18, 6)->default(1)->after('currency_code');
            $table->string('instrument_type', 50)->nullable()->after('payment_account_id');
            $table->string('instrument_no')->nullable()->after('instrument_type');
            $table->date('instrument_date')->nullable()->after('instrument_no');
            $table->string('bank_reference')->nullable()->after('instrument_date');
            $table->string('deposit_reference')->nullable()->after('bank_reference');
            $table->date('clearing_date')->nullable()->after('deposit_reference');
            $table->foreignId('updated_by')->nullable()->after('created_by')->constrained('users')->nullOnDelete();
            $table->foreignId('cancelled_by')->nullable()->after('posted_by')->constrained('users')->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable()->after('posted_at');
            $table->foreignId('reversed_by')->nullable()->after('cancelled_at')->constrained('users')->nullOnDelete();
            $table->timestamp('reversed_at')->nullable()->after('reversed_by');
            $table->foreignId('reversal_voucher_id')->nullable()->after('reversed_at')->constrained('accounting_vouchers')->nullOnDelete();
            $table->string('approval_reference')->nullable()->after('reversal_voucher_id');

            $table->index(['voucher_type', 'posting_date']);
        });

        Schema::table('accounting_voucher_lines', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('account_id')->constrained('departments')->nullOnDelete();
            $table->string('reference_type')->nullable()->after('department_id');
            $table->unsignedBigInteger('reference_id')->nullable()->after('reference_type');
            $table->string('tax_code', 50)->nullable()->after('reference_id');
            $table->decimal('tax_amount', 14, 2)->default(0)->after('tax_code');
            $table->json('dimensions')->nullable()->after('tax_amount');
            $table->boolean('is_system_generated')->default(false)->after('dimensions');
        });
    }

    public function down(): void
    {
        Schema::table('accounting_voucher_lines', function (Blueprint $table) {
            $table->dropConstrainedForeignId('department_id');
            $table->dropColumn(['reference_type', 'reference_id', 'tax_code', 'tax_amount', 'dimensions', 'is_system_generated']);
        });

        Schema::table('accounting_vouchers', function (Blueprint $table) {
            $table->dropIndex(['voucher_type', 'posting_date']);
            $table->dropConstrainedForeignId('department_id');
            $table->dropConstrainedForeignId('updated_by');
            $table->dropConstrainedForeignId('cancelled_by');
            $table->dropConstrainedForeignId('reversed_by');
            $table->dropConstrainedForeignId('reversal_voucher_id');
            $table->dropColumn([
                'posting_date',
                'reference_no',
                'external_reference_no',
                'currency_code',
                'exchange_rate',
                'instrument_type',
                'instrument_no',
                'instrument_date',
                'bank_reference',
                'deposit_reference',
                'clearing_date',
                'cancelled_at',
                'reversed_at',
                'approval_reference',
            ]);
        });
    }
};
