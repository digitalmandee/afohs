<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = Auth::user()->notifications();

        // Filter by Category (Tabs)
        if ($request->filled('category') && $request->category !== 'All') {
            $query->where('data->category', $request->category);
        }

        // Filter by Subtype (Search/Filter input) - Optional extra filtering
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('data->title', 'like', "%$search%")
                    ->orWhere('data->description', 'like', "%$search%");
            });
        }

        $activities = $query
            ->latest()
            ->paginate(20)
            ->through(function ($notification) {
                return [
                    'id' => $notification->id,
                    'text' => $notification->data['description'] ?? '',
                    'time' => $notification->created_at->diffForHumans(),
                    'title' => $notification->data['title'] ?? '',
                    'read_at' => $notification->read_at,
                    'actor_name' => $notification->data['actor_name'] ?? 'System',
                    'category' => $notification->data['category'] ?? 'System',
                    'link' => $notification->data['link'] ?? '#',
                ];
            });

        return Inertia::render('App/Admin/Activity/Index', [
            'activities' => $activities,
            'filters' => $request->only(['category', 'search']),
        ]);
    }
}
