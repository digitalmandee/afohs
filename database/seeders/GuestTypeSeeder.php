<?php

namespace Database\Seeders;

use App\Models\EventVenue;
use App\Models\GuestType;
use Illuminate\Database\Seeder;

class GuestTypeSeeder extends Seeder
{
    public function run(): void
    {
        $guestTypes = [
            ['name' => 'Applied Member'],
            ['name' => 'Affiliated Member'],
            ['name' => "VIP Guest"],
        ];

        foreach ($guestTypes as $guestType) {
            GuestType::updateOrCreate(
                ['name' => $guestType['name']],
            );
        }
    }
}