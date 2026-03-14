<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesSeeder extends Seeder
{
    /**
     * Run the database seeders.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create Super Admin Role (has all permissions)
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->syncPermissions(Permission::all());

        // Create Admin Role (has most permissions except super admin features)
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $adminPermissions = [
            'admin.access',
            // Dashboard
            'dashboard.view',
            
            // Members Management
            'members.view', 'members.create', 'members.edit', 'members.delete',
            'family-members.view', 'family-members.create', 'family-members.edit', 'family-members.delete',
            'family-members.extend-expiry', 'family-members.bulk-expire',
            'member-categories.view', 'member-categories.create', 'member-categories.edit', 'member-categories.delete',
            'member-types.view', 'member-types.create', 'member-types.edit', 'member-types.delete',
            
            // Financial Management
            'financial.dashboard.view', 'financial.view', 'financial.create', 'financial.edit', 'financial.delete',
            'finance.dashboard.view', 'finance.view', 'finance.create',
            
            // Subscriptions
            'subscriptions.dashboard.view', 'subscriptions.view', 'subscriptions.create', 'subscriptions.edit', 'subscriptions.delete',
            'subscriptions.types.view', 'subscriptions.types.create', 'subscriptions.types.edit', 'subscriptions.types.delete',
            'subscriptions.categories.view', 'subscriptions.categories.create', 'subscriptions.categories.edit', 'subscriptions.categories.delete',
            
            // Kitchen
            'kitchen.dashboard.view', 'kitchen.view', 'kitchen.create', 'kitchen.edit', 'kitchen.delete',
            
            // Events Management
            'events.bookings.view', 'events.bookings.create', 'events.bookings.edit', 'events.bookings.delete',
            'events.bookings.completed', 'events.bookings.cancelled', 'events.bookings.calendar',
            'events.venue.view', 'events.venue.create', 'events.venue.edit', 'events.venue.delete',
            'events.menu.view', 'events.menu.create', 'events.menu.edit', 'events.menu.delete',
            'events.menuCategories.view', 'events.menuCategories.create', 'events.menuCategories.edit', 'events.menuCategories.delete',
            'events.menuTypes.view', 'events.menuTypes.create', 'events.menuTypes.edit', 'events.menuTypes.delete',
            'events.menuAdons.view', 'events.menuAdons.create', 'events.menuAdons.edit', 'events.menuAdons.delete',
            'events.chargesTypes.view', 'events.chargesTypes.create', 'events.chargesTypes.edit', 'events.chargesTypes.delete',
            
            // Room Bookings
            'rooms.bookings.view', 'rooms.bookings.create', 'rooms.bookings.edit', 'rooms.bookings.delete',
            'rooms.bookings.calendar', 'rooms.bookings.checkin', 'rooms.bookings.checkout', 'rooms.bookings.requests',
            'rooms.view', 'rooms.create', 'rooms.edit', 'rooms.delete',
            'rooms.types.view', 'rooms.types.create', 'rooms.types.edit', 'rooms.types.delete',
            'rooms.categories.view', 'rooms.categories.create', 'rooms.categories.edit', 'rooms.categories.delete',
            'rooms.chargesTypes.view', 'rooms.chargesTypes.create', 'rooms.chargesTypes.edit', 'rooms.chargesTypes.delete',
            'rooms.miniBar.view', 'rooms.miniBar.create', 'rooms.miniBar.edit', 'rooms.miniBar.delete',
            
            // Employee Management
            'employees.view', 'employees.create', 'employees.edit', 'employees.delete',
            'employees.attendance.view', 'employees.attendance.create', 'employees.attendance.edit',
            'employees.leaves.view', 'employees.leaves.approve',
            
            // Reports
            'reports.view',
            
            // // POS System (commented out)
            // 'pos.view', 'pos.orders.create', 'pos.orders.edit', 'pos.orders.delete',
            // 'pos.product.view', 'pos.product.create', 'pos.product.edit', 'pos.product.delete',
        ];
        $admin->syncPermissions(Permission::whereIn('name', $adminPermissions)->get());

        // Create Manager Role (can manage most things but not delete or create users)
        $manager = Role::firstOrCreate(['name' => 'manager']);
        $managerPermissions = [
            'admin.access',
            // Dashboard
            'dashboard.view',
            
            // Members Management (view and edit only)
            'members.view', 'members.edit',
            'family-members.view', 'family-members.edit',
            'member-categories.view',
            'member-types.view',
            
            // Financial Management (view, create, edit only)
            'financial.dashboard.view', 'financial.view', 'financial.create', 'financial.edit',
            'finance.dashboard.view', 'finance.view', 'finance.create',
            
            // Subscriptions (view, create, edit only)
            'subscriptions.dashboard.view', 'subscriptions.view', 'subscriptions.create', 'subscriptions.edit',
            'subscriptions.types.view', 'subscriptions.categories.view',
            
            // Kitchen (view only)
            'kitchen.dashboard.view', 'kitchen.view',
            
            // Events Management (view, create, edit only)
            'events.bookings.view', 'events.bookings.create', 'events.bookings.edit', 'events.bookings.calendar',
            'events.venue.view',
            'events.menu.view', 'events.menu.create', 'events.menu.edit',
            'events.menuCategories.view',
            'events.menuTypes.view',
            'events.menuAdons.view', 'events.menuAdons.create', 'events.menuAdons.edit',
            'events.chargesTypes.view',
            
            // Room Bookings (view, create, edit only)
            'rooms.bookings.view', 'rooms.bookings.create', 'rooms.bookings.edit', 'rooms.bookings.calendar',
            'rooms.bookings.checkin', 'rooms.bookings.checkout', 'rooms.bookings.requests',
            'rooms.view',
            'rooms.types.view', 'rooms.categories.view', 'rooms.chargesTypes.view', 'rooms.miniBar.view',
            
            // Employee Management (view only)
            'employees.view', 'employees.attendance.view', 'employees.leaves.view',
            
            // Reports
            'reports.view',
            
            // // POS System (commented out)
            // 'pos.view', 'pos.orders.create', 'pos.orders.edit',
            // 'pos.product.view',
        ];
        $manager->syncPermissions(Permission::whereIn('name', $managerPermissions)->get());

        // Create User Role (read-only access to most things)
        $user = Role::firstOrCreate(['name' => 'user']);
        $userPermissions = [
            'admin.access',
            // Dashboard
            'dashboard.view',
            
            // Members Management (view only)
            'members.view',
            'family-members.view',
            'member-categories.view',
            'member-types.view',
            
            // Financial Management (view only)
            'financial.dashboard.view', 'financial.view',
            'finance.dashboard.view', 'finance.view',
            
            // Subscriptions (view only)
            'subscriptions.dashboard.view', 'subscriptions.view',
            'subscriptions.types.view', 'subscriptions.categories.view',
            
            // Kitchen (view only)
            'kitchen.dashboard.view', 'kitchen.view',
            
            // Events Management (view only)
            'events.bookings.view', 'events.bookings.calendar',
            'events.venue.view',
            'events.menu.view', 'events.menuCategories.view', 'events.menuTypes.view',
            'events.menuAdons.view', 'events.chargesTypes.view',
            
            // Room Bookings (view only)
            'rooms.bookings.view', 'rooms.bookings.calendar',
            'rooms.view', 'rooms.types.view', 'rooms.categories.view',
            'rooms.chargesTypes.view', 'rooms.miniBar.view',
            
            // Employee Management (view only)
            'employees.view',
            
            // Reports (view only)
            'reports.view',
            
            // // POS System (commented out)
            // 'pos.view',
        ];
        $user->syncPermissions(Permission::whereIn('name', $userPermissions)->get());

        // Create Guest Role (very limited access)
        $guest = Role::firstOrCreate(['name' => 'guest']);
        $guestPermissions = [
            'admin.access',
            // Dashboard
            'dashboard.view',
            
            // Members Management (view only)
            'members.view',
            'family-members.view',
            
            // Events Management (view only)
            'events.bookings.view',
            'events.venue.view',
            
            // Room Bookings (view only)
            'rooms.bookings.view',
            'rooms.view',
        ];
        $guest->syncPermissions(Permission::whereIn('name', $guestPermissions)->get());

        $cashier = Role::firstOrCreate(['name' => 'cashier']);
        $cashierPermissions = [
            'pos.view',
            'pos.dashboard.view',
            'pos.orders.view',
            'pos.orders.create',
            'pos.orders.edit',
            'pos.orders.delete',
            'pos.orders.send-to-kitchen',
            'pos.orders.generate-invoice',
            'pos.orders.payment',
            'pos.tables.view',
            'pos.tables.manage',
            'pos.customers.view',
            'pos.customers.create',
            'pos.customers.edit',
        ];
        $cashier->syncPermissions(Permission::whereIn('name', $cashierPermissions)->get());

        $this->command->info('Roles and permissions assigned successfully!');
    }
}
