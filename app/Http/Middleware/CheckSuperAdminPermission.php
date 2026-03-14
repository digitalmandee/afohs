<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;
use Inertia\Response as InertiaResponse;

class CheckSuperAdminPermission
{
    /**
     * Handle an incoming request for Super Admin Panel (web guard)
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, $permissions = null): Response|InertiaResponse
    {
        // Check if user is authenticated with web guard
        $user = Auth::guard('web')->user();
        
        if (!$user) {
            return redirect()->route('login');
        }

        // Check permissions if specified
        if ($permissions) {
            $permissionsArray = explode('|', $permissions);
            $hasPermission = false;

            foreach ($permissionsArray as $permission) {
                if ($user->can($permission, 'web')) {
                    $hasPermission = true;
                    break;
                }
            }

            if (!$hasPermission) {
                return Inertia::render('Errors/AccessDenied', [
                    'message' => 'You do not have permission to access this resource.',
                    'required_permission' => $permissions
                ]);
            }
        }

        return $next($request);
    }
}
