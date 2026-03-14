<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        // 1. Transactions: Replace trans_type_id with invoice_id
        Schema::table('transactions', function (Blueprint $table) {
            if (Schema::hasColumn('transactions', 'trans_type_id')) {
                // Drop FK first
                $table->dropForeign(['trans_type_id']);
                $table->dropColumn('trans_type_id');
            }
            if (!Schema::hasColumn('transactions', 'invoice_id')) {
                $table->unsignedBigInteger('invoice_id')->nullable()->index()->after('reference_id');
            }
        });

        // 2. Add Audit Columns to multiple tables
        $tables = [
            'financial_invoices',
            'financial_invoice_items',
            'transactions',
            'financial_receipts',
            'transaction_relations'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (!Schema::hasColumn($tableName, 'created_by')) {
                    $table->unsignedBigInteger('created_by')->nullable()->index();
                }
                if (!Schema::hasColumn($tableName, 'updated_by')) {
                    $table->unsignedBigInteger('updated_by')->nullable()->index();
                }
                if (!Schema::hasColumn($tableName, 'deleted_by')) {
                    $table->unsignedBigInteger('deleted_by')->nullable()->index();
                }
                if (!Schema::hasColumn($tableName, 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }
    }

    public function down()
    {
        // 1. Revert Transactions
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn('invoice_id');
            $table->unsignedBigInteger('trans_type_id')->nullable()->index();
        });

        // 2. Remove Audit Columns
        $tables = [
            'financial_invoices',
            'financial_invoice_items',
            'transactions',
            'financial_receipts',
            'transaction_relations'
        ];

        foreach ($tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn(['created_by', 'updated_by', 'deleted_by']);
                $table->dropSoftDeletes();
            });
        }
    }
};
