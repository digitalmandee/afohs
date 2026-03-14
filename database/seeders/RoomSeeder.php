<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RoomSeeder extends Seeder
{
    public function run(): void
    {
        // Define active categories
        $activeCategoryIds = [1, 2, 3, 4, 6, 7];

        // Define room data
        $rooms = [
            [
                'name' => 'Room1',
                'room_type_id' => 1,
                'number_of_beds' => 2,
                'max_capacity' => 4,
                'number_of_bathrooms' => 1,
                'photo_path' => 'images/standard.jpg',
                'categories' => [
                    ['id' => 1, 'amount' => 100],
                    ['id' => 2, 'amount' => 200],
                    ['id' => 6, 'amount' => 300],
                ],
            ],
            [
                'name' => 'Room2',
                'room_type_id' => 2,
                'number_of_beds' => 3,
                'max_capacity' => 6,
                'number_of_bathrooms' => 2,
                'photo_path' => 'images/deluxe.jpg',
                'categories' => [
                    ['id' => 3, 'amount' => 400],
                    ['id' => 4, 'amount' => 500],
                ],
            ],
            [
                'name' => 'Room3',
                'room_type_id' => 1,
                'number_of_beds' => 1,
                'max_capacity' => 2,
                'number_of_bathrooms' => 1,
                'photo_path' => 'images/economy.jpg',
                'categories' => [
                    ['id' => 7, 'amount' => 150],
                ],
            ],
        ];

        foreach ($rooms as $room) {
            // Extract category data and remove it before insert
            $categories = $room['categories'] ?? [];
            unset($room['categories']);

            // Add timestamps
            $room['created_at'] = now();
            $room['updated_at'] = now();

            // Insert room and get ID
            $roomId = DB::table('rooms')->insertGetId($room);

            // Insert category charges for this room
            foreach ($categories as $cat) {
                if (in_array($cat['id'], $activeCategoryIds)) {
                    DB::table('room_category_charges')->insert([
                        'room_category_id' => $cat['id'],
                        'room_id' => $roomId,
                        'amount' => $cat['amount'],
                        'status' => 'active',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }
    }
}
