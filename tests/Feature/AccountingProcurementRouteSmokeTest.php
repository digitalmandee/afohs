<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AccountingProcurementRouteSmokeTest extends TestCase
{
    public function test_critical_accounting_and_procurement_routes_exist(): void
    {
        $routes = [
            'accounting.dashboard',
            'accounting.coa.index',
            'accounting.journals.index',
            'accounting.general-ledger',
            'accounting.receivables',
            'accounting.outstanding',
            'accounting.payables',
            'accounting.expenses',
            'accounting.bank-accounts.index',
            'accounting.bank-reconciliation.index',
            'accounting.periods.index',
            'accounting.budgets.index',
            'accounting.reports.trial-balance',
            'accounting.reports.balance-sheet',
            'accounting.reports.profit-loss',
            'accounting.reports.financial-statements',
            'accounting.reports.management-pack',
            'accounting.reports.receivables-aging',
            'accounting.reports.receivables-by-source',
            'accounting.reports.payables-aging',
            'procurement.vendors.index',
            'procurement.purchase-orders.index',
            'procurement.goods-receipts.index',
            'procurement.vendor-bills.index',
            'procurement.vendor-payments.index',
            'procurement.insights.discrepancies',
            'procurement.payment-run.index',
        ];

        foreach ($routes as $name) {
            $this->assertTrue(Route::has($name), "Route '{$name}' is missing.");
        }
    }
}
