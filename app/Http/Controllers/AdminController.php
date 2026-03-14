<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\EventBooking;
use App\Models\FinancialInvoice;
use App\Models\Member;
use App\Models\Order;
use App\Models\RoomBooking;
use App\Models\Subscription;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AdminController extends Controller
{
    public function index(Request $request)
    {
        // Get recent notifications for the authenticated user
        $notifications = \App\Models\User::find(auth()->id())
            ->notifications()
            ->latest()
            ->take(15)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'text' => $notification->data['description'] ?? '',
                    'time' => $notification->created_at->diffForHumans(),
                    'title' => $notification->data['title'] ?? '',
                    'read_at' => $notification->read_at,
                    'actor_name' => $notification->data['actor_name'] ?? 'System',
                ];
            });

        return Inertia::render('App/Admin/Dashboard', [
            'recentActivities' => $notifications
        ]);
    }

    public function markNotificationRead($id)
    {
        $notification = auth()->user()->notifications()->find($id);
        if ($notification) {
            $notification->markAsRead();
        }
        return back();
    }

    public function getDashboardStats(Request $request)
    {
        $month = $request->query('month', now()->format('Y-m'));
        $year = $request->query('year', now()->year);

        // Parse month-year (e.g., "Jan-2025" or "2025-01")
        try {
            $date = Carbon::createFromFormat('M-Y', $month);
        } catch (\Exception $e) {
            $date = Carbon::createFromFormat('Y-m', $month);
        }

        $startOfMonth = $date->copy()->startOfMonth();
        $endOfMonth = $date->copy()->endOfMonth();

        // Revenue & Profit
        $totalRevenue = FinancialInvoice::where('status', 'paid')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('total_price');

        $totalExpenses = 0;  // You can calculate from expenses table if you have one
        $totalProfit = $totalRevenue - $totalExpenses;

        // Bookings
        $totalRoomBookings = RoomBooking::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();
        $totalEventBookings = EventBooking::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();
        $totalBookings = $totalRoomBookings + $totalEventBookings;

        // Members & Employees
        // Members are those with parent_id = null
        $totalMembers = Member::whereNull('parent_id')->count();
        $totalCustomers = Customer::count();
        $totalEmployees = Employee::count();

        // Product Orders
        $totalProductOrders = Order::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

        // Subscription Orders
        $totalSubscriptionOrders = Subscription::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

        // Monthly chart data for the year
        $chartData = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create($year, $m, 1)->startOfMonth();
            $monthEnd = Carbon::create($year, $m, 1)->endOfMonth();

            $income = FinancialInvoice::where('status', 'paid')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('total_price');

            $expenses = 0;  // Calculate from your expenses table
            $profit = $income - $expenses;

            $chartData[] = [
                'name' => $monthStart->format('M'),
                'income' => (float) $income,
                'expenses' => (float) $expenses,
                'profit' => (float) $profit,
            ];
        }

        return response()->json([
            'success' => true,
            'stats' => [
                'totalRevenue' => (float) $totalRevenue,
                'totalProfit' => (float) $totalProfit,
                'totalBookings' => $totalBookings,
                'totalRoomBookings' => $totalRoomBookings,
                'totalEventBookings' => $totalEventBookings,
                'totalMembers' => $totalMembers,
                'totalCustomers' => $totalCustomers,
                'totalEmployees' => $totalEmployees,
                'totalProductOrders' => $totalProductOrders,
                'totalSubscriptionOrders' => $totalSubscriptionOrders,
            ],
            'chartData' => $chartData,
            'recentActivities' => $request
                ->user()
                ->notifications()
                ->latest()
                ->take(10)
                ->get()
                ->map(function ($n) {
                    return [
                        'id' => $n->id,
                        'text' => $n->data['description'] ?? '',
                        'time' => $n->created_at->diffForHumans(),
                        'title' => $n->data['title'] ?? '',
                    ];
                }),
        ]);
    }

    public function printDashboard(Request $request)
    {
        $month = $request->query('month', now()->format('M-Y'));
        $year = $request->query('year', now()->year);

        // Parse month-year
        try {
            $date = Carbon::createFromFormat('M-Y', $month);
        } catch (\Exception $e) {
            $date = Carbon::createFromFormat('Y-m', $month);
        }

        $startOfMonth = $date->copy()->startOfMonth();
        $endOfMonth = $date->copy()->endOfMonth();

        // Revenue & Profit
        $totalRevenue = FinancialInvoice::where('status', 'paid')
            ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->sum('total_price');

        $totalExpenses = 0;
        $totalProfit = $totalRevenue - $totalExpenses;

        // Bookings
        $totalRoomBookings = RoomBooking::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();
        $totalEventBookings = EventBooking::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();
        $totalBookings = $totalRoomBookings + $totalEventBookings;

        // Members & Employees
        $totalMembers = Member::whereNull('parent_id')->count();
        $totalCustomers = Customer::count();
        $totalEmployees = Employee::count();

        // Product Orders
        $totalProductOrders = Order::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

        // Subscription Orders
        $totalSubscriptionOrders = Subscription::whereBetween('created_at', [$startOfMonth, $endOfMonth])->count();

        // Monthly chart data for the year
        $chartData = [];
        for ($m = 1; $m <= 12; $m++) {
            $monthStart = Carbon::create($year, $m, 1)->startOfMonth();
            $monthEnd = Carbon::create($year, $m, 1)->endOfMonth();

            $income = FinancialInvoice::where('status', 'paid')
                ->whereBetween('created_at', [$monthStart, $monthEnd])
                ->sum('total_price');

            $expenses = 0;
            $profit = $income - $expenses;

            $chartData[] = [
                'name' => $monthStart->format('M'),
                'income' => (float) $income,
                'expenses' => (float) $expenses,
                'profit' => (float) $profit,
            ];
        }

        $stats = [
            'totalRevenue' => (float) $totalRevenue,
            'totalProfit' => (float) $totalProfit,
            'totalBookings' => $totalBookings,
            'totalRoomBookings' => $totalRoomBookings,
            'totalEventBookings' => $totalEventBookings,
            'totalMembers' => $totalMembers,
            'totalCustomers' => $totalCustomers,
            'totalEmployees' => $totalEmployees,
            'totalProductOrders' => $totalProductOrders,
            'totalSubscriptionOrders' => $totalSubscriptionOrders,
        ];

        return view('admin.dashboard-print', compact('stats', 'chartData', 'month', 'year'));
    }
}
