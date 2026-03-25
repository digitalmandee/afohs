<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('inventory_items')) {
            Schema::create('inventory_items', function (Blueprint $table) {
                $table->id();
                $table->foreignId('legacy_product_id')->nullable()->constrained('products')->nullOnDelete();
                $table->string('name');
                $table->string('sku')->nullable();
                $table->text('description')->nullable();
                $table->unsignedBigInteger('category_id')->nullable();
                $table->unsignedBigInteger('manufacturer_id')->nullable();
                $table->unsignedBigInteger('unit_id')->nullable();
                $table->decimal('default_unit_cost', 15, 4)->default(0);
                $table->decimal('current_stock', 15, 3)->default(0);
                $table->decimal('minimum_stock', 15, 3)->default(0);
                $table->boolean('manage_stock')->default(true);
                $table->boolean('is_purchasable')->default(true);
                $table->string('status')->default('active');
                $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
                $table->softDeletes();
                $table->timestamps();

                $table->unique('legacy_product_id');
                $table->index(['status', 'manage_stock', 'is_purchasable']);
            });
        }

        $this->addOptionalLookupForeignKeys();
        $this->addInventoryItemReference('ingredients', 'inventory_item_id', 'inventory_product_id');
        $this->addInventoryItemReference('inventory_transactions', 'inventory_item_id', 'product_id');
        $this->addInventoryItemReference('purchase_order_items', 'inventory_item_id', 'product_id');
        $this->addInventoryItemReference('goods_receipt_items', 'inventory_item_id', 'product_id');
        $this->addInventoryItemReference('vendor_bill_items', 'inventory_item_id', 'product_id');
    }

    public function down(): void
    {
        $this->dropInventoryItemReference('vendor_bill_items', 'inventory_item_id');
        $this->dropInventoryItemReference('goods_receipt_items', 'inventory_item_id');
        $this->dropInventoryItemReference('purchase_order_items', 'inventory_item_id');
        $this->dropInventoryItemReference('inventory_transactions', 'inventory_item_id');
        $this->dropInventoryItemReference('ingredients', 'inventory_item_id');

        if (Schema::hasTable('inventory_items')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                foreach (['category_id', 'manufacturer_id', 'unit_id'] as $column) {
                    try {
                        $table->dropForeign([$column]);
                    } catch (\Throwable) {
                        // Optional lookup foreign keys may not exist in older environments.
                    }
                }
            });
        }

        Schema::dropIfExists('inventory_items');
    }

    protected function addOptionalLookupForeignKeys(): void
    {
        if (!Schema::hasTable('inventory_items')) {
            return;
        }

        Schema::table('inventory_items', function (Blueprint $table) {
            if (Schema::hasTable('categories')) {
                try {
                    $table->foreign('category_id')->references('id')->on('categories')->nullOnDelete();
                } catch (\Throwable) {
                    // Foreign key may already exist after a partial migration run.
                }
            }

            if (Schema::hasTable('pos_manufacturers')) {
                try {
                    $table->foreign('manufacturer_id')->references('id')->on('pos_manufacturers')->nullOnDelete();
                } catch (\Throwable) {
                    // Foreign key may already exist after a partial migration run.
                }
            }

            if (Schema::hasTable('pos_units')) {
                try {
                    $table->foreign('unit_id')->references('id')->on('pos_units')->nullOnDelete();
                } catch (\Throwable) {
                    // Foreign key may already exist after a partial migration run.
                }
            }
        });
    }

    protected function addInventoryItemReference(string $tableName, string $column, string $afterColumn): void
    {
        if (!Schema::hasTable($tableName) || Schema::hasColumn($tableName, $column)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($column, $afterColumn) {
            $table->foreignId($column)->nullable()->after($afterColumn)->constrained('inventory_items')->nullOnDelete();
        });
    }

    protected function dropInventoryItemReference(string $tableName, string $column): void
    {
        if (!Schema::hasTable($tableName) || !Schema::hasColumn($tableName, $column)) {
            return;
        }

        Schema::table($tableName, function (Blueprint $table) use ($column) {
            $table->dropConstrainedForeignId($column);
        });
    }
};
