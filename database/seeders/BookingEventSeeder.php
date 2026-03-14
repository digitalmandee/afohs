<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class BookingEventSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('booking_events')->insert([
            [
                'event_name' => 'Laravel Workshop',
                'date_time' => Carbon::now()->addDays(7)->toDateTimeString(),
                'max_capacity' => 50,
                'pricing_type' => 'per person',
                'price_per_person' => 49.99,
                'status' => 'upcomming',
                'location' => 'Tech Hub, New York',
                'photo_path' => 'images/events/laravel-workshop.jpg',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'event_name' => 'React Summit',
                'date_time' => Carbon::now()->addDays(14)->toDateTimeString(),
                'max_capacity' => 200,
                'pricing_type' => 'fixed',
                'price_per_person' => 500.00,
                'status' => 'pending',
                'location' => 'San Francisco Convention Center',
                'photo_path' => 'images/events/react-summit.jpg',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'event_name' => 'Completed Event',
                'date_time' => Carbon::now()->subDays(10)->toDateTimeString(),
                'max_capacity' => 100,
                'pricing_type' => 'per person',
                'price_per_person' => 30.00,
                'status' => 'completed',
                'location' => 'Online',
                'photo_path' => 'images/events/completed-event.jpg',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
