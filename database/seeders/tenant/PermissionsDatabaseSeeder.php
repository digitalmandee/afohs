<?php

namespace Database\Seeders\Tenant;

use App\Models\Restaurant;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionsDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Permissions ---
        $permissions = ['dashboard', 'order', 'kitchen', 'user', 'admin'];
        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // --- Roles with Permissions ---
        $rolesWithPermissions = [
            'super-admin' => Permission::all()->pluck('name'),
            'admin' => ['dashboard', 'order', 'user', 'admin'],
            'employee' => ['dashboard', 'order'],
            'cashier' => ['order'],
            'waiter' => ['order'],
            'kitchen' => ['kitchen'],
            'user' => ['dashboard'],
        ];

        foreach ($rolesWithPermissions as $role => $perms) {
            $roleInstance = Role::firstOrCreate(['name' => $role]);
            $roleInstance->syncPermissions($perms);
        }

        // --- Create Super Admin (no tenant_id needed) ---
        // $superAdmin = User::factory()->create([
        //     'name' => 'Super Admin',
        //     'email' => 'superadmin@app.com',
        //     'password' => bcrypt('password'),
        // ]);
        // $superAdmin->assignRole('super-admin');
    }
}
