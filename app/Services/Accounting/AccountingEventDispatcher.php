<?php

namespace App\Services\Accounting;

use App\Models\AccountingEventQueue;
use App\Models\AccountingPostingLog;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\Accounting\Adapters\FinancialInvoicePostingAdapter;
use App\Services\Accounting\Adapters\FinancialReceiptPostingAdapter;
use App\Services\Accounting\Adapters\GoodsReceiptPostingAdapter;
use App\Services\Accounting\Adapters\InventoryDocumentPostingAdapter;
use App\Services\Accounting\Adapters\AccountingVoucherPostingAdapter;
use App\Services\Accounting\Adapters\SupplierAdvancePostingAdapter;
use App\Services\Accounting\Adapters\VendorBillPostingAdapter;
use App\Services\Accounting\Adapters\VendorPaymentPostingAdapter;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\OperationalAuditLogger;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AccountingEventDispatcher
{
    /**
     * @var PostingAdapter[]
     */
    private array $adapters;

    public function __construct(
        FinancialInvoicePostingAdapter $financialInvoicePostingAdapter,
        FinancialReceiptPostingAdapter $financialReceiptPostingAdapter,
        VendorBillPostingAdapter $vendorBillPostingAdapter,
        VendorPaymentPostingAdapter $vendorPaymentPostingAdapter,
        GoodsReceiptPostingAdapter $goodsReceiptPostingAdapter,
        InventoryDocumentPostingAdapter $inventoryDocumentPostingAdapter,
        SupplierAdvancePostingAdapter $supplierAdvancePostingAdapter,
        AccountingVoucherPostingAdapter $accountingVoucherPostingAdapter,
        private readonly OperationalAuditLogger $operationalAuditLogger
    )
    {
        $this->adapters = [
            $financialInvoicePostingAdapter,
            $financialReceiptPostingAdapter,
            $vendorBillPostingAdapter,
            $vendorPaymentPostingAdapter,
            $goodsReceiptPostingAdapter,
            $inventoryDocumentPostingAdapter,
            $supplierAdvancePostingAdapter,
            $accountingVoucherPostingAdapter,
        ];
    }

    public function dispatch(
        string $eventType,
        string $sourceType,
        int $sourceId,
        ?array $payload = null,
        ?int $createdBy = null,
        ?int $restaurantId = null,
        ?string $correlationId = null
    ): AccountingEventQueue
    {
        $idempotencyKey = "{$eventType}|{$sourceType}|{$sourceId}";
        $createdBy = $this->resolveCreatedBy($createdBy);
        $correlationId = $correlationId
            ?: request()?->attributes->get('correlation_id')
            ?: request()?->header('X-Correlation-ID');
        $payload = $payload ?? [];
        if ($correlationId && empty($payload['correlation_id'])) {
            $payload['correlation_id'] = (string) $correlationId;
        }

        $event = AccountingEventQueue::firstOrCreate(
            ['idempotency_key' => $idempotencyKey],
            [
                'event_type' => $eventType,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'restaurant_id' => $restaurantId,
                'payload' => $payload,
                'status' => 'pending',
                'created_by' => $createdBy,
            ]
        );

        $this->operationalAuditLogger->record([
            'correlation_id' => (string) ($payload['correlation_id'] ?? ''),
            'module' => 'accounting',
            'entity_type' => 'accounting_event_queue',
            'entity_id' => (string) $event->id,
            'action' => 'accounting.event.dispatch.attempted',
            'status' => 'attempted',
            'severity' => 'info',
            'message' => 'Accounting event dispatched.',
            'context' => [
                'event_type' => $eventType,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
                'idempotency_key' => $idempotencyKey,
            ],
        ]);

        if ($event->status === 'pending' || $event->status === 'failed') {
            $this->process($event->fresh());
        }

        return $event->fresh();
    }

    private function resolveCreatedBy(?int $createdBy): ?int
    {
        if (!$createdBy) {
            return null;
        }

        return User::query()->whereKey($createdBy)->exists() ? $createdBy : null;
    }

    public function process(AccountingEventQueue $event): AccountingEventQueue
    {
        $correlationId = (string) ($event->payload['correlation_id'] ?? '');
        if ($correlationId !== '') {
            Log::withContext(['correlation_id' => $correlationId]);
        }

        $event->update([
            'status' => 'processing',
            'retry_count' => $event->retry_count + 1,
            'last_attempt_at' => now(),
        ]);

        $this->operationalAuditLogger->record([
            'correlation_id' => $correlationId,
            'module' => 'accounting',
            'entity_type' => 'accounting_event_queue',
            'entity_id' => (string) $event->id,
            'action' => 'accounting.event.process.attempted',
            'status' => 'attempted',
            'severity' => 'info',
            'message' => 'Accounting event processing started.',
            'context' => [
                'event_type' => $event->event_type,
                'source_type' => $event->source_type,
                'source_id' => $event->source_id,
                'retry_count' => $event->retry_count,
            ],
        ]);

        try {
            return DB::transaction(function () use ($event) {
                $adapter = $this->resolveAdapter($event);
                if (!$adapter) {
                    $event->update([
                        'status' => 'failed',
                        'processed_at' => now(),
                        'error_message' => 'No posting adapter mapped for this event.',
                    ]);

                    AccountingPostingLog::create([
                        'queue_id' => $event->id,
                        'event_type' => $event->event_type,
                        'source_type' => $event->source_type,
                        'source_id' => $event->source_id,
                        'restaurant_id' => $event->restaurant_id,
                        'posting_rule_id' => $event->posting_rule_id,
                        'status' => 'failed',
                        'message' => 'No posting adapter mapped for this event.',
                        'payload' => $event->payload,
                    ]);

                    $this->operationalAuditLogger->record([
                        'correlation_id' => (string) ($event->payload['correlation_id'] ?? ''),
                        'module' => 'accounting',
                        'entity_type' => 'accounting_event_queue',
                        'entity_id' => (string) $event->id,
                        'action' => 'accounting.event.process.failed',
                        'status' => 'failed',
                        'severity' => 'error',
                        'message' => 'No posting adapter mapped for event.',
                        'context' => [
                            'event_type' => $event->event_type,
                            'source_type' => $event->source_type,
                            'source_id' => $event->source_id,
                        ],
                    ]);

                    return $event->fresh();
                }

                $entry = $adapter->post($event);
                if (!$entry) {
                    throw new \RuntimeException('Posting adapter did not return a journal entry.');
                }

                $event->update([
                    'status' => 'posted',
                    'journal_entry_id' => $entry?->id,
                    'processed_at' => now(),
                    'error_message' => null,
                ]);

                AccountingPostingLog::create([
                    'queue_id' => $event->id,
                    'event_type' => $event->event_type,
                    'source_type' => $event->source_type,
                    'source_id' => $event->source_id,
                    'restaurant_id' => $event->restaurant_id,
                    'posting_rule_id' => $event->posting_rule_id,
                    'status' => 'posted',
                    'journal_entry_id' => $entry?->id,
                    'message' => 'Posted successfully.',
                    'payload' => $event->payload,
                ]);

                $this->operationalAuditLogger->record([
                    'correlation_id' => (string) ($event->payload['correlation_id'] ?? ''),
                    'module' => 'accounting',
                    'entity_type' => 'accounting_event_queue',
                    'entity_id' => (string) $event->id,
                    'action' => 'accounting.event.process.posted',
                    'status' => 'posted',
                    'severity' => 'info',
                    'message' => 'Accounting event posted successfully.',
                    'context' => [
                        'journal_entry_id' => $entry?->id,
                        'event_type' => $event->event_type,
                        'source_type' => $event->source_type,
                        'source_id' => $event->source_id,
                    ],
                ]);

                return $event->fresh();
            });
        } catch (\Throwable $e) {
            $event->update([
                'status' => 'failed',
                'processed_at' => now(),
                'error_message' => $e->getMessage(),
            ]);

            AccountingPostingLog::create([
                'queue_id' => $event->id,
                'event_type' => $event->event_type,
                'source_type' => $event->source_type,
                'source_id' => $event->source_id,
                'restaurant_id' => $event->restaurant_id,
                'posting_rule_id' => $event->posting_rule_id,
                'status' => 'failed',
                'message' => $e->getMessage(),
                'payload' => $event->payload,
            ]);

            $this->operationalAuditLogger->record([
                'correlation_id' => (string) ($event->payload['correlation_id'] ?? ''),
                'module' => 'accounting',
                'entity_type' => 'accounting_event_queue',
                'entity_id' => (string) $event->id,
                'action' => 'accounting.event.process.failed',
                'status' => 'failed',
                'severity' => 'error',
                'message' => $e->getMessage(),
                'context' => [
                    'event_type' => $event->event_type,
                    'source_type' => $event->source_type,
                    'source_id' => $event->source_id,
                ],
            ]);

            report($e);

            return $event->fresh();
        }
    }

    private function resolveAdapter(AccountingEventQueue $event): ?PostingAdapter
    {
        foreach ($this->adapters as $adapter) {
            if ($adapter->supports($event)) {
                return $adapter;
            }
        }

        return null;
    }
}
