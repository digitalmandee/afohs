<?php

namespace App\Services\Accounting\Vouchers\Handlers;

use App\Models\AccountingVoucher;
use App\Models\VendorBill;
use App\Services\Accounting\Vouchers\Contracts\InvoiceAllocationHandler;
use RuntimeException;

class VendorBillAllocationHandler implements InvoiceAllocationHandler
{
    public function type(): string
    {
        return 'vendor_bill';
    }

    public function lockForAllocation(int $invoiceId): mixed
    {
        $bill = VendorBill::query()->whereKey($invoiceId)->lockForUpdate()->first();
        if (!$bill) {
            throw new RuntimeException('Vendor bill not found for allocation.');
        }

        return $bill;
    }

    public function getOutstanding(mixed $invoice): float
    {
        return max(
            0,
            (float) $invoice->grand_total
            - (float) $invoice->paid_amount
            - (float) $invoice->advance_applied_amount
            - (float) $invoice->return_applied_amount
        );
    }

    public function applyAllocation(mixed $invoice, float $amount, AccountingVoucher $voucher): void
    {
        $invoice->paid_amount = (float) $invoice->paid_amount + $amount;

        if ((float) $invoice->paid_amount + (float) $invoice->advance_applied_amount + (float) $invoice->return_applied_amount + 0.0001 >= (float) $invoice->grand_total) {
            $invoice->status = 'paid';
        } elseif ($amount > 0) {
            $invoice->status = 'partially_paid';
        }

        $invoice->save();
    }

    public function getDocumentNo(mixed $invoice): string
    {
        return (string) ($invoice->bill_no ?: ('VendorBill#' . $invoice->id));
    }

    public function getPartyContext(mixed $invoice): array
    {
        return [
            'party_type' => 'vendor',
            'party_id' => (int) $invoice->vendor_id,
        ];
    }
}

