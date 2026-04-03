<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE inventory_documents
            MODIFY COLUMN type ENUM(
                'opening_balance',
                'adjustment',
                'transfer',
                'purchase_requisition',
                'cash_purchase',
                'purchase_return',
                'delivery_note',
                'store_issue_note',
                'warehouse_issue_note',
                'material_issue_note',
                'material_receipt_note',
                'warehouse_transfer',
                'stock_adjustment',
                'department_transfer_note',
                'department_adjustment',
                'stock_audit'
            ) NOT NULL
        ");
    }

    public function down(): void
    {
        DB::statement("
            ALTER TABLE inventory_documents
            MODIFY COLUMN type ENUM(
                'opening_balance',
                'adjustment',
                'transfer',
                'purchase_requisition',
                'cash_purchase',
                'purchase_return',
                'delivery_note',
                'store_issue_note',
                'warehouse_issue_note',
                'material_issue_note',
                'material_receipt_note',
                'department_transfer_note',
                'department_adjustment',
                'stock_audit'
            ) NOT NULL
        ");
    }
};

