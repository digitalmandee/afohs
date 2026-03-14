<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Models\GuestType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosCustomerController extends Controller
{
    public function index()
    {
        $customerData = Customer::orderBy('created_at', 'desc')->paginate(10);

        return Inertia::render('App/POS/Customers/Index', compact('customerData'));
    }

    public function create()
    {
        $guestTypes = GuestType::where('status', 1)->get();
        $customerNo = $this->getCustomerNo();

        return Inertia::render('App/POS/Customers/CustomerForm', compact('guestTypes', 'customerNo'));
    }

    public function edit(Request $request, $id)
    {
        $customer = Customer::find($id);

        return Inertia::render('App/POS/Customers/CustomerForm', [
            'customer' => $customer,
            'guestTypes' => GuestType::where('status', 1)->get(),
            'isEdit' => true,
        ]);
    }

    public function store(CustomerRequest $request)
    {
        $data = $request->validated();
        $data['customer_no'] = $this->getCustomerNo();
        $customer = Customer::create($data);

        if ($request->wantsJson()) {
            return response()->json(['success' => true, 'customer' => $customer, 'message' => 'Customer created successfully.']);
        }

        return redirect()->route('pos.customers.index')->with('success', 'Customer created successfully.');
    }

    public function update(CustomerRequest $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $data = $request->validated();
        $customer->update($data);

        return redirect()->route('pos.customers.index')->with('success', 'Customer updated successfully.');
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json(['message' => 'Customer deleted successfully.']);
    }

    private function getCustomerNo()
    {
        $maxCustomerNo = Customer::withTrashed()
            ->selectRaw('MAX(CAST(customer_no AS UNSIGNED)) as max_no')
            ->value('max_no');

        return ($maxCustomerNo ?? 0) + 1;
    }
}

