<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

class KitchenRoleSupport
{
    public const ROLE_NAME = 'kitchen';
    public const GUARD_NAME = 'web';

    public static function exists(): bool
    {
        return Role::query()
            ->where('name', self::ROLE_NAME)
            ->where('guard_name', self::GUARD_NAME)
            ->exists();
    }

    public static function find(): ?Role
    {
        return Role::query()
            ->where('name', self::ROLE_NAME)
            ->where('guard_name', self::GUARD_NAME)
            ->first();
    }

    public static function message(): string
    {
        return 'Kitchen role is not configured yet. Please run the roles and permissions seeders.';
    }

    public static function logMissing(string $action, array $context = []): void
    {
        Log::warning('setup.kitchen_role.missing', array_merge([
            'event' => 'setup.kitchen_role.missing',
            'action' => $action,
            'role_name' => self::ROLE_NAME,
            'guard_name' => self::GUARD_NAME,
        ], $context));
    }

    public static function usersQuery(): Builder
    {
        $query = User::query();

        if (!self::exists()) {
            return $query->whereRaw('1 = 0');
        }

        return $query->role(self::ROLE_NAME, self::GUARD_NAME);
    }
}
