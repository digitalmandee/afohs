<?php
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$types = DB::connection('old_afohs')->table('trans_types')->orderBy('type')->orderBy('id')->get();
$output = [];
foreach ($types as $t) {
    if (!isset($output[$t->type]))
        $output[$t->type] = [];
    $output[$t->type][] = "ID: {$t->id} | Name: {$t->name}";
}
file_put_contents('debug_types.json', json_encode($output, JSON_PRETTY_PRINT));
echo 'Done writing to debug_types.json';
