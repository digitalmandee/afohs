<?php

namespace Database\Seeders;

use Database\Seeders\Tenant\FloorDatabaseSeeder;
use Database\Seeders\Tenant\KitchenDatabaseSeeder;
use Database\Seeders\Tenant\OrderDatabaseSeeder;
use Database\Seeders\Tenant\PermissionsDatabaseSeeder;
use Database\Seeders\Tenant\ProductDatabaseSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call([
            FloorDatabaseSeeder::class,
            PermissionsDatabaseSeeder::class,
            KitchenDatabaseSeeder::class,
            ProductDatabaseSeeder::class,
            OrderDatabaseSeeder::class
        ]);
    }
}
