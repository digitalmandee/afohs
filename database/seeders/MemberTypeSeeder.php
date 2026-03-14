<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\MemberType;

class MemberTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $memberTypes = [
            [
                'name' => 'Basic',
            ],
            [
                'name' => 'Premium',
            ],
            [
                'name' => 'Silver',
            ],
            [
                'name' => 'Gold',
            ],
            [
                'name' => 'Applied Member',
            ],
            [
                'name' => 'Affiliated Member',
            ],
            [
                'name' => 'VIP Guest',
            ],
            [
                'name' => 'Employee',
            ],
            [
                'name' => 'Platinum',
            ],
        ];

        foreach ($memberTypes as $memberType) {
            MemberType::updateOrCreate($memberType);
        }
    }
}