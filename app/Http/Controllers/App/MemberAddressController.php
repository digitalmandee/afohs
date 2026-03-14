<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\AddressType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberAddressController extends Controller
{
    public function index()
    {
        $addressTypes = AddressType::all();

        return Inertia::render('App/Member/AddCustomer', [
            'addressTypes' => $addressTypes
        ]);
    }
}
