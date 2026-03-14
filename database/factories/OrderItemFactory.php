<?php

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'order_item' => [
                'id' => $this->faker->numberBetween(1, 10),
                'name' => $this->faker->word(),
                'price' => $this->faker->randomFloat(2, 10, 100),
                'total_price' => $this->faker->randomFloat(2, 10, 100),
                'quantity' => $this->faker->numberBetween(1, 5),
                'category' => $this->faker->word(),
                'variants' => [],
            ],
            'status' => $this->faker->randomElement(['pending', 'completed', 'cancelled']),
        ];
    }
}
