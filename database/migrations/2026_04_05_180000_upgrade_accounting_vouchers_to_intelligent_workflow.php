<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('accounting_vouchers', function (Blueprint $table) {
            if (!Schema::hasColumn('accounting_vouchers', 'entry_mode')) {
                $table->string('entry_mode', 40)->default('manual')->after('voucher_type');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'party_type')) {
                $table->string('party_type', 40)->nullable()->after('entry_mode');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'party_id')) {
                $table->unsignedBigInteger('party_id')->nullable()->after('party_type');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'invoice_type')) {
                $table->string('invoice_type', 80)->nullable()->after('party_id');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'invoice_id')) {
                $table->unsignedBigInteger('invoice_id')->nullable()->after('invoice_type');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'expense_type_id')) {
                $table->unsignedBigInteger('expense_type_id')->nullable()->after('invoice_id');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'template_id')) {
                $table->unsignedBigInteger('template_id')->nullable()->after('expense_type_id');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'is_manual_override')) {
                $table->boolean('is_manual_override')->default(false)->after('template_id');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'amount')) {
                $table->decimal('amount', 14, 2)->default(0)->after('is_manual_override');
            }
            if (!Schema::hasColumn('accounting_vouchers', 'system_narration')) {
                $table->text('system_narration')->nullable()->after('remarks');
            }
        });

        Schema::create('accounting_expense_types', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('expense_account_id')->nullable()->constrained('coa_accounts')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('accounting_entity_account_mappings', function (Blueprint $table) {
            $table->id();
            $table->string('entity_type', 80);
            $table->unsignedBigInteger('entity_id');
            $table->string('role', 40);
            $table->foreignId('account_id')->constrained('coa_accounts')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['entity_type', 'entity_id', 'role'], 'acct_entity_role_unique');
            $table->index(['role', 'is_active'], 'acct_entity_role_active_idx');
        });

        Schema::create('accounting_voucher_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('scope', 20)->default('user');
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->boolean('is_active')->default(true);
            $table->json('payload');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accounting_voucher_templates');
        Schema::dropIfExists('accounting_entity_account_mappings');
        Schema::dropIfExists('accounting_expense_types');

        Schema::table('accounting_vouchers', function (Blueprint $table) {
            $dropColumns = array_values(array_filter([
                Schema::hasColumn('accounting_vouchers', 'entry_mode') ? 'entry_mode' : null,
                Schema::hasColumn('accounting_vouchers', 'party_type') ? 'party_type' : null,
                Schema::hasColumn('accounting_vouchers', 'party_id') ? 'party_id' : null,
                Schema::hasColumn('accounting_vouchers', 'invoice_type') ? 'invoice_type' : null,
                Schema::hasColumn('accounting_vouchers', 'invoice_id') ? 'invoice_id' : null,
                Schema::hasColumn('accounting_vouchers', 'expense_type_id') ? 'expense_type_id' : null,
                Schema::hasColumn('accounting_vouchers', 'template_id') ? 'template_id' : null,
                Schema::hasColumn('accounting_vouchers', 'is_manual_override') ? 'is_manual_override' : null,
                Schema::hasColumn('accounting_vouchers', 'amount') ? 'amount' : null,
                Schema::hasColumn('accounting_vouchers', 'system_narration') ? 'system_narration' : null,
            ]));

            if ($dropColumns !== []) {
                $table->dropColumn($dropColumns);
            }
        });
    }
};

