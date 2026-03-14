<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function create()
    {
        $userNo = $this->getUserNo();

        return Inertia::render('App/Admin/Membership/MembershipForm', compact('userNo'));
    }

    private function getUserNo()
    {
        $userNo = User::max('user_id');
        $userNo = $userNo + 1;
        return $userNo;
    }
}