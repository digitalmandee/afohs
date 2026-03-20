<?php

namespace App\Jobs;

use App\Models\Order;
use App\Models\OrderPrintLog;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;

class PrintOrderJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public array $backoff = [5, 15, 45];

    public function __construct(
        public int $orderId,
        public int $kitchenId,
        public array $items,
        public int $printLogId,
        public ?string $requestId = null
    ) {
    }

    public function handle()
    {
        $order = Order::query()->with('table:id,table_no')->find($this->orderId);
        $kitchen = User::query()->with('kitchenDetail:id,kitchen_id,printer_ip,printer_port')->find($this->kitchenId);
        $logRow = OrderPrintLog::find($this->printLogId);

        if (!$order || !$kitchen || !$kitchen->kitchenDetail?->printer_ip) {
            $error = !$order ? 'order_not_found' : (!$kitchen ? 'kitchen_not_found' : 'missing_printer_config');
            if ($logRow) {
                $logRow->update([
                    'status' => 'failed',
                    'error' => $error,
                    'attempt' => (int) $this->attempts(),
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

        $ip = (string) $kitchen->kitchenDetail->printer_ip;
        $port = (int) ($kitchen->kitchenDetail->printer_port ?: 9100);

        try {
            $connector = new NetworkPrintConnector($ip, $port, 5);
            $printer = new Printer($connector);

            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("KITCHEN ORDER TICKET\n");
            $printer->text("Kitchen: {$kitchen->name}\n");
            $printer->text("Order #: {$order->id}\n");
            $printer->text("Table: " . ($order->table?->table_no ?: 'N/A') . "\n");
            $printer->text(now()->format('Y-m-d H:i:s') . "\n");
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
                    'error' => null,
                    'attempt' => (int) $this->attempts(),
                ]);
            }

            Log::channel('printing')->info('pos.print.job.sent', [
                'event' => 'pos.print.job.sent',
                'request_id' => $this->requestId,
                'order_id' => $this->orderId,
                'kitchen_id' => $this->kitchenId,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'print_log_id' => $this->printLogId,
                'status' => 'sent',
                'attempt' => $this->attempts(),
            ]);
        } catch (\Throwable $th) {
            if ($logRow) {
                $logRow->update([
                    'status' => 'failed',
                    'error' => $th->getMessage(),
                    'attempt' => (int) $this->attempts(),
                ]);
            }

            Log::channel('printing')->error('pos.print.job.failed', [
                'event' => 'pos.print.job.failed',
                'request_id' => $this->requestId,
                'order_id' => $this->orderId,
                'kitchen_id' => $this->kitchenId,
                'printer_ip' => $ip,
                'printer_port' => $port,
                'print_log_id' => $this->printLogId,
                'status' => 'failed',
                'error' => $th->getMessage(),
                'attempt' => $this->attempts(),
            ]);

            throw $th;
        }
    }
}
