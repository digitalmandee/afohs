<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\AccountingRule;
use App\Models\GoodsReceipt;
use App\Models\JournalEntry;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use App\Services\Accounting\Support\RestaurantContextResolver;

class GoodsReceiptPostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService,
        private readonly RestaurantContextResolver $restaurantContextResolver
    ) {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === GoodsReceipt::class && $event->event_type === 'goods_receipt_posted';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $receipt = GoodsReceipt::with(['items', 'purchaseOrder', 'warehouse'])->find($event->source_id);
        if (!$receipt) {
            throw new \RuntimeException('Goods receipt not found for posting.');
        }

        $existingEntry = JournalEntry::where('module_type', 'goods_receipt')
            ->where('module_id', $receipt->id)
            ->first();

        if ($existingEntry) {
            return $existingEntry;
        }

        $amount = (float) $receipt->items->sum('line_total');
        if ($amount <= 0) {
            throw new \RuntimeException('Goods receipt value is zero; posting aborted.');
        }

        $rule = AccountingRule::where('code', 'purchase_receipt')->where('is_active', true)->first();
        if (!$rule) {
            throw new \RuntimeException("Accounting rule 'purchase_receipt' is missing or inactive.");
        }

        $restaurantId = $this->restaurantContextResolver->forGoodsReceipt($receipt);
        $lines = [];
        foreach ((array) $rule->lines as $line) {
            $lineAmount = $amount * (float) ($line['ratio'] ?? 1);
            $side = $line['side'] ?? 'debit';
            $lines[] = [
                'account_id' => $line['account_id'] ?? null,
                'debit' => $side === 'debit' ? $lineAmount : 0,
                'credit' => $side === 'credit' ? $lineAmount : 0,
                'vendor_id' => $receipt->vendor_id,
                'warehouse_id' => $receipt->warehouse_id,
                'warehouse_location_id' => $receipt->warehouse_location_id,
                'reference_type' => GoodsReceipt::class,
                'reference_id' => $receipt->id,
            ];
        }

        $entry = $this->postingService->post(
            'goods_receipt',
            $receipt->id,
            optional($receipt->received_date)->toDateString() ?? now()->toDateString(),
            'GRN ' . $receipt->grn_no,
            $lines,
            $receipt->created_by,
            $restaurantId
        );

        $event->forceFill([
            'restaurant_id' => $restaurantId,
            'posting_rule_id' => $rule->id,
            'journal_entry_id' => $entry->id,
        ])->save();

        return $entry;
    }
}
