<?php

namespace App\Observers;

use App\Models\FinancialReceipt;
use App\Services\Accounting\AccountingEventDispatcher;
use App\Services\Accounting\StrictAccountingSyncService;
use App\Services\Accounting\Support\RestaurantContextResolver;

class FinancialReceiptObserver
{
    public function created(FinancialReceipt $financialReceipt): void
    {
        $restaurantId = app(RestaurantContextResolver::class)->forReceipt($financialReceipt->loadMissing(['links.invoice', 'paymentAccount']));

        $event = app(AccountingEventDispatcher::class)->dispatch(
            'receipt_created',
            FinancialReceipt::class,
            (int) $financialReceipt->id,
            [
                'receipt_no' => $financialReceipt->receipt_no,
                'amount' => $financialReceipt->amount,
                'payment_method' => $financialReceipt->payment_method,
            ],
            $financialReceipt->created_by,
            $restaurantId
        );

        app(StrictAccountingSyncService::class)->enforceOrFail($event, "Receipt {$financialReceipt->receipt_no}");
    }
}
