<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\Booking;
use App\Models\BookingEvents;
use App\Models\EventLocation;
use App\Models\FinancialInvoice;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\RoomBookingRequest;
use App\Models\RoomCategory;
use App\Models\RoomCategoryCharge;
use App\Models\RoomType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomController extends Controller
{
    public function allRooms()
    {
        $rooms = Room::latest()->get();

        return Inertia::render('App/Admin/Booking/AllRooms', [
            'rooms' => $rooms,
        ]);
    }

    // Show form + existing room data
    public function create()
    {
        $roomTypes = RoomType::where('status', 'active')->select('id', 'name')->get();
        $categories = RoomCategory::where('status', 'active')->select('id', 'name')->get();
        $locations = EventLocation::all();

        return Inertia::render('App/Admin/Booking/AddRoom', [
            'roomTypes' => $roomTypes,
            'locations' => $locations,
            'categories' => $categories
        ]);
    }

    // Store new room
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'number_of_beds' => 'required|integer',
            'max_capacity' => 'required|integer',
            'room_type_id' => 'required|exists:room_types,id',
            'number_of_bathrooms' => 'required|integer',
            'photo' => 'nullable|image|max:4096',
            'category_charges' => 'nullable|array',
            'category_charges.*.id' => 'required|exists:room_categories,id',
            'category_charges.*.amount' => 'nullable|numeric|min:0',
        ]);

        $request->validate([]);

        $path = null;
        if ($request->hasFile('photo')) {
            $path = FileHelper::saveImage($request->file('photo'), 'booking_rooms');
        }

        $room = Room::create([
            'name' => $request->name,
            'room_type_id' => $request->room_type_id,
            'number_of_beds' => $request->number_of_beds,
            'max_capacity' => $request->max_capacity,
            'number_of_bathrooms' => $request->number_of_bathrooms,
            'photo_path' => $path,
        ]);

        // Save category charges
        foreach ($request->category_charges as $charge) {
            if (!empty($charge['amount'])) {
                RoomCategoryCharge::updateOrCreate(
                    [
                        'room_id' => $room->id,
                        'room_category_id' => $charge['id']
                    ],
                    [
                        'amount' => $charge['amount']
                    ]
                );
            }
        }

        return redirect()->route('rooms.add')->with('success', 'Room added successfully.');
    }

    // Show edit form for a room
    public function edit($id)
    {
        $room = Room::with('categoryCharges')->findOrFail($id);
        $roomTypes = RoomType::where('status', 'active')->select('id', 'name')->get();
        $categories = RoomCategory::where('status', 'active')->select('id', 'name')->get();
        $locations = EventLocation::all();

        return Inertia::render('App/Admin/Booking/AddRoom', [
            'roomTypes' => $roomTypes,
            'locations' => $locations,
            'categories' => $categories,
            'room' => $room,
        ]);
    }

    // Update a room
    public function update(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'number_of_beds' => 'required|integer',
            'max_capacity' => 'required|integer',
            'room_type_id' => 'required|exists:room_types,id',
            'number_of_bathrooms' => 'required|integer',
            'photo' => 'nullable|image|max:4096',
            'category_charges' => 'nullable|array',
            'category_charges.*.id' => 'required|exists:room_categories,id',
            'category_charges.*.amount' => 'nullable|numeric|min:0',
        ]);

        $room = Room::findOrFail($request->id);

        $path = $room->photo_path;
        if ($request->hasFile('photo')) {
            $path = FileHelper::saveImage($request->file('photo'), 'booking_rooms');
        }

        $room->update([
            'name' => $request->name,
            'room_type_id' => $request->room_type_id,
            'number_of_beds' => $request->number_of_beds,
            'max_capacity' => $request->max_capacity,
            'number_of_bathrooms' => $request->number_of_bathrooms,
            'photo_path' => $path,
        ]);

        // Save category charges
        foreach ($request->category_charges as $charge) {
            if (!empty($charge['amount'])) {
                RoomCategoryCharge::updateOrCreate(
                    [
                        'room_id' => $room->id,
                        'room_category_id' => $charge['id']
                    ],
                    [
                        'amount' => $charge['amount']
                    ]
                );
            }
        }

        return redirect()->route('rooms.all')->with('success', 'Room updated successfully.');
    }

    // Delete a room
    public function destroy($id)
    {
        $room = Room::findOrFail($id);

        // Delete the photo if it exists
        // if ($room->photo_path) {
        //     FileHelper::deleteImage($room->photo_path);
        // }

        $room->delete();

        return redirect()->route('rooms.all')->with('success', 'Room deleted successfully.');
    }

    private function applyFilters($query, $filters)
    {
        // Search
        // Customer Type & Search Logic
        $customerType = $filters['customer_type'] ?? 'all';
        $search = $filters['search'] ?? null;

        if ($customerType === 'member') {
            $query->whereHas('member');
            if ($search) {
                $query->whereHas('member', function ($q) use ($search) {
                    $q
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('membership_no', 'like', "%{$search}%");
                });
            }
        } elseif ($customerType === 'corporate') {
            $query->whereHas('corporateMember');
            if ($search) {
                $query->whereHas('corporateMember', function ($q) use ($search) {
                    $q
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('membership_no', 'like', "%{$search}%");
                });
            }
        } elseif ($customerType === 'guest') {
            $query->whereHas('customer');
            if ($search) {
                $query->whereHas('customer', function ($q) use ($search) {
                    $q
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('customer_no', 'like', "%{$search}%");
                });
            }
        } else {
            // ALL types
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q
                        ->where('id', 'like', "%{$search}%")
                        ->orWhere('booking_no', 'like', "%{$search}%")
                        ->orWhereHas('member', function ($sub) use ($search) {
                            $sub
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('membership_no', 'like', "%{$search}%");
                        })
                        ->orWhereHas('corporateMember', function ($sub) use ($search) {
                            $sub
                                ->where('full_name', 'like', "%{$search}%")
                                ->orWhere('membership_no', 'like', "%{$search}%");
                        })
                        ->orWhereHas('customer', function ($sub) use ($search) {
                            $sub
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('customer_no', 'like', "%{$search}%");
                        })
                        ->orWhereHas('room', function ($sub) use ($search) {
                            $sub->where('name', 'like', "%{$search}%");
                        });
                });
            }
        }

        // Room Type
        if (!empty($filters['room_type'])) {
            $roomTypes = explode(',', $filters['room_type']);
            $query->whereHas('room', function ($q) use ($roomTypes) {
                $q->whereIn('room_type_id', $roomTypes);
            });
        }

        // Room IDs
        if (!empty($filters['room_ids'])) {
            $roomIds = explode(',', $filters['room_ids']);
            $query->whereIn('room_id', $roomIds);
        }

        // Booking Date
        if (!empty($filters['booking_date_from'])) {
            $query->whereDate('booking_date', '>=', $filters['booking_date_from']);
        }
        if (!empty($filters['booking_date_to'])) {
            $query->whereDate('booking_date', '<=', $filters['booking_date_to']);
        }

        // Check In Date
        if (!empty($filters['check_in_from'])) {
            $query->whereDate('check_in_date', '>=', $filters['check_in_from']);
        }
        if (!empty($filters['check_in_to'])) {
            $query->whereDate('check_in_date', '<=', $filters['check_in_to']);
        }

        // Check Out Date
        if (!empty($filters['check_out_from'])) {
            $query->whereDate('check_out_date', '>=', $filters['check_out_from']);
        }
        if (!empty($filters['check_out_to'])) {
            $query->whereDate('check_out_date', '<=', $filters['check_out_to']);
        }

        // Booking Status
        if (!empty($filters['booking_status'])) {
            $query->where('status', $filters['booking_status']);
        }
    }

    /**
     * Display a listing of trashed rooms.
     */
    public function trashed(Request $request)
    {
        $query = Room::onlyTrashed()->with('roomType');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $rooms = $query->orderBy('deleted_at', 'desc')->paginate(50);

        return Inertia::render('App/Admin/Booking/Room/Trashed', [
            'rooms' => $rooms,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Restore the specified trashed room.
     */
    public function restore($id)
    {
        $room = Room::withTrashed()->findOrFail($id);
        $room->restore();

        return redirect()->back()->with('success', 'Room restored successfully.');
    }

    /**
     * Permanently delete the specified trashed room.
     */
    public function forceDelete($id)
    {
        $room = Room::withTrashed()->findOrFail($id);
        $room->forceDelete();

        return redirect()->back()->with('success', 'Room deleted permanently.');
    }
}
