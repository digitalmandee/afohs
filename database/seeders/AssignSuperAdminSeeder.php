<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class AssignSuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        // Find the first user or create one
        $user = User::first();
        
        if (!$user) {
            $user = User::create([
                'name' => 'Super Admin',
                'email' => 'admin@afohs.com',
                'password' => bcrypt(12345678),
            ]);
        }

        // Assign super-admin role
        $superAdminRole = Role::where('name', 'super-admin')->first();
        if ($superAdminRole && !$user->hasRole('super-admin')) {
            $user->assignRole('super-admin');
            $this->command->info("Super Admin role assigned to user: {$user->email}");
        }

        // Also create a test user with 'user' role
        $testUser = User::where('email', 'user@afohs.com')->first();
        if (!$testUser) {
            $testUser = User::create([
                'name' => 'Test User',
                'email' => 'user@afohs.com',
                'password' => bcrypt(12345678),
            ]);
            
            $userRole = Role::where('name', 'user')->first();
            if ($userRole) {
                $testUser->assignRole('user');
                $this->command->info("User role assigned to test user: {$testUser->email}");
            }
        }
    }
}
