<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouse_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('color', 24)->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::table('warehouses', function (Blueprint $table) {
            $table->boolean('all_restaurants')->default(true)->after('tenant_id');
            $table->foreignId('category_id')->nullable()->after('name')->constrained('warehouse_categories')->nullOnDelete();
            $table->index(['all_restaurants', 'status'], 'warehouses_all_restaurants_status_idx');
        });

        Schema::create('warehouse_restaurants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('restaurant_id')->constrained('tenants')->cascadeOnDelete();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['warehouse_id', 'restaurant_id'], 'warehouse_restaurant_unique');
            $table->index(['restaurant_id', 'is_active'], 'warehouse_restaurant_active_idx');
        });

        DB::table('warehouse_categories')->insert([
            ['name' => 'Central', 'slug' => 'central', 'color' => '#1D4ED8', 'status' => 'active', 'sort_order' => 10, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Back Store', 'slug' => 'back-store', 'color' => '#B45309', 'status' => 'active', 'sort_order' => 20, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Sellable', 'slug' => 'sellable', 'color' => '#047857', 'status' => 'active', 'sort_order' => 30, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Production', 'slug' => 'production', 'color' => '#6D28D9', 'status' => 'active', 'sort_order' => 40, 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Transit', 'slug' => 'transit', 'color' => '#0E7490', 'status' => 'active', 'sort_order' => 50, 'created_at' => now(), 'updated_at' => now()],
        ]);

        DB::table('warehouses')
            ->select(['id', 'tenant_id', 'is_global'])
            ->orderBy('id')
            ->chunkById(200, function ($warehouses) {
                foreach ($warehouses as $warehouse) {
                    DB::table('warehouses')
                        ->where('id', $warehouse->id)
                        ->update([
                            'all_restaurants' => (bool) $warehouse->is_global,
                            'updated_at' => now(),
                        ]);

                    if (!$warehouse->is_global && $warehouse->tenant_id) {
                        DB::table('warehouse_restaurants')->updateOrInsert(
                            [
                                'warehouse_id' => $warehouse->id,
                                'restaurant_id' => $warehouse->tenant_id,
                            ],
                            [
                                'is_active' => true,
                                'updated_at' => now(),
                                'created_at' => now(),
                            ]
                        );
                    }
                }
            });
    }

    public function down(): void
    {
        Schema::dropIfExists('warehouse_restaurants');

        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropIndex('warehouses_all_restaurants_status_idx');
            $table->dropForeign(['category_id']);
            $table->dropColumn(['all_restaurants', 'category_id']);
        });

        Schema::dropIfExists('warehouse_categories');
    }
};
