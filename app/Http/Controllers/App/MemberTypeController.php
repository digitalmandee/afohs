<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\MemberType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:member-types.view')->only('index');
        $this->middleware('permission:member-types.create')->only('create', 'store');
        $this->middleware('permission:member-types.edit')->only('edit', 'update');
        $this->middleware('permission:member-types.delete')->only('destroy');
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $memberTypesData = MemberType::all();

        return Inertia::render('App/Admin/Membership/MemberType', compact('memberTypesData'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:member_types,name',
        ]);

        $memberType = MemberType::create($validatedData);

        return response()->json(['success' => true, 'message' => 'Member Type created.', 'data' => $memberType], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:member_types,name,' . $id,
        ]);

        $memberType = MemberType::findOrFail($id);
        $memberType->update($validatedData);

        return response()->json(['success' => true, 'message' => 'Member Type updated.', 'data' => $memberType]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $memberType = MemberType::findOrFail($id);
        $memberType->delete();

        return response()->json(['success' => true, 'message' => 'Member Type deleted.']);
    }

    public function trashed(Request $request)
    {
        $query = MemberType::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('name', 'like', "%{$search}%");
        }

        $memberTypes = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Membership/TrashedMemberTypes', [
            'memberTypes' => $memberTypes,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $memberType = MemberType::withTrashed()->findOrFail($id);
        $memberType->restore();

        return redirect()->back()->with('success', 'Member Type restored successfully.');
    }
}
