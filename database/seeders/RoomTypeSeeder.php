<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RoomType; // or RoomCategory, depending on your model name

class RoomTypeSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Executive Suite', 'status' => 'active'],
            ['name' => 'Deluxe', 'status' => 'active'],
            ['name' => "Guest House", 'status' => 'active'],
        ];

        foreach ($categories as $category) {
            RoomType::updateOrCreate(
                ['name' => $category['name']],
                ['status' => $category['status']]
            );
        }
    }
}
