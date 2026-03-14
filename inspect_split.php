<?php
// inspect_split.php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$stats = \Illuminate\Support\Facades\DB::table('transactions')
    ->select('payable_type', 'type', \Illuminate\Support\Facades\DB::raw('count(*) as count'), \Illuminate\Support\Facades\DB::raw('sum(amount) as total'))
    ->groupBy('payable_type', 'type')
    ->get();

foreach ($stats as $stat) {
    echo "Type: {$stat->payable_type} | Kind: {$stat->type} | Count: {$stat->count} | Total: {$stat->total}\n";
}
