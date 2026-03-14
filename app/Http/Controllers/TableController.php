<?php

namespace App\Http\Controllers;

use App\Models\Floor;
use App\Models\Table;
use Illuminate\Http\Request;

class TableController extends Controller
{
    private function restaurantId(Request $request = null)
    {
        $request = $request ?? request();
        return $request->session()->get('active_restaurant_id') ?? tenant('id');
    }

    public function index(Request $request)
    {
        $restaurantId = $this->restaurantId($request);

        $floors = Floor::where('tenant_id', $restaurantId)->get();
        $query = Table::with('floor')->where('tenant_id', $restaurantId);

        if ($request->filled('floor_id')) {
            $query->where('floor_id', $request->floor_id);
        }

        $tables = $query->get();

        return view('tables.index', compact('tables', 'floors'));
    }

    public function create()
    {
        $floors = Floor::where('tenant_id', $this->restaurantId())->get();
        return view('tables.create', compact('floors'));
    }

    public function store(Request $request)
    {
        $restaurantId = $this->restaurantId($request);

        $request->validate([
            'floor_id' => ['nullable', \Illuminate\Validation\Rule::exists('floors', 'id')->where('tenant_id', $restaurantId)],
            'table_no' => 'required|string|max:255|unique:tables,table_no',
            'capacity' => 'required|integer|min:1',
        ]);

        Table::create([
            'floor_id' => $request->floor_id,
            'table_no' => $request->table_no,
            'capacity' => $request->capacity,
            'tenant_id' => $restaurantId,
        ]);

        return redirect()->route('tables.index')->with('success', 'Table added successfully!');
    }


    public function edit(Table $table)
    {
        $floors = Floor::where('tenant_id', $this->restaurantId())->get();
        return view('tables.edit', compact('table', 'floors'));
    }

    public function update(Request $request, Table $table)
    {
        $restaurantId = $this->restaurantId($request);

        $request->validate([
            'floor_id' => ['nullable', \Illuminate\Validation\Rule::exists('floors', 'id')->where('tenant_id', $restaurantId)],
            'table_no' => 'required|string|max:255',
            'capacity' => 'required|integer',
        ]);

        $table->update([
            'floor_id' => $request->floor_id,
            'table_no' => $request->table_no,
            'capacity' => $request->capacity,
            'tenant_id' => $restaurantId,
        ]);

        return redirect()->route('tables.index')->with('success', 'Table updated!');
    }

    public function destroy(Table $table)
    {
        $table->delete();
        return redirect()->route('tables.index')->with('success', 'Table deleted!');
    }
}
