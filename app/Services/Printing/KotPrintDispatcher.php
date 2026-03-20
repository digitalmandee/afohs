<?php

namespace App\Services\Printing;

use App\Jobs\PrintOrderJob;
use App\Models\Order;
use App\Models\OrderPrintLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class KotPrintDispatcher
{
    public function __construct(
        protected KitchenPrinterResolver $printerResolver
    ) {
    }

    public function dispatchForOrder(
        Order $order,
        array $groupedByKitchen,
        array $context = []
    ): array {
        $batchId = (string) ($context['batch_id'] ?? Str::uuid());
        $requestId = $context['request_id'] ?? request()?->attributes->get('request_id');
        $triggeredBy = $context['triggered_by'] ?? auth()->id();
        $isRetry = (bool) ($context['is_retry'] ?? false);

        $queued = 0;
        $failures = [];

        foreach ($groupedByKitchen as $kitchenIdRaw => $items) {
            $kitchenId = is_numeric($kitchenIdRaw) ? (int) $kitchenIdRaw : null;
            $printer = $this->printerResolver->resolveKitchenPrinter($kitchenId);

            if (!$kitchenId) {
                $failures[] = [
                    'kitchen_id' => null,
                    'status' => 'failed',
                    'reason' => 'missing_kitchen_mapping',
                    'message' => 'Kitchen mapping is missing for one or more order items.',
                ];
                $this->logRecord($order, $batchId, null, null, null, $isRetry ? 'retried' : 'failed', 'missing_kitchen_mapping', $triggeredBy, $requestId);
                continue;
            }

            if (!$printer) {
                $failures[] = [
                    'kitchen_id' => $kitchenId,
                    'status' => 'failed',
                    'reason' => 'missing_printer_config',
                    'message' => "Printer is not configured for kitchen #{$kitchenId}.",
                ];
                $this->logRecord($order, $batchId, $kitchenId, null, null, $isRetry ? 'retried' : 'failed', 'missing_printer_config', $triggeredBy, $requestId);
                continue;
            }

            $log = OrderPrintLog::create([
                'batch_id' => $batchId,
                'order_id' => (int) $order->id,
                'restaurant_id' => (int) ($order->tenant_id ?: 0) ?: null,
                'kitchen_id' => $kitchenId,
                'document_type' => 'kot',
                'status' => $isRetry ? 'retried' : 'queued',
                'queue_name' => 'printing',
                'printer_ip' => $printer['printer_ip'],
                'printer_port' => $printer['printer_port'],
                'attempt' => 1,
                'created_by' => $triggeredBy,
                'meta' => [
                    'request_id' => $requestId,
                    'kitchen_name' => $printer['target_name'] ?? null,
                    'line_count' => is_countable($items) ? count($items) : 0,
                ],
            ]);

            PrintOrderJob::dispatch(
                orderId: (int) $order->id,
                kitchenId: $kitchenId,
                items: array_values($items),
                printLogId: (int) $log->id,
                requestId: $requestId
            )->onQueue('printing');

            $queued++;
        }

        Log::channel('printing')->info('pos.print.dispatch.summary', [
            'event' => 'pos.print.dispatch.summary',
            'request_id' => $requestId,
            'batch_id' => $batchId,
            'order_id' => (int) $order->id,
            'restaurant_id' => (int) ($order->tenant_id ?: 0) ?: null,
            'queued' => $queued,
            'failures_count' => count($failures),
            'is_retry' => $isRetry,
        ]);

        $status = $queued > 0 ? (count($failures) > 0 ? 'failed' : 'queued') : 'failed';

        return [
            'print_status' => $status,
            'print_batch_id' => $batchId,
            'dispatched_at' => now()->toIso8601String(),
            'queued_count' => $queued,
            'print_failures' => $failures,
        ];
    }

    protected function logRecord(
        Order $order,
        string $batchId,
        ?int $kitchenId,
        ?string $ip,
        ?int $port,
        string $status,
        string $error,
        ?int $createdBy,
        ?string $requestId
    ): void {
        OrderPrintLog::create([
            'batch_id' => $batchId,
            'order_id' => (int) $order->id,
            'restaurant_id' => (int) ($order->tenant_id ?: 0) ?: null,
            'kitchen_id' => $kitchenId,
            'document_type' => 'kot',
            'status' => $status,
            'queue_name' => 'printing',
            'printer_ip' => $ip,
            'printer_port' => $port,
            'attempt' => 1,
            'error' => $error,
            'created_by' => $createdBy,
            'meta' => [
                'request_id' => $requestId,
            ],
        ]);
    }
}
