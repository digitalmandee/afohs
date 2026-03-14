<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

// Simulate Media Creation test
use App\Models\Media;
use App\Models\PosCakeBooking;
use App\Models\User;
use Illuminate\Support\Str;

try {
    $booking = PosCakeBooking::first();
    if ($booking) {
        $media = new Media([
            'mediable_type' => PosCakeBooking::class,
            'mediable_id' => $booking->id,
            'type' => 'document',
            'file_name' => 'test_file.jpg',
            'file_path' => 'storage/test.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 1024,
            'disk' => 'public',
            'created_by' => 1
        ]);
        echo "Media Model Instantiation: Success\n";
    } else {
        echo "No booking found to test.\n";
    }
} catch (\Exception $e) {
    echo 'Error: ' . $e->getMessage();
}
