<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;

class VerifyModuleReportsIntegrity extends Command
{
    protected $signature = 'reports:verify-integrity {--limit=20 : Max duplicate rows to display}';

    protected $description = 'Verify procurement/inventory report coverage routes and duplicate-source risk on core report datasets.';

    public function handle(): int
    {
        $requiredReports = [
            'procurement' => [
                'purchase-requisitions',
                'purchase-orders',
                'goods-receipts',
                'vendor-bills',
                'vendor-payments',
                'supplier-advances',
                'purchase-returns',
                'cash-purchases',
                'delivery-notes',
                'discrepancies',
                'payment-run',
            ],
            'inventory' => [
                'documents',
                'valuation',
                'operations',
                'stock-audits',
            ],
        ];

        $missingRoutes = [];
        foreach ($requiredReports as $domain => $reports) {
            foreach ($reports as $report) {
                foreach (['module-reports.index', 'module-reports.print', 'module-reports.pdf', 'module-reports.csv', 'module-reports.xlsx'] as $routeName) {
                    if (!Route::has($routeName)) {
                        $missingRoutes[] = "{$routeName} ({$domain}/{$report})";
                    }
                }
            }
        }

        if (!empty($missingRoutes)) {
            $this->error('Missing report routes detected.');
            $this->table(['Missing Route'], collect($missingRoutes)->map(fn ($r) => [$r])->all());
            return self::FAILURE;
        }

        $limit = max(1, (int) $this->option('limit'));
        $checks = [
            ['table' => 'purchase_requisitions', 'column' => 'pr_no', 'label' => 'Purchase Requisition No'],
            ['table' => 'purchase_orders', 'column' => 'po_no', 'label' => 'Purchase Order No'],
            ['table' => 'goods_receipts', 'column' => 'grn_no', 'label' => 'GRN No'],
            ['table' => 'vendor_bills', 'column' => 'bill_no', 'label' => 'Vendor Bill No'],
            ['table' => 'vendor_payments', 'column' => 'payment_no', 'label' => 'Vendor Payment No'],
            ['table' => 'supplier_advances', 'column' => 'advance_no', 'label' => 'Supplier Advance No'],
            ['table' => 'purchase_returns', 'column' => 'return_no', 'label' => 'Purchase Return No'],
            ['table' => 'cash_purchases', 'column' => 'cp_no', 'label' => 'Cash Purchase No'],
            ['table' => 'inventory_documents', 'column' => 'document_no', 'label' => 'Inventory Document No'],
            ['table' => 'stock_audits', 'column' => 'audit_no', 'label' => 'Stock Audit No'],
        ];

        $issues = collect();
        foreach ($checks as $check) {
            if (!DB::getSchemaBuilder()->hasTable($check['table'])) {
                continue;
            }

            $duplicates = DB::table($check['table'])
                ->select($check['column'], DB::raw('COUNT(*) as total'))
                ->whereNotNull($check['column'])
                ->groupBy($check['column'])
                ->having('total', '>', 1)
                ->limit($limit)
                ->get();

            if ($duplicates->isNotEmpty()) {
                foreach ($duplicates as $row) {
                    $issues->push([
                        'Table' => $check['table'],
                        'Field' => $check['label'],
                        'Value' => $row->{$check['column']},
                        'Count' => (int) $row->total,
                    ]);
                }
            }
        }

        if ($issues->isNotEmpty()) {
            $this->error('Duplicate source identifiers detected. Report integrity check failed.');
            $this->table(['Table', 'Field', 'Value', 'Count'], $issues->all());
            return self::FAILURE;
        }

        $this->info('Report integrity verification passed.');
        return self::SUCCESS;
    }
}

