<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('settings')->insert([
            'tax' => 15, // Insert an integer value
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }
}
