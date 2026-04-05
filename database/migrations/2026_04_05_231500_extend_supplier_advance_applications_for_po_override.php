<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('supplier_advance_applications', function (Blueprint $table) {
            if (!Schema::hasColumn('supplier_advance_applications', 'source_purchase_order_id')) {
                $table->foreignId('source_purchase_order_id')->nullable()->after('vendor_bill_id')
                    ->constrained('purchase_orders')->nullOnDelete();
            }
            if (!Schema::hasColumn('supplier_advance_applications', 'target_purchase_order_id')) {
                $table->foreignId('target_purchase_order_id')->nullable()->after('source_purchase_order_id')
                    ->constrained('purchase_orders')->nullOnDelete();
            }
            if (!Schema::hasColumn('supplier_advance_applications', 'override_po_lock')) {
                $table->boolean('override_po_lock')->default(false)->after('amount');
            }
            if (!Schema::hasColumn('supplier_advance_applications', 'override_reason')) {
                $table->text('override_reason')->nullable()->after('override_po_lock');
            }
            if (!Schema::hasColumn('supplier_advance_applications', 'overridden_by')) {
                $table->foreignId('overridden_by')->nullable()->after('override_reason')
                    ->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('supplier_advance_applications', 'overridden_at')) {
                $table->timestamp('overridden_at')->nullable()->after('overridden_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('supplier_advance_applications', function (Blueprint $table) {
            foreach ([
                'source_purchase_order_id',
                'target_purchase_order_id',
                'overridden_by',
            ] as $foreignColumn) {
                if (Schema::hasColumn('supplier_advance_applications', $foreignColumn)) {
                    $table->dropConstrainedForeignId($foreignColumn);
                }
            }

            foreach ([
                'override_po_lock',
                'override_reason',
                'overridden_at',
            ] as $column) {
                if (Schema::hasColumn('supplier_advance_applications', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};

