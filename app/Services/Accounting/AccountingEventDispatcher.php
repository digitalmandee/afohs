<?php

namespace App\Services\Accounting;

use App\Models\AccountingEventQueue;
use App\Models\AccountingPostingLog;
use App\Models\JournalEntry;
use App\Services\Accounting\Adapters\FinancialInvoicePostingAdapter;
use App\Services\Accounting\Adapters\FinancialReceiptPostingAdapter;
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
        FinancialReceiptPostingAdapter $financialReceiptPostingAdapter
    )
    {
        $this->adapters = [
            $financialInvoicePostingAdapter,
            $financialReceiptPostingAdapter,
        ];
    }

    public function dispatch(string $eventType, string $sourceType, int $sourceId, ?array $payload = null, ?int $createdBy = null): AccountingEventQueue
    {
        $idempotencyKey = "{$eventType}|{$sourceType}|{$sourceId}";

        $event = AccountingEventQueue::firstOrCreate(
            ['idempotency_key' => $idempotencyKey],
            [
                'event_type' => $eventType,
                'source_type' => $sourceType,
                'source_id' => $sourceId,
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
                        'status' => 'skipped',
                        'processed_at' => now(),
                        'error_message' => 'No posting adapter mapped for this event.',
                    ]);

                    AccountingPostingLog::create([
                        'queue_id' => $event->id,
                        'event_type' => $event->event_type,
                        'source_type' => $event->source_type,
                        'source_id' => $event->source_id,
                        'status' => 'skipped',
                        'message' => 'No posting adapter mapped for this event.',
                        'payload' => $event->payload,
                    ]);

                    return $event->fresh();
                }

                $entry = $adapter->post($event);

                $event->update([
                    'status' => $entry ? 'posted' : 'skipped',
                    'processed_at' => now(),
                    'error_message' => null,
                ]);

                AccountingPostingLog::create([
                    'queue_id' => $event->id,
                    'event_type' => $event->event_type,
                    'source_type' => $event->source_type,
                    'source_id' => $event->source_id,
                    'status' => $entry ? 'posted' : 'skipped',
                    'journal_entry_id' => $entry?->id,
                    'message' => $entry ? 'Posted successfully.' : 'Event skipped by adapter rules.',
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
