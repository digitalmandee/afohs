<?php

namespace App\Services\Accounting\Vouchers;

use App\Models\AccountingVoucher;
use App\Models\AccountingVoucherAllocation;
use Illuminate\Validation\ValidationException;

class VoucherSettlementService
{
    public function __construct(
        private readonly InvoiceAllocationResolver $allocationResolver
    ) {
    }

    public function settleInvoiceLinkedVoucher(AccountingVoucher $voucher): ?AccountingVoucherAllocation
    {
        $paymentRows = collect((array) ($voucher->payment_rows ?? []))
            ->filter(fn (array $row) => (string) ($row['payment_mode'] ?? 'direct') === 'against_invoice' && !empty($row['invoice_id']))
            ->values();

        if ($paymentRows->isNotEmpty()) {
            $created = null;
            foreach ($paymentRows as $index => $row) {
                $invoiceType = (string) ($row['invoice_type'] ?? 'vendor_bill');
                $invoiceId = (int) ($row['invoice_id'] ?? 0);
                if ($invoiceId <= 0) {
                    continue;
                }

                $existing = AccountingVoucherAllocation::query()
                    ->where('voucher_id', $voucher->id)
                    ->where('invoice_type', $invoiceType)
                    ->where('invoice_id', $invoiceId)
                    ->first();
                if ($existing) {
                    $created = $created ?: $existing;
                    continue;
                }

                $allocationAmount = (float) ($row['amount'] ?? 0);
                if ($allocationAmount <= 0) {
                    throw ValidationException::withMessages([
                        'payment_rows' => 'Voucher allocation row amount must be greater than zero.',
                    ]);
                }

                $handler = $this->allocationResolver->forType($invoiceType);
                $invoice = $handler->lockForAllocation($invoiceId);
                $outstanding = $handler->getOutstanding($invoice);

                if ($allocationAmount - $outstanding > 0.009) {
                    throw ValidationException::withMessages([
                        'payment_rows' => sprintf(
                            'Voucher allocation %.2f exceeds current outstanding %.2f for %s.',
                            $allocationAmount,
                            $outstanding,
                            $handler->getDocumentNo($invoice)
                        ),
                    ]);
                }

                $handler->applyAllocation($invoice, $allocationAmount, $voucher);
                $party = $handler->getPartyContext($invoice);

                $created = AccountingVoucherAllocation::query()->create([
                    'voucher_id' => $voucher->id,
                    'voucher_line_id' => null,
                    'invoice_type' => $invoiceType,
                    'invoice_id' => $invoiceId,
                    'party_type' => (string) ($party['party_type'] ?? $voucher->party_type),
                    'party_id' => (int) ($party['party_id'] ?? $voucher->party_id),
                    'allocated_amount' => $allocationAmount,
                    'currency_code' => (string) ($voucher->currency_code ?: 'PKR'),
                    'exchange_rate' => (float) ($voucher->exchange_rate ?: 1),
                    'allocated_at' => now(),
                    'created_by' => $voucher->posted_by ?: $voucher->approved_by ?: $voucher->created_by,
                    'idempotency_key' => sprintf(
                        'voucher-allocation|%d|%s|%d|%d',
                        $voucher->id,
                        $invoiceType,
                        $invoiceId,
                        $index + 1
                    ),
                ]);
            }

            return $created;
        }

        if (!$voucher->invoice_type || !$voucher->invoice_id) {
            return null;
        }

        $existing = AccountingVoucherAllocation::query()
            ->where('voucher_id', $voucher->id)
            ->where('invoice_type', (string) $voucher->invoice_type)
            ->where('invoice_id', (int) $voucher->invoice_id)
            ->first();

        if ($existing) {
            return $existing;
        }

        $allocationAmount = $this->resolveAllocationAmount($voucher);
        if ($allocationAmount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Voucher allocation amount must be greater than zero.',
            ]);
        }

        $handler = $this->allocationResolver->forType((string) $voucher->invoice_type);
        $invoice = $handler->lockForAllocation((int) $voucher->invoice_id);
        $outstanding = $handler->getOutstanding($invoice);

        if ($allocationAmount - $outstanding > 0.009) {
            throw ValidationException::withMessages([
                'amount' => sprintf(
                    'Voucher allocation %.2f exceeds current outstanding %.2f for %s.',
                    $allocationAmount,
                    $outstanding,
                    $handler->getDocumentNo($invoice)
                ),
            ]);
        }

        $handler->applyAllocation($invoice, $allocationAmount, $voucher);
        $party = $handler->getPartyContext($invoice);

        return AccountingVoucherAllocation::query()->create([
            'voucher_id' => $voucher->id,
            'voucher_line_id' => null,
            'invoice_type' => (string) $voucher->invoice_type,
            'invoice_id' => (int) $voucher->invoice_id,
            'party_type' => (string) ($party['party_type'] ?? $voucher->party_type),
            'party_id' => (int) ($party['party_id'] ?? $voucher->party_id),
            'allocated_amount' => $allocationAmount,
            'currency_code' => (string) ($voucher->currency_code ?: 'PKR'),
            'exchange_rate' => (float) ($voucher->exchange_rate ?: 1),
            'allocated_at' => now(),
            'created_by' => $voucher->posted_by ?: $voucher->approved_by ?: $voucher->created_by,
            'idempotency_key' => sprintf('voucher-allocation|%d|%s|%d', $voucher->id, (string) $voucher->invoice_type, (int) $voucher->invoice_id),
        ]);
    }

    private function resolveAllocationAmount(AccountingVoucher $voucher): float
    {
        $amount = (float) ($voucher->amount ?? 0);
        if ($amount > 0) {
            return $amount;
        }

        $isPayment = in_array((string) $voucher->voucher_type, ['CPV', 'BPV'], true);

        $sum = (float) $voucher->lines->sum(function ($line) use ($isPayment) {
            return $isPayment ? (float) ($line->debit ?? 0) : (float) ($line->credit ?? 0);
        });

        return max(0, $sum);
    }
}
