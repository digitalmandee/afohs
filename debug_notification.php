<?php

use App\Models\User;
use App\Notifications\ActivityNotification;
use Illuminate\Support\Facades\Notification;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$superAdmins = User::role('super-admin')->get();
echo 'Found ' . $superAdmins->count() . " super-admin users.\n";

if ($superAdmins->count() > 0) {
    try {
        echo "Sending test notification...\n";
        Notification::send($superAdmins, new ActivityNotification(
            'Test Transaction',
            'Manual test from debug script',
            '#',
            User::first()
        ));
        echo "Notification sent successfully.\n";
    } catch (\Exception $e) {
        echo 'Error sending notification: ' . $e->getMessage() . "\n";
    }
} else {
    echo "No super-admins to notify.\n";
}
