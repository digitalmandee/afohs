<?php

namespace Database\Seeders\Tenant;

use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Restaurant;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ProductDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        Tenant::all()->each(function ($restaurant) {
            Category::factory()
                ->count(random_int(5, 10))
                ->state([
                    'tenant_id' => $restaurant->id,
                ])
                ->create();
        });
    }
}