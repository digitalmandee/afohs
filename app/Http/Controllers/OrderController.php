<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Events\OrderCreated;
use App\Helpers\FileHelper;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\FinancialReceipt;
use App\Models\Floor;
use App\Models\GuestType;
use App\Models\Ingredient;
use App\Models\InventoryItem;
use App\Models\Invoices;
use App\Models\Member;
use App\Models\MemberType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PosCakeBooking;
use App\Models\PosShift;
use App\Models\Product;
use App\Models\ProductVariantValue;
use App\Models\Reservation;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\RoomServiceOrder;
use App\Models\RoomType;
use App\Models\Table;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Models\User;
use App\Models\Variant;
use App\Models\Warehouse;
use App\Services\Inventory\InventoryMovementService;
use App\Services\Inventory\RestaurantInventoryResolver;
use App\Services\Printing\KotPrintDispatcher;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Mike42\Escpos\Printer;

class OrderController extends Controller
{
    private function canEditAfterBill(User $user = null): bool
    {
        if (!$user) {
            return false;
        }

        try {
            if (method_exists($user, 'can') && ($user->can('pos.orders.edit-after-bill') || $user->can('orders.edit_after_bill'))) {
                return true;
            }
        } catch (\Throwable $e) {
        }

        try {
            if (method_exists($user, 'hasRole') && ($user->hasRole('Super Admin') || $user->hasRole('super-admin') || $user->hasRole('super admin'))) {
                return true;
            }
        } catch (\Throwable $e) {
        }

        return false;
    }

    private function activeTenantId(Request $request = null)
    {
        $request = $request ?? request();
        return $request->session()->get('active_restaurant_id') ?? $request->route('tenant') ?? tenant('id');
    }

    private function selectedRestaurantId(Request $request = null)
    {
        $request = $request ?? request();
        $requestedId = $request->query('restaurant_id');
        $user = Auth::guard('tenant')->user() ?? Auth::user();
        $tenants = $user ? $user->getAccessibleTenants() : collect();

        if ($requestedId !== null && $requestedId !== '') {
            if ($tenants->contains(fn($t) => (string) $t->id === (string) $requestedId)) {
                return $requestedId;
            }
        }

        return $this->activeTenantId($request);
    }

    // Show new order page
    public function index(Request $request)
    {
        $orderNo = $this->getOrderNo();
        $guestTypes = GuestType::where('status', 1)->select('id', 'name')->get();
        $user = Auth::guard('tenant')->user() ?? Auth::user();
        $allrestaurants = $user ? $user->getAccessibleTenants() : collect();
        $activeTenantId = $this->selectedRestaurantId($request);

        $floorData = null;
        $tableData = null;

        // If query params exist, fetch floor and table
        if ($request->filled('floor')) {
            $floorId = $request->get('floor');
            $tableId = $request->get('table');

            $floorQuery = Floor::select('id', 'name')
                ->where('status', 1)
                ->where('id', $floorId)
                ->when($activeTenantId, fn($q) => $q->where('tenant_id', $activeTenantId));

            if ($tableId) {
                // Directly fetch the single table instead of returning an array
                $tableData = Table::select('id', 'floor_id', 'table_no', 'capacity')
                    ->where('floor_id', $floorId)
                    ->where('id', $tableId)
                    ->when($activeTenantId, fn($q) => $q->where('tenant_id', $activeTenantId))
                    ->first();
            }

            $floorData = $floorQuery->first();
        }

        return Inertia::render('App/Order/New/Index', [
            'orderNo' => $orderNo,
            'floorData' => $floorData,
            'tableData' => $tableData,
            // 'memberTypes' => $memberTypes, // Removed to avoid confusion if not needed
            'guestTypes' => $guestTypes,
            'allrestaurants' => $allrestaurants->map(fn($t) => ['id' => $t->id, 'name' => $t->name])->values(),
            'activeTenantId' => $activeTenantId,
        ]);
    }

    public function getFloorsWithTables(Request $request)
    {
        $activeShift = $this->getActiveShift();
        $today = $activeShift?->start_date ?? Carbon::today()->toDateString();
        $now = Carbon::now('Asia/Karachi');
        $restaurantId = session('active_restaurant_id') ?? tenant('id');
        $requestedId = $request->query('restaurant_id');

        if ($requestedId !== null && $requestedId !== '') {
            $user = Auth::guard('tenant')->user() ?? Auth::user();
            $tenants = $user ? $user->getAccessibleTenants() : collect();

            if ($tenants->contains(fn($t) => (string) $t->id === (string) $requestedId)) {
                $restaurantId = $requestedId;
            }
        }

        $floorTables = Floor::select('id', 'name')
            ->where('status', 1)
            ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
            ->with(['tables' => function ($query) use ($today, $restaurantId) {
                $query
                    ->select('id', 'floor_id', 'table_no', 'capacity')
                    ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
                    ->with([
                        'orders' => function ($orderQuery) use ($restaurantId) {
                            $orderQuery
                                ->select('id', 'table_id', 'status', 'payment_status', 'start_date')
                                ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
                                ->whereIn('status', ['pending', 'in_progress', 'completed'])
                                ->where(function ($q) {
                                    $q->whereNull('payment_status')->orWhere('payment_status', '!=', 'paid');
                                });
                        },
                        'reservations' => function ($resQuery) use ($today, $restaurantId) {
                            $resQuery
                                ->select('id', 'table_id', 'date', 'start_time', 'end_time', 'status')
                                ->whereDate('date', $today)
                                ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
                                ->whereIn('status', ['pending', 'confirmed'])
                                ->with([
                                    'order' => function ($q) {
                                        $q
                                            ->select('id', 'table_id', 'status');
                                    }
                                ]);
                        }
                    ]);
            }])
            ->get();

        $tablesWithoutFloor = Table::select('id', 'floor_id', 'table_no', 'capacity')
            ->whereNull('floor_id')
            ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
            ->with([
                'orders' => function ($orderQuery) use ($restaurantId) {
                    $orderQuery
                        ->select('id', 'table_id', 'status', 'payment_status', 'start_date')
                        ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
                        ->whereIn('status', ['pending', 'in_progress', 'completed'])
                        ->where(function ($q) {
                            $q->whereNull('payment_status')->orWhere('payment_status', '!=', 'paid');
                        });
                },
                'reservations' => function ($resQuery) use ($today, $restaurantId) {
                    $resQuery
                        ->select('id', 'table_id', 'date', 'start_time', 'end_time', 'status')
                        ->whereDate('date', $today)
                        ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
                        ->whereIn('status', ['pending', 'confirmed'])
                        ->with([
                            'order' => function ($q) {
                                $q->select('id', 'table_id', 'status');
                            }
                        ]);
                }
            ])
            ->get();

        if ($tablesWithoutFloor->isNotEmpty()) {
            $floorTables->push((object) [
                'id' => null,
                'name' => 'No Floor',
                'tables' => $tablesWithoutFloor,
            ]);
        }
        // 🔗 Attach invoices manually
        $floorTables->each(function ($floor) {
            $floor->tables->each(function ($table) {
                // If you also want reservation’s order invoice
                $table->reservations->each(function ($reservation) {
                    if ($reservation->order) {
                        $invoice = FinancialInvoice::whereJsonContains('data->order_id', $reservation->order->id)
                            ->select('id', 'status', 'data')
                            ->first();
                        $reservation->order->invoice = $invoice;
                    }
                });
            });
        });

        foreach ($floorTables as $floor) {
            foreach ($floor->tables as $table) {
                $isAvailable = true;

                // 🔹 Check reservations first
                foreach ($table->reservations as $reservation) {
                    $startTime = Carbon::parse($reservation->date . ' ' . $reservation->start_time, 'Asia/Karachi')->subMinutes(15);
                    $endTime = Carbon::parse($reservation->date . ' ' . $reservation->end_time, 'Asia/Karachi')->addMinutes(5);

                    if (!$now->between($startTime, $endTime)) {
                        continue;
                    }

                    if (!$reservation->order) {
                        $isAvailable = false;
                        break;
                    }

                    $order = $reservation->order;
                    $invoice = $order->invoice ?? null;
                    $isPaid = ($order->payment_status ?? null) === 'paid' || (($invoice->status ?? null) === 'paid');
                    $isCompleted = ($order->status ?? null) === 'completed';

                    if (!$isPaid || !$isCompleted) {
                        $isAvailable = false;
                        break;
                    }
                }

                // 🔹 If still available, check direct orders (not tied to reservation)
                if ($isAvailable) {
                    foreach ($table->orders as $order) {
                        $invoice = $order;

                        if (
                            !$invoice ||
                            $invoice->payment_status !== 'paid' ||
                            $order->status !== 'completed'
                        ) {
                            $isAvailable = false;
                            break;
                        }
                    }
                }

                $table->is_available = $isAvailable;

                // Hide relations from response
                unset($table->orders, $table->reservations);
            }
        }

        return response()->json($floorTables);
    }

    public function getRoomsForOrder(Request $request)
    {
        $memberId = $request->query('member_id');
        $memberType = $request->query('member_type');

        $hasMemberFilter = $memberId !== null && $memberId !== '' && $memberType !== null && $memberType !== '';

        $bookingConstraints = function ($q) use ($hasMemberFilter, $memberId, $memberType) {
            $q
                ->where('status', 'checked_in')
                ->whereDate('check_in_date', '<=', Carbon::today())
                ->where(function ($dateQ) {
                    $dateQ
                        ->whereNull('check_out_date')
                        ->orWhereDate('check_out_date', '>=', Carbon::today());
                });

            if (!$hasMemberFilter)
                return;

            if ($memberType == 0 || $memberType == 1) {
                $q->where('member_id', (int) $memberId);
                return;
            }
            if ($memberType == 2) {
                $q->where('corporate_member_id', (int) $memberId);
                return;
            }
            // if ($memberType == 3) {
            //     $q->where('employee_id', (int) $memberId);
            //     return;
            // }
            if (str_starts_with((string) $memberType, 'guest-') || $memberType == '1') {
                $q->where('customer_id', (int) $memberId);
            }
        };

        $roomTypes = RoomType::with(['rooms' => function ($query) use ($hasMemberFilter, $bookingConstraints) {
            $query
                ->select('id', 'name', 'room_type_id')
                ->when($hasMemberFilter, function ($roomQ) use ($bookingConstraints) {
                    $roomQ->whereHas('currentBooking', $bookingConstraints);
                })
                ->with(['currentBooking' => function ($q) use ($bookingConstraints) {
                    $q
                        ->select('id', 'room_id', 'booking_no', 'status', 'member_id', 'corporate_member_id', 'customer_id', 'guest_first_name', 'guest_last_name', 'check_in_date', 'check_out_date')
                        ->tap($bookingConstraints)
                        ->with(['member', 'corporateMember', 'customer']);
                }]);
        }])->get();

        if ($hasMemberFilter) {
            $roomTypes = $roomTypes->filter(function ($rt) {
                return $rt->rooms && $rt->rooms->isNotEmpty();
            })->values();
        }

        return response()->json($roomTypes);
    }

    public function orderManagement(Request $request)
    {
        $filters = $request->only('search_id', 'search_name', 'search_membership', 'time', 'client_type', 'customer_type', 'order_type', 'type', 'order_status', 'tenant_id', 'start_date', 'end_date');
        $user = Auth::guard('tenant')->user() ?? Auth::user();
        $allrestaurants = $user ? $user->getAccessibleTenants() : collect();
        $canEditAfterBill = $this->canEditAfterBill($user);

        // Check if request expects JSON (Axios call)
        if ($request->wantsJson()) {
            $tenants = $allrestaurants ?? collect();
            $query = Order::query()
                ->with([
                    'table:id,table_no',
                    'tenant:id,name',  // ✅ Load Tenant Name
                    'orderItems:id,order_id,tenant_id,kitchen_id,order_item,status,remark,instructions,cancelType',
                    'member:id,member_type_id,full_name,membership_no',
                    'customer:id,name,customer_no,guest_type_id',
                    'customer.guestType:id,name',
                    'employee:id,employee_id,name',
                    'member.memberType:id,name',
                    'waiter:id,name',  // Waiter relation
                ]);

            if (!$canEditAfterBill) {
                $query->where('created_by', Auth::id());
                // ✅ Exclude paid orders from Order Management (table is free after payment)
                // But INCLUDE 'awaiting' payment status (so generated invoices show up)
                $query->where(function ($q) {
                    $q
                        ->whereNull('payment_status')
                        ->orWhere('payment_status', '!=', 'paid');
                });
            }

            $query->where('status', '!=', 'saved');
            $query->where(function ($q) {
                $q
                    ->where('status', '!=', 'completed')
                    ->orWhereNull('payment_status')
                    ->orWhere('payment_status', '!=', 'paid');
            });

            if ($request->filled('tenant_id') && $tenants->contains(fn($t) => (string) $t->id === (string) $request->tenant_id)) {
                $query->where('tenant_id', $request->tenant_id);
            }

            // 🔍 Search By ID
            if ($request->filled('search_id')) {
                $query->where('id', $request->search_id);
            }

            // 🔍 Search By Client Name
            if ($request->filled('search_name')) {
                $searchName = trim(preg_replace('/\s+/', ' ', $request->search_name));
                $query->where(function ($q) use ($searchName) {
                    $q
                        ->whereHas('member', fn($q) => $q->where('full_name', 'like', "%$searchName%"))
                        ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%$searchName%"))
                        ->orWhereHas('employee', fn($q) => $q->where('name', 'like', "%$searchName%"));
                });
            }

            // 🔍 Search By Membership No
            if ($request->filled('search_membership')) {
                $searchMembership = trim($request->search_membership);
                $query->where(function ($q) use ($searchMembership) {
                    $q
                        ->whereHas('member', fn($q) => $q->where('membership_no', 'like', "%$searchMembership%"))
                        ->orWhereHas('customer', fn($q) => $q->where('customer_no', 'like', "%$searchMembership%"))
                        ->orWhereHas('employee', fn($q) => $q->where('employee_id', 'like', "%$searchMembership%"));
                });
            }

            // 📅 Time filter
            if ($request->time && $request->time !== 'all') {
                $today = now();
                switch ($request->time) {
                    case 'today':
                        $query->whereDate('start_date', $today->toDateString());
                        break;
                    case 'yesterday':
                        $query->whereDate('start_date', $today->copy()->subDay()->toDateString());
                        break;
                    case 'this_week':
                        $query->whereBetween(DB::raw('DATE(start_date)'), [$today->copy()->startOfWeek()->toDateString(), $today->copy()->endOfWeek()->toDateString()]);
                        break;
                }
            }

            // 📅 Date range filter
            if ($request->filled('start_date') && $request->filled('end_date')) {
                $query->whereBetween('start_date', [$request->start_date, $request->end_date]);
            }

            $clientType = $request->input('client_type') ?? $request->input('customer_type');
            if (!$clientType && in_array($request->type, ['member', 'corporate', 'employee', 'guest'], true)) {
                $clientType = $request->type;
            }

            if ($clientType && $clientType !== 'all') {
                if ($clientType === 'member') {
                    $query->whereNotNull('member_id');
                } elseif ($clientType === 'employee') {
                    $query->whereNotNull('employee_id');
                } elseif ($clientType === 'guest') {
                    $query
                        ->whereNotNull('customer_id')
                        ->whereNull('member_id')
                        ->whereNull('employee_id');
                } elseif ($clientType === 'corporate') {
                    $query->whereHas('member.memberType', function ($q) {
                        $q->where('name', 'Corporate');
                    });
                }
            }

            $orderType = $request->input('order_type');
            if (!$orderType && $request->type && !in_array($request->type, ['all', 'member', 'corporate', 'employee', 'guest'], true)) {
                $orderType = $request->type;
            }
            if ($orderType && $orderType !== 'all') {
                $query->where('order_type', $orderType);
            }

            if ($request->filled('order_status') && $request->order_status !== 'all') {
                if ($request->order_status === 'waiting_for_payment') {
                    $query->where('payment_status', 'awaiting');
                } elseif ($request->order_status === 'in_progress') {
                    $query->whereIn('status', ['pending', 'in_progress']);
                } else {
                    $query->where('status', $request->order_status);
                }
            }

            $orders = $query->latest()->paginate(20)->withQueryString();
            $orderIds = $orders->getCollection()->pluck('id')->values();
            $printSummaries = collect();
            if (Schema::hasTable('order_print_logs') && $orderIds->isNotEmpty()) {
                $printSummaries = DB::table('order_print_logs')
                    ->select('order_id')
                    ->selectRaw('SUM(CASE WHEN status IN ("queued", "retried") THEN 1 ELSE 0 END) AS queued_count')
                    ->selectRaw('SUM(CASE WHEN status = "failed" THEN 1 ELSE 0 END) AS failed_count')
                    ->selectRaw('MAX(created_at) AS last_print_at')
                    ->whereIn('order_id', $orderIds)
                    ->groupBy('order_id')
                    ->get()
                    ->keyBy('order_id');
            }

            // Attach Invoice Data
            $orders->getCollection()->transform(function ($order) {
                // Optimization: In a real high-load scenario, fetch all invoices for these IDs in one go.
                // For now, keeping logic but moving to async call to unblock page load.
                $invoice = FinancialInvoice::whereJsonContains('data->order_id', $order->id)
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->first();
                $order->invoice = $invoice;
                return $this->attachOrderAdjustmentMetadata($order, $invoice);
            });

            $orders->getCollection()->transform(function ($order) use ($printSummaries) {
                $summary = $printSummaries->get($order->id);
                $order->print_summary = [
                    'queued_count' => (int) ($summary->queued_count ?? 0),
                    'failed_count' => (int) ($summary->failed_count ?? 0),
                    'last_print_at' => $summary->last_print_at ?? null,
                ];
                return $order;
            });

            return response()->json($orders);
        }

        // Return Inertia Shell (Immediate Load)
        return Inertia::render('App/Order/Management/Dashboard', [
            'initialOrders' => null,  // Frontend will fetch
            'allrestaurants' => $allrestaurants,
            'filters' => $filters,  // Pass filters to populate inputs
            'canEditAfterBill' => $canEditAfterBill,
        ]);
    }

    public function moveTable(Request $request, $id)
    {
        if (!$this->checkActiveShift()) {
            return response()->json([
                'message' => 'You must have an active shift to move tables.',
                'error_code' => 'NO_ACTIVE_SHIFT'
            ], 403);
        }

        $request->validate([
            'restaurant_id' => 'required',
            'table_id' => 'required|exists:tables,id',
        ]);

        $user = Auth::guard('tenant')->user() ?? Auth::user();
        $tenants = $user ? $user->getAccessibleTenants() : collect();

        $restaurantId = (string) $request->restaurant_id;
        if (!$tenants->contains(fn($t) => (string) $t->id === $restaurantId)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid restaurant.',
            ], 422);
        }

        $order = Order::where('created_by', Auth::id())->with('table:id,table_no')->findOrFail($id);

        if ($order->status === 'completed' || $order->status === 'cancelled' || $order->status === 'refund' || $order->payment_status === 'awaiting') {
            return response()->json([
                'success' => false,
                'message' => 'This order cannot be moved.',
            ], 422);
        }

        $invoiceExists = FinancialInvoice::where(function ($q) use ($order) {
            $q
                ->where(function ($sq) use ($order) {
                    $sq->where('invoiceable_type', Order::class)->where('invoiceable_id', $order->id);
                })
                ->orWhereJsonContains('data->order_id', $order->id);
        })->exists();

        if ($invoiceExists) {
            return response()->json([
                'success' => false,
                'message' => 'Invoice already generated for this order.',
            ], 422);
        }

        $tableId = (int) $request->table_id;
        $table = Table::select('id', 'tenant_id', 'location_id', 'table_no')->whereKey($tableId)->firstOrFail();

        if ((string) $table->tenant_id !== $restaurantId) {
            return response()->json([
                'success' => false,
                'message' => 'Selected table does not belong to selected restaurant.',
            ], 422);
        }

        $activeShift = $this->getActiveShift();
        $shiftDate = $activeShift?->start_date ?? Carbon::today()->toDateString();

        $conflictingOrder = Order::where('id', '!=', $order->id)
            ->where('tenant_id', $restaurantId)
            ->where('table_id', $tableId)
            ->whereDate('start_date', $shiftDate)
            ->whereIn('status', ['pending', 'in_progress', 'completed'])
            ->where(function ($q) {
                $q->whereNull('payment_status')->orWhere('payment_status', '!=', 'paid');
            })
            ->latest('id')
            ->first();

        if ($conflictingOrder) {
            return response()->json([
                'success' => false,
                'message' => 'Selected table already has an active order (#' . $conflictingOrder->id . ').',
            ], 409);
        }

        $conflictingReservation = Reservation::where('tenant_id', $restaurantId)
            ->where('table_id', $tableId)
            ->whereDate('date', $shiftDate)
            ->whereIn('status', ['pending', 'confirmed'])
            ->exists();

        if ($conflictingReservation) {
            return response()->json([
                'success' => false,
                'message' => 'Selected table is reserved today.',
            ], 409);
        }

        DB::beginTransaction();
        try {
            $posLocationId = (int) ($request->session()->get('active_pos_location_id') ?? $order->location_id ?? $activeShift?->location_id);

            $order->update([
                'tenant_id' => $restaurantId,
                'location_id' => $posLocationId ?: $order->location_id,
                'table_id' => $tableId,
            ]);

            OrderItem::where('order_id', $order->id)->update([
                'tenant_id' => $restaurantId,
                'location_id' => $posLocationId ?: null,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Order moved successfully.',
                'order_id' => $order->id,
                'table_id' => $tableId,
                'restaurant_id' => $restaurantId,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error($e);
            return response()->json([
                'success' => false,
                'message' => 'Failed to move order.',
            ], 500);
        }
    }

    public function generateInvoice($id)
    {
        DB::beginTransaction();
        try {
            $order = Order::with('orderItems', 'member', 'customer', 'employee')->findOrFail($id);

            // Check if invoice already exists
            $existingInvoice = FinancialInvoice::whereJsonContains('data->order_id', $order->id)->first();
            if ($existingInvoice) {
                $advancePayment = (float) ($order->down_payment ?? 0);
                if ($advancePayment <= 0 && $order->reservation_id) {
                    $reservation = Reservation::find($order->reservation_id);
                    if ($reservation && (float) ($reservation->down_payment ?? 0) > 0) {
                        $advancePayment = (float) $reservation->down_payment;
                        $order->update(['down_payment' => $advancePayment]);
                    }
                }

                if ($advancePayment > 0 && (float) ($existingInvoice->advance_payment ?? 0) <= 0) {
                    $existingData = $existingInvoice->data ?? [];
                    $existingData['reservation_id'] = $existingData['reservation_id'] ?? $order->reservation_id;
                    $existingData['advance_deducted'] = $existingData['advance_deducted'] ?? $advancePayment;
                    $existingInvoice->update([
                        'advance_payment' => $advancePayment,
                        'data' => $existingData,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Invoice already exists.',
                    'invoice' => $existingInvoice,
                    'order' => $order
                ]);
            }

            $totalPrice = $order->total_price;
            $items = $order->orderItems;

            $advancePayment = (float) ($order->down_payment ?? 0);
            if ($advancePayment <= 0 && $order->reservation_id) {
                $reservation = Reservation::find($order->reservation_id);
                if ($reservation && (float) ($reservation->down_payment ?? 0) > 0) {
                    $advancePayment = (float) $reservation->down_payment;
                    $order->update(['down_payment' => $advancePayment]);
                }
            }

            $invoiceData = [
                'invoice_no' => $this->getInvoiceNo(),
                'invoice_type' => 'food_order',
                'amount' => $order->amount,  // Subtotal
                'total_price' => $totalPrice,  // Grand Total
                'advance_payment' => $advancePayment > 0 ? $advancePayment : 0,
                'payment_method' => null,
                'issue_date' => Carbon::now(),
                'status' => 'unpaid',
                'data' => [
                    'order_id' => $order->id,
                    'reservation_id' => $order->reservation_id,
                    'advance_deducted' => $advancePayment > 0 ? $advancePayment : 0,
                ],
                'invoiceable_id' => $order->id,
                'invoiceable_type' => Order::class,
            ];

            // Determine Payer
            if ($order->member_id) {
                $invoiceData['member_id'] = $order->member_id;
            } elseif ($order->customer_id) {
                $invoiceData['customer_id'] = $order->customer_id;
            } elseif ($order->employee_id) {
                $invoiceData['employee_id'] = $order->employee_id;
            }

            $invoice = FinancialInvoice::create($invoiceData);

            // Create Invoice Items (Aggregated)
            // Note: We are creating a single line item for the food order.
            // If detailed items are needed, loop through $items.
            // For now, consistent with sendToKitchen takeaway logic:

            $description = 'Food Order #' . $order->id;

            // Calculate tax based on taxable items
            $calculatedTaxAmount = 0;
            $taxRate = $order->tax ?? 0;
            foreach ($items as $item) {
                // Check if product is taxable (assuming eager loaded or available)
                // We need to fetch product is_taxable if not in order_item.
                // Since we loaded orderItems, we can access the data.
                // Ideally, $item->order_item should have it.
                $itemData = $item->order_item;
                $isTaxable = false;

                // If is_taxable is in JSON
                if (isset($itemData['is_taxable'])) {
                    $rawTaxable = $itemData['is_taxable'];
                    $isTaxable = $rawTaxable === true || $rawTaxable === 1 || $rawTaxable === 'true' || $rawTaxable === '1';
                } else {
                    // Fallback: Check product (this causes N+1 if not careful, but for one order it's fine)
                    if (isset($itemData['product_id'])) {
                        $prod = \App\Models\Product::find($itemData['product_id']);
                        if ($prod)
                            $isTaxable = $prod->is_taxable;
                    }
                }

                if ($isTaxable) {
                    $qty = (float) ($itemData['quantity'] ?? 1);
                    $unit = (float) ($itemData['price'] ?? 0);
                    $itemTotal = isset($itemData['total_price']) ? (float) $itemData['total_price'] : ($qty * $unit);
                    $itemDisc = (float) ($itemData['discount_amount'] ?? 0);
                    $calculatedTaxAmount += round(max(0, $itemTotal - $itemDisc) * $taxRate);
                }
            }

            FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => AppConstants::TRANSACTION_TYPE_ID_FOOD_ORDER,
                'description' => $description,
                'qty' => 1,
                'amount' => $order->amount,
                'sub_total' => $order->amount,
                'discount_type' => 'fixed',
                'discount_value' => $order->discount ?? 0,
                'discount_amount' => $order->discount ?? 0,
                'tax_amount' => $calculatedTaxAmount,
                'total' => $totalPrice,  // Note: verify if total_price in DB matches this calc
            ]);

            // Create Debit Transaction (Unpaid)
            Transaction::create([
                'type' => 'debit',
                'amount' => $totalPrice,
                'date' => now(),
                'description' => 'Invoice #' . $invoiceData['invoice_no'] . ' - Food Order',
                'payable_type' => $order->member ? Member::class : ($order->customer ? Customer::class : Employee::class),
                'payable_id' => $order->member_id ?? ($order->customer_id ?? $order->employee_id),
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
                'invoice_id' => $invoice->id,
                'created_by' => Auth::id(),
            ]);

            if ($advancePayment > 0 && $order->reservation_id) {
                Transaction::create([
                    'type' => 'credit',
                    'amount' => $advancePayment,
                    'date' => now(),
                    'description' => 'Advance Payment Adjustment - Reservation #' . $order->reservation_id,
                    'payable_type' => $order->member ? Member::class : ($order->customer ? Customer::class : Employee::class),
                    'payable_id' => $order->member_id ?? ($order->customer_id ?? $order->employee_id),
                    'reference_type' => Reservation::class,
                    'reference_id' => $order->reservation_id,
                    'invoice_id' => $invoice->id,
                    'created_by' => Auth::id(),
                ]);
            }

            // Update Order Status
            $order->update([
                'status' => 'completed',
                'payment_status' => 'awaiting'
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Invoice generated successfully.',
                'invoice' => $invoice,
                'order' => $order
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $th->getMessage(),
            ], 500);
        }
    }

    public function savedOrder()
    {
        $today = Carbon::today()->toDateString();
        $orders = Reservation::where('created_by', Auth::id())
            ->whereDate('date', $today)
            ->with('member:id,full_name,membership_no', 'customer:id,name,customer_no', 'table:id,table_no')
            ->get();

        return response()->json([
            'SavedOrders' => $orders,
        ]);
    }

    public function orderMenu(Request $request)
    {
        $restaurantId = $request->routeIs('pos.*') ? null : $this->selectedRestaurantId($request);
        $totalSavedOrders = Order::where('status', 'saved')
            ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
            ->count();

        $latestCategory = Category::query()
            ->when($restaurantId, fn($q) => $q->where('tenant_id', $restaurantId))
            ->latest()
            ->first();
        $firstCategoryId = $latestCategory->id ?? null;

        $orderContext = null;

        // 🔎 Case 1: Reservation flow
        $reservation = null;
        if ($request->has('reservation_id')) {
            $reservation = Reservation::where('id', $request->reservation_id)
                ->with([
                    'member:id,full_name,membership_no',
                    'customer:id,name,customer_no',
                    'employee:id,name,employee_id',
                    'table:id,table_no,floor_id',
                    'order.orderItems'
                ])
                ->first();
        }

        // 🔎 Case 1b: Room Booking flow (from Rooms selection)
        if ($request->has('room_booking_id')) {
            $roomBooking = RoomBooking::where('id', $request->room_booking_id)
                ->with([
                    'member:id,full_name,membership_no,personal_email,current_address',
                    'customer:id,name,customer_no,email,address',
                    'room:id,name'
                ])
                ->first();

            if ($roomBooking) {
                // Determine member details similar to direct flow
                $memberData = [];
                if ($roomBooking->member) {
                    $memberData = [
                        'id' => $roomBooking->member->id,
                        'booking_type' => 'member',
                        'name' => $roomBooking->member->full_name,
                        'membership_no' => $roomBooking->member->membership_no,
                        'email' => $roomBooking->member->personal_email,
                        'address' => $roomBooking->member->current_address
                    ];
                } elseif ($roomBooking->customer) {
                    $memberData = [
                        'id' => $roomBooking->customer->id,
                        'customer_no' => $roomBooking->customer->customer_no,
                        'booking_type' => 'guest',
                        'name' => $roomBooking->customer->name,
                        'email' => $roomBooking->customer->email,
                        'address' => $roomBooking->customer->address
                    ];
                } else {
                    // Walk-in guest in room? Use Guest info from booking
                    $memberData = [
                        'id' => null,  // No customer ID
                        'booking_type' => 'guest',
                        'name' => $roomBooking->guest_first_name . ' ' . $roomBooking->guest_last_name,
                        'email' => $roomBooking->guest_email ?? '',
                        'address' => $roomBooking->guest_address ?? ''
                    ];
                }

                $orderContext = [
                    'order_type' => 'room_service',
                    'room_booking_id' => $roomBooking->id,
                    'room' => $roomBooking->room,
                    'member' => $memberData
                ];
            }
        }

        // 🔎 Case 1c: Cake Booking flow
        if ($request->has('cake_booking_id')) {
            $booking = PosCakeBooking::with(['member:id,full_name,membership_no', 'customer:id,name,customer_no', 'cakeType'])->find($request->cake_booking_id);

            if ($booking) {
                $memberData = [];
                if ($booking->member) {
                    $memberData = [
                        'id' => $booking->member->id,
                        'booking_type' => 'member',
                        'name' => $booking->member->full_name,
                        'membership_no' => $booking->member->membership_no,
                    ];
                } elseif ($booking->customer) {
                    $memberData = [
                        'id' => $booking->customer->id,
                        'customer_no' => $booking->customer->customer_no,
                        'booking_type' => 'guest',
                        'name' => $booking->customer->name,
                    ];
                }

                $orderContext = [
                    'order_type' => 'takeaway',
                    'cake_booking' => $booking,
                    'member' => $memberData
                ];
            }
        }

        // 🔎 Case 2: Direct order flow (via query params)
        // If reservation flow is active, ignore order_type query param to avoid overriding reservation context.
        if (!$orderContext && !$reservation && $request->has('order_type')) {
            $orderContext = [];

            if ($request->filled('order_type')) {
                $orderContext['order_type'] = $request->get('order_type');
            }

            if ($request->filled('person_count')) {
                $orderContext['person_count'] = $request->get('person_count');
            }

            // Member
            if ($request->filled('member_id') && $request->filled('member_type')) {
                if ($request->member_type == 0 || $request->member_type == 1) {
                    $member = Member::select('id', 'full_name', 'membership_no', 'personal_email', 'current_address')
                        ->where('id', $request->member_id)
                        ->first();
                    $orderContext['member'] = [
                        'id' => $member->id,
                        'booking_type' => 'member',
                        'name' => $member->full_name,
                        'membership_no' => $member->membership_no,
                        'email' => $member->personal_email,
                        'address' => $member->current_address
                    ];
                } elseif ($request->member_type == 2 || str_starts_with((string) $request->member_type, 'guest-')) {
                    $customer = Customer::select('id', 'name', 'customer_no', 'email', 'address')
                        ->where('id', $request->member_id)
                        ->first();
                    $orderContext['member'] = [
                        'id' => $customer->id,
                        'customer_no' => $customer->customer_no,
                        'booking_type' => 'guest',
                        'name' => $customer->name,
                        'email' => $customer->email,
                        'address' => $customer->address
                    ];
                } elseif ($request->member_type == 3) {
                    $employee = Employee::select('id', 'employee_id', 'name', 'email', 'phone_no')
                        ->where('id', $request->member_id)
                        ->first();
                    $orderContext['member'] = [
                        'id' => $employee->id,
                        'employee_id' => $employee->employee_id,
                        'booking_type' => 'employee',
                        'name' => $employee->name,
                        'email' => $employee->email,
                    ];
                }
            }

            // Table
            if ($request->filled('table_id')) {
                $orderContext['table'] = Table::select('id', 'table_no', 'floor_id')
                    ->find($request->table_id);
            }

            // Waiter
            if ($request->filled('waiter_id')) {
                $orderContext['waiter'] = Employee::select('id', 'name')
                    ->find($request->waiter_id);
            }

            // Floor (optional, in case frontend needs it separately)
            if ($request->filled('floor_id')) {
                $orderContext['floor'] = $request->get('floor_id');
            }
            // Room (from direct flow if needed)
            if ($request->filled('room_id')) {
                $room = Room::find($request->room_id);
                if ($room) {
                    $orderContext['room'] = $room;
                }
            }
        }

        $orderNo = $this->getOrderNo();

        // Rider
        if ($request->filled('rider_id')) {
            $orderContext['rider_id'] = $request->rider_id;
        }

        return Inertia::render('App/Order/OrderMenu', [
            'totalSavedOrders' => $totalSavedOrders,
            'firstCategoryId' => $firstCategoryId,
            'reservation' => $reservation,  // Reservation flow
            'is_new_order' => $request->boolean('is_new_order'),  // Flag to distinguish New Reservation flow
            'orderContext' => $orderContext,  // Direct order flow with related details
            'orderNo' => $orderNo,
        ]);
    }

    // Get next order number
    private function getOrderNo()
    {
        $lastOrder = Order::select('id')->latest()->first();
        $orderNo = $lastOrder ? (int) $lastOrder->id + 1 : 1;
        return $orderNo;
    }

    private function getInvoiceNo()
    {
        $invoicNo = FinancialInvoice::max('invoice_no');
        $invoicNo = (int) $invoicNo + 1;
        return $invoicNo;
    }

    // Helper to get active shift (Global Scope, ignoring date restriction)
    private function getActiveShift()
    {
        return PosShift::where('user_id', Auth::id())
            ->where('status', 'active')
            ->latest()
            ->first();
    }

    private function checkActiveShift(): bool
    {
        return (bool) $this->getActiveShift();
    }

    public function sendToKitchen(Request $request, InventoryMovementService $inventoryMovementService, KotPrintDispatcher $kotPrintDispatcher)
    {
        // Enforce Active Shift (Global)
        $activeShift = $this->getActiveShift();
        if (!$activeShift) {
            return response()->json([
                'message' => 'You must start a shift before creating orders.',
                'error_code' => 'NO_ACTIVE_SHIFT'
            ], 403);
        }

        $request->validate([
            // 'member.id' => 'required|exists:members,user_id',
            'order_items' => 'required|array',
            'order_items.*.id' => 'required|exists:products,id',
            'price' => 'required|numeric',
            'collective_discount_percent' => 'nullable|numeric|min:0|max:100',
            'kitchen_note' => 'nullable|string',
            'staff_note' => 'nullable|string',
            'payment_note' => 'nullable|string',
            'reservation_id' => 'nullable|exists:reservations,id',
            'room_booking_id' => 'nullable|exists:room_bookings,id',
            'rider_id' => 'nullable|exists:employees,id',
        ]);

        DB::beginTransaction();

        try {
            $posLocationId = (int) ($request->session()->get('active_pos_location_id') ?? $activeShift->location_id);
            if (!$posLocationId) {
                return response()->json([
                    'success' => false,
                    'message' => 'POS location is not selected. Please select a POS location first.',
                ], 400);
            }

            $user = Auth::guard('tenant')->user() ?? Auth::user();
            $tenants = $user ? $user->getAccessibleTenants() : collect();

            $totalDue = $request->price;
            $orderType = $request->order_type;
            $hasPaymentMethod = $request->has('payment') && is_array($request->payment) && array_key_exists('payment_method', $request->payment ?? []);
            if ($hasPaymentMethod) {
                return response()->json([
                    'success' => false,
                    'message' => "Payment is only allowed after selecting 'Generate Invoice' from Order Management.",
                    'error_code' => 'PAYMENT_NOT_ALLOWED_HERE',
                ], 400);
            }

            $tableId = $request->input('table.id');

            $restaurantId = null;

            if ($tableId) {
                $restaurantId = Table::whereKey($tableId)->value('tenant_id');
            }

            $restaurantId = $restaurantId
                ?: ($request->input('restaurant_id') ?: $request->input('tenant_id'));

            if (!$restaurantId || !$tenants->contains(fn($t) => (string) $t->id === (string) $restaurantId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Restaurant is not selected.',
                ], 400);
            }

            $restaurantId = (string) $restaurantId;
            $inventoryContext = $this->resolveRestaurantInventoryContext((int) $restaurantId);

            $orderData = [
                'waiter_id' => $request->input('waiter.id'),
                'table_id' => $tableId,
                'order_type' => $request->order_type,
                'person_count' => $request->person_count,
                // ✅ Use Persistent Shift Date and Tenant
                'start_date' => $activeShift->start_date,  // Force usage of shift date
                'tenant_id' => $restaurantId,
                'location_id' => $posLocationId,
                'start_time' => $request->time,
                'down_payment' => $request->down_payment,
                'amount' => $request->price,
                'kitchen_note' => $request->kitchen_note,
                'staff_note' => $request->staff_note,
                'payment_note' => $request->payment_note,
                'reservation_id' => $request->reservation_id ?? null,
                'room_booking_id' => $request->room_booking_id ?? null,
                'address' => $request->address,
                'rider_id' => $request->rider_id ?? null,
                // Reservations that are new are saved as drafts
                // All other orders go to in_progress for kitchen processing
                'status' => ($request->order_type === 'reservation' && $request->boolean('is_new_order')) ? 'saved' : 'in_progress',
            ];

            $bookingType = $request->input('member.booking_type');
            $memberId = $request->input('member.id');

            if ($bookingType == 'member') {
                $orderData['member_id'] = $memberId;
            } elseif ($bookingType == 'guest') {
                $orderData['customer_id'] = $memberId;
            } else {
                $orderData['employee_id'] = $memberId;
            }

            // 🔎 DEBUG: Log Request Status Logic
            Log::info('SendToKitchen Request:', [
                'order_type' => $request->order_type,
                'is_new_order' => $request->input('is_new_order'),
                'resolved_status' => $orderData['status']
            ]);

            // Capture existing order state BEFORE update to correctly handle item wiping
            $existingOrder = null;
            if ($request->id) {
                $existingOrder = Order::find($request->id);
            }

            if ($tableId && !$request->id && in_array($orderData['status'], ['pending', 'in_progress'], true)) {
                $conflictingOrder = Order::where('table_id', $tableId)
                    ->where('tenant_id', $restaurantId)
                    ->whereDate('start_date', $activeShift->start_date)
                    ->whereIn('status', ['pending', 'in_progress'])
                    ->where(function ($q) {
                        $q->whereNull('payment_status')->orWhere('payment_status', '!=', 'paid');
                    })
                    ->latest('id')
                    ->first();

                if ($conflictingOrder) {
                    DB::rollBack();
                    return response()->json([
                        'success' => false,
                        'message' => 'This table already has an active order (#' . $conflictingOrder->id . '). Please continue the same order.',
                        'existing_order_id' => $conflictingOrder->id,
                    ], 409);
                }

                $shiftDay = Carbon::parse($activeShift->start_date, 'Asia/Karachi')->startOfDay();
                try {
                    $orderDateTime = $shiftDay->copy()->setTimeFromTimeString($orderData['start_time']);
                } catch (\Throwable $e) {
                    $orderDateTime = Carbon::parse($shiftDay->toDateString() . ' ' . $orderData['start_time'], 'Asia/Karachi');
                }

                $reservationConflicts = Reservation::select('id', 'date', 'start_time', 'end_time', 'status')
                    ->where('table_id', $tableId)
                    ->whereDate('date', $activeShift->start_date)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->when($request->filled('reservation_id'), function ($q) use ($request) {
                        $q->where('id', '!=', $request->reservation_id);
                    })
                    ->get();

                foreach ($reservationConflicts as $reservation) {
                    $startTime = Carbon::parse($reservation->date . ' ' . $reservation->start_time, 'Asia/Karachi')->subMinutes(15);
                    $endTime = Carbon::parse($reservation->date . ' ' . $reservation->end_time, 'Asia/Karachi')->addMinutes(5);

                    if ($reservation->status !== 'completed' && $orderDateTime->between($startTime, $endTime)) {
                        DB::rollBack();
                        return response()->json([
                            'success' => false,
                            'message' => 'This table is reserved during this time (Reservation #' . $reservation->id . ').',
                            'conflicting_reservation_id' => $reservation->id,
                        ], 409);
                    }
                }
            }

            $order = Order::updateOrCreate(
                ['id' => $request->id],
                $orderData
            );

            // If updating a DRAFT (saved) order, wipe items first to allow clean overwrite
            // We check $existingOrder->status because $order->status might now be 'in_progress'
            $wasSaved = $existingOrder && $existingOrder->status === 'saved';
            // Fallback: if no existing order (new creation), it's not "previously saved", so we don't wipe (nothing to wipe)
            // Check if we found an existing order that was saved
            if ($wasSaved) {
                Log::info('Wiping items for previously saved order #' . $existingOrder->id);
                foreach ($existingOrder->orderItems as $existingItem) {
                    $itemData = $existingItem->order_item;
                    $qty = $itemData['quantity'] ?? 1;
                    $prodId = $itemData['id'] ?? null;

                    if ($prodId) {
                        $prod = Product::with(['ingredients.inventoryItem'])->find($prodId);

                        if ($prod) {
                            if ($this->productUsesInventoryTracking($prod) && $this->productUsesUnsupportedVariantStock($prod)) {
                                throw new \RuntimeException("Inventory-backed product '{$prod->name}' still uses variant stock. Remove variant stock before ordering.");
                            }

                            $this->syncRecipeInventoryForOrderItem(
                                inventoryMovementService: $inventoryMovementService,
                                product: $prod,
                                quantity: (float) $qty,
                                orderId: (int) $existingOrder->id,
                                restaurantId: (int) $restaurantId,
                                inventoryContext: $inventoryContext,
                                transactionDate: $orderData['start_date'],
                                direction: 'in',
                                createdBy: $request->user()?->id,
                            );
                        }
                    }
                    $existingItem->delete();
                }
            }

            // Mark reservation completed (ONLY if order is active, not saved)
            if ($orderData['status'] !== 'saved' && $request->filled('reservation_id')) {
                Reservation::where('id', $request->reservation_id)->update([
                    'status' => 'completed'
                ]);
            }

            $orderItems = $request->input('order_items', []);
            if (!is_array($orderItems)) {
                $orderItems = [];
            }

            $collectivePct = $request->input('collective_discount_percent');
            if ($collectivePct !== null && $collectivePct !== '' && is_numeric($collectivePct)) {
                $productIds = collect($orderItems)->pluck('id')->filter()->unique()->values()->all();
                $productsById = Product::whereIn('id', $productIds)
                    ->get()
                    ->mapWithKeys(function ($p) {
                        return [
                            $p->id => [
                                'is_discountable' => $p->is_discountable !== false,
                                'max_discount' => $p->max_discount,
                                'max_discount_type' => $p->max_discount_type,
                                'base_price' => $p->base_price,
                            ]
                        ];
                    })
                    ->all();

                $orderItems = $this->applyCollectiveDiscountToItems($orderItems, $productsById, (float) $collectivePct);
            }

            $orderItems = array_values(array_map(function ($item) {
                if (!is_array($item)) {
                    return [];
                }
                if (!isset($item['product_id']) && isset($item['id'])) {
                    $item['product_id'] = $item['id'];
                }
                if (!isset($item['id']) && isset($item['product_id'])) {
                    $item['id'] = $item['product_id'];
                }
                return $item;
            }, $orderItems));

            $productIds = collect($orderItems)->pluck('id')->filter()->map(fn ($id) => (int) $id)->unique()->values()->all();
            $productKitchenMap = Product::query()->whereIn('id', $productIds)->pluck('kitchen_id', 'id')->toArray();
            $orderItems = array_values(array_map(function ($item) use ($productKitchenMap) {
                if (!is_array($item) || empty($item['id'])) {
                    return $item;
                }

                $productId = (int) $item['id'];
                $item['kitchen_id'] = isset($productKitchenMap[$productId]) ? (int) $productKitchenMap[$productId] : null;

                return $item;
            }, $orderItems));

            $groupedByKitchen = [];
            $totalCostPrice = 0;

            foreach ($orderItems as $item) {
                $productId = $item['id'] ?? null;
                if (!$productId) {
                    continue;
                }

                $productQty = $item['quantity'] ?? 1;
                $product = Product::with(['ingredients.inventoryItem'])->find($productId);
                $resolvedKitchenId = isset($item['kitchen_id']) && $item['kitchen_id'] ? (int) $item['kitchen_id'] : null;

                if ($product && $this->productUsesInventoryTracking($product) && $this->productUsesUnsupportedVariantStock($product)) {
                    throw new \RuntimeException("Inventory-backed product '{$product->name}' still uses variant stock. Remove variant stock before ordering.");
                }

                if ($product) {
                    $this->syncRecipeInventoryForOrderItem(
                        inventoryMovementService: $inventoryMovementService,
                        product: $product,
                        quantity: (float) $productQty,
                        orderId: (int) $order->id,
                        restaurantId: (int) $restaurantId,
                        inventoryContext: $inventoryContext,
                        transactionDate: $orderData['start_date'],
                        direction: 'out',
                        createdBy: $request->user()?->id,
                    );
                }

                if (!empty($item['variants'])) {
                    if ($product && $this->productUsesInventoryTracking($product)) {
                        throw new \RuntimeException("Inventory-backed product '{$product->name}' cannot use variant-level stock yet.");
                    }

                    foreach ($item['variants'] as $variant) {
                        $variantId = $variant['id'] ?? null;
                        if (!$variantId) {
                            continue;
                        }

                        $variantValue = ProductVariantValue::find($variantId);

                        if (!$variantValue) {
                            throw new \Exception('Invalid variant ID: ' . $variantId);
                        }

                        // Only check and decrement stock if management is enabled
                        if ($product && $this->productUsesInventoryTracking($product)) {
                            if ($variantValue->stock < 0) {
                                throw new \Exception('Insufficient stock for variant: ' . ($variantValue->name ?? 'Unknown'));
                            }
                            $variantValue->decrement('stock', 1);
                        }

                        $totalCostPrice += $variantValue->additional_price;
                    }
                }

                $totalCostPrice += ($product->cost_of_goods_sold ?? 0) * $productQty;

                OrderItem::create([
                    'order_id' => $order->id,
                    'tenant_id' => $restaurantId,
                    'location_id' => $posLocationId,
                    'kitchen_id' => $resolvedKitchenId,
                    'order_item' => $item,
                    'status' => 'in_progress',
                ]);

                $groupKey = $resolvedKitchenId ? (string) $resolvedKitchenId : 'unassigned';
                if (!array_key_exists($groupKey, $groupedByKitchen)) {
                    $groupedByKitchen[$groupKey] = [];
                }
                $groupedByKitchen[$groupKey][] = $item;
            }

            // Handle Cancelled Items (if any)
            if ($request->has('cancelled_items')) {
                $cancelledItems = collect($request->cancelled_items)
                    ->filter(function ($item) {
                        return !empty($item['id']);
                    })
                    ->values()
                    ->all();

                $cancelledItems = array_map(function ($item) use ($productKitchenMap) {
                    $productId = (int) ($item['id'] ?? 0);
                    $item['kitchen_id'] = $productKitchenMap[$productId] ?? null;
                    return $item;
                }, $cancelledItems);

                $groupedCancelled = collect($cancelledItems)->groupBy('kitchen_id');

                foreach ($groupedCancelled as $kitchenId => $items) {
                    $resolvedKitchenId = is_numeric($kitchenId) ? (int) $kitchenId : null;

                    foreach ($items as $item) {
                        // Apply Stock Logic:
                        // Since we WIPED all items (Restoring Stock), we need to consume stock again unless it's a 'Return'.
                        // If cancelType is 'return', we do nothing (stock stays restored).
                        // If cancelType is 'void' or 'complementary', we decrement stock (consumed).

                        $cancelType = $item['cancelType'] ?? 'void';

                        if ($cancelType !== 'return') {
                            $productId = $item['id'] ?? null;
                            $productQty = $item['quantity'] ?? 1;

                            if ($productId) {
                                $product = Product::with(['ingredients.inventoryItem'])->find($productId);
                                if ($product && $this->productUsesInventoryTracking($product) && $this->productUsesUnsupportedVariantStock($product)) {
                                    throw new \RuntimeException("Inventory-backed product '{$product->name}' still uses variant stock. Remove variant stock before ordering.");
                                }

                                if (!empty($item['variants'])) {
                                    if ($product && $this->productUsesInventoryTracking($product)) {
                                        throw new \RuntimeException("Inventory-backed product '{$product->name}' cannot use variant-level stock yet.");
                                    }

                                    foreach ($item['variants'] as $variant) {
                                        $vId = $variant['id'] ?? null;
                                        if ($vId) {
                                            ProductVariantValue::where('id', $vId)->decrement('stock', 1);
                                        }
                                    }
                                }

                                if ($product) {
                                    $this->syncRecipeInventoryForOrderItem(
                                        inventoryMovementService: $inventoryMovementService,
                                        product: $product,
                                        quantity: (float) $productQty,
                                        orderId: (int) $order->id,
                                        restaurantId: (int) $restaurantId,
                                        inventoryContext: $inventoryContext,
                                        transactionDate: $orderData['start_date'],
                                        direction: 'out',
                                        createdBy: $request->user()?->id,
                                    );
                                }
                            }
                        }

                        OrderItem::create([
                            'order_id' => $order->id,
                            'tenant_id' => $restaurantId,
                            'location_id' => $posLocationId,
                            'kitchen_id' => $resolvedKitchenId,
                            'order_item' => $item,
                            'status' => 'cancelled',  // Explicitly marked
                            'remark' => $item['remark'] ?? null,
                            'instructions' => $item['instructions'] ?? null,
                            'cancelType' => $cancelType,
                        ]);
                    }
                }
            }

            $order->update([
                'tax' => $request->tax,
                'discount' => $request->discount,
                'total_price' => $request->total_price,
                'cost_price' => $totalCostPrice,
                'service_charges' => $request->service_charges,
                'service_charges_percentage' => $request->service_charges_percentage,
                'bank_charges' => $request->bank_charges,
                'bank_charges_percentage' => $request->bank_charges_percentage,
            ]);

            DB::commit();

            $order->load(['table', 'orderItems']);
            broadcast(new OrderCreated($order));

            $printDispatch = $kotPrintDispatcher->dispatchForOrder($order, $groupedByKitchen, [
                'request_id' => $request->attributes->get('request_id'),
                'triggered_by' => $request->user()?->id,
            ]);

            $printMessage = 'Order sent to kitchen successfully.';
            if (($printDispatch['print_status'] ?? null) === 'failed') {
                $printMessage = 'Order saved, but one or more kitchen prints failed. Use Reprint KOT.';
            }

            return response()->json([
                'success' => true,
                'message' => $printMessage,
                'order' => $order,
                'print_status' => $printDispatch['print_status'] ?? 'failed',
                'print_batch_id' => $printDispatch['print_batch_id'] ?? null,
                'dispatched_at' => $printDispatch['dispatched_at'] ?? now()->toIso8601String(),
                'print_failures' => $printDispatch['print_failures'] ?? [],
            ]);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Error sending order to kitchen: ' . $th->getMessage());

            return response()->json([
                'success' => false,
                'message' => $th->getMessage(),
            ], 500);
        }
    }

    private function applyCollectiveDiscountToItems(array $orderItems, array $productsById, float $percent): array
    {
        $pct = max(0.0, min(100.0, $percent));

        foreach ($orderItems as $index => $item) {
            if (!is_array($item)) {
                continue;
            }

            $productId = $item['id'] ?? ($item['product_id'] ?? null);
            if (!$productId || !isset($productsById[$productId])) {
                continue;
            }

            $product = $productsById[$productId];
            if (empty($product['is_discountable'])) {
                continue;
            }

            $qty = isset($item['quantity']) ? (int) $item['quantity'] : 1;
            $qty = $qty > 0 ? $qty : 1;

            $basePrice = isset($item['price'])
                ? (float) $item['price']
                : (isset($product['base_price']) ? (float) $product['base_price'] : 0.0);

            $variantsSum = 0.0;
            if (isset($item['variants']) && is_array($item['variants'])) {
                foreach ($item['variants'] as $variant) {
                    if (is_array($variant) && isset($variant['price'])) {
                        $variantsSum += (float) $variant['price'];
                    }
                }
            }

            $totalPrice = ($basePrice + $variantsSum) * $qty;

            $effectivePct = $pct;
            $maxDiscount = isset($product['max_discount']) ? (float) $product['max_discount'] : 0.0;
            if ($maxDiscount > 0) {
                $maxType = $product['max_discount_type'] ?? 'percentage';
                if ($maxType === 'percentage') {
                    $effectivePct = min($effectivePct, $maxDiscount);
                } else {
                    $maxAmt = $maxDiscount * $qty;
                    $maxPctEquivalent = $totalPrice > 0 ? ($maxAmt / $totalPrice) * 100 : 0.0;
                    $effectivePct = min($effectivePct, $maxPctEquivalent);
                }
            }

            $effectivePct = round($effectivePct, 2);
            $discountAmount = round($totalPrice * ($effectivePct / 100));
            if ($discountAmount > $totalPrice) {
                $discountAmount = $totalPrice;
            }

            $item['quantity'] = $qty;
            $item['price'] = $basePrice;
            $item['total_price'] = $totalPrice;
            $item['discount_type'] = 'percentage';
            $item['discount_value'] = $effectivePct;
            $item['discount_amount'] = $discountAmount;

            $orderItems[$index] = $item;
        }

        return $orderItems;
    }

    private function resolveRestaurantInventoryContext(int $restaurantId): array
    {
        $assignment = app(RestaurantInventoryResolver::class)->resolvePrimaryIssueSource($restaurantId);

        return [
            'warehouse_id' => (int) $assignment->warehouse_id,
            'warehouse_location_id' => $assignment->warehouse_location_id ? (int) $assignment->warehouse_location_id : null,
        ];
    }

    private function recordOrderInventoryMovement(
        InventoryMovementService $inventoryMovementService,
        Product|InventoryItem $inventorySubject,
        float $quantity,
        int $orderId,
        int $restaurantId,
        array $inventoryContext,
        string $transactionDate,
        string $reason,
        string $direction,
        ?int $createdBy = null,
    ): void {
        $inventoryItemId = (int) ($inventorySubject instanceof InventoryItem
            ? $inventorySubject->id
            : ($inventorySubject->inventory_item_id ?? $inventorySubject->id));
        $unitCost = (float) ($inventorySubject instanceof InventoryItem
            ? ($inventorySubject->default_unit_cost ?? 0)
            : ($inventorySubject->cost_of_goods_sold ?? 0));

        $inventoryMovementService->record([
            'product_id' => $inventorySubject instanceof Product ? $inventorySubject->id : null,
            'inventory_item_id' => $inventoryItemId,
            'tenant_id' => $restaurantId,
            'warehouse_id' => $inventoryContext['warehouse_id'],
            'warehouse_location_id' => $inventoryContext['warehouse_location_id'],
            'transaction_date' => $transactionDate,
            'type' => $direction === 'out' ? 'sale' : 'return_in',
            'qty_in' => $direction === 'in' ? $quantity : 0,
            'qty_out' => $direction === 'out' ? $quantity : 0,
            'unit_cost' => $unitCost,
            'total_cost' => $unitCost * $quantity,
            'reference_type' => Order::class,
            'reference_id' => $orderId,
            'reason' => $reason,
            'status' => 'posted',
            'created_by' => $createdBy,
        ]);
    }

    private function syncRecipeInventoryForOrderItem(
        InventoryMovementService $inventoryMovementService,
        Product $product,
        float $quantity,
        int $orderId,
        int $restaurantId,
        array $inventoryContext,
        string $transactionDate,
        string $direction,
        ?int $createdBy = null,
    ): void {
        if (!$product->relationLoaded('ingredients')) {
            $product->load('ingredients.inventoryItem');
        }

        foreach ($product->ingredients as $ingredient) {
            $inventoryItem = $ingredient->inventoryItem;

            if (!$inventoryItem) {
                throw new \RuntimeException("Ingredient '{$ingredient->name}' is not linked to an inventory item.");
            }

            $requiredQuantity = round((float) $ingredient->pivot->quantity_used * $quantity, 3);

            if ($requiredQuantity <= 0) {
                continue;
            }

            if ($direction === 'out') {
                $available = $inventoryMovementService->availableQuantity(
                    (int) $inventoryItem->id,
                    (int) $inventoryContext['warehouse_id'],
                    $inventoryContext['warehouse_location_id'],
                );

                if ($available + 0.0001 < $requiredQuantity) {
                    throw new \RuntimeException("Insufficient raw-material stock for ingredient '{$ingredient->name}'.");
                }
            }

            $this->recordOrderInventoryMovement(
                inventoryMovementService: $inventoryMovementService,
                inventorySubject: $inventoryItem,
                quantity: $requiredQuantity,
                orderId: $orderId,
                restaurantId: $restaurantId,
                inventoryContext: $inventoryContext,
                transactionDate: $transactionDate,
                reason: 'POS recipe consumption · ' . $product->name . ' · ' . $ingredient->name,
                direction: $direction,
                createdBy: $createdBy,
            );
        }
    }

    private function normalizeAdjustmentType(?string $status, ?string $adjustmentType = null, ?string $cancelType = null): ?string
    {
        $normalized = strtolower(trim((string) ($adjustmentType ?: $cancelType ?: '')));

        if (in_array($normalized, ['void', 'complementary', 'return', 'refund'], true)) {
            return $normalized;
        }

        return $status === 'refund' ? 'refund' : null;
    }

    private function shouldConsumeInventoryForAdjustment(?string $status, ?string $adjustmentType): bool
    {
        if ($status === 'cancelled') {
            return $adjustmentType !== 'return';
        }

        if ($status === 'refund') {
            return $adjustmentType !== 'return';
        }

        return true;
    }

    private function buildOrderInventorySnapshot(Collection $rows, ?string $orderStatus = null, ?string $orderAdjustmentType = null): array
    {
        $productIds = $rows
            ->map(function ($row) {
                $payload = is_array($row->order_item ?? null) ? $row->order_item : [];
                $productId = $payload['product_id'] ?? ($payload['id'] ?? null);

                return $productId ? (int) $productId : null;
            })
            ->filter()
            ->unique()
            ->values();

        $products = Product::query()
            ->with('ingredients.inventoryItem')
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $snapshot = [
            'finished' => [],
            'recipe' => [],
        ];

        foreach ($rows as $row) {
            $payload = is_array($row->order_item ?? null) ? $row->order_item : [];
            $productId = (int) ($payload['product_id'] ?? ($payload['id'] ?? 0));

            if ($productId <= 0) {
                continue;
            }

            $product = $products->get($productId);
            if (!$product) {
                continue;
            }

            $rowStatus = $orderStatus && in_array($orderStatus, ['cancelled', 'refund'], true)
                ? $orderStatus
                : ($row->status ?? 'pending');
            $rowAdjustmentType = $orderStatus && in_array($orderStatus, ['cancelled', 'refund'], true)
                ? $orderAdjustmentType
                : $this->normalizeAdjustmentType($rowStatus, $payload['adjustment_type'] ?? null, $row->cancelType ?? ($payload['cancelType'] ?? null));

            if (!$this->shouldConsumeInventoryForAdjustment($rowStatus, $rowAdjustmentType)) {
                continue;
            }

            $quantity = round((float) ($payload['quantity'] ?? 0), 3);
            if ($quantity <= 0) {
                continue;
            }

            if ($this->productUsesInventoryTracking($product) && $this->productUsesUnsupportedVariantStock($product)) {
                throw new \RuntimeException("Inventory-backed product '{$product->name}' still uses variant stock. Remove variant stock before ordering.");
            }

            foreach ($product->ingredients as $ingredient) {
                $inventoryItem = $ingredient->inventoryItem;
                if (!$inventoryItem) {
                    throw new \RuntimeException("Ingredient '{$ingredient->name}' is not linked to an inventory item.");
                }

                $requiredQuantity = round((float) $ingredient->pivot->quantity_used * $quantity, 3);
                if ($requiredQuantity <= 0) {
                    continue;
                }

                if (!isset($snapshot['recipe'][$inventoryItem->id])) {
                    $snapshot['recipe'][$inventoryItem->id] = [
                        'product' => $inventoryItem,
                        'quantity' => 0.0,
                    ];
                }

                $snapshot['recipe'][$inventoryItem->id]['quantity'] += $requiredQuantity;
            }
        }

        return $snapshot;
    }

    private function applyInventorySnapshotDelta(
        InventoryMovementService $inventoryMovementService,
        array $previousSnapshot,
        array $nextSnapshot,
        Order $order,
        string $transactionDate,
        ?int $createdBy = null,
    ): string {
        $allBuckets = ['recipe'];
        $hasChanges = false;

        foreach ($allBuckets as $bucket) {
            $keys = array_unique(array_merge(
                array_keys($previousSnapshot[$bucket] ?? []),
                array_keys($nextSnapshot[$bucket] ?? []),
            ));

            foreach ($keys as $productId) {
                $before = (float) ($previousSnapshot[$bucket][$productId]['quantity'] ?? 0);
                $after = (float) ($nextSnapshot[$bucket][$productId]['quantity'] ?? 0);
                if (abs($after - $before) >= 0.0001) {
                    $hasChanges = true;
                    break 2;
                }
            }
        }

        if (!$hasChanges) {
            return 'none';
        }

        $inventoryContext = $this->resolveRestaurantInventoryContext((int) $order->tenant_id);
        $effect = 'none';

        foreach ($allBuckets as $bucket) {
            $keys = array_unique(array_merge(
                array_keys($previousSnapshot[$bucket] ?? []),
                array_keys($nextSnapshot[$bucket] ?? []),
            ));

            foreach ($keys as $productId) {
                $before = round((float) ($previousSnapshot[$bucket][$productId]['quantity'] ?? 0), 3);
                $after = round((float) ($nextSnapshot[$bucket][$productId]['quantity'] ?? 0), 3);
                $delta = round($after - $before, 3);

                if (abs($delta) < 0.0001) {
                    continue;
                }

                $product = $nextSnapshot[$bucket][$productId]['product']
                    ?? $previousSnapshot[$bucket][$productId]['product']
                    ?? null;

                if (!$product) {
                    continue;
                }

                if ($delta > 0) {
                    $available = $inventoryMovementService->availableQuantity(
                        (int) $product->id,
                        (int) $inventoryContext['warehouse_id'],
                        $inventoryContext['warehouse_location_id'],
                    );

                    if ($available + 0.0001 < $delta) {
                        throw new \RuntimeException("Insufficient warehouse stock for '{$product->name}' while updating order.");
                    }

                    $this->recordOrderInventoryMovement(
                        inventoryMovementService: $inventoryMovementService,
                        inventorySubject: $product,
                        quantity: $delta,
                        orderId: (int) $order->id,
                        restaurantId: (int) $order->tenant_id,
                        inventoryContext: $inventoryContext,
                        transactionDate: $transactionDate,
                        reason: $bucket === 'recipe' ? 'POS order adjustment recipe consumption' : 'POS order adjustment consumption',
                        direction: 'out',
                        createdBy: $createdBy,
                    );
                    $effect = 'consume';
                    continue;
                }

                $this->recordOrderInventoryMovement(
                    inventoryMovementService: $inventoryMovementService,
                    inventorySubject: $product,
                    quantity: abs($delta),
                    orderId: (int) $order->id,
                    restaurantId: (int) $order->tenant_id,
                    inventoryContext: $inventoryContext,
                    transactionDate: $transactionDate,
                    reason: $bucket === 'recipe' ? 'POS order adjustment recipe return' : 'POS order adjustment return',
                    direction: 'in',
                    createdBy: $createdBy,
                );
                $effect = 'restore';
            }
        }

        return $effect;
    }

    private function buildOrderAdjustmentSummary(Order $order, ?FinancialInvoice $invoice = null): array
    {
        $adjustmentType = $this->normalizeAdjustmentType($order->status, null, $order->cancelType);
        $invoiceStatus = strtolower((string) ($invoice?->status ?? ''));
        $paymentStatus = strtolower((string) ($order->payment_status ?? ''));
        $paidAmount = (float) ($invoice?->paid_amount ?? 0);

        $adjustmentLabel = match ($adjustmentType) {
            'void' => 'Void - stock kept consumed',
            'complementary' => 'Complementary - stock kept consumed',
            'return' => 'Return - stock restored',
            'refund' => 'Refund - payment reversed',
            default => match ($order->status) {
                'cancelled' => 'Cancelled',
                'refund' => 'Refund',
                default => ucfirst(str_replace('_', ' ', (string) $order->status)),
            },
        };

        $inventoryEffect = 'none';
        if ($order->status === 'cancelled') {
            $inventoryEffect = $adjustmentType === 'return' ? 'restore' : 'none';
        } elseif ($order->status === 'refund') {
            $inventoryEffect = $adjustmentType === 'return' ? 'restore' : 'none';
        }

        $financeEffect = 'none';
        if ($order->status === 'cancelled') {
            if ($invoice) {
                $financeEffect = in_array($adjustmentType, ['void', 'complementary'], true) ? 'void_invoice' : 'cancel_invoice';
            }
        } elseif ($order->status === 'refund' || $invoiceStatus === 'refunded') {
            $financeEffect = ($paidAmount > 0 || in_array($paymentStatus, ['paid', 'refunded'], true) || $invoiceStatus === 'refunded')
                ? 'refund_payment'
                : 'cancel_invoice';
        }

        return [
            'adjustment_type' => $adjustmentType,
            'adjustment_label' => $adjustmentLabel,
            'inventory_effect' => $inventoryEffect,
            'finance_effect' => $financeEffect,
        ];
    }

    private function attachOrderAdjustmentMetadata(Order $order, ?FinancialInvoice $invoice = null): Order
    {
        $summary = $this->buildOrderAdjustmentSummary($order, $invoice);
        foreach ($summary as $key => $value) {
            $order->setAttribute($key, $value);
        }

        if ($order->relationLoaded('orderItems')) {
            $order->orderItems->transform(function ($row) {
                $status = $row->status ?? 'pending';
                $adjustmentType = $this->normalizeAdjustmentType($status, null, $row->cancelType);
                $row->setAttribute('adjustment_type', $adjustmentType);
                $row->setAttribute('adjustment_label', match ($adjustmentType) {
                    'void' => 'Void - stock kept consumed',
                    'complementary' => 'Complementary - stock kept consumed',
                    'return' => 'Return - stock restored',
                    'refund' => 'Refund - payment reversed',
                    default => $status === 'cancelled' ? 'Cancelled' : ucfirst(str_replace('_', ' ', (string) $status)),
                });
                $row->setAttribute('inventory_effect', $status === 'cancelled' && $adjustmentType === 'return' ? 'restore' : 'none');

                return $row;
            });
        }

        return $order;
    }

    private function refundOrderInvoice(Order $order, FinancialInvoice $invoice): string
    {
        $hasReceiptLink = TransactionRelation::query()
            ->where('invoice_id', $invoice->id)
            ->whereNotNull('receipt_id')
            ->exists()
            || Transaction::query()
                ->where('invoice_id', $invoice->id)
                ->whereNotNull('receipt_id')
                ->exists();

        $refundableAmount = (float) ($invoice->paid_amount ?? 0);

        if ($refundableAmount <= 0 || !$hasReceiptLink) {
            throw new \RuntimeException('Refund cannot be processed because no valid invoice receipt linkage was found.');
        }

        $invoiceItem = $invoice->items()->first();
        $payerType = $order->member_id
            ? Member::class
            : ($order->customer_id ? Customer::class : Employee::class);
        $payerId = $order->member_id ?: ($order->customer_id ?: $order->employee_id);

        if (!$payerId) {
            throw new \RuntimeException('Refund cannot be processed because the payer could not be resolved.');
        }

        $invoice->update([
            'status' => 'refunded',
            'paid_amount' => max(0, (float) $invoice->paid_amount - $refundableAmount),
        ]);

        Transaction::create([
            'type' => 'debit',
            'amount' => $refundableAmount,
            'date' => now(),
            'description' => 'Refund processed for POS Order #' . $order->id,
            'payable_type' => $payerType,
            'payable_id' => $payerId,
            'reference_type' => $invoiceItem ? FinancialInvoiceItem::class : FinancialInvoice::class,
            'reference_id' => $invoiceItem ? $invoiceItem->id : $invoice->id,
            'invoice_id' => $invoice->id,
            'created_by' => Auth::id(),
        ]);

        return 'refund_payment';
    }

    protected function printItem($printer, $item)
    {
        // Print the category if available
        if (isset($item['category']) && !empty($item['category'])) {
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->text("Category: {$item['category']}\n");
        }

        // Print item basic info
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text("- {$item['name']} x {$item['quantity']}\n");

        // Print item variants
        if (isset($item['variants']) && !empty($item['variants'])) {
            foreach ($item['variants'] as $variant) {
                $printer->text("  > {$variant['name']}: {$variant['value']}\n");
            }
        }

        // Add separator
        $printer->text("--------------------------------\n");
    }

    // update Order

    public function update(Request $request, $id)
    {
        $user = Auth::guard('tenant')->user() ?? Auth::user();
        $canEditAfterBill = $this->canEditAfterBill($user);
        $respondUpdateError = function (string $message, string $errorCode = 'ORDER_UPDATE_ERROR', int $status = 422) use ($request) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return response()->json([
                    'message' => $message,
                    'error_code' => $errorCode,
                ], $status);
            }

            return redirect()->back()->withErrors([
                'error' => $message,
                'error_code' => $errorCode,
            ]);
        };

        if (!$this->checkActiveShift() && !$canEditAfterBill) {
            return $respondUpdateError('You must have an active shift to update orders.', 'NO_ACTIVE_SHIFT', 403);
        }

        // Validate status and items first
        $validated = $request->validate([
            'updated_items' => 'nullable|array',
            'new_items' => 'nullable|array',
            'status' => 'required|in:saved,pending,in_progress,completed,cancelled,no_show,refund',
            'adjustment_type' => 'nullable|in:void,complementary,return,refund',
            'adjustment_scope' => 'nullable|in:item,order',
            'subtotal' => 'nullable|numeric',
            'total_price' => 'nullable|numeric',
            'discount' => 'nullable|numeric',
            'tax_rate' => 'nullable|numeric',
            'service_charges' => 'nullable|numeric',
            'bank_charges' => 'nullable|numeric',
            'client_type' => 'nullable|in:member,guest,employee',
            'client_id' => 'nullable|integer|min:1',
        ]);

        // Custom check for subtotal/total_price dependency
        if (($request->has('subtotal') && !$request->has('total_price')) ||
                ($request->has('total_price') && !$request->has('subtotal'))) {
            return redirect()->back()->withErrors([
                'subtotal' => 'Subtotal and total_price must be provided together.'
            ]);
        }

        DB::beginTransaction();

        try {
            $order = Order::findOrFail($id);
            $previousOrderItems = $order->orderItems()->get();
            $previousOrderStatus = (string) $order->status;
            $previousAdjustmentType = $this->normalizeAdjustmentType($previousOrderStatus, null, $order->cancelType);
            if (!$canEditAfterBill && (string) $order->created_by !== (string) Auth::id()) {
                DB::rollBack();
                return $respondUpdateError('You are not allowed to update this order.', 'FORBIDDEN', 403);
            }

            $financialInvoice = FinancialInvoice::where('invoice_type', 'food_order')
                ->whereJsonContains('data', ['order_id' => $order->id])
                ->first();
            $requestedAdjustmentType = $this->normalizeAdjustmentType(
                $validated['status'],
                $request->input('adjustment_type'),
                $request->input('cancelType'),
            );
            $hasClientUpdate = ($request->filled('client_type') || $request->filled('customer_type')) && ($request->filled('client_id') || $request->filled('customer_id'));
            $isClientChanged = false;
            if ($hasClientUpdate) {
                $clientType = (string) ($request->input('client_type') ?? $request->input('customer_type'));
                $clientId = (int) ($request->input('client_id') ?? $request->input('customer_id'));
                $currentClientType = $order->member_id ? 'member' : ($order->customer_id ? 'guest' : ($order->employee_id ? 'employee' : null));
                $currentClientId = (int) ($order->member_id ?: ($order->customer_id ?: ($order->employee_id ?: 0)));
                $isClientChanged = ((string) $clientType !== (string) $currentClientType) || ($clientId !== $currentClientId);
            }
            if ($isClientChanged) {
                $isPaidOrder = strtolower((string) ($order->payment_status ?? '')) === 'paid';
                $isPaidInvoice = strtolower((string) ($financialInvoice->status ?? '')) === 'paid';
                if ($isPaidOrder || $isPaidInvoice) {
                    DB::rollBack();
                    return $respondUpdateError('Customer cannot be changed after payment is done.', 'CLIENT_EDIT_AFTER_PAYMENT_FORBIDDEN', 422);
                }
            }

            $getItemId = function ($rawId) {
                if (is_int($rawId) || (is_string($rawId) && ctype_digit($rawId))) {
                    return (int) $rawId;
                }
                if (is_string($rawId) && str_starts_with($rawId, 'update-')) {
                    $maybe = substr($rawId, 7);
                    return ctype_digit($maybe) ? (int) $maybe : null;
                }
                return null;
            };

            $normalizeOrderItem = function ($orderItem) {
                if (!is_array($orderItem)) {
                    return [];
                }

                if (!isset($orderItem['product_id']) && isset($orderItem['id'])) {
                    $orderItem['product_id'] = $orderItem['id'];
                }
                if (!isset($orderItem['id']) && isset($orderItem['product_id'])) {
                    $orderItem['id'] = $orderItem['product_id'];
                }

                $qty = isset($orderItem['quantity']) ? (int) $orderItem['quantity'] : 1;
                $orderItem['quantity'] = $qty > 0 ? $qty : 1;
                $orderItem['price'] = isset($orderItem['price']) ? (float) $orderItem['price'] : 0.0;

                $variants = isset($orderItem['variants']) && is_array($orderItem['variants']) ? $orderItem['variants'] : [];
                $orderItem['variants'] = array_values(array_map(function ($v) {
                    if (!is_array($v)) {
                        return [];
                    }
                    if (isset($v['price'])) {
                        $v['price'] = (float) $v['price'];
                    }
                    return $v;
                }, $variants));

                return $orderItem;
            };

            $itemKey = function ($orderItem) use ($normalizeOrderItem) {
                $oi = $normalizeOrderItem($orderItem);
                $productId = $oi['product_id'] ?? $oi['id'] ?? null;
                $variants = isset($oi['variants']) && is_array($oi['variants']) ? $oi['variants'] : [];
                $variantKeyParts = [];
                foreach ($variants as $v) {
                    $variantKeyParts[] = ($v['id'] ?? '') . ':' . ($v['value'] ?? '');
                }
                sort($variantKeyParts);
                return (string) ($productId ?? '') . '|' . implode(',', $variantKeyParts);
            };

            $unitPrice = function ($orderItem) use ($normalizeOrderItem) {
                $oi = $normalizeOrderItem($orderItem);
                $base = (float) ($oi['price'] ?? 0);
                $variants = isset($oi['variants']) && is_array($oi['variants']) ? $oi['variants'] : [];
                $variantsSum = 0.0;
                foreach ($variants as $v) {
                    $variantsSum += isset($v['price']) ? (float) $v['price'] : 0.0;
                }
                return $base + $variantsSum;
            };

            $recalcPricing = function ($orderItem) use ($normalizeOrderItem, $unitPrice) {
                $oi = $normalizeOrderItem($orderItem);
                $qty = (int) ($oi['quantity'] ?? 1);
                $qty = $qty > 0 ? $qty : 1;
                $totalPrice = $unitPrice($oi) * $qty;
                $oi['total_price'] = $totalPrice;

                $discountValue = isset($oi['discount_value']) ? (float) $oi['discount_value'] : null;
                $discountType = $oi['discount_type'] ?? null;

                if ($discountValue !== null && $discountValue > 0) {
                    $disc = 0.0;
                    if ($discountType === 'percentage') {
                        $disc = round($totalPrice * ($discountValue / 100));
                    } else {
                        $disc = round($discountValue * $qty);
                    }
                    if ($disc > $totalPrice) {
                        $disc = $totalPrice;
                    }
                    $oi['discount_amount'] = $disc;
                } else {
                    $oi['discount_amount'] = isset($oi['discount_amount']) ? (float) $oi['discount_amount'] : 0.0;
                }

                return $oi;
            };

            $mergeIncoming = function (array $updated, array $new) use ($itemKey, $recalcPricing) {
                $map = [];

                foreach ($updated as $row) {
                    if (!is_array($row) || !isset($row['order_item'])) {
                        continue;
                    }
                    $row['order_item'] = $recalcPricing($row['order_item']);
                    $baseKey = $itemKey($row['order_item']);
                    $status = $row['status'] ?? null;
                    $rowId = isset($row['id']) ? (string) $row['id'] : uniqid('row_', true);
                    $key = $status === 'cancelled'
                        ? ('cancelled|' . $rowId . '|' . $baseKey . '|' . uniqid('row_', true))
                        : ($rowId . '|' . $baseKey);
                    if ($key === '|') {
                        $key = uniqid('row_', true);
                    }
                    $map[$key] = $row;
                }

                foreach ($new as $row) {
                    if (!is_array($row) || !isset($row['order_item'])) {
                        continue;
                    }
                    $row['order_item'] = $recalcPricing($row['order_item']);
                    $baseKey = $itemKey($row['order_item']);
                    $status = $row['status'] ?? null;
                    $key = $status === 'cancelled' ? ('cancelled|' . $baseKey . '|' . uniqid('row_', true)) : $baseKey;
                    if ($key === '|') {
                        $key = uniqid('row_', true);
                    }

                    if (!isset($map[$key])) {
                        $map[$key] = $row;
                        continue;
                    }

                    $existingStatus = $map[$key]['status'] ?? null;
                    if ($existingStatus === 'cancelled' || $status === 'cancelled') {
                        $map[uniqid('row_', true)] = $row;
                        continue;
                    }

                    $existingQty = (int) ($map[$key]['order_item']['quantity'] ?? 1);
                    $incomingQty = (int) ($row['order_item']['quantity'] ?? 1);
                    $nextQty = $existingQty + ($incomingQty > 0 ? $incomingQty : 1);

                    $map[$key]['order_item']['quantity'] = $nextQty;
                    $map[$key]['order_item'] = $recalcPricing($map[$key]['order_item']);
                }

                $mergedUpdated = [];
                $mergedNew = [];
                foreach ($map as $row) {
                    $rawId = $row['id'] ?? null;
                    if (is_string($rawId) && str_starts_with($rawId, 'update-')) {
                        $mergedUpdated[] = $row;
                    } else {
                        $mergedNew[] = $row;
                    }
                }

                return [$mergedUpdated, $mergedNew];
            };

            // Update only price fields if both are present
            // Update order fields
            $updateData = [
                'status' => $validated['status'],
                'remark' => $request->remark ?? null,
                'instructions' => $request->instructions ?? null,
                'cancelType' => $requestedAdjustmentType,
            ];
            if ($validated['status'] === 'cancelled' && $financialInvoice && strtolower((string) ($financialInvoice->status ?? '')) === 'paid') {
                DB::rollBack();
                return $respondUpdateError('Paid orders must use the refund workflow instead of cancellation.', 'PAID_ORDER_CANCEL_FORBIDDEN', 422);
            }
            if ($hasClientUpdate) {
                $clientType = (string) ($request->input('client_type') ?? $request->input('customer_type'));
                $clientId = (int) ($request->input('client_id') ?? $request->input('customer_id'));
                if (
                    ($clientType === 'member' && !Member::where('id', $clientId)->exists()) ||
                    ($clientType === 'guest' && !Customer::where('id', $clientId)->exists()) ||
                    ($clientType === 'employee' && !Employee::where('id', $clientId)->exists())
                ) {
                    DB::rollBack();
                    return $respondUpdateError('Selected customer is invalid.', 'INVALID_CLIENT', 422);
                }

                $updateData['member_id'] = $clientType === 'member' ? $clientId : null;
                $updateData['customer_id'] = $clientType === 'guest' ? $clientId : null;
                $updateData['employee_id'] = $clientType === 'employee' ? $clientId : null;
            }

            if (
                $request->has('subtotal') &&
                $request->has('total_price') &&
                $validated['subtotal'] !== null &&
                $validated['total_price'] !== null
            ) {
                $updateData['amount'] = $validated['subtotal'];
                $updateData['total_price'] = $validated['total_price'];

                // Update discount if provided
                if ($request->has('discount')) {
                    $updateData['discount'] = $validated['discount'];
                }

                // Update tax if provided
                if ($request->has('tax_rate')) {
                    $updateData['tax'] = $validated['tax_rate'];
                }
            }
            if ($request->has('service_charges')) {
                $updateData['service_charges'] = (float) ($validated['service_charges'] ?? 0);
            }
            if ($request->has('bank_charges')) {
                $updateData['bank_charges'] = (float) ($validated['bank_charges'] ?? 0);
            }

            $order->update($updateData);

            [$mergedUpdatedItems, $mergedNewItems] = $mergeIncoming($validated['updated_items'] ?? [], $validated['new_items'] ?? []);

            $mergedProductIds = collect(array_merge($mergedUpdatedItems, $mergedNewItems))
                ->map(function ($row) {
                    $orderItem = is_array($row['order_item'] ?? null) ? $row['order_item'] : [];
                    $productId = $orderItem['product_id'] ?? ($orderItem['id'] ?? null);
                    return $productId ? (int) $productId : null;
                })
                ->filter()
                ->unique()
                ->values()
                ->all();

            $productKitchenMap = !empty($mergedProductIds)
                ? Product::query()->whereIn('id', $mergedProductIds)->pluck('kitchen_id', 'id')->toArray()
                : [];

            // Update existing order items
            foreach ($mergedUpdatedItems as $itemData) {
                $itemId = $getItemId($itemData['id'] ?? null);
                if (!$itemId) {
                    continue;
                }
                $normalizedOrderItem = $recalcPricing($itemData['order_item'] ?? []);
                $productId = (int) ($normalizedOrderItem['product_id'] ?? ($normalizedOrderItem['id'] ?? 0));
                $resolvedKitchenId = $productId > 0 ? (($productKitchenMap[$productId] ?? null) ? (int) $productKitchenMap[$productId] : null) : null;
                $order->orderItems()->where('id', $itemId)->update([
                    'order_item' => $normalizedOrderItem,
                    'kitchen_id' => $resolvedKitchenId,
                    'status' => $itemData['status'],
                    'remark' => $itemData['remark'] ?? null,
                    'instructions' => $itemData['instructions'] ?? null,
                    'cancelType' => $this->normalizeAdjustmentType($itemData['status'] ?? null, $itemData['adjustment_type'] ?? null, $itemData['cancelType'] ?? null),
                ]);
            }

            // Add new order items
            foreach ($mergedNewItems as $itemData) {
                $normalizedOrderItem = $recalcPricing($itemData['order_item'] ?? []);
                $productId = (int) ($normalizedOrderItem['product_id'] ?? ($normalizedOrderItem['id'] ?? 0));
                $resolvedKitchenId = $productId > 0 ? (($productKitchenMap[$productId] ?? null) ? (int) $productKitchenMap[$productId] : null) : null;
                $order->orderItems()->create([
                    'tenant_id' => $order->tenant_id,
                    'location_id' => $order->location_id,
                    'kitchen_id' => $resolvedKitchenId,
                    'order_item' => $normalizedOrderItem,
                    'status' => $itemData['status'] ?? 'pending',
                    'remark' => $itemData['remark'] ?? null,
                    'instructions' => $itemData['instructions'] ?? null,
                    'cancelType' => $this->normalizeAdjustmentType($itemData['status'] ?? null, $itemData['adjustment_type'] ?? null, $itemData['cancelType'] ?? null),
                ]);
            }

            $inventoryMovementService = app(InventoryMovementService::class);
            $previousSnapshot = $this->buildOrderInventorySnapshot(
                $previousOrderItems,
                in_array($previousOrderStatus, ['cancelled', 'refund'], true) ? $previousOrderStatus : null,
                $previousAdjustmentType,
            );
            $nextOrderItems = $order->orderItems()->get();
            $nextSnapshot = $this->buildOrderInventorySnapshot(
                $nextOrderItems,
                in_array($validated['status'], ['cancelled', 'refund'], true) ? $validated['status'] : null,
                $requestedAdjustmentType,
            );
            $inventoryEffect = $this->applyInventorySnapshotDelta(
                inventoryMovementService: $inventoryMovementService,
                previousSnapshot: $previousSnapshot,
                nextSnapshot: $nextSnapshot,
                order: $order,
                transactionDate: (string) ($order->start_date ?? now()->toDateString()),
                createdBy: $request->user()?->id,
            );

            $freshItems = $order->orderItems()->where('status', '!=', 'cancelled')->get();
            $taxRate = (float) ($order->tax ?? 0);
            $subtotal = 0.0;
            $totalDiscount = 0.0;
            $totalTax = 0.0;
            foreach ($freshItems as $row) {
                $oi = is_array($row->order_item) ? $row->order_item : [];
                $oi = $normalizeOrderItem($oi);
                $qty = (int) ($oi['quantity'] ?? 1);
                $lineTotal = $unitPrice($oi) * ($qty > 0 ? $qty : 1);
                $lineDiscount = isset($oi['discount_amount']) ? (float) $oi['discount_amount'] : 0.0;
                $net = $lineTotal - $lineDiscount;

                $isTaxable = $oi['is_taxable'] ?? null;
                if ($isTaxable === null) {
                    $productId = $oi['product_id'] ?? null;
                    if ($productId) {
                        $product = Product::find($productId);
                        $isTaxable = $product ? (bool) $product->is_taxable : false;
                    } else {
                        $isTaxable = false;
                    }
                } else {
                    $isTaxable = $isTaxable === true || $isTaxable === 1 || $isTaxable === 'true';
                }

                $subtotal += $lineTotal;
                $totalDiscount += $lineDiscount;
                $totalTax += $isTaxable ? round($net * $taxRate) : 0.0;
            }

            $computedAmount = (float) round($subtotal);
            $computedDiscount = (float) round($totalDiscount);
            $effectiveServiceCharges = $request->has('service_charges')
                ? (float) ($validated['service_charges'] ?? 0)
                : (float) ($order->service_charges ?? 0);
            $effectiveBankCharges = $request->has('bank_charges')
                ? (float) ($validated['bank_charges'] ?? 0)
                : (float) ($order->bank_charges ?? 0);
            $computedTotal = (float) round($subtotal - $totalDiscount + $totalTax + $effectiveServiceCharges + $effectiveBankCharges);

            $shouldSyncTotals = !empty($mergedUpdatedItems) || !empty($mergedNewItems) || ($request->has('subtotal') || $request->has('total_price') || $request->has('service_charges') || $request->has('bank_charges'));
            if ($shouldSyncTotals) {
                $order->update([
                    'amount' => $computedAmount,
                    'discount' => $computedDiscount,
                    'service_charges' => $effectiveServiceCharges,
                    'bank_charges' => $effectiveBankCharges,
                    'total_price' => $computedTotal,
                ]);
            }

            $financeEffect = 'none';

            // ✅ AUTO-CREATE INVOICE when order marked 'completed' (for dine-in, delivery, reservation, room_service)
            // Only if a payer exists (member, customer, or employee)
            $hasPayer = $order->member_id || $order->customer_id || $order->employee_id;
            if (
                $validated['status'] === 'completed' &&
                !$financialInvoice &&
                $hasPayer &&
                in_array($order->order_type, ['dineIn', 'delivery', 'reservation', 'room_service', 'takeaway'])
            ) {
                // Determine payer type
                if ($order->member_id) {
                    $payerType = \App\Models\Member::class;
                    $payerId = $order->member_id;
                } elseif ($order->customer_id) {
                    $payerType = \App\Models\Customer::class;
                    $payerId = $order->customer_id;
                } else {
                    $payerType = \App\Models\Employee::class;
                    $payerId = $order->employee_id;
                }

                $invoiceData = [
                    'invoice_no' => $this->getInvoiceNo(),
                    'invoice_type' => 'food_order',
                    'amount' => $order->amount ?? 0,
                    'total_price' => $order->total_price ?? 0,
                    'payment_method' => null,
                    'issue_date' => Carbon::now(),
                    'status' => 'unpaid',
                    'data' => [
                        'order_id' => $order->id,
                    ],
                    'invoiceable_id' => $order->id,
                    'invoiceable_type' => Order::class,
                ];

                if ($order->member_id) {
                    $invoiceData['member_id'] = $order->member_id;
                } elseif ($order->customer_id) {
                    $invoiceData['customer_id'] = $order->customer_id;
                } else {
                    $invoiceData['employee_id'] = $order->employee_id;
                }

                $financialInvoice = FinancialInvoice::create($invoiceData);

                // Update order payment_status to 'awaiting'
                $order->update(['payment_status' => 'awaiting']);

                // Mark reservation as completed
                if ($order->reservation_id) {
                    Reservation::where('id', $order->reservation_id)->update(['status' => 'completed']);
                }

                // Create Invoice Items & Debit Transaction (Aggregated)
                $orderItems = $order->orderItems()->where('status', '!=', 'cancelled')->get();
                if ($orderItems->isNotEmpty()) {
                    $totalGross = 0;
                    $totalDiscount = 0;
                    $totalTax = 0;
                    $itemNames = [];

                    $taxRate = $order->tax ?? 0;

                    // Fetch products to check is_taxable
                    $productIds = [];
                    foreach ($orderItems as $orderItem) {
                        $itemData = $orderItem->order_item;
                        if (isset($itemData['product_id'])) {
                            $productIds[] = $itemData['product_id'];
                        }
                    }
                    $productIds = array_unique($productIds);
                    $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

                    foreach ($orderItems as $orderItem) {
                        $item = is_array($orderItem->order_item) ? $orderItem->order_item : [];
                        $item = $normalizeOrderItem($item);
                        $qty = (int) ($item['quantity'] ?? 1);
                        $subTotal = isset($item['total_price']) ? (float) $item['total_price'] : ($unitPrice($item) * ($qty > 0 ? $qty : 1));

                        $itemDiscountAmount = (float) ($item['discount_amount'] ?? 0);
                        $netAmount = $subTotal - $itemDiscountAmount;

                        // Check if product is taxable
                        $isTaxable = false;
                        if (isset($item['is_taxable'])) {
                            $rawTaxable = $item['is_taxable'];
                            $isTaxable = $rawTaxable === true || $rawTaxable === 1 || $rawTaxable === 'true' || $rawTaxable === '1';
                        } elseif (isset($item['product_id']) && isset($products[$item['product_id']])) {
                            $isTaxable = $products[$item['product_id']]->is_taxable;
                        }

                        $itemTaxAmount = $isTaxable ? ($netAmount * $taxRate) : 0;

                        $totalGross += $subTotal;
                        $totalDiscount += $itemDiscountAmount;
                        $totalTax += $itemTaxAmount;

                        if (count($itemNames) < 3) {
                            $itemNames[] = $item['name'] ?? 'Item';
                        }
                    }

                    $totalNet = $totalGross - $totalDiscount + $totalTax;
                    $invoiceTotal = (float) ($order->total_price ?? $totalNet);

                    $description = 'Food Order Items (' . $orderItems->count() . ') - ' . implode(', ', $itemNames) . ($orderItems->count() > 3 ? '...' : '');

                    $invoiceItem = FinancialInvoiceItem::create([
                        'invoice_id' => $financialInvoice->id,
                        'fee_type' => AppConstants::TRANSACTION_TYPE_ID_FOOD_ORDER,
                        'description' => $description,
                        'qty' => 1,
                        'amount' => $totalGross,
                        'sub_total' => $totalGross,
                        'discount_type' => 'fixed',
                        'discount_value' => $totalDiscount,
                        'discount_amount' => $totalDiscount,
                        'tax_amount' => round($totalTax),
                        'total' => $invoiceTotal,
                    ]);

                    Transaction::create([
                        'type' => 'debit',
                        'amount' => $invoiceTotal,
                        'date' => now(),
                        'description' => 'Invoice #' . $invoiceData['invoice_no'] . ' - Food Order',
                        'payable_type' => $payerType,
                        'payable_id' => $payerId,
                        'reference_type' => FinancialInvoiceItem::class,
                        'reference_id' => $invoiceItem->id,
                        'invoice_id' => $financialInvoice->id,
                        'created_by' => Auth::id(),
                    ]);

                    // If reservation order with advance payment, create credit entry
                    if ($order->reservation_id) {
                        $reservation = Reservation::find($order->reservation_id);
                        if ($reservation && $reservation->down_payment > 0) {
                            // Create credit transaction for advance payment
                            Transaction::create([
                                'type' => 'credit',
                                'amount' => $reservation->down_payment,
                                'date' => now(),
                                'description' => 'Advance Payment Adjustment - Reservation #' . $reservation->id,
                                'payable_type' => $payerType,
                                'payable_id' => $payerId,
                                'reference_type' => Reservation::class,
                                'reference_id' => $reservation->id,
                                'invoice_id' => $financialInvoice->id,
                                'created_by' => Auth::id(),
                            ]);

                            // Update invoice to show advance deducted
                            $financialInvoice->update([
                                'advance_payment' => $reservation->down_payment,
                                'data' => array_merge($financialInvoice->data ?? [], [
                                    'reservation_id' => $reservation->id,
                                    'advance_deducted' => $reservation->down_payment,
                                ]),
                            ]);
                        }
                    }
                }
            } elseif ($financialInvoice && ($financialInvoice->status !== 'paid' || $canEditAfterBill || $validated['status'] === 'refund')) {
                if ($validated['status'] === 'cancelled') {
                    $targetInvoiceStatus = in_array($requestedAdjustmentType, ['void', 'complementary'], true) ? 'void' : 'cancelled';
                    $financialInvoice->update(['status' => $targetInvoiceStatus]);
                    $financeEffect = $targetInvoiceStatus === 'void' ? 'void_invoice' : 'cancel_invoice';
                } elseif ($validated['status'] === 'refund') {
                    $financeEffect = $this->refundOrderInvoice($order, $financialInvoice);
                    $order->update(['payment_status' => 'refunded']);
                } elseif ($shouldSyncTotals) {
                    // Otherwise update amounts if provided
                    $financialInvoice->update([
                        'amount' => $computedAmount,
                        'total_price' => $computedTotal,
                    ]);

                    $invoiceItem = FinancialInvoiceItem::where('invoice_id', $financialInvoice->id)->first();
                    if ($invoiceItem) {
                        $invoiceItem->update([
                            'amount' => $computedAmount,
                            'sub_total' => $computedAmount,
                            'discount_type' => 'fixed',
                            'discount_value' => $computedDiscount,
                            'discount_amount' => $computedDiscount,
                            'tax_amount' => round($totalTax),
                            'total' => $computedTotal,
                        ]);
                    }

                    // ✅ Sync Ledger (Debit)
                    $transaction = Transaction::where('reference_type', FinancialInvoice::class)
                        ->where('reference_id', $financialInvoice->id)
                        ->where('type', 'debit')
                        ->first();

                    if ($transaction) {
                        $transaction->update([
                            'amount' => $computedTotal,
                            'description' => 'Food Order Invoice #' . $financialInvoice->invoice_no . ' (Updated)',
                        ]);
                    }

                    $financeEffect = 'none';
                }
            }

            if ($hasClientUpdate && $financialInvoice && strtolower((string) ($financialInvoice->status ?? '')) !== 'paid') {
                $financialInvoice->update([
                    'member_id' => $order->member_id ?: null,
                    'customer_id' => $order->customer_id ?: null,
                    'employee_id' => $order->employee_id ?: null,
                ]);

                if ($order->member_id) {
                    $payerType = Member::class;
                    $payerId = $order->member_id;
                } elseif ($order->customer_id) {
                    $payerType = Customer::class;
                    $payerId = $order->customer_id;
                } else {
                    $payerType = Employee::class;
                    $payerId = $order->employee_id;
                }

                Transaction::where('invoice_id', $financialInvoice->id)->update([
                    'payable_type' => $payerType,
                    'payable_id' => $payerId,
                ]);
            }

            Log::info('pos.order.adjustment.processed', [
                'request_id' => $request->attributes->get('request_id'),
                'order_id' => $order->id,
                'restaurant_id' => $order->tenant_id,
                'adjustment_type' => $requestedAdjustmentType,
                'scope' => $request->input('adjustment_scope', 'order'),
                'inventory_effect' => $inventoryEffect,
                'finance_effect' => $financeEffect,
                'user_id' => $request->user()?->id,
                'status' => $validated['status'],
            ]);

            DB::commit();

            return redirect()->back()->with('success', 'Order updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            report($e);
            return redirect()->back()->withErrors(['error' => $e->getMessage() ?: 'Failed to update order.']);
        }
    }

    // Order Queue
    public function orderQueue()
    {
        $orders2 = Order::whereIn('status', ['pending', 'in_progress', 'completed'])->get();
        return Inertia::render('App/Order/Queue', compact('orders2'));
    }

    public function getProducts(Request $request, $category_id)
    {
        $order_type = $request->input('order_type', '');
        $productOrderType = $order_type === 'reservation' ? 'dineIn' : $order_type;
        $category = Category::find($category_id);

        if (!$category) {
            return response()->json(['success' => true, 'products' => []], 200);
        }

        $productsQuery = Product::query()
            ->posMenuEligible()
            ->with(['variants:id,product_id,name', 'variants.values', 'category', 'ingredients:id,name,inventory_item_id'])
            ->where('category_id', $category_id);
        if (!$request->routeIs('pos.*')) {
            $restaurantId = session('active_restaurant_id') ?? tenant('id');
            $requestedId = $request->query('restaurant_id');

            if ($requestedId !== null && $requestedId !== '') {
                $user = Auth::guard('tenant')->user() ?? Auth::user();
                $tenants = $user ? $user->getAccessibleTenants() : collect();

                if ($tenants->contains(fn($t) => (string) $t->id === (string) $requestedId)) {
                    $restaurantId = $requestedId;
                }
            }

            if ($restaurantId) {
                $productsQuery->where('tenant_id', $restaurantId);
            }
        }

        // Only filter by order_type if it exists and is not 'room_service'
        if ($productOrderType && $productOrderType !== 'room_service') {
            $productsQuery->whereJsonContains('available_order_types', $productOrderType);
        }

        $products = $productsQuery->get();
        $restaurantId = (int) ($request->session()->get('active_restaurant_id') ?? 0);
        if ($request->filled('restaurant_id')) {
            $restaurantId = (int) $request->input('restaurant_id');
        }
        $this->hydrateRestaurantProductStocks($products, $restaurantId);
        $this->annotatePosInventoryReadiness($products);
        $products = $products
            ->filter(fn ($product) => !$product->inventory_tracked || (float) ($product->inventory_available_quantity ?? 0) > 0)
            ->values();

        return response()->json(['success' => true, 'products' => $products], 200);
    }

    public function getCategories(Request $request)
    {
        $categoriesQuery = Category::query();

        if (!$request->routeIs('pos.*')) {
            $restaurantId = session('active_restaurant_id') ?? tenant('id');
            $requestedId = $request->query('restaurant_id');

            if ($requestedId !== null && $requestedId !== '') {
                $user = Auth::guard('tenant')->user() ?? Auth::user();
                $tenants = $user ? $user->getAccessibleTenants() : collect();

                if ($tenants->contains(fn($t) => (string) $t->id === (string) $requestedId)) {
                    $restaurantId = $requestedId;
                }
            }

            if ($restaurantId) {
                $categoriesQuery->where('tenant_id', $restaurantId);
            }
        }

        $categories = $categoriesQuery->latest()->get();

        return response()->json(['categories' => $categories]);
    }

    public function searchProducts(Request $request)
    {
        $searchTerm = $request->query('search');

        if (empty($searchTerm)) {
            return response()->json(['success' => true, 'products' => []], 200);
        }

        // Search products across all restaurants by ID or name
        $productsQuery = Product::query()
            ->posMenuEligible()
            ->with(['variants:id,product_id,name', 'variants.values', 'category', 'tenant:id,name', 'ingredients:id,name,inventory_item_id'])
            ->where(function ($query) use ($searchTerm) {
                $query
                    ->where('id', 'like', "%{$searchTerm}%")
                    ->orWhere('menu_code', 'like', "%{$searchTerm}%")
                    ->orWhere('name', 'like', "%{$searchTerm}%");
            })
            ->limit(20);  // Limit results for performance

        $requestedId = $request->query('restaurant_id');
        if ($requestedId !== null && $requestedId !== '') {
            $user = Auth::guard('tenant')->user() ?? Auth::user();
            $tenants = $user ? $user->getAccessibleTenants() : collect();
            if ($tenants->contains(fn($t) => (string) $t->id === (string) $requestedId)) {
                $productsQuery->where('tenant_id', $requestedId);
            }
        }

        $products = $productsQuery->get();
        $restaurantId = (int) ($request->session()->get('active_restaurant_id') ?? 0);
        if ($requestedId !== null && $requestedId !== '') {
            $restaurantId = (int) $requestedId;
        }
        $this->hydrateRestaurantProductStocks($products, $restaurantId);
        $this->annotatePosInventoryReadiness($products);
        $products = $products
            ->filter(fn ($product) => !$product->inventory_tracked || (float) ($product->inventory_available_quantity ?? 0) > 0)
            ->values();

        return response()->json(['success' => true, 'products' => $products], 200);
    }

    private function hydrateRestaurantProductStocks($products, int $restaurantId): void
    {
        if ($restaurantId <= 0 || empty($products) || count($products) === 0) {
            return;
        }

        $resolver = app(RestaurantInventoryResolver::class);
        $assignments = $resolver->assignmentsForRestaurant($restaurantId, ['sellable', 'primary_issue_source']);
        $inventoryItemIds = collect($products)
            ->flatMap(fn ($product) => collect($product->ingredients ?? [])->pluck('inventory_item_id'))
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();
        $balances = $resolver->aggregateBalancesForAssignments($inventoryItemIds, $assignments);

        foreach ($products as $product) {
            if (!$product) {
                continue;
            }

            $ingredients = collect($product->ingredients ?? []);
            $linkedIngredients = $ingredients->filter(fn ($ingredient) => !empty($ingredient->inventory_item_id));
            $availableServings = $linkedIngredients->map(function ($ingredient) use ($balances) {
                $required = (float) ($ingredient->pivot->quantity_used ?? 0);
                if ($required <= 0) {
                    return null;
                }

                $available = (float) $balances->get((int) $ingredient->inventory_item_id, 0.0);

                return floor($available / $required);
            })->filter(fn ($value) => $value !== null);

            $product->inventory_tracked = $ingredients->isNotEmpty();
            $product->inventory_available_quantity = $availableServings->isEmpty() ? 0.0 : (float) max(0, $availableServings->min());
            $product->current_stock = $product->inventory_available_quantity;
            $product->minimal_stock = 0;
            $product->manage_stock = $product->inventory_tracked;
        }
    }

    private function annotatePosInventoryReadiness($products): void
    {
        foreach ($products as $product) {
            if (!$product) {
                continue;
            }

            $issues = [];
            $ingredients = collect($product->ingredients ?? []);
            $unlinkedIngredients = $ingredients
                ->filter(fn ($ingredient) => empty($ingredient->inventory_item_id))
                ->values();
            $tracked = $ingredients->isNotEmpty();

            if ($unlinkedIngredients->isNotEmpty()) {
                $issues[] = 'Recipe ingredients are missing inventory links.';
            }

            if ($tracked && $this->productUsesUnsupportedVariantStock($product)) {
                $issues[] = 'Variant-level stock is not warehouse-backed yet.';
            }

            if ($tracked && $unlinkedIngredients->isEmpty() && (float) ($product->inventory_available_quantity ?? 0) <= 0) {
                $issues[] = 'No linked ingredient inventory is available for this product.';
            }

            $product->inventory_setup_issues = $issues;
            $product->inventory_tracked = $tracked;
            $product->inventory_ready_for_pos = empty($issues);
            $product->variant_stock_supported = !$tracked || !$this->productUsesUnsupportedVariantStock($product);
        }
    }

    private function productUsesUnsupportedVariantStock(Product $product): bool
    {
        return collect($product->variants ?? [])->contains(function ($variant) {
            return collect($variant->values ?? [])->isNotEmpty();
        });
    }

    private function productUsesInventoryTracking(Product $product): bool
    {
        return collect($product->ingredients ?? [])->isNotEmpty();
    }

    /**
     * Search Customers (Member, Corporate, Guest) for Auto-complete
     */
    public function searchCustomers(Request $request)
    {
        $query = $request->input('query');
        $type = $request->input('type', 'all');

        if (!$query) {
            return response()->json([]);
        }

        $results = collect();

        // 1. Members
        if ($type === 'all' || $type === 'member') {
            $members = Member::where('status', 'active')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('full_name', 'like', "%{$query}%")
                        ->orWhere('membership_no', 'like', "%{$query}%");
                })
                ->limit(30)
                ->get()
                ->map(function ($m) {
                    return [
                        'label' => "{$m->full_name} (Member - {$m->membership_no})",
                        'value' => $m->full_name,
                        'type' => 'Member',
                        'name' => $m->full_name,
                        'membership_no' => $m->membership_no,
                        'status' => $m->status,
                    ];
                });
            $results = $results->merge($members);
        }

        // 2. Corporate Members
        if ($type === 'all' || $type === 'corporate') {
            // Check if CorporateMember model exists and is imported, assuming yes based on previous files
            $corporate = \App\Models\CorporateMember::where('status', 'active')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('full_name', 'like', "%{$query}%")
                        ->orWhere('membership_no', 'like', "%{$query}%");
                })
                ->limit(30)
                ->get()
                ->map(function ($m) {
                    return [
                        'label' => "{$m->full_name} (Corporate - {$m->membership_no})",
                        'value' => $m->full_name,
                        'type' => 'Corporate',
                        'name' => $m->full_name,
                        'membership_no' => $m->membership_no,
                        'status' => $m->status,
                    ];
                });
            $results = $results->merge($corporate);
        }

        // 3. Guests (Customers)
        if ($type === 'all' || $type === 'guest') {
            $guests = Customer::query()
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('customer_no', 'like', "%{$query}%");
                })
                ->limit(30)
                ->get()
                ->map(function ($c) {
                    return [
                        'label' => "{$c->name} (Guest - {$c->customer_no})",
                        'value' => $c->name,
                        'type' => 'Guest',
                        'name' => $c->name,
                        'customer_no' => $c->customer_no,
                        'id' => $c->id,
                        'status' => 'active',  // Guests usually don't have status, default active
                    ];
                });
            $results = $results->merge($guests);
        }

        // 4. Employees (Optional, but useful for internal orders) - only if type is all or employee
        if ($type === 'all' || $type === 'employee') {
            $employees = Employee::where('status', 'active')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('employee_id', 'like', "%{$query}%");
                })
                ->limit(30)
                ->get()
                ->map(function ($e) {
                    return [
                        'label' => "{$e->name} (Employee - {$e->employee_id})",
                        'value' => $e->name,
                        'type' => 'Employee',
                        'name' => $e->name,
                        'membership_no' => $e->employee_id,  // Normalize key
                        'employee_id' => $e->employee_id,
                        'status' => $e->status,
                    ];
                });
            $results = $results->merge($employees);
        }

        return response()->json($results);
    }

    /**
     * Order History - Shows all completed/paid orders
     */
    public function orderHistory(Request $request)
    {
        $user = Auth::guard('tenant')->user() ?? Auth::user();
        $canEditAfterBill = $this->canEditAfterBill($user);

        // Select only necessary columns for the list view
        // Using with() for relationships but we can optimize relationships too if needed
        $query = Order::select([
            'id', 'order_type', 'start_date', 'status', 'payment_status', 'payment_method',
            'total_price', 'amount', 'discount', 'tax', 'paid_amount', 'down_payment',
            'table_id', 'member_id', 'customer_id', 'employee_id',
            'tenant_id', 'waiter_id', 'created_by', 'cashier_id'
        ])
            ->with([
                'table:id,table_no',
                'tenant:id,name',
                // 'orderItems', // REMOVED: Fetching items for every order in the list is expensive
                'member:id,member_type_id,full_name,membership_no',
                'member.memberType:id,name',
                'customer:id,name,customer_no,guest_type_id',
                'customer.guestType:id,name',
                'employee:id,employee_id,name',
                'cashier:id,name',
                'user:id,name',
                'waiter:id,name',
            ])
            // Simplified invoice data fetching - only get what's needed for list filtering/display
            // If specific invoice details (ENT/CTS breakdown) are needed only in modal, we can skip them here
            // But keeping them if they are used in filters
            ->addSelect([
                // 'orders.*', // Already selected specific columns
                'invoice_id' => FinancialInvoice::select('id')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_no' => FinancialInvoice::select('invoice_no')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                // We can keep these if filters rely on them, otherwise move to detail fetch
                'invoice_ent_amount' => FinancialInvoice::select('ent_amount')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_cts_amount' => FinancialInvoice::select('cts_amount')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_tax_amount' => FinancialInvoiceItem::selectRaw('COALESCE(SUM(tax_amount), 0)')
                    ->where('invoice_id', FinancialInvoice::select('id')
                        ->where('invoice_type', 'food_order')
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                        ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                        ->orderByDesc('id')
                        ->limit(1)),
                'invoice_sub_total' => FinancialInvoiceItem::select('sub_total')
                    ->where('invoice_id', FinancialInvoice::select('id')
                        ->where('invoice_type', 'food_order')
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                        ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                        ->orderByDesc('id')
                        ->limit(1))
                    ->limit(1),
                'invoice_discount_amount' => FinancialInvoiceItem::select('discount_amount')
                    ->where('invoice_id', FinancialInvoice::select('id')
                        ->where('invoice_type', 'food_order')
                        ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                        ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                        ->orderByDesc('id')
                        ->limit(1))
                    ->limit(1),
            ])
            ->whereIn('order_type', ['dineIn', 'delivery', 'takeaway', 'reservation', 'room_service'])
            ->where('status', '!=', 'pending');

        // 🔍 Search by Order ID
        if ($request->filled('search_id')) {
            $query->where('id', $request->search_id);
        }

        // 🔍 Search by Client Name
        if ($request->filled('search_name')) {
            $searchName = trim($request->search_name);
            $query->where(function ($q) use ($searchName) {
                $q
                    ->whereHas('member', fn($q) => $q->where('full_name', 'like', "%$searchName%"))
                    ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%$searchName%"))
                    ->orWhereHas('employee', fn($q) => $q->where('name', 'like', "%$searchName%"));
            });
        }

        // 🔍 Unified Type Filter (Member, Corporate, Employee, Guest, Order Types)
        if ($request->filled('type') && $request->type !== 'all') {
            if ($request->type === 'member') {
                $query->whereNotNull('member_id');
            } elseif ($request->type === 'employee') {
                $query->whereNotNull('employee_id');
            } elseif ($request->type === 'guest') {
                $query
                    ->whereNotNull('customer_id')
                    ->whereNull('member_id')
                    ->whereNull('employee_id');
            } elseif ($request->type === 'corporate') {
                $query->whereHas('member.memberType', function ($q) {
                    $q->where('name', 'Corporate');
                });
            } else {
                // Assume it's a specific order_type (dineIn, delivery, etc.)
                $query->where('order_type', $request->type);
            }
        }

        // 📅 Date range filter
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('start_date', [$request->start_date, $request->end_date]);
        } elseif ($request->filled('start_date')) {
            $query->whereDate('start_date', '>=', $request->start_date);
        } elseif ($request->filled('end_date')) {
            $query->whereDate('start_date', '<=', $request->end_date);
        }

        // 💰 Payment status filter
        if ($request->filled('payment_status') && $request->payment_status !== 'all') {
            $query->where('payment_status', $request->payment_status);
        }

        // 💳 Payment method filter
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        // 🎯 Adjustment Type filter (ENT/CTS) - Query via linked invoice's JSON data
        if ($request->filled('adjustment_type') && $request->adjustment_type !== 'all') {
            $adjustmentType = $request->adjustment_type;
            $query->whereExists(function ($subQuery) use ($adjustmentType) {
                $subQuery
                    ->select(DB::raw(1))
                    ->from('financial_invoices')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->when($adjustmentType === 'ent', function ($q) {
                        $q->where('ent_amount', '>', 0);
                    })
                    ->when($adjustmentType === 'cts', function ($q) {
                        $q->where('cts_amount', '>', 0);
                    })
                    ->when($adjustmentType === 'none', function ($q) {
                        $q->where(function ($inner) {
                            $inner->whereNull('ent_amount')->orWhere('ent_amount', 0);
                        })->where(function ($inner) {
                            $inner->whereNull('cts_amount')->orWhere('cts_amount', 0);
                        });
                    });
            });
        }

        // 🍽 Table filter
        if ($request->filled('table_id')) {
            $query->where('table_id', $request->table_id);
        }

        // 👨‍🍳 Waiter filter
        if ($request->filled('waiter_id')) {
            $query->where('waiter_id', $request->waiter_id);
        }

        // 💵 Cashier filter
        if ($request->filled('cashier_id')) {
            $query->where('cashier_id', $request->cashier_id);
        }

        $orders = $query->orderBy('id', 'desc')->paginate(15)->withQueryString();
        $orders->getCollection()->transform(function ($order) {
            $invoice = FinancialInvoice::whereJsonContains('data->order_id', $order->id)
                ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                ->orderByDesc('id')
                ->first();

            return $this->attachOrderAdjustmentMetadata($order, $invoice);
        });

        // Dropdown Data
        $tables = Table::select('id', 'table_no')->get();
        $waiters = Employee::whereHas('designation', fn($q) => $q->whereIn('name', ['Waiter', 'Waiters', 'Captain']))
            ->select('id', 'name')
            ->get();
        $cashiers = User::select('id', 'name')->get();

        $allrestaurants = $user ? $user->getAccessibleTenants() : collect();

        return Inertia::render('App/Order/History/Dashboard', [
            'orders' => $orders,
            'filters' => $request->all(),
            'tables' => $tables,
            'waiters' => $waiters,
            'cashiers' => $cashiers,
            'canEditAfterBill' => $canEditAfterBill,
            'allrestaurants' => $allrestaurants,
        ]);
    }

    public function reprintKot(Request $request, int $id, KotPrintDispatcher $kotPrintDispatcher)
    {
        $order = Order::query()->with('orderItems:id,order_id,kitchen_id,order_item,status')->findOrFail($id);
        $groupedByKitchen = $this->groupOrderItemsByKitchen($order);

        if (empty($groupedByKitchen)) {
            return response()->json([
                'success' => false,
                'message' => 'No kitchen-routed items found for this order.',
            ], 422);
        }

        $printDispatch = $kotPrintDispatcher->dispatchForOrder($order, $groupedByKitchen, [
            'request_id' => $request->attributes->get('request_id'),
            'triggered_by' => $request->user()?->id,
            'is_retry' => true,
        ]);

        $success = ($printDispatch['queued_count'] ?? 0) > 0;
        $message = $success
            ? 'KOT reprint queued successfully.'
            : 'Reprint failed. Verify kitchen printer configuration.';

        return response()->json([
            'success' => $success,
            'message' => $message,
            'print_status' => $printDispatch['print_status'] ?? 'failed',
            'print_batch_id' => $printDispatch['print_batch_id'] ?? null,
            'dispatched_at' => $printDispatch['dispatched_at'] ?? now()->toIso8601String(),
            'print_failures' => $printDispatch['print_failures'] ?? [],
        ], $success ? 200 : 422);
    }

    public function printHealth(Request $request)
    {
        $queueDriver = (string) config('queue.default');
        $jobsTableReady = Schema::hasTable('jobs');
        $failedTableReady = Schema::hasTable('failed_jobs');

        $pendingPrintJobs = 0;
        $failedPrintJobs = 0;

        if ($jobsTableReady) {
            $pendingPrintJobs = DB::table('jobs')->where('queue', 'printing')->count();
        }

        if ($failedTableReady) {
            $failedPrintJobs = DB::table('failed_jobs')
                ->where(function ($q) {
                    $q->where('queue', 'printing')
                        ->orWhere('payload', 'like', '%PrintOrderJob%');
                })
                ->count();
        }

        $workerHeartbeat = Cache::get('printing:worker_heartbeat');
        $workerOnline = false;
        if ($workerHeartbeat) {
            try {
                $workerOnline = now()->diffInMinutes(Carbon::parse($workerHeartbeat)) <= 10;
            } catch (\Throwable $e) {
                $workerOnline = false;
            }
        }

        return response()->json([
            'queue_driver' => $queueDriver,
            'queue_name' => 'printing',
            'worker_heartbeat' => $workerHeartbeat,
            'worker_online' => $workerOnline,
            'pending_print_jobs' => $pendingPrintJobs,
            'failed_print_jobs' => $failedPrintJobs,
            'required_worker_command' => 'php artisan queue:work --queue=printing,default',
        ]);
    }

    protected function groupOrderItemsByKitchen(Order $order): array
    {
        $grouped = [];

        foreach ($order->orderItems as $row) {
            if (($row->status ?? null) === 'cancelled') {
                continue;
            }

            $payload = is_array($row->order_item) ? $row->order_item : [];
            if (empty($payload['id'])) {
                continue;
            }

            $kitchenId = $row->kitchen_id;
            if (!$kitchenId) {
                $kitchenId = Product::query()->where('id', (int) $payload['id'])->value('kitchen_id');
            }

            $key = $kitchenId ? (string) ((int) $kitchenId) : 'unassigned';
            if (!array_key_exists($key, $grouped)) {
                $grouped[$key] = [];
            }
            $grouped[$key][] = $payload;
        }

        return $grouped;
    }

    /**
     * Get single order details (JSON) for optimized fetching
     */
    public function orderDetails($id)
    {
        $order = Order::with([
            'table:id,table_no',
            'tenant:id,name',
            'orderItems:id,order_id,kitchen_id,order_item,status,remark,instructions,cancelType',
            'member:id,member_type_id,full_name,membership_no',
            'member.memberType:id,name',
            'customer:id,name,customer_no,guest_type_id',
            'customer.guestType:id,name',
            'employee:id,employee_id,name',
            'cashier:id,name',
            'user:id,name',
            'waiter:id,name',
        ])
            // Load invoice ENT/CTS data
            ->addSelect([
                'orders.*',
                'invoice_id' => FinancialInvoice::select('id')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_no' => FinancialInvoice::select('invoice_no')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_status' => FinancialInvoice::select('status')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_ent_amount' => FinancialInvoice::select('ent_amount')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_cts_amount' => FinancialInvoice::select('cts_amount')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_advance_payment' => FinancialInvoice::select('advance_payment')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_advance_deducted' => FinancialInvoice::selectRaw("CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '\\\$.advance_deducted')), '0') AS DECIMAL(10,2))")
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_ent_reason' => FinancialInvoice::select('ent_reason')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_ent_comment' => FinancialInvoice::select('ent_comment')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_cts_comment' => FinancialInvoice::select('cts_comment')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_bank_charges_amount' => FinancialInvoice::selectRaw("CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '\\\$.bank_charges_amount')), '0') AS DECIMAL(10,2))")
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_bank_charges_enabled' => FinancialInvoice::selectRaw("COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '\\\$.bank_charges_enabled')), '0')")
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_bank_charges_type' => FinancialInvoice::selectRaw('JSON_UNQUOTE(JSON_EXTRACT(data, \'\$.bank_charges_type\'))')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
                'invoice_bank_charges_value' => FinancialInvoice::selectRaw("CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '\\\$.bank_charges_value')), '0') AS DECIMAL(10,2))")
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->limit(1),
            ])
            ->find($id);

        if (!$order) {
            return response()->json(null, 404);
        }

        $invoice = FinancialInvoice::where('invoice_type', 'food_order')
            ->whereJsonContains('data->order_id', $order->id)
            ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
            ->orderByDesc('id')
            ->first();

        if ($invoice) {
            $invoiceData = is_array($invoice->data) ? $invoice->data : [];
            $order->setAttribute('invoice_id', $invoice->id);
            $order->setAttribute('invoice_no', $invoice->invoice_no);
            $order->setAttribute('invoice_status', $invoice->status);
            $order->setAttribute('invoice_paid_amount', (float) ($invoice->paid_amount ?? 0));
            $order->setAttribute('invoice_ent_amount', (float) ($invoice->ent_amount ?? 0));
            $order->setAttribute('invoice_cts_amount', (float) ($invoice->cts_amount ?? 0));
            $order->setAttribute('invoice_advance_payment', (float) ($invoice->advance_payment ?? 0));
            $order->setAttribute('invoice_advance_deducted', (float) ($invoiceData['advance_deducted'] ?? 0));
            $order->setAttribute('invoice_ent_reason', $invoice->ent_reason);
            $order->setAttribute('invoice_ent_comment', $invoice->ent_comment);
            $order->setAttribute('invoice_cts_comment', $invoice->cts_comment);
            $order->setAttribute('invoice_bank_charges_amount', (float) ($invoiceData['bank_charges_amount'] ?? 0));
            $order->setAttribute('invoice_bank_charges_enabled', !empty($invoiceData['bank_charges_enabled']));
            $order->setAttribute('invoice_bank_charges_type', $invoiceData['bank_charges_type'] ?? null);
            $order->setAttribute('invoice_bank_charges_value', (float) ($invoiceData['bank_charges_value'] ?? 0));

            $transactionRelation = TransactionRelation::where('invoice_id', $invoice->id)
                ->with('receipt')
                ->latest('id')
                ->first();

            if ($transactionRelation?->receipt) {
                $receipt = $transactionRelation->receipt;
                $paymentDetails = $receipt->payment_details;
                if (is_string($paymentDetails)) {
                    $decoded = json_decode($paymentDetails, true);
                    $paymentDetails = is_array($decoded) ? $decoded : [];
                }
                if (!is_array($paymentDetails)) {
                    $paymentDetails = [];
                }

                $order->setAttribute('receipt_paid_amount', (float) ($receipt->amount ?? 0));
                $order->setAttribute('receipt_customer_changes', (float) ($paymentDetails['customer_changes'] ?? 0));
            }
        }

        return response()->json($this->attachOrderAdjustmentMetadata($order, $invoice));
    }
}
