<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('legacy_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('name');
            $table->string('sku')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->foreignId('manufacturer_id')->nullable()->constrained('pos_manufacturers')->nullOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained('pos_units')->nullOnDelete();
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

        Schema::table('ingredients', function (Blueprint $table) {
            $table->foreignId('inventory_item_id')->nullable()->after('inventory_product_id')->constrained('inventory_items')->nullOnDelete();
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->foreignId('inventory_item_id')->nullable()->after('product_id')->constrained('inventory_items')->nullOnDelete();
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreignId('inventory_item_id')->nullable()->after('product_id')->constrained('inventory_items')->nullOnDelete();
        });

        Schema::table('goods_receipt_items', function (Blueprint $table) {
            $table->foreignId('inventory_item_id')->nullable()->after('product_id')->constrained('inventory_items')->nullOnDelete();
        });

        Schema::table('vendor_bill_items', function (Blueprint $table) {
            $table->foreignId('inventory_item_id')->nullable()->after('product_id')->constrained('inventory_items')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('vendor_bill_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_item_id');
        });

        Schema::table('goods_receipt_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_item_id');
        });

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_item_id');
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_item_id');
        });

        Schema::table('ingredients', function (Blueprint $table) {
            $table->dropConstrainedForeignId('inventory_item_id');
        });

        Schema::dropIfExists('inventory_items');
    }
};
