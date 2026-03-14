<?php

namespace Database\Seeders;

use App\Models\MemberClassification;
use Illuminate\Database\Seeder;
use App\Models\MemberType;

class MemberClassificationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $memberClassifications = [
            [
                'code' => 1,
                'desc' => 'Regular',
                'status' => 'Active',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2020-04-08 16:26:58',
                'deleted_at' => NULL,
            ],
            [
                'code' => 2,
                'desc' => 'Provisional',
                'status' => 'Active',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2020-04-08 16:24:49',
                'deleted_at' => NULL,
            ],
            [
                'code' => 3,
                'desc' => 'Temporary',
                'status' => 'Inactive',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2025-03-14 14:40:59',
                'deleted_at' => NULL,
                'deleted_by' => 15,
            ],
            [
                'code' => 4,
                'desc' => 'Honourary',
                'status' => 'Active',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2020-04-08 16:27:18',
                'deleted_at' => '2020-04-08 16:27:18',
            ],
            [
                'code' => 5,
                'desc' => 'Sports Based',
                'status' => 'Inactive',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2025-03-14 14:41:02',
                'deleted_at' => NULL,
                'deleted_by' => 15,
            ],
            [
                'code' => 6,
                'desc' => 'Discounted',
                'status' => 'Active',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2020-04-08 16:27:23',
                'deleted_at' => '2020-04-08 16:27:23',
            ],
            [
                'code' => 7,
                'desc' => 'Family Discount',
                'status' => 'Active',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2020-04-08 16:27:28',
                'deleted_at' => '2020-04-08 16:27:28',
            ],
            [
                'code' => 8,
                'desc' => 'Shaheed Discount',
                'status' => 'Active',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2020-04-08 16:26:41',
                'deleted_at' => '2020-04-08 16:26:41',
            ],
            [
                'code' => 9,
                'desc' => 'Permanent',
                'status' => 'Inactive',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2025-03-14 14:41:05',
                'deleted_at' => NULL,
                'deleted_by' => 15,
            ],
            [
                'code' => 10,
                'desc' => 'Dining Based',
                'status' => 'Inactive',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2025-03-14 14:41:20',
                'deleted_at' => NULL,
                'deleted_by' => 15,
            ],
            [
                'code' => 11,
                'desc' => 'On Hold',
                'status' => 'Active',
                'created_at' => '2019-11-26 10:52:48',
                'updated_at' => '2019-11-26 10:52:48',
                'deleted_at' => NULL,
            ],
        ];

        foreach ($memberClassifications as $memberClassification) {
            MemberClassification::updateOrCreate($memberClassification);
        }
    }
}