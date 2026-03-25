<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $search = trim((string) $request->query('search', ''));

        $shifts = Shift::query()
            ->when($search !== '', function ($query) use ($search) {
                $normalizedSearch = strtolower($search);

                $query->where(function ($inner) use ($search, $normalizedSearch) {
                    $inner
                        ->whereRaw('LOWER(name) LIKE ?', ['%' . strtolower($search) . '%'])
                        ->orWhereRaw("LOWER(CONCAT(COALESCE(start_time, ''), ' ', COALESCE(end_time, ''))) LIKE ?", ['%' . $normalizedSearch . '%']);
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('App/Admin/Employee/Shift/Index', [
            'shifts' => $shifts,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('App/Admin/Employee/Shift/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'relaxation_time' => 'nullable|integer',
            'weekend_days' => 'nullable|array',
        ]);

        Shift::create($request->all());

        return redirect()->route('shifts.index')->with('success', 'Shift created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Shift $shift)
    {
        return Inertia::render('App/Admin/Employee/Shift/Edit', [
            'shift' => $shift
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Shift $shift)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required',
            'end_time' => 'required',
            'relaxation_time' => 'nullable|integer',
            'weekend_days' => 'nullable|array',
        ]);

        $shift->update($request->all());

        return redirect()->route('shifts.index')->with('success', 'Shift updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Shift $shift)
    {
        $shift->delete();
        return redirect()->back()->with('success', 'Shift deleted successfully.');
    }

    /**
     * Get list for dropdowns
     */
    public function list()
    {
        $shifts = Shift::where('status', true)->select('id', 'name', 'start_time', 'end_time')->get();
        return response()->json(['success' => true, 'shifts' => $shifts]);
    }

    public function trashed()
    {
        $shifts = Shift::onlyTrashed()->paginate(10);
        return Inertia::render('App/Admin/Employee/Shift/Trashed', ['shifts' => $shifts]);
    }

    public function restore($id)
    {
        Shift::withTrashed()->find($id)->restore();
        return redirect()->back()->with('success', 'Shift restored successfully.');
    }

    public function forceDelete($id)
    {
        Shift::withTrashed()->find($id)->forceDelete();
        return redirect()->back()->with('success', 'Shift permanently deleted.');
    }
}
