<?php

namespace App\Services\Accounting;

use App\Models\AccountingEventQueue;
use App\Models\AccountingPostingLog;
use App\Models\JournalEntry;
use App\Models\User;
use App\Services\Accounting\Adapters\FinancialInvoicePostingAdapter;
use App\Services\Accounting\Adapters\FinancialReceiptPostingAdapter;
use App\Services\Accounting\Adapters\GoodsReceiptPostingAdapter;
use App\Services\Accounting\Adapters\VendorBillPostingAdapter;
use App\Services\Accounting\Adapters\VendorPaymentPostingAdapter;
use App\Services\Accounting\Contracts\PostingAdapter;
use Illuminate\Support\Facades\DB;

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
        GoodsReceiptPostingAdapter $goodsReceiptPostingAdapter
    )
    {
        $this->adapters = [
            $financialInvoicePostingAdapter,
            $financialReceiptPostingAdapter,
            $vendorBillPostingAdapter,
            $vendorPaymentPostingAdapter,
            $goodsReceiptPostingAdapter,
        ];
    }

    public function dispatch(
        string $eventType,
        string $sourceType,
        int $sourceId,
        ?array $payload = null,
        ?int $createdBy = null,
        ?int $restaurantId = null
    ): AccountingEventQueue
    {
        $idempotencyKey = "{$eventType}|{$sourceType}|{$sourceId}";
        $createdBy = $this->resolveCreatedBy($createdBy);

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
        $event->update([
            'status' => 'processing',
            'retry_count' => $event->retry_count + 1,
            'last_attempt_at' => now(),
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
