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
        'opening_balance',
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

    private const ADAPTER_SUPPORTED_ACCOUNTING_CODES = [
        'cash_purchase',
        'purchase_return',
        'opening_balance',
        'stock_adjustment',
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

        $this->newLine();
        $this->info('Posting Matrix');

        $matrixCodes = ['cash_purchase', 'purchase_return', 'opening_balance', 'stock_adjustment'];
        $configs = InventoryDocumentTypeConfig::query()
            ->whereIn('code', $matrixCodes)
            ->get()
            ->keyBy('code');

        $rows = [];
        foreach ($matrixCodes as $code) {
            $config = $configs->get($code);
            $adapterSupported = in_array($code, self::ADAPTER_SUPPORTED_ACCOUNTING_CODES, true);
            $rows[] = [
                'code' => $code,
                'auto_post' => $config?->auto_post ? 'yes' : 'no',
                'approval_required' => $config?->approval_required ? 'yes' : 'no',
                'accounting_enabled' => $config?->accounting_enabled ? 'yes' : 'no',
                'adapter_supported' => $adapterSupported ? 'yes' : 'no',
            ];
        }

        $this->table(
            ['code', 'auto_post', 'approval_required', 'accounting_enabled', 'adapter_supported'],
            $rows
        );

        $unsupportedEnabled = InventoryDocumentTypeConfig::query()
            ->where('is_active', true)
            ->where('accounting_enabled', true)
            ->pluck('code')
            ->filter(fn ($code) => !in_array((string) $code, self::ADAPTER_SUPPORTED_ACCOUNTING_CODES, true))
            ->values()
            ->all();

        if (!empty($unsupportedEnabled)) {
            $this->error(
                'Accounting is enabled for unsupported inventory document type(s): '
                . implode(', ', $unsupportedEnabled)
                . '. Disable accounting_enabled or add adapter mappings.'
            );
            return self::FAILURE;
        }

        $this->info('Enum coverage passed for inventory_documents.type.');
        $this->line('Checked values: ' . implode(', ', $expected));
        return self::SUCCESS;
    }
}
