<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\AccountingRule;
use App\Models\JournalEntry;
use App\Models\VendorPayment;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use App\Services\Accounting\Support\RestaurantContextResolver;

class VendorPaymentPostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService,
        private readonly RestaurantContextResolver $restaurantContextResolver
    ) {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === VendorPayment::class && $event->event_type === 'vendor_payment_posted';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $payment = VendorPayment::with(['vendor', 'paymentAccount'])->find($event->source_id);
        if (!$payment) {
            throw new \RuntimeException('Vendor payment not found for posting.');
        }

        $existingEntry = JournalEntry::where('module_type', 'vendor_payment')
            ->where('module_id', $payment->id)
            ->first();

        if ($existingEntry) {
            return $existingEntry;
        }

        $amount = (float) ($payment->amount ?? 0);
        if ($amount <= 0) {
            throw new \RuntimeException('Vendor payment amount is zero; posting aborted.');
        }

        $rule = AccountingRule::where('code', 'vendor_payment')->where('is_active', true)->first();
        if (!$rule) {
            throw new \RuntimeException("Accounting rule 'vendor_payment' is missing or inactive.");
        }

        $restaurantId = $this->restaurantContextResolver->forVendorPayment($payment);
        $lines = [];
        foreach ((array) $rule->lines as $line) {
            $lineAmount = $amount * (float) ($line['ratio'] ?? 1);
            $side = $line['side'] ?? 'debit';
            $accountId = $line['account_id'] ?? null;

            if (!empty($line['use_payment_account']) && !empty($payment->paymentAccount?->coa_account_id)) {
                $accountId = $payment->paymentAccount->coa_account_id;
            }

            $lines[] = [
                'account_id' => $accountId,
                'debit' => $side === 'debit' ? $lineAmount : 0,
                'credit' => $side === 'credit' ? $lineAmount : 0,
                'vendor_id' => $payment->vendor_id,
                'reference_type' => VendorPayment::class,
                'reference_id' => $payment->id,
            ];
        }

        $entry = $this->postingService->post(
            'vendor_payment',
            $payment->id,
            optional($payment->payment_date)->toDateString() ?? now()->toDateString(),
            'Vendor Payment ' . $payment->payment_no,
            $lines,
            $payment->posted_by ?: $payment->created_by,
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
