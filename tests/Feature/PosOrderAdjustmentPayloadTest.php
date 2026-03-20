<?php

namespace Tests\Feature;

use App\Http\Controllers\OrderController;
use App\Models\FinancialInvoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Response as InertiaResponse;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PosOrderAdjustmentPayloadTest extends TestCase
{
    use RefreshDatabase;

    private int $tenantId = 202;

    public function test_order_management_json_exposes_adjustment_metadata(): void
    {
        $user = $this->bootstrapActor();
        $cancelledOrder = $this->createOrder($user, [
            'status' => 'cancelled',
            'cancelType' => 'return',
        ]);
        $this->createOrderItem($cancelledOrder, 'Cancelled Meal', 'cancelled', 'return');
        FinancialInvoice::create([
            'invoice_no' => '1001',
            'invoice_type' => 'food_order',
            'amount' => 10,
            'total_price' => 10,
            'issue_date' => now()->toDateString(),
            'status' => 'cancelled',
            'data' => ['order_id' => $cancelledOrder->id],
            'invoiceable_id' => $cancelledOrder->id,
            'invoiceable_type' => Order::class,
        ]);

        $request = $this->makeRequest('GET', [], ['HTTP_ACCEPT' => 'application/json']);
        $response = app(OrderController::class)->orderManagement($request);
        $payload = $response->getData(true);
        $first = $payload['data'][0];

        $this->assertArrayHasKey('adjustment_type', $first);
        $this->assertArrayHasKey('adjustment_label', $first);
        $this->assertArrayHasKey('inventory_effect', $first);
        $this->assertArrayHasKey('finance_effect', $first);
    }

    public function test_order_details_json_exposes_order_and_item_adjustment_metadata(): void
    {
        $user = $this->bootstrapActor();
        $order = $this->createOrder($user, [
            'status' => 'cancelled',
            'cancelType' => 'return',
        ]);
        $this->createOrderItem($order, 'Returned Meal', 'cancelled', 'return');
        $invoice = FinancialInvoice::create([
            'invoice_no' => '1002',
            'invoice_type' => 'food_order',
            'amount' => 20,
            'total_price' => 20,
            'issue_date' => now()->toDateString(),
            'status' => 'cancelled',
            'data' => ['order_id' => $order->id],
            'invoiceable_id' => $order->id,
            'invoiceable_type' => Order::class,
        ]);

        $order->load('orderItems');
        $controller = app(OrderController::class);
        $method = new \ReflectionMethod($controller, 'attachOrderAdjustmentMetadata');
        $method->setAccessible(true);
        $payload = $method->invoke($controller, $order, $invoice)->toArray();

        $this->assertSame('return', $payload['adjustment_type']);
        $this->assertSame('Return - stock restored', $payload['adjustment_label']);
        $this->assertSame('restore', $payload['inventory_effect']);
        $this->assertSame('cancel_invoice', $payload['finance_effect']);
        $this->assertSame('return', $payload['order_items'][0]['adjustment_type']);
        $this->assertSame('Return - stock restored', $payload['order_items'][0]['adjustment_label']);
    }

    public function test_order_history_inertia_props_include_adjustment_metadata(): void
    {
        $user = $this->bootstrapActor();
        $refundedOrder = $this->createOrder($user, [
            'status' => 'refund',
            'payment_status' => 'refunded',
            'cancelType' => 'refund',
        ]);
        $this->createOrderItem($refundedOrder, 'Refunded Meal', 'pending', null);
        FinancialInvoice::create([
            'invoice_no' => '1003',
            'invoice_type' => 'food_order',
            'amount' => 30,
            'total_price' => 30,
            'issue_date' => now()->toDateString(),
            'status' => 'refunded',
            'paid_amount' => 0,
            'data' => ['order_id' => $refundedOrder->id],
            'invoiceable_id' => $refundedOrder->id,
            'invoiceable_type' => Order::class,
        ]);

        $request = $this->makeRequest('GET', [], [
            'HTTP_X_INERTIA' => 'true',
            'HTTP_X_REQUESTED_WITH' => 'XMLHttpRequest',
        ]);

        /** @var InertiaResponse $response */
        $response = app(OrderController::class)->orderHistory($request);
        $httpResponse = $response->toResponse($request);
        $page = $httpResponse->getData(true);
        $first = $page['props']['orders']['data'][0];

        $this->assertSame('refund', $first['adjustment_type']);
        $this->assertSame('Refund - payment reversed', $first['adjustment_label']);
        $this->assertSame('refund_payment', $first['finance_effect']);
    }

    private function bootstrapActor(): User
    {
        DB::connection()->getPdo()->sqliteCreateFunction('JSON_UNQUOTE', fn ($value) => $value);

        DB::table('tenants')->insert([
            'id' => $this->tenantId,
            'name' => 'Restaurant Payload',
            'status' => 'active',
            'data' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => (string) $this->tenantId,
            'email' => 'payload-' . uniqid() . '@example.com',
        ]);
        Role::findOrCreate('super-admin', 'web');
        $user->assignRole('super-admin');

        $this->actingAs($user, 'tenant');

        return $user;
    }

    private function createOrder(User $actor, array $overrides = []): Order
    {
        return Order::create(array_merge([
            'order_number' => random_int(1000, 999999),
            'user_id' => $actor->id,
            'created_by' => $actor->id,
            'tenant_id' => $this->tenantId,
            'order_type' => 'dineIn',
            'amount' => 0,
            'total_price' => 0,
            'start_date' => now()->toDateString(),
            'start_time' => now()->format('H:i:s'),
            'status' => 'completed',
        ], $overrides));
    }

    private function createOrderItem(Order $order, string $name, string $status, ?string $cancelType): OrderItem
    {
        return OrderItem::create([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'order_item' => [
                'id' => 1,
                'product_id' => 1,
                'name' => $name,
                'quantity' => 1,
                'price' => 10,
                'total_price' => 10,
                'discount_amount' => 0,
                'is_taxable' => false,
                'variants' => [],
            ],
            'status' => $status,
            'cancelType' => $cancelType,
        ]);
    }

    private function makeRequest(string $method, array $payload = [], array $server = []): Request
    {
        $request = Request::create('/tests', $method, $payload, [], [], array_merge([
            'HTTP_REFERER' => '/tests',
        ], $server));
        $session = app('session')->driver();
        $session->start();
        $session->put('active_restaurant_id', $this->tenantId);
        $request->setLaravelSession($session);
        $request->setUserResolver(fn () => auth()->user());

        return $request;
    }
}
