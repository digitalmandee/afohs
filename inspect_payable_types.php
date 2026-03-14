<?php
// inspect_payable_types.php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$types = \Illuminate\Support\Facades\DB::table('transactions')
    ->select('payable_type', \Illuminate\Support\Facades\DB::raw('count(*) as total'))
    ->groupBy('payable_type')
    ->get();

foreach ($types as $type) {
    echo 'Type: ' . $type->payable_type . ' | Count: ' . $type->total . "\n";
}
