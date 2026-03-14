<?php

namespace Database\Seeders;

use App\Models\RoomCategory;
use Illuminate\Database\Seeder;

class RoomCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Armed Forces Member', 'status' => 'active'],
            ['name' => 'Armed Forces Non Member', 'status' => 'active'],
            ['name' => 'Non Member', 'status' => 'active'],
            ['name' => 'Foreigners', 'status' => 'active'],
            ['name' => 'Armed Forces Guests', 'status' => 'inactive'],
            ['name' => 'Members or Family Members', 'status' => 'active'],
            ['name' => "Member's Guest", 'status' => 'active'],
        ];

        foreach ($categories as $category) {
            RoomCategory::updateOrCreate(
                ['name' => $category['name']],
                ['status' => $category['status']]
            );
        }
    }
}
