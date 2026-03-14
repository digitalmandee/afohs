<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Log;

class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word(),
            'tenant_id' => null,
            'menu_code' => $this->faker->bothify('MC-###'),
            'description' => $this->faker->paragraph(),
            'kitchen_id' => User::role('kitchen', 'web')->inRandomOrder()->value('id'),
            'images' => [],
            'category_id' => Category::factory(),
            'base_price' => $this->faker->randomFloat(2, 10, 100),
            'cost_of_goods_sold' => $this->faker->randomFloat(2, 5, 50),
            'current_stock' => $this->faker->numberBetween(0, 100),
            'minimal_stock' => $this->faker->numberBetween(1, 10),
            'notify_when_out_of_stock' => $this->faker->boolean(),
            'available_order_types' => ['dineIn', 'takeaway'],
        ];
    }
}