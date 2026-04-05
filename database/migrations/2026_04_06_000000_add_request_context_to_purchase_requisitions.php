<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_requisitions', function (Blueprint $table) {
            $table->enum('request_for', ['restaurant', 'office', 'warehouse', 'other'])
                ->default('restaurant')
                ->after('pr_no');
            $table->foreignId('branch_id')->nullable()->after('tenant_id')->constrained('branches')->nullOnDelete();
            $table->foreignId('warehouse_id')->nullable()->after('branch_id')->constrained('warehouses')->nullOnDelete();
            $table->string('other_location_label')->nullable()->after('warehouse_id');

            $table->index(['request_for', 'department_id'], 'pr_request_for_department_idx');
            $table->index(['request_for', 'tenant_id', 'branch_id', 'warehouse_id'], 'pr_request_for_location_idx');
        });
    }

    public function down(): void
    {
        Schema::table('purchase_requisitions', function (Blueprint $table) {
            $table->dropIndex('pr_request_for_department_idx');
            $table->dropIndex('pr_request_for_location_idx');
            $table->dropForeign(['branch_id']);
            $table->dropForeign(['warehouse_id']);
            $table->dropColumn(['request_for', 'branch_id', 'warehouse_id', 'other_location_label']);
        });
    }
};
