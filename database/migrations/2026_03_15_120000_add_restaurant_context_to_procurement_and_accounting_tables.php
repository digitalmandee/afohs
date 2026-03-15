<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendors', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('address')->constrained('tenants')->nullOnDelete();
            $table->foreignId('payable_account_id')->nullable()->after('opening_balance')->constrained('coa_accounts')->nullOnDelete();
            $table->foreignId('advance_account_id')->nullable()->after('payable_account_id')->constrained('coa_accounts')->nullOnDelete();
            $table->foreignId('default_payment_account_id')->nullable()->after('advance_account_id')->constrained('payment_accounts')->nullOnDelete();
            $table->string('tax_treatment', 50)->nullable()->after('default_payment_account_id');
            $table->string('approval_status', 30)->default('approved')->after('tax_treatment');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('vendor_id')->constrained('tenants')->nullOnDelete();
        });

        Schema::table('goods_receipts', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('vendor_id')->constrained('tenants')->nullOnDelete();
            $table->unsignedBigInteger('warehouse_location_id')->nullable()->after('warehouse_id');
        });

        Schema::table('vendor_bills', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('vendor_id')->constrained('tenants')->nullOnDelete();
        });

        Schema::table('vendor_payments', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('vendor_id')->constrained('tenants')->nullOnDelete();
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('product_id')->constrained('tenants')->nullOnDelete();
            $table->unsignedBigInteger('warehouse_location_id')->nullable()->after('warehouse_id');
            $table->string('reason')->nullable()->after('reference_id');
            $table->string('status', 30)->default('posted')->after('reason');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->foreignId('tenant_id')->nullable()->after('module_id')->constrained('tenants')->nullOnDelete();
        });

        Schema::table('journal_lines', function (Blueprint $table) {
            $table->unsignedBigInteger('warehouse_location_id')->nullable()->after('warehouse_id');
        });

        Schema::table('accounting_event_queues', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->nullable()->after('source_id')->constrained('tenants')->nullOnDelete();
            $table->foreignId('posting_rule_id')->nullable()->after('restaurant_id')->constrained('accounting_rules')->nullOnDelete();
            $table->foreignId('journal_entry_id')->nullable()->after('posting_rule_id')->constrained('journal_entries')->nullOnDelete();
        });

        Schema::table('accounting_posting_logs', function (Blueprint $table) {
            $table->foreignId('restaurant_id')->nullable()->after('source_id')->constrained('tenants')->nullOnDelete();
            $table->foreignId('posting_rule_id')->nullable()->after('restaurant_id')->constrained('accounting_rules')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('accounting_posting_logs', function (Blueprint $table) {
            $table->dropConstrainedForeignId('posting_rule_id');
            $table->dropConstrainedForeignId('restaurant_id');
        });

        Schema::table('accounting_event_queues', function (Blueprint $table) {
            $table->dropConstrainedForeignId('journal_entry_id');
            $table->dropConstrainedForeignId('posting_rule_id');
            $table->dropConstrainedForeignId('restaurant_id');
        });

        Schema::table('journal_lines', function (Blueprint $table) {
            $table->dropColumn('warehouse_location_id');
        });

        Schema::table('journal_entries', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropColumn(['warehouse_location_id', 'reason', 'status']);
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('vendor_payments', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('vendor_bills', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('goods_receipts', function (Blueprint $table) {
            $table->dropColumn('warehouse_location_id');
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->dropConstrainedForeignId('tenant_id');
        });

        Schema::table('vendors', function (Blueprint $table) {
            $table->dropColumn(['tax_treatment', 'approval_status']);
            $table->dropConstrainedForeignId('default_payment_account_id');
            $table->dropConstrainedForeignId('advance_account_id');
            $table->dropConstrainedForeignId('payable_account_id');
            $table->dropConstrainedForeignId('tenant_id');
        });
    }
};
