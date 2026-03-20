<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'kitchen_id')) {
                $table->foreignId('kitchen_id')->nullable()->after('order_id')->constrained('users')->nullOnDelete();
                $table->index(['order_id', 'kitchen_id'], 'order_items_order_kitchen_idx');
            }
        });
    }

    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            if (Schema::hasColumn('order_items', 'kitchen_id')) {
                $table->dropIndex('order_items_order_kitchen_idx');
                $table->dropForeign(['kitchen_id']);
                $table->dropColumn('kitchen_id');
            }
        });
    }
};

