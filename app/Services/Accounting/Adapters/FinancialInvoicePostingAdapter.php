<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\AccountingRule;
use App\Models\FinancialInvoice;
use App\Models\JournalEntry;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use App\Services\Accounting\Support\FinancePostingClassifier;
use App\Services\Accounting\Support\RestaurantContextResolver;

class FinancialInvoicePostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService,
        private readonly RestaurantContextResolver $restaurantContextResolver,
        private readonly FinancePostingClassifier $financePostingClassifier
    )
    {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === FinancialInvoice::class && $event->event_type === 'invoice_created';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $invoice = FinancialInvoice::find($event->source_id);
        if (!$invoice) {
            throw new \RuntimeException('Financial invoice not found for posting.');
        }

        $ruleCode = $this->financePostingClassifier->classifyInvoice($invoice);

        $rule = AccountingRule::where('code', $ruleCode)->where('is_active', true)->first();

        if (!$rule) {
            throw new \RuntimeException("Accounting rule '{$ruleCode}' is missing or inactive.");
        }

        $existingEntry = JournalEntry::whereIn('module_type', ['financial_invoice', $ruleCode])
            ->where('module_id', $invoice->id)
            ->first();

        if ($existingEntry) {
            return $existingEntry;
        }

        $amount = (float) ($invoice->total_price ?? $invoice->amount ?? 0);
        if ($amount < 0) {
            throw new \RuntimeException('Invoice amount is negative; posting aborted.');
        }

        $lines = [];
        foreach ((array) $rule->lines as $line) {
            $lineAmount = $amount * (float) ($line['ratio'] ?? 1);
            $side = $line['side'] ?? 'debit';
            $lines[] = [
                'account_id' => $line['account_id'] ?? null,
                'debit' => $side === 'debit' ? $lineAmount : 0,
                'credit' => $side === 'credit' ? $lineAmount : 0,
                'member_id' => $invoice->member_id,
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
            ];
        }

        $restaurantId = $this->restaurantContextResolver->forInvoice($invoice);
        $entry = $this->postingService->post(
            $ruleCode,
            $invoice->id,
            optional($invoice->issue_date)->toDateString() ?? now()->toDateString(),
            'Financial Invoice ' . $invoice->invoice_no,
            $lines,
            $invoice->created_by,
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
