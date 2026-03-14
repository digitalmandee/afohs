<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\KitchenDetail;
use App\Models\MemberType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\UserDetail;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

class KitchenController extends Controller
{
    public function index()
    {
        $userId = Auth::id();

        $orders = Order::with([
            'table:id,table_no', // Load only needed table fields
            'orderItems' => function ($query) use ($userId) {
                $query->where('kitchen_id', $userId)
                    ->select('id', 'order_id', 'kitchen_id', 'order_item', 'status');
            },
        ])->whereHas('orderItems', function ($query) use ($userId) {
            $query->where('kitchen_id', $userId);
        })->latest()->get();

        return Inertia::render('App/Kitchen/Dashboard', [
            'kitchenOrders' => $orders,
        ]);
    }


    public function updateAll(Request $request, $orderId)
    {

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,in_progress,completed',
            'items' => 'required|json',
            'order_time' => 'nullable|date_format:Y-m-d\TH:i:s.v\Z', // Validate order_time if provided in the specified format
            'end_time' => 'nullable|date_format:Y-m-d\TH:i:s.v\Z', // Validate end_time if provided in the specified format
        ]);

        if ($validator->fails()) {

            return redirect()->back()->withErrors($validator)->with('error', 'Validation failed.');
        }

        // Update overall order status, order_time, and end_time
        $order = Order::findOrFail($orderId);
        $order->status = $request->input('status');

        if ($request->filled('order_time')) {
            $orderTimeIso = $request->input('order_time');
            Log::info('Order time ISO: ' . $orderTimeIso);
            $order->order_time = Carbon::parse($orderTimeIso)->format('Y-m-d H:i:s');
        } elseif ($request->input('status') === 'in_progress') {
            $order->order_time = Carbon::now()->format('Y-m-d H:i:s');
        }

        if ($request->filled('end_time')) {
            $orderTimeIso = $request->input('end_time');
            Log::info('Order time ISO: ' . $orderTimeIso);
            $order->end_time = Carbon::parse($orderTimeIso)->format('Y-m-d H:i:s');
        } elseif ($request->input('status') === 'completed') {
            $order->end_time = Carbon::now()->format('Y-m-d H:i:s');
        }

        $order->save();

        // Update item-level statuses
        $items = json_decode($request->input('items'), true);

        foreach ($items as $item) {
            $orderItem = OrderItem::where('id', $item['id'])
                ->where('order_id', $orderId)
                ->first();

            if ($orderItem) {
                $orderItem->status = $item['status'];
                $orderItem->save();
            }
        }

        return redirect()->back()->with('success', 'Order and item statuses updated successfully.');
    }

    public function updateItemStatus(Request $request, $orderId, $itemId)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,completed',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->with('error', 'Validation failed for item status.');
        }

        $orderItem = OrderItem::where('id', $itemId)
            ->where('order_id', $orderId)
            ->firstOrFail();

        $orderItem->status = $request->input('status');
        $orderItem->save();

        return redirect()->back()->with('success', 'Item status updated successfully.');
    }


    // CRUD actions
    public function indexPage(Request $request)
    {
        $limit = $request->query('limit') ?? 10;

        $kitchens = User::role('kitchen', 'web')->with('kitchenDetail')->latest()->paginate($limit);

        return Inertia::render('App/Kitchen/Main', [
            'kitchens' => $kitchens,
        ]);
    }

    public function create()
    {
        $userNo = $this->getUserNo();
        return Inertia::render('App/Kitchen/AddCustomer', [
            'userNo' => $userNo,
        ]);
    }

    public function store(Request $request)
    {
        // Validate request data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'phone' => 'required|string|max:20',
            'profile_pic' => 'nullable|image|max:4096',
            'printer_ip' => 'required|string|max:255',
            'printer_port' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $customer = User::create([
                'user_id' => $this->getUserNo(),
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone_number' => $validated['phone'],
                'user_id' => $this->getUserNo(),
            ]);

            if ($request->hasFile('profile_pic')) {
                $customer->update(['profile_photo' => FileHelper::saveImage($request->file('profile_pic'), 'profiles')]);
            }

            $customer->assignRole(Role::findByName('kitchen', 'web'));

            KitchenDetail::create([
                'kitchen_id' => $customer->id,
                'printer_ip' => $validated['printer_ip'],
                'printer_port' => $validated['printer_port'],
            ]);

            DB::commit();

            return redirect()->back()->with(['success' => 'Kitchen added successfully!',]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to add customer: ' . $e->getMessage()]);
        }
    }


    public function edit(string $id)
    {
        $customer = User::with(['kitchenDetail'])->findOrFail($id);
        return Inertia::render('App/Kitchen/AddCustomer', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, $id)
    {
        // dd($request->all());
        // Validate request data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users,email,' . $id,
            'phone' => 'required|string|max:20',
            'profile_pic' => 'nullable|image|max:4096',
            'printer_ip' => 'required|string|max:255',
            'printer_port' => 'required|string|max:255',
        ]);

        try {
            DB::beginTransaction();

            $customer = User::findOrFail($id);
            $customer->update([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone_number' => $validated['phone'],
            ]);

            if ($request->hasFile('profile_photo')) {
                // if ($customer->profile_photo) {
                //     Storage::disk('public')->delete(str_replace('/storage/', '', $customer->profile_photo));
                // }

                $customer->update([
                    'profile_photo' => FileHelper::saveImage($request->file('profile_photo'), 'profiles'),
                ]);
            }

            $kitchenDetail = KitchenDetail::where('kitchen_id', $customer->id)->first();
            if ($kitchenDetail) {
                $kitchenDetail->update([
                    'printer_ip' => $validated['printer_ip'],
                    'printer_port' => $validated['printer_port'],
                ]);
            } else {
                KitchenDetail::create([
                    'kitchen_id' => $customer->id,
                    'printer_ip' => $validated['printer_ip'],
                    'printer_port' => $validated['printer_port'],
                ]);
            }

            DB::commit();

            return redirect()->back()->with(['success' => 'Kitchen updated successfully!']);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::info($e->getMessage());
            return redirect()->back()->withErrors(['error' => 'Failed to update kitchen: ' . $e->getMessage()]);
        }
    }

    // Get next user number
    private function getUserNo()
    {
        $orderNo = User::max('user_id');
        $orderNo = $orderNo + 1;
        return $orderNo;
    }
}