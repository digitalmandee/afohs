<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SubscriptionSeeder extends Seeder
{
    public function run(): void
    {
        // Define subscription types (main categories)
        $types = [
            ['name' => 'Sports', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Music', 'created_at' => now(), 'updated_at' => now()],
            ['name' => 'Education', 'created_at' => now(), 'updated_at' => now()],
        ];

        DB::table('subscription_types')->insert($types);

        // Fetch the inserted IDs
        $typeIds = DB::table('subscription_types')->pluck('id', 'name');

        // Define related categories for each type
        $categories = [
            // Sports
            [
                'name' => 'Football',
                'subscription_type_id' => $typeIds['Sports'],
                'description' => 'Access to football events',
                'fee' => 1500,
                'subscription_fee' => 100,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Basketball',
                'subscription_type_id' => $typeIds['Sports'],
                'description' => 'Basketball games and updates',
                'fee' => 1200,
                'subscription_fee' => 80,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Music
            [
                'name' => 'Classical',
                'subscription_type_id' => $typeIds['Music'],
                'description' => 'Classical music access',
                'fee' => 1000,
                'subscription_fee' => 70,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Rock',
                'subscription_type_id' => $typeIds['Music'],
                'description' => 'Rock music and concerts',
                'fee' => 1300,
                'subscription_fee' => 90,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],

            // Education
            [
                'name' => 'Mathematics',
                'subscription_type_id' => $typeIds['Education'],
                'description' => 'Math tutorials and quizzes',
                'fee' => 800,
                'subscription_fee' => 60,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Science',
                'subscription_type_id' => $typeIds['Education'],
                'description' => 'Science experiments and notes',
                'fee' => 900,
                'subscription_fee' => 70,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('subscription_categories')->insert($categories);
    }
}
