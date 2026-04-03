<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->string('valuation_method', 20)->default('fifo')->after('purchase_price_mode');
            $table->decimal('moving_average_cost', 15, 4)->default(0)->after('default_unit_cost');
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->string('valuation_method', 20)->nullable()->after('status');
            $table->decimal('valuation_rate', 15, 4)->nullable()->after('valuation_method');
        });

        Schema::table('vendor_bills', function (Blueprint $table) {
            $table->decimal('advance_applied_amount', 15, 2)->default(0)->after('paid_amount');
            $table->decimal('other_charges_total', 15, 2)->default(0)->after('discount_total');
        });

        Schema::create('vendor_bill_other_charges', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_bill_id')->constrained('vendor_bills')->cascadeOnDelete();
            $table->foreignId('account_id')->constrained('coa_accounts')->restrictOnDelete();
            $table->foreignId('party_vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->string('description')->nullable();
            $table->decimal('amount', 15, 2);
            $table->timestamps();
        });

        Schema::table('vendor_payments', function (Blueprint $table) {
            $table->string('payment_intent', 20)->default('ledger_wise')->after('method');
            $table->unsignedBigInteger('source_document_id')->nullable()->after('payment_intent');
            $table->string('source_document_type', 120)->nullable()->after('source_document_id');
        });

        Schema::create('supplier_advances', function (Blueprint $table) {
            $table->id();
            $table->string('advance_no')->unique();
            $table->foreignId('vendor_id')->constrained('vendors')->restrictOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('purchase_order_id')->nullable()->constrained('purchase_orders')->nullOnDelete();
            $table->foreignId('payment_account_id')->nullable()->constrained('payment_accounts')->nullOnDelete();
            $table->date('advance_date');
            $table->decimal('amount', 15, 2);
            $table->decimal('applied_amount', 15, 2)->default(0);
            $table->enum('status', ['draft', 'posted', 'partially_applied', 'applied', 'void'])->default('draft');
            $table->string('reference')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('posted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->nullable();
            $table->timestamps();
        });

        Schema::create('supplier_advance_applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_advance_id')->constrained('supplier_advances')->cascadeOnDelete();
            $table->foreignId('vendor_bill_id')->constrained('vendor_bills')->cascadeOnDelete();
            $table->decimal('amount', 15, 2);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['supplier_advance_id', 'vendor_bill_id'], 'supplier_advance_bill_unique');
        });

        Schema::create('purchase_order_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('purchase_orders')->cascadeOnDelete();
            $table->unsignedInteger('revision_no')->default(1);
            $table->json('snapshot');
            $table->text('change_reason');
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->unique(['purchase_order_id', 'revision_no'], 'purchase_order_revision_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('purchase_order_revisions');
        Schema::dropIfExists('supplier_advance_applications');
        Schema::dropIfExists('supplier_advances');
        Schema::dropIfExists('vendor_bill_other_charges');

        Schema::table('vendor_payments', function (Blueprint $table) {
            $table->dropColumn(['payment_intent', 'source_document_id', 'source_document_type']);
        });

        Schema::table('vendor_bills', function (Blueprint $table) {
            $table->dropColumn(['advance_applied_amount', 'other_charges_total']);
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropColumn(['valuation_method', 'valuation_rate']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropColumn(['valuation_method', 'moving_average_cost']);
        });
    }
};
