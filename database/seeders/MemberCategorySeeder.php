<?php

namespace Database\Seeders;

use App\Models\MemberCategory;
use Illuminate\Database\Seeder;
use App\Models\MemberType;

class MemberCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $memberCategories = [
            [
                'name' => 'SO',
                'description' => 'Armed Forces (Serving)',
                'fee' => 10000,
                'subscription_fee' => 500,
                'status' => 'active',
            ],
            [
                'name' => 'CS',
                'description' => 'Civil Services',
                'fee' => 300000,
                'subscription_fee' => 2500,
                'status' => 'active',
            ],
            [
                'name' => 'FR',
                'description' => 'Falcon Resident',
                'fee' => 200000,
                'subscription_fee' => 2000,
                'status' => 'active',
            ],
            [
                'name' => 'AE/D',
                'description' => 'Associate D',
                'fee' => 350000,
                'subscription_fee' => 3500,
                'status' => 'active',
            ],
            [
                'name' => 'OP',
                'description' => 'Overseas Pakistani',
                'fee' => 300000,
                'subscription_fee' => 3000,
                'status' => 'active',
            ],
            [
                'name' => 'AS',
                'description' => 'Askari-V',
                'fee' => 200000,
                'subscription_fee' => 2000,
                'status' => 'active',
            ],
            [
                'name' => 'AE',
                'description' => 'Associate',
                'fee' => 400000,
                'subscription_fee' => 3500,
                'status' => 'active',
            ],
            [
                'name' => 'FR/D',
                'description' => 'Falcon Resident D',
                'fee' => 150000,
                'subscription_fee' => 2000,
                'status' => 'active',
            ],
            [
                'name' => 'AS/D',
                'description' => 'Askari-V D',
                'fee' => 150000,
                'subscription_fee' => 2000,
                'status' => 'active',
            ],
            [
                'name' => 'SC',
                'description' => 'Special Category',
                'fee' => 10000,
                'subscription_fee' => 5000,
                'status' => 'active',
            ],
            [
                'name' => 'HY',
                'description' => 'Honorary Member',
                'fee' => 0,
                'subscription_fee' => 0,
                'status' => 'active',
            ],
            [
                'name' => 'AF',
                'description' => 'Armed Forces (Retd.)',
                'fee' => 10000,
                'subscription_fee' => 500,
                'status' => 'active',
            ],
            [
                'name' => 'CE',
                'description' => 'Corporate Executive',
                'fee' => 0,
                'subscription_fee' => 0,
                'status' => 'active',
            ],
        ];

        foreach ($memberCategories as $memberCategory) {
            MemberCategory::updateOrCreate($memberCategory);
        }
    }
}