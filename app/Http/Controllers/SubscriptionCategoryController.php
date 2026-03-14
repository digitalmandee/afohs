<?php

namespace App\Http\Controllers;

use App\Models\MemberCategory;
use App\Models\SubscriptionCategory;
use App\Models\SubscriptionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SubscriptionCategoryController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:subscriptions.categories.view')->only('index');
        $this->middleware('permission:subscriptions.categories.create')->only('create', 'store');
        $this->middleware('permission:subscriptions.categories.edit')->only('edit', 'update');
        $this->middleware('permission:subscriptions.categories.delete')->only('destroy');
    }
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $subscriptionCategories = SubscriptionCategory::with('subscriptionType')->get();
        return Inertia::render('App/Admin/Subscription/Category/Index', compact('subscriptionCategories'));
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        $subscriptionTypes = SubscriptionType::select('id', 'name')->get();
        return Inertia::render('App/Admin/Subscription/Category/AddEdit', compact('subscriptionTypes'));
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subscription_type_id' => 'required|exists:subscription_types,id',
            'description' => 'nullable|string|max:1000',
            'fee' => 'nullable|integer',
            'status' => 'required|in:active,inactive',
        ]);

        SubscriptionCategory::create($validated);

        return redirect()->back()->with('success', 'Subscription category created successfully.');
    }


    /**
     * Show the form for editing the specified resource.
     *
     * @param  \App\Models\MemberCategory  $memberCategory
     * @return \Illuminate\Http\Response
     */
    public function edit(SubscriptionCategory $subscriptionCategory)
    {
        $subscriptionTypes = SubscriptionType::select('id', 'name')->get();
        return Inertia::render('App/Admin/Subscription/Category/AddEdit', compact('subscriptionTypes', 'subscriptionCategory'));
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\MemberCategory  $memberCategory
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, SubscriptionCategory $subscriptionCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'subscription_type_id' => 'required|exists:subscription_types,id',
            'description' => 'nullable|string|max:1000',
            'fee' => 'nullable|integer',
            'status' => 'required|in:active,inactive',
        ]);

        $subscriptionCategory->update($validated);

        return redirect()->back()->with('success', 'Subscription category updated successfully.');
    }


    /**
     * Remove the specified resource from storage.
     *
     * @param  \App\Models\MemberCategory  $memberCategory
     * @return \Illuminate\Http\Response
     */
    public function destroy(SubscriptionCategory $subscriptionCategory)
    {
        $subscriptionCategory->delete();

        return response()->json(['message' => 'Subscription category deleted successfully']);
    }
}