<?php

namespace App\Helpers;

use App\Models\UserLog;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TenantLogout
{
    public static function logout(Request $request, $guard = 'tenant')
    {
        $user = Auth::guard($guard)->user();

        if ($user) {
            $now = Carbon::now();

            // If between midnight and 4 AM → treat date as previous day
            if ($now->hour < 4) {
                $loggedAt = $now->copy()->subDay()->setDate(
                    $now->copy()->subDay()->year,
                    $now->copy()->subDay()->month,
                    $now->copy()->subDay()->day
                );
                $loggedAt->setTime($now->hour, $now->minute, $now->second);
            } else {
                $loggedAt = $now;
            }

            $restaurantId = $request->session()->get('active_restaurant_id') ?? $request->route('tenant');

            UserLog::create([
                'user_id' => $user->id,
                'type' => 'logout',
                'logged_at' => $loggedAt,
                'restaurant_id' => $restaurantId,
            ]);
        }

        Auth::guard($guard)->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        session()->forget(['active_restaurant_id', 'active_company_id', 'active_pos_location_id']);
    }
}
