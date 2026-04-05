<?php

return [
    'vouchers' => [
        'allow_direct_post_without_submission' => env('ACCOUNTING_VOUCHER_ALLOW_DIRECT_POST', false),
        'default_payable_account_id' => env('ACCOUNTING_DEFAULT_PAYABLE_ACCOUNT_ID'),
        'default_receivable_account_id' => env('ACCOUNTING_DEFAULT_RECEIVABLE_ACCOUNT_ID'),
        'manual_override_permission' => env('ACCOUNTING_VOUCHER_MANUAL_OVERRIDE_PERMISSION', 'accounting.vouchers.manual_override'),
        'set_default_payment_account_permission' => env('ACCOUNTING_VOUCHER_SET_DEFAULT_PAYMENT_ACCOUNT_PERMISSION', 'accounting.vouchers.set_default_payment_account'),
    ],
];
