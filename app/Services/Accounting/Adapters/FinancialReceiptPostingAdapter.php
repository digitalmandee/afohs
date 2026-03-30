<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\AccountingRule;
use App\Models\FinancialReceipt;
use App\Models\JournalEntry;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use App\Services\Accounting\Support\FinancePostingClassifier;
use App\Services\Accounting\Support\PaymentAccountPostingGuard;
use App\Services\Accounting\Support\RestaurantContextResolver;

class FinancialReceiptPostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService,
        private readonly RestaurantContextResolver $restaurantContextResolver,
        private readonly FinancePostingClassifier $financePostingClassifier,
        private readonly PaymentAccountPostingGuard $paymentAccountPostingGuard,
    )
    {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === FinancialReceipt::class && $event->event_type === 'receipt_created';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $receipt = FinancialReceipt::with(['links.invoice', 'paymentAccount'])->find($event->source_id);
        if (!$receipt) {
            throw new \RuntimeException('Financial receipt not found for posting.');
        }

        $amount = (float) ($receipt->amount ?? 0);
        if ($amount <= 0) {
            throw new \RuntimeException('Receipt amount is zero; posting aborted.');
        }

        $ruleCode = $this->financePostingClassifier->classifyReceipt($receipt);

        $existingEntry = JournalEntry::whereIn('module_type', ['financial_receipt', $ruleCode])
            ->where('module_id', $receipt->id)
            ->first();

        if ($existingEntry) {
            return $existingEntry;
        }

        $rule = AccountingRule::where('code', $ruleCode)->where('is_active', true)->first();
        if (!$rule) {
            throw new \RuntimeException("Accounting rule '{$ruleCode}' is missing or inactive.");
        }

        $linkedMemberId = $receipt->links
            ->pluck('invoice')
            ->filter()
            ->pluck('member_id')
            ->first();

        $paymentAccount = $this->paymentAccountPostingGuard->validateRequiredForPosting(
            $receipt->payment_account_id,
            $receipt->payment_method,
        );

        $lines = [];
        foreach ((array) $rule->lines as $line) {
            $lineAmount = $amount * (float) ($line['ratio'] ?? 1);
            $side = $line['side'] ?? 'debit';
            $accountId = $line['account_id'] ?? null;

            if (!empty($line['use_payment_account'])) {
                $accountId = $paymentAccount->coa_account_id;
            }

            $lines[] = [
                'account_id' => $accountId,
                'debit' => $side === 'debit' ? $lineAmount : 0,
                'credit' => $side === 'credit' ? $lineAmount : 0,
                'member_id' => $linkedMemberId,
                'reference_type' => FinancialReceipt::class,
                'reference_id' => $receipt->id,
            ];
        }

        $restaurantId = $this->restaurantContextResolver->forReceipt($receipt);
        $entry = $this->postingService->post(
            $ruleCode,
            $receipt->id,
            optional($receipt->receipt_date)->toDateString() ?? now()->toDateString(),
            'Financial Receipt ' . $receipt->receipt_no,
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
