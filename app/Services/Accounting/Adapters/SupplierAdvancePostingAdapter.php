<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\JournalEntry;
use App\Models\SupplierAdvance;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use RuntimeException;

class SupplierAdvancePostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService
    ) {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === SupplierAdvance::class && $event->event_type === 'supplier_advance_posted';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $advance = SupplierAdvance::query()->with(['vendor', 'paymentAccount'])->find($event->source_id);
        if (!$advance) {
            throw new RuntimeException('Supplier advance not found for posting.');
        }

        $existing = JournalEntry::query()
            ->where('module_type', 'supplier_advance')
            ->where('module_id', $advance->id)
            ->first();
        if ($existing) {
            return $existing;
        }

        $amount = (float) ($advance->amount ?? 0);
        if ($amount <= 0.0) {
            throw new RuntimeException('Supplier advance amount must be greater than zero.');
        }

        $advanceAccountId = $advance->vendor?->advance_account_id;
        $paymentAccountId = $advance->paymentAccount?->coa_account_id;
        if (!$advanceAccountId || !$paymentAccountId) {
            throw new RuntimeException('Supplier advance posting requires vendor advance account and payment account COA mapping.');
        }

        $entry = $this->postingService->post(
            'supplier_advance',
            $advance->id,
            optional($advance->advance_date)->toDateString() ?? now()->toDateString(),
            'Supplier Advance ' . $advance->advance_no,
            [
                [
                    'account_id' => $advanceAccountId,
                    'debit' => $amount,
                    'credit' => 0,
                    'vendor_id' => $advance->vendor_id,
                    'reference_type' => SupplierAdvance::class,
                    'reference_id' => $advance->id,
                ],
                [
                    'account_id' => $paymentAccountId,
                    'debit' => 0,
                    'credit' => $amount,
                    'vendor_id' => $advance->vendor_id,
                    'reference_type' => SupplierAdvance::class,
                    'reference_id' => $advance->id,
                ],
            ],
            $advance->posted_by ?: $advance->created_by,
            $advance->tenant_id
        );

        $event->forceFill([
            'journal_entry_id' => $entry->id,
        ])->save();

        return $entry;
    }
}
