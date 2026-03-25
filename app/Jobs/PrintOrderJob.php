<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\OrderPrintLog;
use App\Services\Printing\KitchenPrinterResolver;
use App\Services\Printing\PrinterConnectorFactory;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\Printer;

class PrintOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 0;
    public array $backoff = [60];

    public function __construct(
        public int $orderId,
        public ?int $restaurantId,
        public int $kitchenId,
        public array $items,
        public int $printLogId,
        public ?string $requestId = null
    ) {
    }

    public function handle()
    {
        $order = Order::query()->with('table:id,table_no')->find($this->orderId);
        $printerTarget = app(KitchenPrinterResolver::class)->resolveKitchenPrinter($this->kitchenId, $this->restaurantId);
        $logRow = OrderPrintLog::find($this->printLogId);

        if (!$order || !$printerTarget) {
            $error = !$order ? 'order_not_found' : 'missing_printer_config';
            if ($logRow) {
                $logRow->update([
                    'status' => 'failed',
                    'error' => $error,
                    'attempt' => (int) $this->attempts(),
                    'last_attempt_at' => now(),
                ]);
            }

            Log::channel('printing')->error('pos.print.job.failed', [
                'event' => 'pos.print.job.failed',
                'request_id' => $this->requestId,
                'order_id' => $this->orderId,
                'kitchen_id' => $this->kitchenId,
                'print_log_id' => $this->printLogId,
                'status' => 'failed',
                'error' => $error,
                'attempt' => $this->attempts(),
            ]);
            return;
        }

        $source = (string) ($printerTarget['printer_source'] ?? 'network_scan');
        $printerProfileId = $printerTarget['printer_profile_id'] ?? null;
        $ip = $printerTarget['printer_ip'] ?? null;
        $port = $printerTarget['printer_port'] ?? null;
        $printerName = $printerTarget['printer_name'] ?? null;
        $printerConnector = $printerTarget['printer_connector'] ?? null;
        $targetName = $printerTarget['target_name'] ?? null;

        try {
            $connector = app(PrinterConnectorFactory::class)->create($printerTarget);
            $printer = new Printer($connector);

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("KITCHEN ORDER TICKET\n");
            $printer->text("Kitchen: {$targetName}\n");
            $printer->text("Order #: {$order->id}\n");
            $printer->text("Table: " . ($order->table?->table_no ?: 'N/A') . "\n");
            $printer->text(now()->format('Y-m-d H:i:s') . "\n");
            if ($source === 'system_printer') {
                $printer->text("Printer: {$printerName}\n");
            }
            $printer->text("--------------------------------\n");

            foreach ($this->items as $item) {
                $name = (string) ($item['name'] ?? 'Item');
                $qty = (float) ($item['quantity'] ?? 1);
                $printer->text("{$name} x {$qty}\n");
            }

            $printer->feed(1);
            $printer->cut();
            $printer->close();

            Cache::put('printing:worker_heartbeat', now()->toIso8601String(), now()->addMinutes(10));

            if ($logRow) {
                $logRow->update([
                    'status' => 'sent',
                    'printed_at' => now(),
                    'last_attempt_at' => now(),
                    'error' => null,
                    'attempt' => (int) $this->attempts(),
                    'printer_profile_id' => $printerProfileId,
                ]);
            }

            Log::channel('printing')->info('pos.print.job.sent', [
                'event' => 'pos.print.job.sent',
                'request_id' => $this->requestId,
                'order_id' => $this->orderId,
                'kitchen_id' => $this->kitchenId,
                'printer_source' => $source,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'printer_name' => $printerName,
                'printer_connector' => $printerConnector,
                'print_log_id' => $this->printLogId,
                'status' => 'sent',
                'attempt' => $this->attempts(),
            ]);
        } catch (\Throwable $th) {
            if ($logRow) {
                $logRow->update([
                    'status' => 'queued',
                    'error' => $th->getMessage(),
                    'attempt' => (int) $this->attempts(),
                    'last_attempt_at' => now(),
                    'printer_profile_id' => $printerProfileId,
                ]);
            }

            Log::channel('printing')->error('pos.print.job.failed', [
                'event' => 'pos.print.job.failed',
                'request_id' => $this->requestId,
                'order_id' => $this->orderId,
                'kitchen_id' => $this->kitchenId,
                'printer_source' => $source,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'printer_name' => $printerName,
                'printer_connector' => $printerConnector,
                'print_log_id' => $this->printLogId,
                'status' => 'failed',
                'error' => $th->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            static::dispatch(
                orderId: $this->orderId,
                restaurantId: $this->restaurantId,
                kitchenId: $this->kitchenId,
                items: $this->items,
                printLogId: $this->printLogId,
                requestId: $this->requestId
            )
                ->delay(now()->addMinute())
                ->onQueue('printing');
        }
    }
}
