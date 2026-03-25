<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerRequest;
use App\Models\Customer;
use App\Models\EventVenue;
use App\Models\GuestType;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->only(['search', 'guest_type_id']);

        $query = Customer::with('guestType:id,name')->orderByDesc('created_at');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($customerQuery) use ($search) {
                $customerQuery
                    ->where('customer_no', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('contact', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('member_name', 'like', "%{$search}%")
                    ->orWhere('member_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('guest_type_id')) {
            $query->where('guest_type_id', $request->guest_type_id);
        }

        $customerData = $query->paginate(15)->withQueryString();
        $guestTypes = GuestType::where('status', 1)->orderBy('name')->get(['id', 'name']);

        return Inertia::render('App/Admin/Customers/Index', compact('customerData', 'filters', 'guestTypes'));
    }

    public function create()
    {
        $guestTypes = GuestType::where('status', 1)->get();
        $customerNo = $this->getCustomerNo();
        return Inertia::render('App/Admin/Customers/CustomerForm', compact('guestTypes', 'customerNo'));
    }

    public function edit(Request $request, $id)
    {
        $customer = Customer::find($id);
        return Inertia::render('App/Admin/Customers/CustomerForm', [
            'customer' => $customer,
            'guestTypes' => GuestType::where('status', 1)->get(),
            'isEdit' => true,
        ]);
    }

    public function show($id)
    {
        $customer = Customer::with('guestType:id,name')->findOrFail($id);

        return Inertia::render('App/Admin/Customers/Show', [
            'customer' => $customer,
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

        return redirect()->route('guests.index')->with('success', 'Customer created successfully.');
    }

    public function update(CustomerRequest $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $data = $request->validated();
        $customer->update($data);
        return redirect()->route('guests.index')->with('success', 'Customer updated successfully.');
    }

    public function destroy($id)
    {
        $customer = Customer::findOrFail($id);
        $customer->delete();

        return response()->json(['message' => 'Guest deleted successfully.']);
    }

    // Delete an Customer
    public function trashed()
    {
        $customerData = Customer::onlyTrashed()->orderBy('deleted_at', 'desc')->paginate(10);
        return Inertia::render('App/Admin/Customers/Trashed', compact('customerData'));
    }

    public function restore($id)
    {
        $customer = Customer::onlyTrashed()->findOrFail($id);
        $customer->restore();
        return redirect()->route('guests.trashed')->with('success', 'Customer restored successfully.');
    }

    private function getCustomerNo()
    {
        $maxCustomerNo = Customer::withTrashed()
            ->selectRaw('MAX(CAST(customer_no AS UNSIGNED)) as max_no')
            ->value('max_no');

        return ($maxCustomerNo ?? 0) + 1;
    }
}
