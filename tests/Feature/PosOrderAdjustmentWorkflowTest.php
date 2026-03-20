<?php

namespace Tests\Feature;

use App\Http\Controllers\OrderController;
use App\Models\Category;
use App\Models\Customer;
use App\Models\FinancialInvoice;
use App\Models\FinancialReceipt;
use App\Models\InventoryTransaction;
use App\Models\Ingredient;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PosShift;
use App\Models\Product;
use App\Models\RestaurantWarehouseAssignment;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Models\User;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Services\Inventory\InventoryMovementService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Session;
use Tests\TestCase;

class PosOrderAdjustmentWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private int $tenantId = 101;

    public function test_partial_item_cancel_with_return_restores_finished_and_recipe_inventory(): void
    {
        $actor = $this->bootstrapActor();
        [$warehouse, $location] = $this->createWarehouseContext();
        [$menuProduct, $rawProduct] = $this->createRecipeDrivenMenuProduct();
        $order = $this->createOrder($actor, ['status' => 'in_progress']);
        $orderItem = $this->createOrderItem($order, $menuProduct, 3);

        $this->seedInventoryLedger($order, $warehouse, $location, $menuProduct, 3, $rawProduct, 6);

        $request = $this->makeRequest('POST', [
            'updated_items' => [[
                'id' => 'update-' . $orderItem->id,
                'status' => 'pending',
                'order_item' => $this->buildOrderItemPayload($menuProduct, 2),
            ]],
            'new_items' => [[
                'id' => 'new',
                'status' => 'cancelled',
                'adjustment_type' => 'return',
                'cancelType' => 'return',
                'remark' => 'GUEST MIND CHANGE',
                'order_item' => $this->buildOrderItemPayload($menuProduct, 1),
            ]],
            'status' => 'in_progress',
        ]);

        $response = app(OrderController::class)->update($request, $order->id);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertSame(8.0, (float) Product::findOrFail($menuProduct->id)->current_stock);
        $this->assertSame(16.0, (float) Product::findOrFail($rawProduct->id)->current_stock);
        $this->assertDatabaseHas('inventory_transactions', [
            'product_id' => $menuProduct->id,
            'reference_type' => Order::class,
            'reference_id' => $order->id,
            'type' => 'return_in',
            'qty_in' => 1,
        ]);
        $this->assertDatabaseHas('inventory_transactions', [
            'product_id' => $rawProduct->id,
            'reference_type' => Order::class,
            'reference_id' => $order->id,
            'type' => 'return_in',
            'qty_in' => 2,
        ]);
    }

    public function test_partial_item_cancel_with_void_keeps_inventory_consumed(): void
    {
        $actor = $this->bootstrapActor();
        [$warehouse, $location] = $this->createWarehouseContext();
        $menuProduct = $this->createMenuProduct();
        $order = $this->createOrder($actor, ['status' => 'in_progress']);
        $orderItem = $this->createOrderItem($order, $menuProduct, 3);

        $this->seedInventoryLedger($order, $warehouse, $location, $menuProduct, 3);
        $beforeCount = InventoryTransaction::count();

        $request = $this->makeRequest('POST', [
            'updated_items' => [[
                'id' => 'update-' . $orderItem->id,
                'status' => 'pending',
                'order_item' => $this->buildOrderItemPayload($menuProduct, 2),
            ]],
            'new_items' => [[
                'id' => 'new',
                'status' => 'cancelled',
                'adjustment_type' => 'void',
                'cancelType' => 'void',
                'remark' => 'WRONG PUNCHING',
                'order_item' => $this->buildOrderItemPayload($menuProduct, 1),
            ]],
            'status' => 'in_progress',
        ]);

        app(OrderController::class)->update($request, $order->id);

        $this->assertSame(7.0, (float) Product::findOrFail($menuProduct->id)->current_stock);
        $this->assertSame($beforeCount, InventoryTransaction::count());
    }

    public function test_restore_of_cancelled_return_item_reconsumes_inventory(): void
    {
        $actor = $this->bootstrapActor();
        [$warehouse, $location] = $this->createWarehouseContext();
        $menuProduct = $this->createMenuProduct();
        $order = $this->createOrder($actor, ['status' => 'in_progress']);
        $activeItem = $this->createOrderItem($order, $menuProduct, 2);
        $cancelledItem = $this->createOrderItem($order, $menuProduct, 1, [
            'status' => 'cancelled',
            'cancelType' => 'return',
            'remark' => 'CANCELLED BY CUSTOMER',
        ]);

        $this->seedInventoryLedger($order, $warehouse, $location, $menuProduct, 2);

        $request = $this->makeRequest('POST', [
            'updated_items' => [
                [
                    'id' => 'update-' . $activeItem->id,
                    'status' => 'pending',
                    'order_item' => $this->buildOrderItemPayload($menuProduct, 2),
                ],
                [
                    'id' => 'update-' . $cancelledItem->id,
                    'status' => 'pending',
                    'order_item' => $this->buildOrderItemPayload($menuProduct, 1),
                ],
            ],
            'new_items' => [],
            'status' => 'in_progress',
        ]);

        app(OrderController::class)->update($request, $order->id);

        $this->assertSame(7.0, (float) Product::findOrFail($menuProduct->id)->current_stock);
        $this->assertDatabaseHas('inventory_transactions', [
            'product_id' => $menuProduct->id,
            'reference_type' => Order::class,
            'reference_id' => $order->id,
            'type' => 'sale',
            'qty_out' => 1,
            'reason' => 'POS order adjustment consumption',
        ]);
    }

    public function test_full_order_cancel_before_payment_with_return_restores_inventory_and_cancels_invoice(): void
    {
        $actor = $this->bootstrapActor();
        [$warehouse, $location] = $this->createWarehouseContext();
        $menuProduct = $this->createMenuProduct();
        $customer = $this->createCustomer();
        $order = $this->createOrder($actor, ['status' => 'completed', 'payment_status' => 'awaiting', 'customer_id' => $customer->id]);
        $this->createOrderItem($order, $menuProduct, 2);
        $invoice = $this->createInvoiceForOrder($order, ['status' => 'unpaid']);

        $this->seedInventoryLedger($order, $warehouse, $location, $menuProduct, 2);

        $request = $this->makeRequest('POST', [
            'status' => 'cancelled',
            'adjustment_type' => 'return',
            'adjustment_scope' => 'order',
            'remark' => 'CANCELLED BY CUSTOMER',
        ]);

        app(OrderController::class)->update($request, $order->id);

        $order->refresh();
        $invoice->refresh();
        $this->assertSame('cancelled', $order->status);
        $this->assertSame('return', $order->cancelType);
        $this->assertSame('cancelled', $invoice->status);
        $this->assertSame(10.0, (float) Product::findOrFail($menuProduct->id)->current_stock);
    }

    public function test_full_order_cancel_with_void_does_not_restore_inventory_and_voids_invoice(): void
    {
        $actor = $this->bootstrapActor();
        [$warehouse, $location] = $this->createWarehouseContext();
        $menuProduct = $this->createMenuProduct();
        $customer = $this->createCustomer();
        $order = $this->createOrder($actor, ['status' => 'completed', 'payment_status' => 'awaiting', 'customer_id' => $customer->id]);
        $this->createOrderItem($order, $menuProduct, 2);
        $invoice = $this->createInvoiceForOrder($order, ['status' => 'unpaid']);

        $this->seedInventoryLedger($order, $warehouse, $location, $menuProduct, 2);
        $beforeCount = InventoryTransaction::count();

        $request = $this->makeRequest('POST', [
            'status' => 'cancelled',
            'adjustment_type' => 'void',
            'adjustment_scope' => 'order',
            'remark' => 'WRONG PUNCHING',
        ]);

        app(OrderController::class)->update($request, $order->id);

        $invoice->refresh();
        $this->assertSame('void', $invoice->status);
        $this->assertSame(8.0, (float) Product::findOrFail($menuProduct->id)->current_stock);
        $this->assertSame($beforeCount, InventoryTransaction::count());
    }

    public function test_paid_order_cancel_is_rejected_but_paid_order_refund_with_receipt_link_succeeds(): void
    {
        $actor = $this->bootstrapActor();
        [$warehouse, $location] = $this->createWarehouseContext();
        $menuProduct = $this->createMenuProduct();
        $customer = $this->createCustomer();
        $order = $this->createOrder($actor, ['status' => 'completed', 'payment_status' => 'paid', 'customer_id' => $customer->id]);
        $this->createOrderItem($order, $menuProduct, 2);
        $invoice = $this->createInvoiceForOrder($order, [
            'status' => 'paid',
            'paid_amount' => 40,
            'customer_id' => $customer->id,
        ]);
        $this->createReceiptLink($invoice, $customer, 40);

        $this->seedInventoryLedger($order, $warehouse, $location, $menuProduct, 2);

        $cancelRequest = $this->makeRequest('POST', [
            'status' => 'cancelled',
            'adjustment_type' => 'return',
            'adjustment_scope' => 'order',
        ], true);

        $cancelResponse = app(OrderController::class)->update($cancelRequest, $order->id);

        $this->assertSame(422, $cancelResponse->getStatusCode());
        $cancelPayload = $cancelResponse->getData(true);
        $this->assertSame('PAID_ORDER_CANCEL_FORBIDDEN', $cancelPayload['error_code']);

        $refundRequest = $this->makeRequest('POST', [
            'status' => 'refund',
            'adjustment_type' => 'refund',
            'adjustment_scope' => 'order',
        ]);

        app(OrderController::class)->update($refundRequest, $order->id);

        $order->refresh();
        $invoice->refresh();
        $this->assertSame('refund', $order->status);
        $this->assertSame('refunded', $order->payment_status);
        $this->assertSame('refunded', $invoice->status);
        $this->assertSame(0.0, (float) $invoice->paid_amount);
        $this->assertDatabaseHas('transactions', [
            'invoice_id' => $invoice->id,
            'type' => 'debit',
            'amount' => 40,
            'description' => 'Refund processed for POS Order #' . $order->id,
        ]);
        $this->assertSame(8.0, (float) Product::findOrFail($menuProduct->id)->current_stock);
    }

    public function test_refund_without_receipt_link_fails_with_explicit_error(): void
    {
        $actor = $this->bootstrapActor();
        [$warehouse, $location] = $this->createWarehouseContext();
        $menuProduct = $this->createMenuProduct();
        $customer = $this->createCustomer();
        $order = $this->createOrder($actor, ['status' => 'completed', 'payment_status' => 'paid', 'customer_id' => $customer->id]);
        $this->createOrderItem($order, $menuProduct, 1);
        $invoice = $this->createInvoiceForOrder($order, [
            'status' => 'paid',
            'paid_amount' => 20,
            'customer_id' => $customer->id,
        ]);

        $this->seedInventoryLedger($order, $warehouse, $location, $menuProduct, 1);

        $request = $this->makeRequest('POST', [
            'status' => 'refund',
            'adjustment_type' => 'refund',
            'adjustment_scope' => 'order',
        ]);

        $response = app(OrderController::class)->update($request, $order->id);

        $this->assertInstanceOf(RedirectResponse::class, $response);
        $this->assertSame(
            'Refund cannot be processed because no valid invoice receipt linkage was found.',
            $response->getSession()->get('errors')->getBag('default')->first('error')
        );
        $invoice->refresh();
        $this->assertSame('paid', $invoice->status);
    }

    private function bootstrapActor(): User
    {
        DB::table('tenants')->insert([
            'id' => $this->tenantId,
            'name' => 'Restaurant A',
            'status' => 'active',
            'data' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $user = User::factory()->create([
            'tenant_id' => (string) $this->tenantId,
            'email' => 'pos-' . uniqid() . '@example.com',
        ]);

        DB::table('user_tenant_access')->insert([
            'user_id' => $user->id,
            'tenant_id' => (string) $this->tenantId,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        PosShift::create([
            'user_id' => $user->id,
            'tenant_id' => (string) $this->tenantId,
            'start_date' => now()->toDateString(),
            'start_time' => now(),
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user, 'tenant');

        return $user;
    }

    private function createWarehouseContext(): array
    {
        $warehouse = Warehouse::create([
            'code' => 'WH-' . uniqid(),
            'name' => 'Sellable Warehouse',
            'status' => 'active',
            'all_restaurants' => false,
        ]);

        $location = WarehouseLocation::create([
            'warehouse_id' => $warehouse->id,
            'code' => 'LOC-' . uniqid(),
            'name' => 'POS Shelf',
            'status' => 'active',
            'is_primary' => true,
        ]);

        RestaurantWarehouseAssignment::create([
            'restaurant_id' => $this->tenantId,
            'warehouse_id' => $warehouse->id,
            'warehouse_location_id' => $location->id,
            'role' => 'primary_issue_source',
            'is_primary' => true,
            'is_active' => true,
        ]);

        return [$warehouse, $location];
    }

    private function createMenuProduct(array $overrides = []): Product
    {
        $category = Category::create([
            'name' => 'Menu',
            'status' => 'active',
            'tenant_id' => $this->tenantId,
        ]);

        return Product::create(array_merge([
            'name' => 'Burger',
            'category_id' => $category->id,
            'base_price' => 20,
            'cost_of_goods_sold' => 10,
            'current_stock' => 0,
            'minimal_stock' => 0,
            'available_order_types' => ['dineIn'],
            'is_salable' => true,
            'is_purchasable' => false,
            'item_type' => 'finished_product',
            'status' => 'active',
            'manage_stock' => true,
            'tenant_id' => $this->tenantId,
        ], $overrides));
    }

    private function createRecipeDrivenMenuProduct(): array
    {
        $rawCategory = Category::create([
            'name' => 'Raw',
            'status' => 'active',
            'tenant_id' => $this->tenantId,
        ]);

        $rawProduct = Product::create([
            'name' => 'Patty',
            'category_id' => $rawCategory->id,
            'base_price' => 5,
            'cost_of_goods_sold' => 2,
            'current_stock' => 0,
            'minimal_stock' => 0,
            'available_order_types' => ['dineIn'],
            'is_salable' => false,
            'is_purchasable' => true,
            'item_type' => 'raw_material',
            'status' => 'active',
            'manage_stock' => true,
            'tenant_id' => $this->tenantId,
        ]);

        $menuProduct = $this->createMenuProduct([
            'name' => 'Burger Meal',
            'cost_of_goods_sold' => 10,
        ]);

        $ingredient = Ingredient::create([
            'name' => 'Patty Ingredient',
            'total_quantity' => 0,
            'used_quantity' => 0,
            'inventory_product_id' => $rawProduct->id,
            'remaining_quantity' => 0,
            'status' => 'active',
        ]);

        $menuProduct->ingredients()->attach($ingredient->id, [
            'quantity_used' => 2,
            'cost' => 0,
        ]);

        return [$menuProduct->fresh('ingredients.inventoryProduct'), $rawProduct];
    }

    private function createCustomer(): Customer
    {
        return Customer::create([
            'customer_no' => 'C-' . uniqid(),
            'name' => 'Walk In Customer',
        ]);
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
            'status' => 'in_progress',
        ], $overrides));
    }

    private function createOrderItem(Order $order, Product $product, int $quantity, array $overrides = []): OrderItem
    {
        return OrderItem::create(array_merge([
            'order_id' => $order->id,
            'tenant_id' => $order->tenant_id,
            'order_item' => $this->buildOrderItemPayload($product, $quantity),
            'status' => 'pending',
        ], $overrides));
    }

    private function buildOrderItemPayload(Product $product, int $quantity): array
    {
        $price = (float) ($product->base_price ?? 0);

        return [
            'id' => $product->id,
            'product_id' => $product->id,
            'name' => $product->name,
            'quantity' => $quantity,
            'price' => $price,
            'total_price' => $price * $quantity,
            'discount_amount' => 0,
            'is_taxable' => false,
            'variants' => [],
        ];
    }

    private function createInvoiceForOrder(Order $order, array $overrides = []): FinancialInvoice
    {
        return FinancialInvoice::create(array_merge([
            'invoice_no' => (string) random_int(1000, 999999),
            'invoice_type' => 'food_order',
            'amount' => (int) $order->amount,
            'total_price' => (int) $order->total_price,
            'issue_date' => now()->toDateString(),
            'status' => 'unpaid',
            'data' => ['order_id' => $order->id],
            'invoiceable_id' => $order->id,
            'invoiceable_type' => Order::class,
        ], $overrides));
    }

    private function createReceiptLink(FinancialInvoice $invoice, Customer $customer, float $amount): void
    {
        $receipt = FinancialReceipt::create([
            'receipt_no' => 'R-' . uniqid(),
            'payer_type' => Customer::class,
            'payer_id' => $customer->id,
            'amount' => $amount,
            'payment_method' => 'cash',
            'receipt_date' => now()->toDateString(),
        ]);

        TransactionRelation::create([
            'invoice_id' => $invoice->id,
            'receipt_id' => $receipt->id,
            'amount' => $amount,
        ]);
    }

    private function seedInventoryLedger(
        Order $order,
        Warehouse $warehouse,
        WarehouseLocation $location,
        Product $finishedProduct,
        float $finishedConsumedQty,
        ?Product $rawProduct = null,
        float $rawConsumedQty = 0,
    ): void {
        $service = app(InventoryMovementService::class);
        $service->createOpeningBalance([
            'warehouse_id' => $warehouse->id,
            'warehouse_location_id' => $location->id,
            'product_id' => $finishedProduct->id,
            'transaction_date' => now()->toDateString(),
            'quantity' => 10,
            'unit_cost' => (float) ($finishedProduct->cost_of_goods_sold ?? 1),
        ]);

        if ($rawProduct) {
            $service->createOpeningBalance([
                'warehouse_id' => $warehouse->id,
                'warehouse_location_id' => $location->id,
                'product_id' => $rawProduct->id,
                'transaction_date' => now()->toDateString(),
                'quantity' => 20,
                'unit_cost' => (float) ($rawProduct->cost_of_goods_sold ?? 1),
            ]);
        }

        $service->record([
            'product_id' => $finishedProduct->id,
            'tenant_id' => $order->tenant_id,
            'warehouse_id' => $warehouse->id,
            'warehouse_location_id' => $location->id,
            'transaction_date' => now()->toDateString(),
            'type' => 'sale',
            'qty_in' => 0,
            'qty_out' => $finishedConsumedQty,
            'unit_cost' => (float) ($finishedProduct->cost_of_goods_sold ?? 1),
            'total_cost' => (float) ($finishedProduct->cost_of_goods_sold ?? 1) * $finishedConsumedQty,
            'reference_type' => Order::class,
            'reference_id' => $order->id,
            'reason' => 'Seed order sale',
            'status' => 'posted',
            'created_by' => auth()->id(),
        ]);

        if ($rawProduct && $rawConsumedQty > 0) {
            $service->record([
                'product_id' => $rawProduct->id,
                'tenant_id' => $order->tenant_id,
                'warehouse_id' => $warehouse->id,
                'warehouse_location_id' => $location->id,
                'transaction_date' => now()->toDateString(),
                'type' => 'sale',
                'qty_in' => 0,
                'qty_out' => $rawConsumedQty,
                'unit_cost' => (float) ($rawProduct->cost_of_goods_sold ?? 1),
                'total_cost' => (float) ($rawProduct->cost_of_goods_sold ?? 1) * $rawConsumedQty,
                'reference_type' => Order::class,
                'reference_id' => $order->id,
                'reason' => 'Seed recipe sale',
                'status' => 'posted',
                'created_by' => auth()->id(),
            ]);
        }
    }

    private function makeRequest(string $method, array $payload = [], bool $json = false): Request
    {
        $server = [
            'HTTP_REFERER' => '/tests',
        ];

        if ($json) {
            $server['HTTP_ACCEPT'] = 'application/json';
        }

        $request = Request::create('/tests', $method, $payload, [], [], $server);
        $session = app('session')->driver();
        $session->start();
        $session->put('active_restaurant_id', $this->tenantId);
        $request->setLaravelSession($session);
        $request->attributes->set('request_id', 'test-request-id');
        $request->setUserResolver(fn () => auth()->user());
        Session::setDefaultDriver(config('session.driver'));

        return $request;
    }
}
