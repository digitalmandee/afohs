<?php

namespace Database\Seeders;

use App\Models\EventMenuType;
use App\Models\EventVenue;
use Illuminate\Database\Seeder;

class EventMenuTypeSeeder extends Seeder
{
    public function run(): void
    {
        $eventMenuTypes = [
            ['name' => 'B', 'status' => 'active'],
            ['name' => 'Mutton', 'status' => 'active'],
            ['name' => "C", 'status' => 'active'],
        ];

        foreach ($eventMenuTypes as $eventMenuType) {
            EventMenuType::updateOrCreate(
                ['name' => $eventMenuType['name']],
                ['status' => $eventMenuType['status']]
            );
        }
    }
}