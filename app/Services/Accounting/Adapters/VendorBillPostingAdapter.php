<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\AccountingRule;
use App\Models\JournalEntry;
use App\Models\VendorBill;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use App\Services\Accounting\Support\RestaurantContextResolver;

class VendorBillPostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService,
        private readonly RestaurantContextResolver $restaurantContextResolver
    ) {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === VendorBill::class && $event->event_type === 'vendor_bill_posted';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $bill = VendorBill::with(['vendor', 'goodsReceipt.purchaseOrder'])->find($event->source_id);
        if (!$bill) {
            throw new \RuntimeException('Vendor bill not found for posting.');
        }

        $existingEntry = JournalEntry::where('module_type', 'vendor_bill')
            ->where('module_id', $bill->id)
            ->first();

        if ($existingEntry) {
            return $existingEntry;
        }

        $amount = (float) ($bill->grand_total ?? 0);
        if ($amount <= 0) {
            throw new \RuntimeException('Vendor bill amount is zero; posting aborted.');
        }

        $rule = AccountingRule::where('code', 'vendor_bill')->where('is_active', true)->first();
        if (!$rule) {
            throw new \RuntimeException("Accounting rule 'vendor_bill' is missing or inactive.");
        }

        $restaurantId = $this->restaurantContextResolver->forVendorBill($bill);
        $lines = [];
        foreach ((array) $rule->lines as $line) {
            $lineAmount = $amount * (float) ($line['ratio'] ?? 1);
            $side = $line['side'] ?? 'debit';
            $lines[] = [
                'account_id' => $line['account_id'] ?? null,
                'debit' => $side === 'debit' ? $lineAmount : 0,
                'credit' => $side === 'credit' ? $lineAmount : 0,
                'vendor_id' => $bill->vendor_id,
                'warehouse_id' => $bill->goodsReceipt?->warehouse_id,
                'warehouse_location_id' => $bill->goodsReceipt?->warehouse_location_id,
                'reference_type' => VendorBill::class,
                'reference_id' => $bill->id,
            ];
        }

        $entry = $this->postingService->post(
            'vendor_bill',
            $bill->id,
            optional($bill->bill_date)->toDateString() ?? now()->toDateString(),
            'Vendor Bill ' . $bill->bill_no,
            $lines,
            $bill->posted_by ?: $bill->created_by,
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
