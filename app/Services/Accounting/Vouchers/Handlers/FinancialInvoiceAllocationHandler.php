<?php

namespace App\Services\Accounting\Vouchers\Handlers;

use App\Models\AccountingVoucher;
use App\Models\FinancialInvoice;
use App\Services\Accounting\Vouchers\Contracts\InvoiceAllocationHandler;
use RuntimeException;

class FinancialInvoiceAllocationHandler implements InvoiceAllocationHandler
{
    public function type(): string
    {
        return 'financial_invoice';
    }

    public function lockForAllocation(int $invoiceId): mixed
    {
        $invoice = FinancialInvoice::query()->whereKey($invoiceId)->lockForUpdate()->first();
        if (!$invoice) {
            throw new RuntimeException('Receivable invoice not found for allocation.');
        }

        return $invoice;
    }

    public function getOutstanding(mixed $invoice): float
    {
        return max(0, (float) ($invoice->total_price ?? 0) - (float) ($invoice->paid_amount ?? 0));
    }

    public function applyAllocation(mixed $invoice, float $amount, AccountingVoucher $voucher): void
    {
        $invoice->paid_amount = (float) ($invoice->paid_amount ?? 0) + $amount;

        if ((float) $invoice->paid_amount + 0.0001 >= (float) ($invoice->total_price ?? 0)) {
            $invoice->status = 'paid';
        } elseif ($amount > 0 && in_array((string) $invoice->status, ['unpaid', 'overdue', 'upcoming'], true)) {
            $invoice->status = 'partially_paid';
        }

        $invoice->save();
    }

    public function getDocumentNo(mixed $invoice): string
    {
        return (string) ($invoice->invoice_no ?: ('FinancialInvoice#' . $invoice->id));
    }

    public function getPartyContext(mixed $invoice): array
    {
        if ($invoice->customer_id) {
            return ['party_type' => 'customer', 'party_id' => (int) $invoice->customer_id];
        }
        if ($invoice->member_id) {
            return ['party_type' => 'member', 'party_id' => (int) $invoice->member_id];
        }

        return ['party_type' => 'corporate_member', 'party_id' => (int) $invoice->corporate_member_id];
    }
}

