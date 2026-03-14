<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->word(),
            // 'image' => 'assets/cimage.png',
            'tenant_id' => null,
        ];
    }

    public function configure()
    {
        return $this->afterCreating(function (Category $category) {
            Product::factory()->count(6)->create([
                'category_id' => $category->id,
                'tenant_id' => $category->tenant_id,
            ]);
        });
    }
}