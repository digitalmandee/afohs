<?php

namespace App\Http\Middleware;

use App\Models\PosLocation;
use App\Models\Tenant;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $sessionRestaurantId = $request->session()->get('active_restaurant_id');
        $sessionRestaurant = $sessionRestaurantId ? Tenant::select('id', 'name')->find($sessionRestaurantId) : null;
        $currentTenant = tenant();

        $sessionPosLocationId = $request->session()->get('active_pos_location_id');
        $sessionPosLocation = $sessionPosLocationId ? PosLocation::select('id', 'name')->find($sessionPosLocationId) : null;

        $activeRestaurant = null;
        if ($sessionRestaurant) {
            $activeRestaurant = ['id' => $sessionRestaurant->id, 'name' => $sessionRestaurant->name];
        } elseif ($currentTenant) {
            $activeRestaurant = ['id' => $currentTenant->id, 'name' => $currentTenant->name];
        }

        $activePosLocation = null;
        if ($sessionPosLocation) {
            $activePosLocation = ['id' => $sessionPosLocation->id, 'name' => $sessionPosLocation->name];
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'tenant' => tenant(),
            'activeRestaurant' => $activeRestaurant,
            'activePosLocation' => $activePosLocation,
            'auth' => [
                'user' => $request->user()?->load('employee:id,user_id,employee_id,phone_no,designation,address'),
                'role' => $request->user()?->roles->first()?->name ?? null,
                'permissions' => $request->user()?->getAllPermissions()->pluck('name'),
                'roles' => $request->user()?->roles->pluck('name') ?? collect(),
            ],
            'tenantAssetBase' => '',
            'ziggy' => fn(): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => !$request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'requestMeta' => [
                'request_id' => $request->attributes->get('request_id'),
                'correlation_id' => $request->attributes->get('correlation_id'),
            ],
        ];
    }
}
