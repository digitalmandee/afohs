<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\AccountingVoucher;
use App\Models\JournalEntry;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use App\Services\Accounting\Vouchers\VoucherSettlementService;

class AccountingVoucherPostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService,
        private readonly VoucherSettlementService $settlementService
    ) {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === AccountingVoucher::class && $event->event_type === 'accounting_voucher_posted';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $voucher = AccountingVoucher::query()
            ->with(['lines', 'paymentAccount'])
            ->find($event->source_id);

        if (!$voucher) {
            throw new \RuntimeException('Accounting voucher not found for posting.');
        }

        $existingEntry = JournalEntry::query()
            ->where('module_type', 'accounting_voucher')
            ->where('module_id', $voucher->id)
            ->first();
        if ($existingEntry) {
            return $existingEntry;
        }

        $this->settlementService->settleInvoiceLinkedVoucher($voucher);

        $lines = $voucher->lines->map(function ($line) use ($voucher) {
            return [
                'account_id' => $line->account_id,
                'description' => $line->description,
                'debit' => (float) $line->debit,
                'credit' => (float) $line->credit,
                'vendor_id' => $line->vendor_id,
                'member_id' => $line->member_id,
                'employee_id' => $line->employee_id,
                'reference_type' => $line->reference_type ?: AccountingVoucher::class,
                'reference_id' => $line->reference_id ?: $voucher->id,
            ];
        })->all();

        $entry = $this->postingService->post(
            'accounting_voucher',
            $voucher->id,
            optional($voucher->posting_date ?: $voucher->voucher_date)->toDateString() ?? now()->toDateString(),
            "{$voucher->voucher_type} {$voucher->voucher_no}",
            $lines,
            $voucher->posted_by ?: $voucher->created_by,
            $voucher->tenant_id
        );

        $event->forceFill([
            'journal_entry_id' => $entry->id,
            'restaurant_id' => $voucher->tenant_id,
        ])->save();

        return $entry;
    }
}
