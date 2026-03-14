<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionTypeController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:subscriptions.types.view')->only('index');
        $this->middleware('permission:subscriptions.types.create')->only('create', 'store');
        $this->middleware('permission:subscriptions.types.edit')->only('edit', 'update');
        $this->middleware('permission:subscriptions.types.delete')->only('destroy');
    }
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $subscriptionTypesData = SubscriptionType::all();

        return Inertia::render('App/Admin/Subscription/SubscriptionType', compact('subscriptionTypesData'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:subscription_types,name',
        ]);

        $subscriptionType = SubscriptionType::create($validatedData);

        return response()->json(['success' => true, 'message' => 'Subscription Type created.', 'data' => $subscriptionType], 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255|unique:subscription_types,name,' . $id,
        ]);

        $subscriptionType = SubscriptionType::findOrFail($id);
        $subscriptionType->update($validatedData);

        return response()->json(['success' => true, 'message' => 'Subscription Type updated.', 'data' => $subscriptionType]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $subscriptionType = SubscriptionType::findOrFail($id);
        $subscriptionType->delete();

        return response()->json(['success' => true, 'message' => 'Subscription Type deleted.']);
    }
}