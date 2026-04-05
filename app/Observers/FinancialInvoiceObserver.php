<?php

namespace App\Observers;

use App\Models\FinancialInvoice;
use App\Services\Accounting\AccountingEventDispatcher;
use App\Services\Accounting\StrictAccountingSyncService;
use App\Services\Accounting\Support\RestaurantContextResolver;

class FinancialInvoiceObserver
{
    public function created(FinancialInvoice $financialInvoice): void
    {
        $restaurantId = app(RestaurantContextResolver::class)->forInvoice($financialInvoice);

        $event = app(AccountingEventDispatcher::class)->dispatch(
            'invoice_created',
            FinancialInvoice::class,
            (int) $financialInvoice->id,
            [
                'invoice_no' => $financialInvoice->invoice_no,
                'invoice_type' => $financialInvoice->invoice_type,
                'total_price' => $financialInvoice->total_price,
            ],
            $financialInvoice->created_by,
            $restaurantId
        );

        app(StrictAccountingSyncService::class)->enforceOrFail($event, "Invoice {$financialInvoice->invoice_no}");
    }
}
