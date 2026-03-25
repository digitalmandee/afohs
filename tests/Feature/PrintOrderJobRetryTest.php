<?php

namespace Tests\Feature;

use App\Jobs\PrintOrderJob;
use App\Models\Floor;
use App\Models\KitchenDetail;
use App\Models\Order;
use App\Models\OrderPrintLog;
use App\Models\PrinterProfile;
use App\Models\Table;
use App\Models\User;
use App\Services\Printing\PrinterConnectorFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PrintOrderJobRetryTest extends TestCase
{
    use RefreshDatabase;

    public function test_failed_network_send_stays_queued_and_requeues_itself(): void
    {
        Queue::fake();

        $cashier = User::factory()->create();
        $kitchen = User::factory()->create(['name' => 'Hot Kitchen']);
        $floor = Floor::query()->create(['name' => 'Main', 'area' => 'Ground']);
        $table = Table::query()->create([
            'floor_id' => $floor->id,
            'table_no' => 'T-1',
            'capacity' => '4',
        ]);

        $profile = PrinterProfile::query()->create([
            'tenant_id' => 1,
            'name' => 'Kitchen Printer',
            'printer_ip' => '192.168.1.55',
            'printer_port' => 9100,
            'is_active' => true,
        ]);

        KitchenDetail::query()->create([
            'kitchen_id' => $kitchen->id,
            'printer_profile_id' => $profile->id,
            'printer_ip' => $profile->printer_ip,
            'printer_port' => $profile->printer_port,
            'printer_source' => 'network_scan',
        ]);

        $order = Order::unguarded(function () use ($cashier, $table) {
            return Order::query()->create([
                'cashier_id' => $cashier->id,
                'table_id' => $table->id,
                'order_type' => 'dineIn',
                'person_count' => 2,
                'amount' => 0,
                'status' => 'pending',
                'tenant_id' => 1,
            ]);
        });

        $log = OrderPrintLog::query()->create([
            'batch_id' => 'batch-1',
            'order_id' => $order->id,
            'restaurant_id' => 1,
            'kitchen_id' => $kitchen->id,
            'printer_profile_id' => $profile->id,
            'document_type' => 'kot',
            'status' => 'queued',
            'queue_name' => 'printing',
            'printer_ip' => $profile->printer_ip,
            'printer_port' => $profile->printer_port,
            'attempt' => 1,
        ]);

        app()->instance(PrinterConnectorFactory::class, new class extends PrinterConnectorFactory
        {
            public function create(array $target): object
            {
                throw new \RuntimeException('Printer offline');
            }
        });

        $job = new PrintOrderJob(
            orderId: $order->id,
            restaurantId: 1,
            kitchenId: $kitchen->id,
            items: [['name' => 'Burger', 'quantity' => 1]],
            printLogId: $log->id,
            requestId: 'req-1'
        );

        $job->handle();

        $log->refresh();

        $this->assertSame('queued', $log->status);
        $this->assertSame('Printer offline', $log->error);
        $this->assertNotNull($log->last_attempt_at);

        Queue::assertPushed(PrintOrderJob::class, function (PrintOrderJob $queuedJob) use ($order, $kitchen, $log) {
            return $queuedJob->orderId === $order->id
                && $queuedJob->restaurantId === 1
                && $queuedJob->kitchenId === $kitchen->id
                && $queuedJob->printLogId === $log->id;
        });
    }
}
