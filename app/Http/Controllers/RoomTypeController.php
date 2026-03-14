<?php

namespace App\Http\Controllers;

use App\Models\RoomType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoomTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:rooms.types.view')->only('index');
        $this->middleware('super.admin:rooms.types.create')->only('create', 'store');
        $this->middleware('super.admin:rooms.types.edit')->only('edit', 'update');
        $this->middleware('permission:rooms.types.delete')->only('destroy');
    }

    // List all room types
    public function index()
    {
        $roomTypesData = RoomType::orderBy('created_at', 'desc')->get();

        return Inertia::render('App/Admin/Rooms/Types/Index', compact('roomTypesData'));
    }

    // Store a new room type
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:room_types,name',
            'status' => 'required|in:active,inactive',  // ✅ validate status
        ]);

        $roomType = RoomType::create([
            'name' => $request->name,
            'status' => $request->status,  // ✅ store status
        ]);

        return response()->json([
            'message' => 'Room Type created successfully.',
            'data' => $roomType,
        ], 201);
    }

    // Update an existing room type
    public function update(Request $request, $id)
    {
        $roomType = RoomType::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:room_types,name,' . $roomType->id,
            'status' => 'required|in:active,inactive',  // ✅ validate status
        ]);

        $roomType->update([
            'name' => $request->name,
            'status' => $request->status,  // ✅ update status
        ]);

        return response()->json([
            'message' => 'Room Type updated successfully.',
            'data' => $roomType,
        ], 200);
    }

    // Delete a room type
    public function destroy($id)
    {
        $roomType = RoomType::findOrFail($id);
        $roomType->delete();

        return response()->json(['message' => 'Room Type deleted successfully.']);
    }

    // Display a listing of trashed room types
    public function trashed(Request $request)
    {
        $query = RoomType::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $roomTypes = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Rooms/Types/Trashed', [
            'roomTypes' => $roomTypes,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed room type
    public function restore($id)
    {
        $roomType = RoomType::withTrashed()->findOrFail($id);
        $roomType->restore();

        return redirect()->back()->with('success', 'Room Type restored successfully.');
    }

    // Force delete a room type
    public function forceDelete($id)
    {
        $roomType = RoomType::withTrashed()->findOrFail($id);
        $roomType->forceDelete();

        return redirect()->back()->with('success', 'Room Type deleted permanently.');
    }
}
