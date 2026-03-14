<?php

namespace App\Http\Controllers;

use App\Models\PosLocation;
use App\Models\PosShift;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PosShiftController extends Controller
{
    private function restaurantId(Request $request = null)
    {
        $request = $request ?? request();
        return $request->session()->get('active_restaurant_id') ?? tenant('id');
    }

    private function posLocationId(Request $request = null): ?int
    {
        $request = $request ?? request();
        $locationId = $request->session()->get('active_pos_location_id');

        return $locationId ? (int) $locationId : null;
    }

    private function getActiveShiftForUser(int $userId)
    {
        return PosShift::where('user_id', $userId)
            ->where('status', 'active')
            ->with(['tenant:id,name', 'posLocation:id,name'])
            ->latest()
            ->first();
    }

    /**
     * Get shift history for the current user.
     */
    public function history()
    {
        $user = Auth::user();

        $shifts = PosShift::where('user_id', $user->id)
            ->with(['tenant:id,name', 'posLocation:id,name'])
            ->latest()
            ->limit(50)
            ->get();

        return response()->json($shifts);
    }

    /**
     * Check if the current user has an active shift for today.
     */
    public function status()
    {
        $user = Auth::user();

        $activeShift = $this->getActiveShiftForUser($user->id);
        if ($activeShift && !$activeShift->relationLoaded('posLocation')) {
            $activeShift->load('posLocation:id,name');
        }

        if ($activeShift && !$activeShift->posLocation) {
            $posLocationId = $this->posLocationId();
            if ($posLocationId) {
                $posLocation = PosLocation::query()->select('id', 'name')->find($posLocationId);
                if ($posLocation) {
                    $activeShift->setRelation('posLocation', $posLocation);
                }
            }
        }

        return response()->json([
            'has_active_shift' => (bool) $activeShift,
            'shift' => $activeShift
        ]);
    }

    /**
     * Start a new shift.
     */
    public function start(Request $request)
    {
        // No input validation needed as we auto-set date/time

        $user = Auth::user();
        $tenantId = $this->restaurantId($request);
        $posLocationId = $this->posLocationId($request);

        if (!$posLocationId) {
            return response()->json([
                'success' => false,
                'message' => 'POS location is not selected. Please select a POS location first.',
            ], 400);
        }

        $existingShift = $this->getActiveShiftForUser($user->id);

        if ($existingShift) {
            return response()->json([
                'success' => false,
                'message' => 'You already have an active shift.',
                'shift' => $existingShift
            ], 400);
        }

        $shift = PosShift::create([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'location_id' => $posLocationId,
            'start_date' => Carbon::today()->toDateString(),  // Auto-set to today
            'start_time' => Carbon::now(),
            'status' => 'active',
            'created_by' => $user->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Shift started successfully.',
            'shift' => $shift->load(['tenant:id,name', 'posLocation:id,name'])
        ]);
    }

    /**
     * End the current shift.
     */
    public function end()
    {
        $user = Auth::user();
        $activeShift = $this->getActiveShiftForUser($user->id);
        $tenantId = $activeShift?->tenant_id;

        // Check for incomplete orders created by this user
        // An order is incomplete if:
        // 1. Status is NOT 'completed' AND NOT 'cancelled'
        // 2. OR Payment Status is NOT 'paid' OR 'awaiting' (unless cancelled)
        $incompleteOrders = false;
        if ($tenantId) {
            $incompleteOrders = \App\Models\Order::where('created_by', $user->id)
                ->where('tenant_id', $tenantId)
                ->where(function ($query) {
                    $query
                        ->whereNotIn('status', ['completed', 'cancelled'])
                        ->orWhere(function ($q) {
                            $q
                                ->whereNotIn('payment_status', ['paid', 'awaiting'])
                                ->where('status', '!=', 'cancelled');
                        });
                })
                ->exists();
        }

        // if ($incompleteOrders) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Cannot end shift. You have incomplete or unpaid orders.',
        //     ], 400);
        // }

        if ($activeShift) {
            $activeShift->update([
                'end_time' => Carbon::now(),
                'status' => 'closed',
                'updated_by' => $user->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Shift closed successfully.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'No active shift found.',
        ], 404);
    }
}
