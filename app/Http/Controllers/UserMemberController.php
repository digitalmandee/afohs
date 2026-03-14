<?php

namespace App\Http\Controllers;

use App\Models\UserMember;
use Illuminate\Http\Request;

class UserMemberController extends Controller
{
    // Show form to create a new user member
    public function create()
    {
        return view('user_member.create'); // Create this Blade file
    }

    // Store new user member
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
        ]);

        UserMember::create($validated);

        return response()->json(['message' => 'User member created successfully.'], 201);
    }
}
