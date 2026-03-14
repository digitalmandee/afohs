<?php

namespace App\Http\Controllers\App\Auth;

use App\Helpers\TenantLogout;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\TenantLoginRequest;
use App\Models\PosLocation;
use App\Models\UserLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    private function safeRedirectTo(?string $redirectTo): ?string
    {
        $redirectTo = $redirectTo !== null ? trim($redirectTo) : null;

        return $redirectTo
            && Str::startsWith($redirectTo, '/')
            && !Str::startsWith($redirectTo, '//')
            && !Str::contains($redirectTo, ['://', "\n", "\r"])
            ? $redirectTo
            : null;
    }

    /**
     * Show the login page.
     */
    public function create(Request $request): Response
    {
        return Inertia::render('App/Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $request->session()->get('status'),
            'routes' => [
                'checkUserId' => 'tenant.check-user-id',
                'login' => 'tenant.login',
            ],
        ]);
    }

    public function createPos(Request $request)
    {
        if (Auth::guard('tenant')->check()) {
            if ($request->session()->has('active_pos_location_id')) {
                return redirect()->route('pos.dashboard');
            }

            return redirect()->route('pos.select-pos-location');
        }

        $webUser = Auth::guard('web')->user();
        if ($webUser && ($webUser->hasRole('admin') || $webUser->hasRole('super-admin'))) {
            Auth::guard('tenant')->login($webUser);
            $request->session()->regenerate();

            if ($request->session()->has('active_pos_location_id')) {
                return redirect()->route('pos.dashboard');
            }

            return redirect()->route('pos.select-pos-location');
        }

        return Inertia::render('App/Auth/Login', [
            'canResetPassword' => false,
            'status' => $request->session()->get('status'),
            'routes' => [
                'checkUserId' => 'pos.check-user-id',
                'login' => 'pos.login',
            ],
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(TenantLoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::guard('tenant')->user();
        $restaurantId = tenant('id');

        if (tenant('status') !== 'active') {
            Auth::guard('tenant')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('tenant.login', ['tenant' => tenant('id')])->withErrors([
                'employee_id' => 'Access denied. Restaurant is inactive.',
            ]);
        }

        // 🔹 Super Admin Bypass
        if ($user->hasRole('super-admin')) {
            UserLog::create([
                'user_id' => $user->id,
                'type' => 'login',
                'logged_at' => now(),
                'restaurant_id' => $restaurantId,
            ]);

            return redirect()->intended(route('tenant.dashboard', absolute: false));
        }

        // ✅ Only cashier/employee can proceed if not super admin
        if ($user->hasRole('cashier') || $user->employee) {
            // 🔹 1. Check Employee Status
            if ($user->employee && $user->employee->status !== 'active') {
                Auth::guard('tenant')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('tenant.login', ['tenant' => tenant('id')])->withErrors([
                    'employee_id' => 'Access denied. Your account is not active.',
                ]);
            }

            // 🔹 2. Check Tenant Access
            $currentTenant = tenant('id');
            $allowedTenants = $user->getAllowedTenantIds();

            // If no tenants assigned OR current tenant not in allowed list
            if (empty($allowedTenants) || !in_array($currentTenant, $allowedTenants)) {
                Auth::guard('tenant')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return redirect()->route('tenant.login', ['tenant' => tenant('id')])->withErrors([
                    'employee_id' => 'Access denied. You do not have access to this restaurant.',
                ]);
            }

            UserLog::create([
                'user_id' => $user->id,
                'type' => 'login',
                'logged_at' => now(),
                'restaurant_id' => $restaurantId,
            ]);

            return redirect()->intended(route('tenant.dashboard', absolute: false));
        }

        // ❌ Not authorized
        Auth::guard('tenant')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('tenant.login', ['tenant' => tenant('id')])->withErrors([
            'employee_id' => 'Access denied. Only authorized employees can log in.',
        ]);
    }

    public function storePos(TenantLoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        $user = Auth::guard('tenant')->user();

        if ($user->employee && $user->employee->status !== 'active') {
            Auth::guard('tenant')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('pos.login')->withErrors([
                'employee_id' => 'Access denied. Your account is not active.',
            ]);
        }

        if (!$user->can('pos.view')) {
            Auth::guard('tenant')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('pos.login')->withErrors([
                'employee_id' => 'Access denied. You do not have POS access.',
            ]);
        }

        $request->session()->forget('active_pos_location_id');

        UserLog::create([
            'user_id' => $user->id,
            'type' => 'login',
            'logged_at' => now(),
            'restaurant_id' => null,
        ]);

        return redirect()->route('pos.select-pos-location');
    }

    public function selectPosLocation(Request $request): Response|RedirectResponse
    {
        $locations = PosLocation::query()
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        if ($locations->isEmpty()) {
            return redirect()->route('pos.login')->withErrors([
                'pos_location_id' => 'No active POS locations found.',
            ]);
        }

        if ($locations->count() === 1) {
            session(['active_pos_location_id' => $locations->first()->id]);

            $redirectTo = $this->safeRedirectTo($request->query('redirect_to'));
            return $redirectTo ? redirect()->to($redirectTo) : redirect()->route('pos.dashboard');
        }

        return Inertia::render('App/Auth/SelectRestaurant', [
            'restaurants' => $locations->map(fn($l) => ['id' => $l->id, 'name' => $l->name])->values(),
            'title' => 'Select POS Location',
            'postRouteName' => 'pos.set-pos-location',
            'fieldName' => 'pos_location_id',
            'redirectTo' => $this->safeRedirectTo($request->query('redirect_to')),
        ]);
    }

    public function setPosLocation(Request $request): RedirectResponse
    {
        $activeLocationIds = PosLocation::query()
            ->where('status', 'active')
            ->pluck('id')
            ->all();

        $request->validate([
            'pos_location_id' => ['required', Rule::in($activeLocationIds)],
            'redirect_to' => ['nullable', 'string', 'max:2048'],
        ]);

        session(['active_pos_location_id' => (int) $request->pos_location_id]);

        $redirectTo = $this->safeRedirectTo($request->input('redirect_to'));
        return $redirectTo ? redirect()->to($redirectTo) : redirect()->route('pos.dashboard');
    }

    public function destroyPos(Request $request): RedirectResponse
    {
        TenantLogout::logout($request, 'tenant');

        return redirect()->route('pos.login');
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        TenantLogout::logout($request);

        return redirect(route('tenant.login'));
    }
}
