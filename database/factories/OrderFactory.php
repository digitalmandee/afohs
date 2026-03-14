<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Table;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    protected $model = Order::class;

    public function definition(): array
    {
        return [
            'order_number' => $this->faker->unique()->numberBetween(100000, 999999),
            'user_id' => User::inRandomOrder()->value('id'),
            'waiter_id' => 7, // optional: ->nullable() if you want to skip sometimes
            'table_id' => Table::inRandomOrder()->value('id'),
            'order_type' => $this->faker->randomElement(['dineIn', 'takeaway', 'delivery']),
            'person_count' => $this->faker->numberBetween(1, 6),
            'down_payment' => $this->faker->optional()->numberBetween(100, 1000),
            'start_date' => $this->faker->optional()->date(),
            'start_time' => $this->faker->optional()->time(),
            'order_time' => $this->faker->optional()->dateTime(),
            'status' => $this->faker->randomElement(['pending', 'in_progress', 'completed', 'cancelled', 'no_show', 'refund']),
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Order $order) {
            OrderItem::factory()->count(3)->create(['order_id' => $order->id]);
        });
    }
}