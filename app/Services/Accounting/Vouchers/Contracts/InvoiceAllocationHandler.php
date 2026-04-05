<?php

namespace App\Services\Accounting\Vouchers\Contracts;

use App\Models\AccountingVoucher;

interface InvoiceAllocationHandler
{
    public function type(): string;

    public function lockForAllocation(int $invoiceId): mixed;

    public function getOutstanding(mixed $invoice): float;

    public function applyAllocation(mixed $invoice, float $amount, AccountingVoucher $voucher): void;

    public function getDocumentNo(mixed $invoice): string;

    public function getPartyContext(mixed $invoice): array;
}

