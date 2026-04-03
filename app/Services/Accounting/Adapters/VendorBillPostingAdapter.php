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
        $bill = VendorBill::with(['vendor', 'goodsReceipt.purchaseOrder', 'otherCharges'])->find($event->source_id);
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
        $otherChargesTotal = (float) ($bill->other_charges_total ?? 0);
        $baseAmount = max(0, $amount - $otherChargesTotal);

        $lines = [];
        foreach ((array) $rule->lines as $line) {
            $lineAmount = $baseAmount * (float) ($line['ratio'] ?? 1);
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

        $debitBaseLine = collect($lines)->first(fn ($line) => (float) ($line['debit'] ?? 0) > 0.0);
        if ($otherChargesTotal > 0.0 && !$debitBaseLine) {
            throw new \RuntimeException('Vendor bill posting could not resolve debit base account for other charges.');
        }

        foreach ($bill->otherCharges as $charge) {
            $chargeAmount = (float) ($charge->amount ?? 0);
            if ($chargeAmount <= 0.0) {
                continue;
            }
            $lines[] = [
                'account_id' => $debitBaseLine['account_id'] ?? null,
                'debit' => $chargeAmount,
                'credit' => 0,
                'vendor_id' => $bill->vendor_id,
                'warehouse_id' => $bill->goodsReceipt?->warehouse_id,
                'warehouse_location_id' => $bill->goodsReceipt?->warehouse_location_id,
                'reference_type' => VendorBill::class,
                'reference_id' => $bill->id,
            ];
            $lines[] = [
                'account_id' => $charge->account_id,
                'debit' => 0,
                'credit' => $chargeAmount,
                'vendor_id' => $charge->party_vendor_id ?: $bill->vendor_id,
                'reference_type' => VendorBill::class,
                'reference_id' => $bill->id,
            ];
        }

        $advanceApplied = (float) ($bill->advance_applied_amount ?? 0);
        if ($advanceApplied > 0.0) {
            $payableLine = collect($lines)->first(fn ($line) => (float) ($line['credit'] ?? 0) > 0.0);
            if (!$bill->vendor?->advance_account_id || !$payableLine) {
                throw new \RuntimeException('Bill advance adjustment requires vendor advance account and payable line.');
            }
            $lines[] = [
                'account_id' => $payableLine['account_id'],
                'debit' => $advanceApplied,
                'credit' => 0,
                'vendor_id' => $bill->vendor_id,
                'reference_type' => VendorBill::class,
                'reference_id' => $bill->id,
            ];
            $lines[] = [
                'account_id' => $bill->vendor->advance_account_id,
                'debit' => 0,
                'credit' => $advanceApplied,
                'vendor_id' => $bill->vendor_id,
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
