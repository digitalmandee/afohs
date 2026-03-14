<?php

namespace App\Observers;

use App\Models\FinancialInvoice;
use App\Services\Accounting\AccountingEventDispatcher;

class FinancialInvoiceObserver
{
    public function created(FinancialInvoice $financialInvoice): void
    {
        app(AccountingEventDispatcher::class)->dispatch(
            'invoice_created',
            FinancialInvoice::class,
            (int) $financialInvoice->id,
            [
                'invoice_no' => $financialInvoice->invoice_no,
                'invoice_type' => $financialInvoice->invoice_type,
                'total_price' => $financialInvoice->total_price,
            ],
            $financialInvoice->created_by
        );
    }
}
