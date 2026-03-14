<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'financial_invoices',
            'financial_invoice_items',
            'transactions',
            'financial_receipts',
            'transaction_relations',
        ];

        $targetColumns = ['created_by', 'updated_by', 'deleted_by'];

        foreach ($tables as $tableName) {
            if (!Schema::hasTable($tableName)) {
                continue;
            }

            // Get all foreign keys for the table
            // Schema::getForeignKeys returns an array of records with details about each FK
            $foreignKeys = Schema::getForeignKeys($tableName);
            $keysToDrop = [];

            foreach ($foreignKeys as $fk) {
                // Ensure it's an array or object access
                $fkData = (array) $fk;

                // $fkData['columns'] contains the local columns for the foreign key
                if (isset($fkData['columns']) && !empty(array_intersect($fkData['columns'], $targetColumns))) {
                    $keysToDrop[] = $fkData['name'];
                }
            }

            if (!empty($keysToDrop)) {
                Schema::table($tableName, function (Blueprint $table) use ($keysToDrop) {
                    foreach ($keysToDrop as $key) {
                        $table->dropForeign($key);
                    }
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'financial_invoices',
            'financial_invoice_items',
            'transactions',
            'financial_receipts',
            'transaction_relations',
        ];

        foreach ($tables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $tableBlueprint) use ($table) {
                if (Schema::hasColumn($table, 'created_by')) {
                    // Attempt to add back, utilizing a try-catch to ignore if it fails or already exists
                    // Wrap in a closure or just try executing. Migration down is best-effort here.
                    try {
                        $tableBlueprint->foreign('created_by')->references('id')->on('users')->nullOnDelete();
                    } catch (\Throwable $e) {
                    }
                }
                if (Schema::hasColumn($table, 'updated_by')) {
                    try {
                        $tableBlueprint->foreign('updated_by')->references('id')->on('users')->nullOnDelete();
                    } catch (\Throwable $e) {
                    }
                }
                if (Schema::hasColumn($table, 'deleted_by')) {
                    try {
                        $tableBlueprint->foreign('deleted_by')->references('id')->on('users')->nullOnDelete();
                    } catch (\Throwable $e) {
                    }
                }
            });
        }
    }
};
