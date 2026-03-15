<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('restaurant_warehouse_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('restaurant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('warehouse_location_id')->nullable()->constrained('warehouse_locations')->nullOnDelete();
            $table->enum('role', ['sellable', 'back_store', 'primary_issue_source'])->default('sellable');
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['restaurant_id', 'warehouse_id', 'warehouse_location_id', 'role'],
                'restaurant_warehouse_role_unique'
            );
            $table->index(['restaurant_id', 'role', 'is_active'], 'restaurant_warehouse_role_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('restaurant_warehouse_assignments');
    }
};
