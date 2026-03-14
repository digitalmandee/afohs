<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RoomChargesType;
use App\Models\RoomMiniBar;

class RoomOtherChargesSeeder extends Seeder
{
    public function run(): void
    {
        $chargeTypes = [
            ['name' => 'Mini Bar', 'amount' => 500, 'status' => 'active'],
            ['name' => 'Sports', 'amount' => 300, 'status' => 'active'],
            ['name' => 'Breakage', 'amount' => 1000, 'status' => 'active'],
            ['name' => 'Mattress', 'amount' => 800, 'status' => 'active'],
            ['name' => 'Misc Charges', 'amount' => 200, 'status' => 'active'],
            ['name' => 'Smoking', 'amount' => 400, 'status' => 'active'],
            ['name' => 'Services Charges', 'amount' => 250, 'status' => 'active'],
            ['name' => 'Dry Cleaning/Ironing', 'amount' => 600, 'status' => 'active'],
        ];

        foreach ($chargeTypes as $type) {
            RoomChargesType::updateOrCreate(
                ['name' => $type['name']],
                ['amount' => $type['amount'], 'status' => $type['status']]
            );
        }

        $miniBarItems = [
            ['name' => 'Large Water', 'amount' => 100, 'status' => 'active'],
            ['name' => 'Small Water', 'amount' => 50, 'status' => 'active'],
            ['name' => 'Large Juice', 'amount' => 120, 'status' => 'active'],
            ['name' => 'Small Juice', 'amount' => 70, 'status' => 'active'],
            ['name' => 'Dairy Milk', 'amount' => 150, 'status' => 'active'],
            ['name' => 'Lays', 'amount' => 60, 'status' => 'active'],
            ['name' => 'Nimko', 'amount' => 80, 'status' => 'active'],
            ['name' => 'Biscuit', 'amount' => 90, 'status' => 'active'],
            ['name' => 'Can', 'amount' => 130, 'status' => 'active'],
        ];

        foreach ($miniBarItems as $item) {
            RoomMiniBar::updateOrCreate(
                ['name' => $item['name']],
                ['amount' => $item['amount'], 'status' => $item['status']]
            );
        }
    }
}