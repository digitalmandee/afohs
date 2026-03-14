<?php

namespace App\Http\Middleware;

use App\Models\Tenant;
use Closure;
use Illuminate\Http\Request;

class InitializePosTenancy
{
    public function handle(Request $request, Closure $next)
    {
        if (!$request->session()->has('active_pos_location_id')) {
            return redirect()->route('pos.select-pos-location', [
                'redirect_to' => $request->getRequestUri(),
            ]);
        }

        $tenantId = $request->session()->get('active_restaurant_id');
        if (!$tenantId) {
            return $next($request);
        }

        $tenant = Tenant::find($tenantId);
        if (!$tenant || $tenant->status !== 'active') {
            $request->session()->forget(['active_restaurant_id', 'active_company_id']);
            return $next($request);
        }

        tenancy()->initialize($tenant);

        try {
            return $next($request);
        } finally {
            tenancy()->end();
        }
    }
}
