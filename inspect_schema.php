<?php

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$columns = DB::select('DESCRIBE financial_invoices');
foreach ($columns as $col) {
    if ($col->Field === 'payment_method') {
        echo 'Column: ' . $col->Field . "\n";
        echo 'Type: ' . $col->Type . "\n";
        echo 'Null: ' . $col->Null . "\n";
    }
}
