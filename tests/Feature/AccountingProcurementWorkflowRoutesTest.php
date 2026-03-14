<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class AccountingProcurementWorkflowRoutesTest extends TestCase
{
    public function test_workflow_action_routes_have_expected_http_methods(): void
    {
        $expected = [
            'accounting.journals.store' => 'POST',
            'accounting.journals.submit' => 'POST',
            'accounting.journals.approve' => 'POST',
            'accounting.journals.reject' => 'POST',
            'accounting.journals.reverse' => 'POST',
            'procurement.purchase-orders.store' => 'POST',
            'procurement.purchase-orders.submit' => 'POST',
            'procurement.purchase-orders.approve' => 'POST',
            'procurement.purchase-orders.reject' => 'POST',
            'procurement.goods-receipts.store' => 'POST',
            'procurement.vendor-bills.store' => 'POST',
            'procurement.vendor-bills.submit' => 'POST',
            'procurement.vendor-bills.approve' => 'POST',
            'procurement.vendor-bills.reject' => 'POST',
            'procurement.vendor-payments.store' => 'POST',
            'procurement.vendor-payments.submit' => 'POST',
            'procurement.vendor-payments.approve' => 'POST',
            'procurement.vendor-payments.reject' => 'POST',
            'procurement.payment-run.execute' => 'POST',
            'accounting.periods.lock' => 'POST',
            'accounting.periods.reopen' => 'POST',
            'accounting.bank-reconciliation.store' => 'POST',
            'accounting.bank-reconciliation.auto-match' => 'POST',
        ];

        foreach ($expected as $routeName => $method) {
            $route = Route::getRoutes()->getByName($routeName);
            $this->assertNotNull($route, "Route '{$routeName}' is missing.");
            $this->assertContains($method, $route->methods(), "Route '{$routeName}' is not bound to {$method}.");
        }
    }

    public function test_protected_workflow_routes_redirect_guest_to_login(): void
    {
        $this->post(route('accounting.journals.store'), [])->assertRedirect(route('login'));
        $this->post(route('accounting.periods.lock', 1), [])->assertRedirect(route('login'));
        $this->post(route('accounting.bank-reconciliation.store'), [])->assertRedirect(route('login'));

        $this->post(route('procurement.purchase-orders.store'), [])->assertRedirect(route('login'));
        $this->post(route('procurement.vendor-bills.store'), [])->assertRedirect(route('login'));
        $this->post(route('procurement.vendor-payments.store'), [])->assertRedirect(route('login'));
        $this->post(route('procurement.payment-run.execute'), [])->assertRedirect(route('login'));
    }
}
