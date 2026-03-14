<?php

namespace Database\Seeders\Tenant;

use App\Models\KitchenDetail;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;

class RestuarantDatabaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        $superAdmin = User::factory()->create([
            'user_id' => 12345670,
            'name' => 'Super Admin',
            'email' => 'superadmin@gmail.com',
            'password' => bcrypt('12345678'),
        ]);

        $superAdmin->assignRole('super-admin');

        // Format the output
        $output = <<<TEXT

            ==================== 🌐 App Setup Complete ====================

            Super Admin:
                URL:       http://localhost:8000
                Login URL: http://localhost:8000/login
                Email:     {$superAdmin->email}
                Password:  12345678

            TEXT;

        // Show in terminal
        $this->command->info($output);

        $tenantPassword = '123456';

        $globalUserId = 12345671;

        for ($i = 1; $i <= 5; $i++) {
            $tenantName = "Afohs Restaurant $i";
            $tenant = Tenant::create([
                'name' => $tenantName,
                'email' => "afohs$i@gmail.com",
                'password' => $tenantPassword,
            ]);


            // $tenant->run(function () use (&$globalUserId, $tenant, $i, $tenantPassword, $subdomain) {
            // Admin
            $admin = User::create([
                'user_id' => $globalUserId++,
                'name' => $tenant->name,
                'email' => $tenant->email,
                'password' => bcrypt($tenantPassword),
                'tenant_id' => $tenant->id
            ]);
            $admin->assignRole('admin');

            // Employees
            User::factory()->count(2)->create()->each(function ($user) use (&$globalUserId, $tenant) {
                $user->update(['user_id' => $globalUserId++, 'password' => bcrypt('123456'), 'tenant_id' => $tenant->id]);
                $user->assignRole('employee');
            });

            // Waiters
            User::factory()->count(2)->create()->each(function ($user) use (&$globalUserId, $tenant) {
                $user->update(['user_id' => $globalUserId++, 'password' => bcrypt('123456'), 'tenant_id' => $tenant->id]);
                $user->assignRole('waiter');
            });

            // Kitchen
            $kitchen = User::create([
                'name' => "kitchen $i",
                'user_id' => $globalUserId++,
                'email' => "kitchen$i@gmail.com",
                'password' => bcrypt('123456'),
                'tenant_id' => $tenant->id
            ]);

            $kitchen->assignRole('kitchen');

            KitchenDetail::create([
                'kitchen_id' => $kitchen->id,
            ]);

            // // Customers
            // User::factory()->count(5)->create()->each(function ($user) use (&$globalUserId, $tenant) {
            //     $user->update(['user_id' => $globalUserId++, 'password' => bcrypt('123456'), 'member_type_id' => MemberType::pluck('id')->random(), 'tenant_id' => $tenant->id]);
            //     $user->assignRole('user');
            // });

            // });
            // Format the output
            $output = <<<TEXT

            Tenant ({$tenant->name}):
                id:        $admin->user_id
                URL:       http://localhost:8000/{$tenant->id}
                Login URL: http://localhost:8000/{$tenant->id}/login
                Email:     {$tenant->email}
                Password:  {$tenantPassword}

            TEXT;

            // Show in terminal
            $this->command->info($output);
        }
    }
}
