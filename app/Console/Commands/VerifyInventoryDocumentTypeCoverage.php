<?php

namespace App\Console\Commands;

use App\Models\InventoryDocumentTypeConfig;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VerifyInventoryDocumentTypeCoverage extends Command
{
    protected $signature = 'inventory:verify-document-types';

    protected $description = 'Verify inventory_documents.type enum includes active mapped document type configs.';

    private const MAPPED_CODES = [
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
        'stock_audit',
    ];

    public function handle(): int
    {
        if (!Schema::hasTable('inventory_document_type_configs')) {
            $this->error('Table inventory_document_type_configs is missing. Run migrations first.');
            return self::FAILURE;
        }

        $column = DB::selectOne("SHOW COLUMNS FROM inventory_documents WHERE Field = 'type'");
        $typeDef = (string) ($column->Type ?? '');

        if (!preg_match('/^enum\((.*)\)$/i', $typeDef, $matches)) {
            $this->error("inventory_documents.type is not an enum. Found: {$typeDef}");
            return self::FAILURE;
        }

        $enumValues = collect(explode(',', $matches[1]))
            ->map(fn ($value) => trim($value, " '\""))
            ->filter()
            ->values()
            ->all();

        $expected = InventoryDocumentTypeConfig::query()
            ->where('is_active', true)
            ->whereIn('code', self::MAPPED_CODES)
            ->pluck('code')
            ->values()
            ->all();

        $missing = array_values(array_diff($expected, $enumValues));
        if (!empty($missing)) {
            $this->error('Enum coverage failed. Missing values: ' . implode(', ', $missing));
            return self::FAILURE;
        }

        $this->info('Enum coverage passed for inventory_documents.type.');
        $this->line('Checked values: ' . implode(', ', $expected));
        return self::SUCCESS;
    }
}
