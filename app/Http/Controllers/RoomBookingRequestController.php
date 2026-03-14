<?php

namespace App\Http\Controllers;

use App\Models\Room;
use App\Models\RoomBookingRequest;
use App\Models\RoomCategory;
use App\Models\RoomType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomBookingRequestController extends Controller
{
    public function index()
    {
        $requests = RoomBookingRequest::with(['roomType', 'member', 'customer', 'corporateMember'])->latest()->get();

        return Inertia::render('App/Admin/Booking/Room/Requests', [
            'requests' => $requests
        ]);
    }

    public function create()
    {
        $roomTypes = RoomType::select('id', 'name')->get();

        return Inertia::render('App/Admin/Booking/Request', [
            'roomTypes' => $roomTypes,
            'request' => null,
            'mode' => 'create'
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'booking_date' => 'required|date',
            'check_in_date' => 'required|date|after_or_equal:today',
            'check_out_date' => 'required|date|after:check_in_date',
            'booking_type' => 'required|string',
            'room_type_id' => 'required|exists:room_types,id',
            'additional_notes' => 'nullable|string',
            'room_id' => 'nullable|exists:rooms,id',
            'booking_category' => 'nullable|exists:room_categories,id',
            'persons' => 'nullable|integer|min:1',
            'security_deposit' => 'nullable|numeric',
            'per_day_charge' => 'nullable|numeric|min:0',
        ]);

        // Add logic for member or customer
        $this->validateGuest($request, $validated);

        $validated['member_id'] = $request->member_id ?? null;
        $validated['customer_id'] = $request->customer_id ?? null;
        $validated['corporate_member_id'] = $request->corporate_member_id ?? null;
        $validated['status'] = 'pending';

        RoomBookingRequest::create($validated);

        return redirect()->back()->with('success', 'Booking Request created successfully!');
    }

    public function show($id)
    {
        $request = RoomBookingRequest::with(['room', 'member', 'customer', 'corporateMember'])->findOrFail($id);
        return Inertia::render('Admin/Rooms/ViewBookingRequest', [
            'request' => $request
        ]);
    }

    public function edit($id)
    {
        $roomTypes = RoomType::select('id', 'name')->get();

        $request = RoomBookingRequest::with(['member', 'customer', 'corporateMember'])->findOrFail($id);

        return Inertia::render('App/Admin/Booking/Request', [
            'roomTypes' => $roomTypes,
            'request' => $request,
            'mode' => 'edit'
        ]);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'booking_date' => 'required|date',
            'check_in_date' => 'required|date',
            'check_out_date' => 'required|date|after:check_in_date',
            'booking_type' => 'required|string',
            'room_type_id' => 'required|exists:room_types,id',
            'additional_notes' => 'nullable|string',
            'room_id' => 'nullable|exists:rooms,id',
            'booking_category' => 'nullable|exists:room_categories,id',
            'persons' => 'nullable|integer|min:1',
            'security_deposit' => 'nullable|numeric',
            'per_day_charge' => 'nullable|numeric|min:0',
        ]);

        $this->validateGuest($request, $validated);

        $bookingRequest = RoomBookingRequest::findOrFail($id);

        $validated['member_id'] = $request->member_id ?? null;
        $validated['customer_id'] = $request->customer_id ?? null;
        $validated['corporate_member_id'] = $request->corporate_member_id ?? null;

        $bookingRequest->update($validated);

        return redirect()->back()->with('success', 'Booking Request updated successfully!');
    }

    private function validateGuest(Request $request, $validated)
    {
        if (str_starts_with($validated['booking_type'], 'guest-')) {
            $request->validate(['customer_id' => 'required|exists:customers,id']);
        } elseif ($validated['booking_type'] == '2') {
            $request->validate(['corporate_member_id' => 'required|exists:corporate_members,id']);
        } else {
            $request->validate(['member_id' => 'required|exists:members,id']);
            // If booking type logic needs to be updated, it should mirror store()
            // For now, assuming only details are updated, not the guest itself unless explicitly handled
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,approved,rejected'
        ]);

        $roomRequest = RoomBookingRequest::findOrFail($id);
        $roomRequest->status = $validated['status'];
        $roomRequest->save();

        return back()->with('success', 'Status updated successfully.');
    }
}
