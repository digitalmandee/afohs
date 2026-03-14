<?php

namespace Database\Seeders;

use App\Models\EventMenuAddOn;
use Illuminate\Database\Seeder;

class EventMenuAddonsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $eventMenuAddons = [
            ['name' => 'Hot & Sour Soup', 'amount' => 100, 'status' => 'active'],
            ['name' => 'Chicken Corn Soup', 'amount' => 100, 'status' => 'active'],
            ['name' => 'Chicken Cream Soup', 'amount' => 100, 'status' => 'active'],
            ['name' => 'Fresh Juice', 'amount' => 180, 'status' => 'active'],
            ['name' => 'Nestle Juice', 'amount' => 100, 'status' => 'active'],
            ['name' => 'Aloo Bukhara Chatni', 'amount' => 50, 'status' => 'active'],
            ['name' => 'Black Tea', 'amount' => 35, 'status' => 'active'],
            ['name' => 'Green Tea', 'amount' => 30, 'status' => 'active'],
            ['name' => 'Kashmiri Tea', 'amount' => 60, 'status' => 'active'],
            ['name' => 'Benazir Kulfia', 'amount' => 150, 'status' => 'active'],
            ['name' => 'Gajar Halwa', 'amount' => 150, 'status' => 'active'],
            ['name' => 'Petha Halwa', 'amount' => 150, 'status' => 'active'],
            ['name' => 'Chicken Seekh Kabab', 'amount' => 175, 'status' => 'active'],
            ['name' => 'Beef Seekh Kabab', 'amount' => 200, 'status' => 'active'],
            ['name' => 'Mutton Seekh Kabab', 'amount' => 350, 'status' => 'active'],
            ['name' => 'Chicken Gola Kabab', 'amount' => 250, 'status' => 'active'],
            ['name' => 'Chicken Steam Roast', 'amount' => 250, 'status' => 'active'],
            ['name' => 'Chicken Boti', 'amount' => 175, 'status' => 'active'],
            ['name' => 'Chicken Malai Boti', 'amount' => 250, 'status' => 'active'],
            ['name' => 'Mutton Tikka', 'amount' => 450, 'status' => 'active'],
            ['name' => 'Fired Fish', 'amount' => 350, 'status' => 'active'],
            ['name' => 'Finger Fish', 'amount' => 350, 'status' => 'active'],
            ['name' => 'Mutton Chops', 'amount' => 450, 'status' => 'active'],
            ['name' => 'Mutton Joint Roast', 'amount' => 600, 'status' => 'active'],
            ['name' => 'Halwa Puri Bhaji Channa', 'amount' => 150, 'status' => 'active'],
            ['name' => 'Batter Fry Prawn', 'amount' => 600, 'status' => 'active'],
            ['name' => 'Chicken Tempura', 'amount' => 250, 'status' => 'active'],
            ['name' => 'Fish Dhaka', 'amount' => 250, 'status' => 'active'],
            ['name' => 'Leg Roast(Per Leg)', 'amount' => 1750, 'status' => 'active'],
        ];

        foreach ($eventMenuAddons as $eventMenuAddon) {
            EventMenuAddOn::updateOrCreate(
                ['name' => $eventMenuAddon['name']],
                [
                    'amount' => $eventMenuAddon['amount'],
                    'status' => $eventMenuAddon['status']
                ]
            );
        }
    }
}
