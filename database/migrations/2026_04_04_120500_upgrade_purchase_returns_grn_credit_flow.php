<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('purchase_returns')) {
            Schema::table('purchase_returns', function (Blueprint $table) {
                if (!Schema::hasColumn('purchase_returns', 'source_type')) {
                    $table->string('source_type', 30)->default('grn')->after('return_no');
                }
                if (!Schema::hasColumn('purchase_returns', 'source_id')) {
                    $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
                    $table->index(['source_type', 'source_id'], 'purchase_returns_source_lookup');
                }
                if (!Schema::hasColumn('purchase_returns', 'vendor_credit_amount')) {
                    $table->decimal('vendor_credit_amount', 15, 2)->default(0)->after('grand_total');
                }
                if (!Schema::hasColumn('purchase_returns', 'credit_status')) {
                    $table->string('credit_status', 30)->default('none')->after('vendor_credit_amount');
                }
            });
        }

        if (Schema::hasTable('vendor_bills') && !Schema::hasColumn('vendor_bills', 'return_applied_amount')) {
            Schema::table('vendor_bills', function (Blueprint $table) {
                $table->decimal('return_applied_amount', 15, 2)->default(0)->after('advance_applied_amount');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('purchase_returns')) {
            Schema::table('purchase_returns', function (Blueprint $table) {
                if (Schema::hasColumn('purchase_returns', 'credit_status')) {
                    $table->dropColumn('credit_status');
                }
                if (Schema::hasColumn('purchase_returns', 'vendor_credit_amount')) {
                    $table->dropColumn('vendor_credit_amount');
                }
                if (Schema::hasColumn('purchase_returns', 'source_id')) {
                    $table->dropIndex('purchase_returns_source_lookup');
                    $table->dropColumn('source_id');
                }
                if (Schema::hasColumn('purchase_returns', 'source_type')) {
                    $table->dropColumn('source_type');
                }
            });
        }

        if (Schema::hasTable('vendor_bills') && Schema::hasColumn('vendor_bills', 'return_applied_amount')) {
            Schema::table('vendor_bills', function (Blueprint $table) {
                $table->dropColumn('return_applied_amount');
            });
        }
    }
};
