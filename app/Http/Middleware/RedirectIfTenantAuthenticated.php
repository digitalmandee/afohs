<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;
use Closure;

class RedirectIfTenantAuthenticated
{
    public function handle(Request $request, Closure $next, string $guard = 'tenant'): Response
    {
        if (Auth::guard($guard)->check()) {
            $tenantId = $request->route('tenant');
            $user = Auth::guard('tenant')->user();
            if ($user->hasRole('kitchen', 'web')) {
                return redirect()->route('kitchen.index', ['tenant' => $tenantId]);
            }
            return redirect()->route('tenant.dashboard', ['tenant' => $tenantId]);
        }

        return $next($request);
    }
}
