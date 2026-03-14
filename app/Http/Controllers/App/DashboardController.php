<?php

namespace App\Http\Controllers\App;

use App\Http\Controllers\Controller;
use App\Models\Invoices;
use App\Models\Order;
use App\Models\Reservation;
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();

        // Invoices Summary
        $invoices = Order::selectRaw('
        DATE(created_at) as date,
        SUM(total_price) as revenue,
        SUM(cost_price) as cost,
        COUNT(*) as transactions
    ')
            ->whereIn(DB::raw('DATE(created_at)'), [$today, $yesterday])
            ->groupBy(DB::raw('DATE(created_at)'))
            ->get()
            ->keyBy('date');

        $today_revenue = $invoices[$today]->revenue ?? 0;
        $yesterday_revenue = $invoices[$yesterday]->revenue ?? 0;

        $today_cost = $invoices[$today]->cost ?? 0;
        $yesterday_cost = $invoices[$yesterday]->cost ?? 0;

        $today_profit = $today_revenue - $today_cost;
        $yesterday_profit = $yesterday_revenue - $yesterday_cost;

        $today_profit_margin = $today_revenue > 0
            ? round(($today_profit / $today_revenue) * 100, 2)
            : 0;

        $sales_change = $yesterday_revenue > 0
            ? round((($today_revenue - $yesterday_revenue) / $yesterday_revenue) * 100, 2)
            : 0;

        $total_transactions = $invoices[$today]->transactions ?? 0;

        // Orders Summary
        $ordersToday = Order::whereDate('start_date', $today)
            ->selectRaw('order_type, COUNT(*) as count')
            ->groupBy('order_type')
            ->get()
            ->keyBy('order_type');

        $total_orders = $ordersToday->sum('count');

        $orderTypes = ['dineIn', 'takeaway', 'pickup', 'delivery'];
        $order_types = [];

        foreach ($orderTypes as $type) {
            $count = $ordersToday[$type]->count ?? 0;
            $percentage = $total_orders > 0
                ? round(($count / $total_orders) * 100, 2)
                : 0;

            $order_types[$type] = [
                'count' => $count,
                'percentage' => $percentage,
            ];
        }

        // Products Sold
        $products_sold = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereDate('orders.start_date', $today)
            ->where('orders.status', 'completed')
            ->where('order_items.status', '!=', 'cancelled')
            ->selectRaw('SUM(CAST(JSON_UNQUOTE(JSON_EXTRACT(order_item, "$.quantity")) AS UNSIGNED)) as total_quantity')
            ->value('total_quantity') ?? 0;

        return Inertia::render('App/Dashboard/Dashboardm', [
            'today_revenue' => $today_revenue,
            'yesterday_revenue' => $yesterday_revenue,
            'today_profit' => $today_profit,
            'yesterday_profit' => $yesterday_profit,
            'today_profit_margin' => $today_profit_margin,
            'sales_change' => $sales_change,
            'total_orders' => $total_orders,
            'order_types' => $order_types,
            'total_transactions' => $total_transactions,
            'products_sold' => $products_sold,
        ]);
    }

    public function weeklyReservationOverview()
    {
        $start = Carbon::today();
        $end = Carbon::today()->addDays(6);  // Next 7 days
        $period = CarbonPeriod::create($start, $end);

        $days = [];

        foreach ($period as $date) {
            // Count reservations from Reservation table
            $ordersCount = Reservation::whereDate('date', $date->toDateString())->count();

            $days[] = [
                'label' => $date->format('D'),  // Sun, Mon, etc.
                'date' => $date->toDateString(),
                'dayNum' => $date->day,
                'orders_count' => $ordersCount,
            ];
        }

        return response()->json([
            'week_days' => $days
        ]);
    }

    // Order Reservations
    public function orderReservations(Request $request)
    {
        $date = $request->query('date') ?: date('Y-m-d');
        $limit = $request->query('limit');

        $orders = Reservation::whereDate('date', $date)
            ->with([
                'member:id,full_name,membership_no,mobile_number_a',
                'customer:id,name,contact',
                'table:id,table_no'
            ])
            ->limit($limit)
            ->get();

        return response()->json(['success' => true, 'orders' => $orders]);
    }

    public function allOrders(Request $request)
    {
        $date = $request->query('date') ?: date('Y-m-d');
        // $limit = $request->query('limit');
        $order_type = $request->query('order_type');

        if (empty($order_type) || $order_type === 'all') {
            $orders = Order::whereDate('start_date', $date)->with(['member:id,full_name,membership_no', 'table:id,table_no'])->withCount([
                'orderItems AS completed_order_items_count' => function ($query) {
                    $query->where('order_items.status', 'completed');
                }
            ])->get();
        } else {
            $query = Order::whereDate('start_date', $date);
            
            // If order_type is takeaway, also include delivery orders
            if ($order_type === 'takeaway') {
                $query->whereIn('order_type', ['takeaway', 'delivery']);
            } else {
                $query->where('order_type', $order_type);
            }
            
            $orders = $query->with(['member:id,full_name,membership_no', 'table:id,table_no'])->withCount([
                'orderItems AS completed_order_items_count' => function ($query) {
                    $query->where('order_items.status', 'completed');
                }
            ])->get();
        }

        return response()->json(['success' => true, 'orders' => $orders]);
    }
}
