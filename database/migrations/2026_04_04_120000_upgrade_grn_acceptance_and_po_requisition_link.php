<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('purchase_orders', function (Blueprint $table) {
            if (!Schema::hasColumn('purchase_orders', 'purchase_requisition_id')) {
                $table->foreignId('purchase_requisition_id')
                    ->nullable()
                    ->after('warehouse_id')
                    ->constrained('purchase_requisitions')
                    ->nullOnDelete();
            }
        });

        Schema::table('goods_receipts', function (Blueprint $table) {
            if (!Schema::hasColumn('goods_receipts', 'verifier_user_id')) {
                $table->foreignId('verifier_user_id')
                    ->nullable()
                    ->after('created_by')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (!Schema::hasColumn('goods_receipts', 'accepted_by')) {
                $table->foreignId('accepted_by')
                    ->nullable()
                    ->after('verifier_user_id')
                    ->constrained('users')
                    ->nullOnDelete();
            }
            if (!Schema::hasColumn('goods_receipts', 'submitted_at')) {
                $table->timestamp('submitted_at')->nullable()->after('remarks');
            }
            if (!Schema::hasColumn('goods_receipts', 'accepted_at')) {
                $table->timestamp('accepted_at')->nullable()->after('submitted_at');
            }
        });

        DB::statement("
            ALTER TABLE goods_receipts
            MODIFY COLUMN status ENUM('draft','pending_acceptance','accepted','received','cancelled') NOT NULL DEFAULT 'draft'
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE goods_receipts
            MODIFY COLUMN status ENUM('draft','received','cancelled') NOT NULL DEFAULT 'draft'
        ");

        Schema::table('goods_receipts', function (Blueprint $table) {
            if (Schema::hasColumn('goods_receipts', 'accepted_at')) {
                $table->dropColumn('accepted_at');
            }
            if (Schema::hasColumn('goods_receipts', 'submitted_at')) {
                $table->dropColumn('submitted_at');
            }
            if (Schema::hasColumn('goods_receipts', 'accepted_by')) {
                $table->dropConstrainedForeignId('accepted_by');
            }
            if (Schema::hasColumn('goods_receipts', 'verifier_user_id')) {
                $table->dropConstrainedForeignId('verifier_user_id');
            }
        });

        Schema::table('purchase_orders', function (Blueprint $table) {
            if (Schema::hasColumn('purchase_orders', 'purchase_requisition_id')) {
                $table->dropConstrainedForeignId('purchase_requisition_id');
            }
        });
    }
};

