<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('purchase_order_items') || !Schema::hasColumn('purchase_order_items', 'product_id')) {
            return;
        }

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('purchase_order_items') || !Schema::hasColumn('purchase_order_items', 'product_id')) {
            return;
        }

        Schema::table('purchase_order_items', function (Blueprint $table) {
            $table->foreignId('product_id')->nullable(false)->change();
        });
    }
};
