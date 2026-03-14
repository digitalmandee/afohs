<?php

namespace Database\Seeders\Tenant;

use App\Models\Floor;
use App\Models\Table;
use Illuminate\Database\Seeder;

class FloorDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $floors = [
            [
                'name' => 'First Floor',
                'area' => 'First Area',
                'status' => 1,
                'tables' => [
                    ['table_no' => 'T1', 'capacity' => 2],
                    ['table_no' => 'T2', 'capacity' => 4],
                    ['table_no' => 'T3', 'capacity' => 6],
                    ['table_no' => 'T4', 'capacity' => 8],
                    ['table_no' => 'T5', 'capacity' => 10],
                ]
            ],
            [
                'name' => 'Second Floor',
                'area' => 'Second Area',
                'status' => 1,
                'tables' => [
                    ['table_no' => 'T11', 'capacity' => 8],
                    ['table_no' => 'T12', 'capacity' => 4],
                    ['table_no' => 'T13', 'capacity' => 2],
                    ['table_no' => 'T14', 'capacity' => 6],
                    ['table_no' => 'T15', 'capacity' => 10],
                ]
            ],
        ];

        foreach ($floors as $floor) {
            $floorModel = Floor::create([
                'name' => $floor['name'],
                'area' => $floor['area'],
                'status' => $floor['status'],
            ]);

            foreach ($floor['tables'] as $table) {
                Table::create([
                    'floor_id' => $floorModel->id,
                    'table_no' => $table['table_no'],
                    'capacity' => $table['capacity'],
                ]);
            }
        }
    }
}
