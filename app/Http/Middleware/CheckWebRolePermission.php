<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class CheckWebRolePermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $roles = null, $permissions = null)
    {
        $user = $request->user('tenant');
        if (!$user) {
            return abort(403);
        }
        $guard = 'web';  // Spatie guard for roles/permissions

        // Check roles
        if ($roles) {
            $rolesArray = explode('|', $roles);
            $hasRole = false;

            foreach ($rolesArray as $role) {
                if ($user->hasRole($role, $guard)) {
                    $hasRole = true;
                    break;
                }
            }

            if (!$hasRole) {
                // Return custom Inertia page instead of abort
                return Inertia::render('Errors/AccessDenied', [
                    'message' => 'You do not have the required role.'
                ]);
            }
        }

        // Check permissions
        if ($permissions) {
            $permissionsArray = explode('|', $permissions);
            $hasPermission = false;

            Log::info('user permissions: ' . json_encode($user->getAllPermissions()->pluck('name')->toArray()));

            foreach ($permissionsArray as $perm) {
                if ($user->hasPermissionTo($perm, $guard)) {
                    $hasPermission = true;
                    break;
                }
            }

            if (!$hasPermission) {
                // Return custom Inertia page instead of abort
                return Inertia::render('Errors/AccessDenied', [
                    'message' => 'You do not have the required permission.'
                ]);
            }
        }

        return $next($request);
    }
}
