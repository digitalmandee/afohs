<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

// Test Logic
$query = '100';  // Search term
$type = 'all';

echo "Testing Search for: $query\n";

$members = \App\Models\Member::where('status', 'active')
    ->where(function ($q) use ($query) {
        $q->where('membership_no', 'like', "%{$query}%");
    })
    ->limit(5)
    ->get(['id', 'full_name', 'membership_no']);

echo 'Found ' . $members->count() . " Members:\n";
foreach ($members as $m) {
    echo " - {$m->full_name} ({$m->membership_no})\n";
}

$corporate = \App\Models\CorporateMember::where('status', 'active')
    ->where(function ($q) use ($query) {
        $q->where('membership_no', 'like', "%{$query}%");
    })
    ->limit(5)
    ->get(['id', 'full_name', 'membership_no']);

echo 'Found ' . $corporate->count() . " Corporate Members:\n";
foreach ($corporate as $c) {
    echo " - {$c->full_name} ({$c->membership_no})\n";
}
