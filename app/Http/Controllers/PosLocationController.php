<?php

namespace App\Http\Controllers;

use App\Models\PosLocation;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PosLocationController extends Controller
{
    public function index(Request $request)
    {
        $query = PosLocation::query()->orderByDesc('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $locations = $query->paginate(10)->withQueryString();

        return Inertia::render('App/Admin/PosLocations/Index', [
            'locations' => $locations,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('pos_locations', 'name')->whereNull('deleted_at'),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        PosLocation::create($validated);

        return back()->with('success', 'POS location created successfully.');
    }

    public function update(Request $request, $id)
    {
        $location = PosLocation::findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('pos_locations', 'name')->ignore($location->id)->whereNull('deleted_at'),
            ],
            'status' => ['required', Rule::in(['active', 'inactive'])],
        ]);

        $location->update($validated);

        return back()->with('success', 'POS location updated successfully.');
    }

    public function destroy($id)
    {
        $location = PosLocation::findOrFail($id);
        $location->delete();

        return back()->with('success', 'POS location deleted successfully.');
    }

    public function trashed(Request $request)
    {
        $query = PosLocation::onlyTrashed()->orderByDesc('deleted_at');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('name', 'like', "%{$search}%");
        }

        $locations = $query->paginate(10)->withQueryString();

        return Inertia::render('App/Admin/PosLocations/Trashed', [
            'locations' => $locations,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $location = PosLocation::withTrashed()->findOrFail($id);
        $location->restore();

        return redirect()->route('pos-locations.index')->with('success', 'POS location restored successfully.');
    }

    public function forceDelete($id)
    {
        $location = PosLocation::withTrashed()->findOrFail($id);
        $location->forceDelete();

        return back()->with('success', 'POS location permanently deleted.');
    }
}

