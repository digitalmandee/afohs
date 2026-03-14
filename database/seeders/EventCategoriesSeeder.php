<?php

namespace Database\Seeders;

use App\Models\EventMenu;
use App\Models\EventMenuCategory;
use Illuminate\Database\Seeder;

class EventCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['name' => 'Assorted Naan', 'status' => 'active'],
            ['name' => 'Chicken Qorma or Karari', 'status' => 'active'],
            ['name' => 'Chicken Biryani', 'status' => 'active'],
            ['name' => 'Salad 3 Types', 'status' => 'active'],
            ['name' => 'Raita', 'status' => 'active'],
            ['name' => 'Desert One Type', 'status' => 'active'],
            ['name' => 'Mineral Water', 'status' => 'active'],
            ['name' => 'Soft Drinks', 'status' => 'active'],
            ['name' => 'Mutton Qorma or Karahi', 'status' => 'active'],
            ['name' => 'Chicken Kabab or Chicken Boti', 'status' => 'active'],
            ['name' => 'Chicken Achari Karahi or Murgh Chana', 'status' => 'active'],
            ['name' => 'Puri or Pathore', 'status' => 'active'],
            ['name' => 'Aloo Bhujia', 'status' => 'active'],
            ['name' => 'Halwa', 'status' => 'active'],
            ['name' => 'Hot & Sour or Chicken Corn Soup', 'status' => 'active'],
            ['name' => 'Fried Fish', 'status' => 'active'],
            ['name' => 'Chicken Kabab', 'status' => 'active'],
            ['name' => 'Chicken Boti', 'status' => 'active'],
            ['name' => 'Chicken Manchurian or Sweet & Sour', 'status' => 'active'],
            ['name' => 'Chicken Fried or Egg Fried Rice', 'status' => 'active'],
            ['name' => 'Chicken Karahi', 'status' => 'active'],
        ];

        $menus = [
            ['name' => 'Banquet Menu A', 'amount' => 1149, 'status' => 'active', 'items' => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]],
            ['name' => 'Banquet Menu B', 'amount' => 1449, 'status' => 'active', 'items' => [12, 13, 14, 15, 16, 7, 5, 1, 4, 3]],
            ['name' => 'Banquet Menu C', 'amount' => 1199, 'status' => 'active', 'items' => [15, 16, 17, 18, 19, 20, 12, 8, 9, 10]],
            ['name' => 'Banquet Menu D', 'amount' => 1549, 'status' => 'active', 'items' => [11, 14, 6, 3, 2, 9, 18, 19, 20, 15]],
            ['name' => 'Special Event Menu For Mehndi', 'amount' => 1199, 'status' => 'active', 'items' => [6, 7, 8, 9, 10, 18, 19, 20, 1, 5]],
            ['name' => 'Special Get Together Menu', 'amount' => 1849, 'status' => 'active', 'items' => [1, 2, 3, 4, 5, 15, 16, 17, 18, 20]],
        ];

        foreach ($categories as $category) {
            EventMenuCategory::updateOrCreate(
                ['name' => $category['name']],
                ['status' => $category['status']]
            );
        }

        foreach ($menus as $menu) {
            $newMenu = EventMenu::updateOrCreate(
                ['name' => $menu['name'], 'amount' => $menu['amount'], 'status' => $menu['status']],
            );
            foreach ($menu['items'] as $item) {
                $newMenu->items()->create([
                    'menu_category_id' => $item,
                    'status' => 'active',
                ]);
            }
        }
    }
}
