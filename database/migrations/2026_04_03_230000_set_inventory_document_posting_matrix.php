<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('inventory_document_type_configs')) {
            return;
        }

        $now = now();
        $matrix = [
            'cash_purchase' => [
                'name' => 'Cash Purchase',
                'prefix' => 'CP',
                'auto_post' => false,
                'approval_required' => true,
                'accounting_enabled' => true,
            ],
            'purchase_return' => [
                'name' => 'Purchase Return',
                'prefix' => 'PRTN',
                'auto_post' => false,
                'approval_required' => true,
                'accounting_enabled' => true,
            ],
            'opening_balance' => [
                'name' => 'Opening Balance',
                'prefix' => 'OB',
                'auto_post' => true,
                'approval_required' => false,
                'accounting_enabled' => true,
            ],
            'stock_adjustment' => [
                'name' => 'Stock Adjustment',
                'prefix' => 'SADJ',
                'auto_post' => false,
                'approval_required' => true,
                'accounting_enabled' => false,
            ],
        ];

        foreach ($matrix as $code => $config) {
            DB::table('inventory_document_type_configs')->updateOrInsert(
                ['code' => $code],
                [
                    'name' => $config['name'],
                    'prefix' => $config['prefix'],
                    'sequence' => 0,
                    'auto_post' => $config['auto_post'],
                    'approval_required' => $config['approval_required'],
                    'accounting_enabled' => $config['accounting_enabled'],
                    'is_active' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }
    }

    public function down(): void
    {
        // Intentionally no-op to avoid deleting runtime config choices.
    }
};
