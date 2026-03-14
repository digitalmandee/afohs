<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\AddressType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AddressTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $addressTypes = AddressType::all();
        return Inertia::render('App/Member/AddressType', compact('addressTypes'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:address_types,name',
        ]);

        AddressType::create([
            'name' => $request->name,
        ]);

        return redirect()->back()->with('success', 'Address Type created.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:address_types,name,' . $id,
        ]);

        $addressType = AddressType::findOrFail($id);
        $addressType->update([
            'name' => $request->name,
        ]);

        return redirect()->back()->with('success', 'Address Type updated.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $addressType = AddressType::findOrFail($id);
        $addressType->delete();

        return redirect()->back()->with('success', 'Address Type deleted.');
    }
}
