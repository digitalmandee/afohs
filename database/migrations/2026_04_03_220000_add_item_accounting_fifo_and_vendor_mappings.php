<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->foreignId('inventory_account_id')->nullable()->after('unit_id')->constrained('coa_accounts')->nullOnDelete();
            $table->foreignId('cogs_account_id')->nullable()->after('inventory_account_id')->constrained('coa_accounts')->nullOnDelete();
            $table->foreignId('purchase_account_id')->nullable()->after('cogs_account_id')->constrained('coa_accounts')->nullOnDelete();

            $table->boolean('is_expiry_tracked')->default(false)->after('is_purchasable');
            $table->string('purchase_price_mode', 20)->default('open')->after('is_expiry_tracked');
            $table->decimal('fixed_purchase_price', 15, 4)->nullable()->after('purchase_price_mode');
            $table->boolean('allow_price_override')->default(true)->after('fixed_purchase_price');
            $table->decimal('max_price_variance_percent', 8, 2)->nullable()->after('allow_price_override');
        });

        Schema::create('inventory_batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('warehouse_location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->string('batch_no', 64);
            $table->date('received_date');
            $table->date('expiry_date')->nullable();
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('original_qty', 15, 3)->default(0);
            $table->decimal('remaining_qty', 15, 3)->default(0);
            $table->string('status', 30)->default('open');
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->timestamps();

            $table->index(['inventory_item_id', 'warehouse_id', 'warehouse_location_id'], 'inv_batches_item_wh_idx');
            $table->index(['received_date', 'expiry_date'], 'inv_batches_dates_idx');
            $table->index(['reference_type', 'reference_id'], 'inv_batches_ref_idx');
        });

        Schema::create('inventory_issue_allocations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('inventory_transaction_id')->constrained('inventory_transactions')->cascadeOnDelete();
            $table->foreignId('inventory_batch_id')->constrained('inventory_batches')->restrictOnDelete();
            $table->decimal('quantity', 15, 3)->default(0);
            $table->decimal('unit_cost', 15, 4)->default(0);
            $table->decimal('total_cost', 15, 4)->default(0);
            $table->timestamps();

            $table->index(['inventory_transaction_id', 'inventory_batch_id'], 'inv_issue_alloc_txn_batch_idx');
        });

        Schema::create('vendor_item_mappings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('vendor_id')->constrained('vendors')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->boolean('is_preferred')->default(false);
            $table->boolean('is_active')->default(true);
            $table->decimal('contract_price', 15, 4)->nullable();
            $table->decimal('last_purchase_price', 15, 4)->nullable();
            $table->unsignedInteger('lead_time_days')->nullable();
            $table->decimal('minimum_order_qty', 15, 3)->nullable();
            $table->string('currency', 8)->default('PKR');
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['vendor_id', 'inventory_item_id'], 'vendor_item_unique');
            $table->index(['inventory_item_id', 'is_preferred', 'is_active'], 'vendor_item_pref_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_item_mappings');
        Schema::dropIfExists('inventory_issue_allocations');
        Schema::dropIfExists('inventory_batches');

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('purchase_account_id');
            $table->dropConstrainedForeignId('cogs_account_id');
            $table->dropConstrainedForeignId('inventory_account_id');
            $table->dropColumn([
                'is_expiry_tracked',
                'purchase_price_mode',
                'fixed_purchase_price',
                'allow_price_override',
                'max_price_variance_percent',
            ]);
        });
    }
};
