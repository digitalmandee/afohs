<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Head Office Branch
    |--------------------------------------------------------------------------
    |
    | Used for purchase requisitions when request_for = office.
    | Set this in .env as PROCUREMENT_HEAD_OFFICE_BRANCH_ID.
    |
    */
    'head_office_branch_id' => env('PROCUREMENT_HEAD_OFFICE_BRANCH_ID'),

    /*
    |--------------------------------------------------------------------------
    | Request For Department Rules
    |--------------------------------------------------------------------------
    |
    | Department filtering is config-driven. Each request type uses case-insensitive
    | keyword matching against department names.
    |
    */
    'request_for_department_rules' => [
        'restaurant' => ['kitchen', 'service', 'bar'],
        'office' => ['hr', 'it', 'finance', 'admin'],
        'warehouse' => ['warehouse', 'store', 'inventory', 'logistics'],
        'other' => [],
    ],
];
