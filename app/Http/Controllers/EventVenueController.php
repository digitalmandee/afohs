<?php

namespace App\Http\Controllers;

use App\Models\EventVenue;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EventVenueController extends Controller
{
    public function __construct()
    {
        $this->middleware('super.admin:events.venue.view')->only('index');
        $this->middleware('super.admin:events.venue.create')->only('create', 'store');
        $this->middleware('super.admin:events.venue.edit')->only('edit', 'update');
        $this->middleware('permission:events.venue.delete')->only('destroy', 'trashed', 'restore', 'forceDelete');
    }

    // List all event venues with search and pagination
    public function index(Request $request)
    {
        $query = EventVenue::orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventVenuesData = $query->paginate(10);

        return Inertia::render('App/Admin/Events/Venue/Index', [
            'eventVenuesData' => $eventVenuesData,
            'filters' => $request->only(['search']),
        ]);
    }

    // Store a new event venue
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:event_venues,name',
            'status' => 'required|in:active,inactive',
        ]);

        $eventVenue = EventVenue::create([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Event Venue created successfully.',
            'data' => $eventVenue,
        ], 201);
    }

    // Update an existing event venue
    public function update(Request $request, $id)
    {
        $eventVenue = EventVenue::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:event_venues,name,' . $eventVenue->id,
            'status' => 'required|in:active,inactive',
        ]);

        $eventVenue->update([
            'name' => $request->name,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Event Venue updated successfully.',
            'data' => $eventVenue,
        ], 200);
    }

    // Delete an event venue
    public function destroy($id)
    {
        $eventVenue = EventVenue::findOrFail($id);
        $eventVenue->delete();

        return response()->json(['message' => 'Event Venue deleted successfully.']);
    }

    // Display a listing of trashed event venues
    public function trashed(Request $request)
    {
        $query = EventVenue::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $eventVenues = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Events/Venue/Trashed', [
            'eventVenues' => $eventVenues,
            'filters' => $request->only(['search']),
        ]);
    }

    // Restore the specified trashed event venue
    public function restore($id)
    {
        $eventVenue = EventVenue::withTrashed()->findOrFail($id);
        $eventVenue->restore();

        return redirect()->back()->with('success', 'Event Venue restored successfully.');
    }

    // Force delete an event venue
    public function forceDelete($id)
    {
        $eventVenue = EventVenue::withTrashed()->findOrFail($id);
        $eventVenue->forceDelete();

        return redirect()->back()->with('success', 'Event Venue deleted permanently.');
    }
}
