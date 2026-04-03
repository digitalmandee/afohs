<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_document_type_configs', function (Blueprint $table) {
            $table->id();
            $table->string('code', 32)->unique();
            $table->string('name', 120);
            $table->string('prefix', 10)->nullable();
            $table->unsignedInteger('sequence')->default(0);
            $table->boolean('auto_post')->default(true);
            $table->boolean('approval_required')->default(false);
            $table->boolean('accounting_enabled')->default(false);
            $table->json('settings')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('inventory_documents', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->after('tenant_id')->constrained('departments')->nullOnDelete();
            $table->foreignId('subdepartment_id')->nullable()->after('department_id')->constrained('subdepartments')->nullOnDelete();
            $table->string('source_document_type', 120)->nullable()->after('remarks');
            $table->unsignedBigInteger('source_document_id')->nullable()->after('source_document_type');
            $table->string('posting_key', 80)->nullable()->after('source_document_id');
            $table->timestamp('submitted_at')->nullable()->after('posting_key');
            $table->timestamp('approved_at')->nullable()->after('submitted_at');
            $table->foreignId('approved_by')->nullable()->after('approved_at')->constrained('users')->nullOnDelete();
            $table->timestamp('posted_at')->nullable()->after('approved_by');
            $table->string('approval_status', 30)->default('draft')->after('status');

            $table->unique('posting_key', 'inventory_documents_posting_key_unique');
        });

        // Extend inventory document type enum for newly requested operational flows.
        DB::statement("
            ALTER TABLE inventory_documents
            MODIFY COLUMN type ENUM(
                'opening_balance',
                'adjustment',
                'transfer',
                'purchase_requisition',
                'cash_purchase',
                'purchase_return',
                'delivery_note',
                'store_issue_note',
                'warehouse_issue_note',
                'material_issue_note',
                'material_receipt_note',
                'department_transfer_note',
                'department_adjustment',
                'stock_audit'
            ) NOT NULL
        ");

        Schema::create('inventory_document_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_document_id')->constrained('inventory_documents')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('quantity', 15, 3)->default(0);
            $table->decimal('counted_quantity', 15, 3)->nullable();
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['inventory_document_id', 'inventory_item_id'], 'inv_doc_lines_doc_item_idx');
        });

        Schema::create('purchase_requisitions', function (Blueprint $table) {
            $table->id();
            $table->string('pr_no')->unique();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->foreignId('subdepartment_id')->nullable()->constrained('subdepartments')->nullOnDelete();
            $table->foreignId('requested_by')->nullable()->constrained('users')->nullOnDelete();
            $table->date('request_date');
            $table->date('required_date')->nullable();
            $table->string('status', 30)->default('draft');
            $table->text('notes')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('purchase_requisition_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_requisition_id')->constrained('purchase_requisitions')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('qty_requested', 15, 3)->default(0);
            $table->decimal('qty_approved', 15, 3)->nullable();
            $table->decimal('qty_converted', 15, 3)->default(0);
            $table->decimal('estimated_unit_cost', 15, 4)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('cash_purchases', function (Blueprint $table) {
            $table->id();
            $table->string('cp_no')->unique();
            $table->foreignId('vendor_id')->nullable()->constrained('vendors')->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('warehouse_location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->foreignId('payment_account_id')->nullable()->constrained('payment_accounts')->nullOnDelete();
            $table->date('purchase_date');
            $table->string('status', 30)->default('draft');
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('cash_purchase_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cash_purchase_id')->constrained('cash_purchases')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('qty', 15, 3)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('purchase_returns', function (Blueprint $table) {
            $table->id();
            $table->string('return_no')->unique();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('warehouse_location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->foreignId('goods_receipt_id')->nullable()->constrained('goods_receipts')->nullOnDelete();
            $table->foreignId('vendor_bill_id')->nullable()->constrained('vendor_bills')->nullOnDelete();
            $table->date('return_date');
            $table->string('status', 30)->default('draft');
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('purchase_return_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_return_id')->constrained('purchase_returns')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('qty_returned', 15, 3)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('line_total', 15, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_audits', function (Blueprint $table) {
            $table->id();
            $table->string('audit_no')->unique();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('warehouse_location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->date('audit_date');
            $table->string('status', 30)->default('draft');
            $table->text('remarks')->nullable();
            $table->timestamp('frozen_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('posted_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('stock_audit_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_audit_id')->constrained('stock_audits')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('system_qty', 15, 3)->default(0);
            $table->decimal('counted_qty', 15, 3)->default(0);
            $table->decimal('variance_qty', 15, 3)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('variance_value', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('department_inventory_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('subdepartment_id')->nullable()->constrained('subdepartments')->nullOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('current_qty', 15, 3)->default(0);
            $table->decimal('current_value', 15, 2)->default(0);
            $table->timestamps();

            $table->unique(
                ['tenant_id', 'department_id', 'subdepartment_id', 'inventory_item_id'],
                'dept_inv_balances_unique'
            );
        });

        Schema::create('department_inventory_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('department_id')->constrained('departments')->cascadeOnDelete();
            $table->foreignId('subdepartment_id')->nullable()->constrained('subdepartments')->nullOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->date('transaction_date');
            $table->string('type', 40);
            $table->decimal('qty_in', 15, 3)->default(0);
            $table->decimal('qty_out', 15, 3)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_cost', 15, 2)->default(0);
            $table->string('reference_type', 120)->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('remarks')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        $this->seedDocumentConfigs();
    }

    public function down(): void
    {
        Schema::dropIfExists('department_inventory_transactions');
        Schema::dropIfExists('department_inventory_balances');
        Schema::dropIfExists('stock_audit_items');
        Schema::dropIfExists('stock_audits');
        Schema::dropIfExists('purchase_return_items');
        Schema::dropIfExists('purchase_returns');
        Schema::dropIfExists('cash_purchase_items');
        Schema::dropIfExists('cash_purchases');
        Schema::dropIfExists('purchase_requisition_items');
        Schema::dropIfExists('purchase_requisitions');
        Schema::dropIfExists('inventory_document_lines');
        Schema::dropIfExists('inventory_document_type_configs');

        Schema::table('inventory_documents', function (Blueprint $table) {
            $table->dropUnique('inventory_documents_posting_key_unique');
            $table->dropConstrainedForeignId('approved_by');
            $table->dropConstrainedForeignId('subdepartment_id');
            $table->dropConstrainedForeignId('department_id');
            $table->dropColumn([
                'source_document_type',
                'source_document_id',
                'posting_key',
                'submitted_at',
                'approved_at',
                'posted_at',
                'approval_status',
            ]);
        });

        DB::statement("
            ALTER TABLE inventory_documents
            MODIFY COLUMN type ENUM('opening_balance','adjustment','transfer') NOT NULL
        ");
    }

    private function seedDocumentConfigs(): void
    {
        $configs = [
            ['code' => 'purchase_requisition', 'name' => 'Purchase Requisition', 'prefix' => 'PR', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'cash_purchase', 'name' => 'Cash Purchase', 'prefix' => 'CP', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => true],
            ['code' => 'purchase_return', 'name' => 'Purchase Return', 'prefix' => 'PRTN', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => true],
            ['code' => 'delivery_note', 'name' => 'Delivery Note', 'prefix' => 'DN', 'auto_post' => true, 'approval_required' => false, 'accounting_enabled' => false],
            ['code' => 'store_issue_note', 'name' => 'Store Issue Note', 'prefix' => 'SIN', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'warehouse_issue_note', 'name' => 'Warehouse Issue Note', 'prefix' => 'WIN', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'material_issue_note', 'name' => 'Material Issue Note', 'prefix' => 'MIN', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'material_receipt_note', 'name' => 'Material Receipt Note', 'prefix' => 'MRN', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'warehouse_transfer', 'name' => 'Warehouse Transfer Note', 'prefix' => 'WTN', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'stock_adjustment', 'name' => 'Stock Adjustment', 'prefix' => 'SADJ', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'stock_audit', 'name' => 'Stock Audit', 'prefix' => 'SAUD', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'department_transfer_note', 'name' => 'Department Transfer Note', 'prefix' => 'DTN', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
            ['code' => 'department_adjustment', 'name' => 'Department Inventory Adjustment', 'prefix' => 'DADJ', 'auto_post' => false, 'approval_required' => true, 'accounting_enabled' => false],
        ];

        foreach ($configs as $config) {
            DB::table('inventory_document_type_configs')->updateOrInsert(
                ['code' => $config['code']],
                array_merge($config, [
                    'sequence' => 0,
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }
    }
};
