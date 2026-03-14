<?php

namespace App\Observers;

use App\Models\FinancialReceipt;
use App\Services\Accounting\AccountingEventDispatcher;

class FinancialReceiptObserver
{
    public function created(FinancialReceipt $financialReceipt): void
    {
        app(AccountingEventDispatcher::class)->dispatch(
            'receipt_created',
            FinancialReceipt::class,
            (int) $financialReceipt->id,
            [
                'receipt_no' => $financialReceipt->receipt_no,
                'amount' => $financialReceipt->amount,
                'payment_method' => $financialReceipt->payment_method,
            ],
            $financialReceipt->created_by
        );
    }
}
