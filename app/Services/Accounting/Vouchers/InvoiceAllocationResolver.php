<?php

namespace App\Services\Accounting\Vouchers;

use App\Services\Accounting\Vouchers\Handlers\FinancialInvoiceAllocationHandler;
use App\Services\Accounting\Vouchers\Handlers\VendorBillAllocationHandler;
use App\Services\Accounting\Vouchers\Contracts\InvoiceAllocationHandler;
use Illuminate\Validation\ValidationException;

class InvoiceAllocationResolver
{
    /** @var InvoiceAllocationHandler[] */
    private array $handlers;

    public function __construct(
        VendorBillAllocationHandler $vendorBillHandler,
        FinancialInvoiceAllocationHandler $financialInvoiceHandler
    ) {
        $this->handlers = [
            $vendorBillHandler,
            $financialInvoiceHandler,
        ];
    }

    public function forType(string $invoiceType): InvoiceAllocationHandler
    {
        foreach ($this->handlers as $handler) {
            if ($handler->type() === $invoiceType) {
                return $handler;
            }
        }

        throw ValidationException::withMessages([
            'invoice_type' => "No allocation handler configured for invoice type: {$invoiceType}.",
        ]);
    }
}
