<?php

namespace App\Http\Middleware;

use App\Helpers\TenantLogout;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class AuthenticateTenant
{
    public function handle(Request $request, Closure $next, string $guard = 'tenant'): Response
    {
        $currentTenant = tenant('id');

        if (Auth::guard($guard)->check()) {
            if (tenant('status') !== 'active') {
                TenantLogout::logout($request);
                return redirect()
                    ->route('tenant.login', ['tenant' => $currentTenant])
                    ->with('error', 'Restaurant is inactive.');
            }

            // Compare logged-in tenant vs current tenant
            $loggedInTenant = session('active_restaurant_id');

            if ($loggedInTenant && $loggedInTenant !== $currentTenant) {
                TenantLogout::logout($request);

                return redirect()->route('tenant.login', ['tenant' => $currentTenant]);
            }

            // // Check if user has access to this tenant (restaurant)
            // $user = Auth::guard($guard)->user();

            // // Bypass for Super Admin
            // if (!$user->hasRole('super-admin')) {
            //     // 1. Check Employee Status
            //     if ($user->employee && $user->employee->status !== 'active') {
            //         TenantLogout::logout($request);
            //         return redirect()
            //             ->route('tenant.login', ['tenant' => $currentTenant])
            //             ->with('error', 'Your account is not active.');
            //     }

            //     // 2. Check Tenant Access
            //     $allowedTenants = $user->getAllowedTenantIds();

            //     // If no tenants assigned OR current tenant not in allowed list
            //     if (empty($allowedTenants) || !in_array($currentTenant, $allowedTenants)) {
            //         TenantLogout::logout($request);
            //         return redirect()
            //             ->route('tenant.login', ['tenant' => $currentTenant])
            //             ->with('error', 'You do not have access to this restaurant.');
            //     }
            // }
        }

        if (!Auth::guard($guard)->check()) {
            return redirect()->route('tenant.login', ['tenant' => $currentTenant]);
        }

        session([
            'active_restaurant_id' => $currentTenant,
        ]);

        return $next($request);
    }
}
