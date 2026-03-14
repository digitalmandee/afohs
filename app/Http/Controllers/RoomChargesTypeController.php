<?php

namespace App\Http\Controllers;

use App\Models\RoomChargesType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomChargesTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:rooms.chargesTypes.view')->only('index');
        $this->middleware('super.admin:rooms.chargesTypes.create')->only('create', 'store');
        $this->middleware('super.admin:rooms.chargesTypes.edit')->only('edit', 'update');
        $this->middleware('permission:rooms.chargesTypes.delete')->only('destroy');
    }

    // List all room charges types
    public function index()
    {
        $roomChargesData = RoomChargesType::orderBy('created_at', 'desc')->get();

        return Inertia::render('App/Admin/Rooms/ChargesType/Index', compact('roomChargesData'));
    }

    // Store a new room charges type
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:room_charges_types,name',
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',  // ✅ validate status
        ]);

        $roomChargesType = RoomChargesType::create([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,  // ✅ store status
        ]);

        return response()->json([
            'message' => 'Room Charges Type created successfully.',
            'data' => $roomChargesType,
        ], 201);
    }

    // Update an existing room charges type
    public function update(Request $request, $id)
    {
        $roomChargesType = RoomChargesType::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:room_charges_types,name,' . $roomChargesType->id,
            'amount' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',  // ✅ validate status
        ]);

        $roomChargesType->update([
            'name' => $request->name,
            'amount' => $request->amount,
            'status' => $request->status,  // ✅ update status
        ]);

        return response()->json([
            'message' => 'Room Charges Type updated successfully.',
            'data' => $roomChargesType,
        ], 200);
    }

    // Delete a room charges type
    public function destroy($id)
    {
        $roomChargesType = RoomChargesType::findOrFail($id);
        $roomChargesType->delete();

        return response()->json(['message' => 'Room Charges Type deleted successfully.']);
    }

    // Display a listing of trashed room charges types
    public function trashed(Request $request)
    {
        $query = RoomChargesType::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $roomCharges = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Rooms/ChargesType/Trashed', [
            'roomCharges' => $roomCharges,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed room charges type
    public function restore($id)
    {
        $roomChargesType = RoomChargesType::withTrashed()->findOrFail($id);
        $roomChargesType->restore();

        return redirect()->back()->with('success', 'Room Charges Type restored successfully.');
    }

    // Force delete a room charges type
    public function forceDelete($id)
    {
        $roomChargesType = RoomChargesType::withTrashed()->findOrFail($id);
        $roomChargesType->forceDelete();

        return redirect()->back()->with('success', 'Room Charges Type deleted permanently.');
    }
}
