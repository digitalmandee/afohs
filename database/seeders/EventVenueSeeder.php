<?php

namespace Database\Seeders;

use App\Models\EventVenue;
use Illuminate\Database\Seeder;

class EventVenueSeeder extends Seeder
{
    public function run(): void
    {
        $eventVenues = [
            ['name' => 'Conference Room', 'status' => 'active'],
            ['name' => 'Green Lounge', 'status' => 'active'],
            ['name' => "Event Hall", 'status' => 'active'],
        ];

        foreach ($eventVenues as $eventVenue) {
            EventVenue::updateOrCreate(
                ['name' => $eventVenue['name']],
                ['status' => $eventVenue['status']]
            );
        }
    }
}