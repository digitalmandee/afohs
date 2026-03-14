<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\FinancialInvoice;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Tenant;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class AdminPosReportController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        return Inertia::render('App/Admin/Reports/AllPosReports', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $request->only(['start_date', 'end_date'])
        ]);
    }

    public function dishBreakdownPrice()
    {
        $filters = request()->only(['start_date', 'end_date', 'tenant_ids', 'category_names', 'item_search']);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $categoryNames = $this->normalizeFilterArray($filters['category_names'] ?? null);
        $itemSearch = $this->normalizeFilterString($filters['item_search'] ?? null);

        $data = $this->buildDishBreakdownData($startDate, $endDate, $tenantIds, $categoryNames, $itemSearch);
        usort($data, fn ($a, $b) => ($b['total_sale'] <=> $a['total_sale']));

        return Inertia::render('App/Admin/Reports/DishBreakdownSummary', [
            'metric' => 'price',
            'title' => 'DISH BREAKDOWN SUMMARY (PRICE)',
            'rows' => $data,
            'tenants' => Tenant::select('id', 'name')->orderBy('name')->get(),
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $filters,
        ]);
    }

    public function dishBreakdownQuantity()
    {
        $filters = request()->only(['start_date', 'end_date', 'tenant_ids', 'category_names', 'item_search']);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $categoryNames = $this->normalizeFilterArray($filters['category_names'] ?? null);
        $itemSearch = $this->normalizeFilterString($filters['item_search'] ?? null);

        $data = $this->buildDishBreakdownData($startDate, $endDate, $tenantIds, $categoryNames, $itemSearch);
        usort($data, fn ($a, $b) => ($b['qty'] <=> $a['qty']));

        return Inertia::render('App/Admin/Reports/DishBreakdownSummary', [
            'metric' => 'quantity',
            'title' => 'DISH BREAKDOWN SUMMARY (SOLD QUANTITY)',
            'rows' => $data,
            'tenants' => Tenant::select('id', 'name')->orderBy('name')->get(),
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $filters,
        ]);
    }

    public function closingSales()
    {
        $filters = request()->only(['start_date', 'end_date']);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $invoices = FinancialInvoice::where('invoice_type', 'food_order')
            ->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $startDate)
            ->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $endDate)
            ->get();

        $byMethod = [];
        $grandTotal = 0;
        $grandPaid = 0;
        $grandBalance = 0;
        foreach ($invoices as $inv) {
            $method = strtolower((string) ($inv->payment_method ?? 'cash'));
            if ($method === '') {
                $method = 'cash';
            }
            if (!isset($byMethod[$method])) {
                $byMethod[$method] = [
                    'payment_method' => $method,
                    'total' => 0,
                    'paid' => 0,
                    'balance' => 0,
                ];
            }
            $amount = (float) ($inv->amount ?? 0);
            $paid = (float) ($inv->paid_amount ?? 0);
            $balance = $amount - $paid;

            $byMethod[$method]['total'] += $amount;
            $byMethod[$method]['paid'] += $paid;
            $byMethod[$method]['balance'] += $balance;

            $grandTotal += $amount;
            $grandPaid += $paid;
            $grandBalance += $balance;
        }

        $rows = array_values($byMethod);
        usort($rows, fn ($a, $b) => ($b['total'] <=> $a['total']));

        return Inertia::render('App/Admin/Reports/ClosingSalesReport', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $filters,
            'rows' => $rows,
            'grandTotal' => $grandTotal,
            'grandPaid' => $grandPaid,
            'grandBalance' => $grandBalance,
        ]);
    }

    public function monthlyEmployeeFoodBills()
    {
        $filters = request()->only(['start_date', 'end_date', 'employee_search']);
        $startDate = $filters['start_date'] ?? now()->startOfMonth()->toDateString();
        $endDate = $filters['end_date'] ?? now()->endOfMonth()->toDateString();
        $employeeSearch = $this->normalizeFilterString($filters['employee_search'] ?? null);

        $ordersQuery = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->whereNotNull('employee_id')
            ->with(['employee']);

        if ($employeeSearch) {
            $ordersQuery->whereHas('employee', function ($q) use ($employeeSearch) {
                $q->where('name', 'like', "%{$employeeSearch}%")
                    ->orWhere('employee_id', 'like', "%{$employeeSearch}%");
            });
        }

        $orders = $ordersQuery->get();

        $rows = [];
        foreach ($orders as $order) {
            $empId = (int) ($order->employee_id ?? 0);
            if ($empId <= 0) {
                continue;
            }
            if (!isset($rows[$empId])) {
                $rows[$empId] = [
                    'employee_id' => $empId,
                    'employee_no' => $order->employee?->employee_id ?? 'N/A',
                    'employee_name' => $order->employee?->name ?? 'N/A',
                    'orders' => 0,
                    'total' => 0,
                ];
            }
            $rows[$empId]['orders'] += 1;
            $rows[$empId]['total'] += (float) ($order->total_price ?? 0);
        }

        $rows = array_values($rows);
        usort($rows, fn ($a, $b) => ($b['total'] <=> $a['total']));

        return Inertia::render('App/Admin/Reports/MonthlyEmployeeFoodBillsReport', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $filters,
            'rows' => $rows,
        ]);
    }

    public function graphical()
    {
        $filters = request()->only(['start_date', 'end_date']);
        $startDate = $filters['start_date'] ?? now()->subDays(6)->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $orders = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->get();

        $byDate = [];
        foreach ($orders as $order) {
            $date = $order->start_date ?: ($order->created_at ? $order->created_at->toDateString() : null);
            if (!$date) {
                continue;
            }
            if (!isset($byDate[$date])) {
                $byDate[$date] = [
                    'date' => $date,
                    'total' => 0,
                    'orders' => 0,
                ];
            }
            $byDate[$date]['total'] += (float) ($order->total_price ?? 0);
            $byDate[$date]['orders'] += 1;
        }

        $rows = array_values($byDate);
        usort($rows, fn ($a, $b) => strcmp($a['date'], $b['date']));

        return Inertia::render('App/Admin/Reports/PosGraphicalReport', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $filters,
            'rows' => $rows,
        ]);
    }

    public function singleRestaurant(Request $request, $tenantId)
    {
        // Get date range - default to today
        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        // Get specific tenant
        $tenant = Tenant::findOrFail($tenantId);

        // Get report data for this restaurant
        $reportData = $this->generateReportDataForTenant($tenantId, $startDate, $endDate);

        return Inertia::render('App/Admin/Reports/SinglePosReport', [
            'reportData' => $reportData,
            'tenant' => $tenant,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $request->only(['start_date', 'end_date'])
        ]);
    }

    public function printSingle(Request $request, $tenantId)
    {
        // Get date range - default to today
        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        // Get specific tenant
        $tenant = Tenant::findOrFail($tenantId);

        // Get report data for this restaurant
        $reportData = $this->generateReportDataForTenant($tenantId, $startDate, $endDate);

        return Inertia::render('App/Admin/Reports/SinglePosReportPrint', [
            'reportData' => $reportData,
            'tenant' => $tenant,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $request->only(['start_date', 'end_date'])
        ]);
    }

    public function printAll(Request $request)
    {
        // Get date range - default to today
        $startDate = $request->get('start_date', Carbon::today()->toDateString());
        $endDate = $request->get('end_date', Carbon::today()->toDateString());

        // Get all tenants (restaurants)
        $tenants = Tenant::select('id', 'name')->get();

        // Get report data for all restaurants
        $allReportsData = [];
        $grandTotal = 0;

        foreach ($tenants as $tenant) {
            $reportData = $this->generateReportDataForTenant($tenant->id, $startDate, $endDate);
            if ($reportData['total_quantity'] > 0) {
                $allReportsData[] = [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'report_data' => $reportData
                ];
                $grandTotal += $reportData['total_quantity'];
            }
        }

        return Inertia::render('App/Admin/Reports/AllPosReportsPrint', [
            'allReportsData' => $allReportsData,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'grandTotal' => $grandTotal
        ]);
        return Inertia::render('App/Admin/Reports/SinglePosReportPrint', [
            'reportData' => $reportData,
            'tenant' => $tenant,
            'startDate' => $startDate,
            'endDate' => $endDate
        ]);
    }

    public function restaurantWise()
    {
        $filters = request()->only([
            'start_date',
            'end_date',
            'tenant_ids',
            'customer_types',
            'customer_search',
            'waiter_ids',
            'cashier_ids',
            'table_nos',
            'category_names',
            'item_search',
            'discounted_only',
            'taxed_only',
            'payment_statuses',
        ]);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenants = Tenant::select('id', 'name')->orderBy('name')->get();
        $selectedTenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $selectedTenants = !empty($selectedTenantIds) ? $tenants->whereIn('id', $selectedTenantIds)->values() : $tenants;

        $allReportsData = [];
        $grandTotal = 0;
        $grandSubTotal = 0;
        $grandDiscount = 0;
        $grandTax = 0;
        $grandTotalSale = 0;

        foreach ($selectedTenants as $tenant) {
            $reportData = $this->generateFinancialReportDataForTenant($tenant->id, $startDate, $endDate, $filters);

            if (!empty($reportData['categories'])) {
                $allReportsData[] = [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'report_data' => $reportData
                ];

                $grandTotal += $reportData['total_quantity'];
                $grandSubTotal += $reportData['total_sub_total'];
                $grandDiscount += $reportData['total_discount'];
                $grandTax += $reportData['total_tax'] ?? 0;
                $grandTotalSale += $reportData['total_sale'];
            }
        }

        $ordersForLists = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled']);

        $waiterIds = (clone $ordersForLists)->whereNotNull('waiter_id')->distinct()->pluck('waiter_id')->filter()->values();
        $cashierIds = (clone $ordersForLists)->whereNotNull('cashier_id')->distinct()->pluck('cashier_id')->filter()->values();

        $waiters = Employee::select('id', 'name')->whereIn('id', $waiterIds)->orderBy('name')->get();
        $cashiers = User::select('id', 'name')->whereIn('id', $cashierIds)->orderBy('name')->get();

        return Inertia::render('App/Admin/Reports/RestaurantWisePosReport', [
            'allReportsData' => $allReportsData,
            'tenants' => $tenants,
            'waiters' => $waiters,
            'cashiers' => $cashiers,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'grandTotal' => $grandTotal,
            'grandSubTotal' => $grandSubTotal,
            'grandDiscount' => $grandDiscount,
            'grandTax' => $grandTax,
            'grandTotalSale' => $grandTotalSale,
            'filters' => $filters
        ]);
    }

    public function restaurantWisePrint()
    {
        $filters = request()->only([
            'start_date',
            'end_date',
            'tenant_ids',
            'customer_types',
            'customer_search',
            'waiter_ids',
            'cashier_ids',
            'table_nos',
            'category_names',
            'item_search',
            'discounted_only',
            'taxed_only',
            'payment_statuses',
        ]);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenants = Tenant::select('id', 'name')->orderBy('name')->get();
        $selectedTenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $selectedTenants = !empty($selectedTenantIds) ? $tenants->whereIn('id', $selectedTenantIds)->values() : $tenants;
        $allReportsData = [];
        $grandTotal = 0;
        $grandSubTotal = 0;
        $grandDiscount = 0;
        $grandTax = 0;
        $grandTotalSale = 0;

        foreach ($selectedTenants as $tenant) {
            $reportData = $this->generateFinancialReportDataForTenant($tenant->id, $startDate, $endDate, $filters);

            if (!empty($reportData['categories'])) {
                $allReportsData[] = [
                    'tenant_id' => $tenant->id,
                    'tenant_name' => $tenant->name,
                    'report_data' => $reportData
                ];

                $grandTotal += $reportData['total_quantity'];
                $grandSubTotal += $reportData['total_sub_total'];
                $grandDiscount += $reportData['total_discount'];
                $grandTax += $reportData['total_tax'] ?? 0;
                $grandTotalSale += $reportData['total_sale'];
            }
        }

        return Inertia::render('App/Admin/Reports/RestaurantWisePosReportPrint', [
            'allReportsData' => $allReportsData,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'grandTotal' => $grandTotal,
            'grandSubTotal' => $grandSubTotal,
            'grandDiscount' => $grandDiscount,
            'grandTax' => $grandTax,
            'grandTotalSale' => $grandTotalSale
        ]);
    }

    public function runningSalesOrders()
    {
        $filters = request()->only(['start_date', 'end_date', 'tenant_ids', 'cashier_ids']);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();
        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $cashierIds = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);

        $query = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['completed', 'cancelled', 'saved'])
            ->with(['tenant', 'table', 'member', 'customer', 'employee', 'cashier', 'waiter'])
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->orderBy('created_at', 'desc');

        if (!empty($tenantIds)) {
            $query->whereIn('tenant_id', $tenantIds);
        }
        if (!empty($cashierIds)) {
            $query->whereIn('cashier_id', $cashierIds);
        }

        $runningOrders = $query->get();

        $orderIds = $runningOrders->pluck('id')->values();
        $invoiceByOrderId = [];
        if ($orderIds->isNotEmpty()) {
            $invoiceQuery = FinancialInvoice::where('invoice_type', 'food_order');
            $invoiceQuery->where(function ($q) use ($orderIds) {
                foreach ($orderIds as $orderId) {
                    $q->orWhereJsonContains('data', ['order_id' => $orderId]);
                }
            });
            $invoices = $invoiceQuery->get();
            foreach ($invoices as $inv) {
                $oid = (int) (($inv->data['order_id'] ?? 0));
                if ($oid > 0 && !isset($invoiceByOrderId[$oid])) {
                    $invoiceByOrderId[$oid] = $inv->invoice_no;
                }
            }
        }

        $runningOrders->transform(function ($order) use ($invoiceByOrderId) {
            $order->invoice_no = $invoiceByOrderId[(int) $order->id] ?? null;
            return $order;
        });

        $totalOrders = $runningOrders->count();
        $totalAmount = $runningOrders->sum('total_price');

        $tenants = Tenant::select('id', 'name')->orderBy('name')->get();
        $cashierListIds = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotNull('cashier_id')
            ->distinct()
            ->pluck('cashier_id')
            ->filter()
            ->values();
        $cashiers = User::select('id', 'name')->whereIn('id', $cashierListIds)->orderBy('name')->get();

        return Inertia::render('App/Admin/Reports/RunningSalesOrders', [
            'runningOrders' => $runningOrders->values(),
            'totalOrders' => $totalOrders,
            'totalAmount' => $totalAmount,
            'reportDate' => $startDate,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'tenants' => $tenants,
            'cashiers' => $cashiers,
            'filters' => $filters,
        ]);
    }

    public function runningSalesOrdersPrint()
    {
        $filters = request()->only(['start_date', 'end_date', 'tenant_ids', 'cashier_ids']);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();
        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $cashierIds = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);

        $query = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['completed', 'cancelled', 'saved'])
            ->with(['tenant', 'table', 'member', 'customer', 'employee', 'cashier', 'waiter'])
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->orderBy('created_at', 'desc');

        if (!empty($tenantIds)) {
            $query->whereIn('tenant_id', $tenantIds);
        }
        if (!empty($cashierIds)) {
            $query->whereIn('cashier_id', $cashierIds);
        }

        $runningOrders = $query->get();

        $orderIds = $runningOrders->pluck('id')->values();
        $invoiceByOrderId = [];
        if ($orderIds->isNotEmpty()) {
            $invoiceQuery = FinancialInvoice::where('invoice_type', 'food_order');
            $invoiceQuery->where(function ($q) use ($orderIds) {
                foreach ($orderIds as $orderId) {
                    $q->orWhereJsonContains('data', ['order_id' => $orderId]);
                }
            });
            $invoices = $invoiceQuery->get();
            foreach ($invoices as $inv) {
                $oid = (int) (($inv->data['order_id'] ?? 0));
                if ($oid > 0 && !isset($invoiceByOrderId[$oid])) {
                    $invoiceByOrderId[$oid] = $inv->invoice_no;
                }
            }
        }

        $runningOrders->transform(function ($order) use ($invoiceByOrderId) {
            $order->invoice_no = $invoiceByOrderId[(int) $order->id] ?? null;
            return $order;
        });

        $totalOrders = $runningOrders->count();
        $totalAmount = $runningOrders->sum('total_price');

        return Inertia::render('App/Admin/Reports/RunningSalesOrdersPrint', [
            'runningOrders' => $runningOrders->values(),
            'totalOrders' => $totalOrders,
            'totalAmount' => $totalAmount,
            'reportDate' => $startDate,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'filters' => $filters,
        ]);
    }

    public function salesSummaryWithItems()
    {
        $filters = request()->only([
            'start_date',
            'end_date',
            'tenant_ids',
            'customer_types',
            'customer_search',
            'waiter_ids',
            'cashier_ids',
            'table_nos',
            'category_names',
            'item_search',
            'discounted_only',
            'taxed_only',
            'payment_statuses',
        ]);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $customerTypes = $this->normalizeFilterArray($filters['customer_types'] ?? null);
        $customerSearch = $this->normalizeFilterString($filters['customer_search'] ?? null);
        $waiterIds = $this->normalizeFilterIntArray($filters['waiter_ids'] ?? null);
        $cashierIds = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);
        $tableNos = $this->normalizeFilterArray($filters['table_nos'] ?? null);
        $categoryNames = $this->normalizeFilterArray($filters['category_names'] ?? null);
        $itemSearch = $this->normalizeFilterString($filters['item_search'] ?? null);
        $discountedOnly = filter_var($filters['discounted_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $taxedOnly = filter_var($filters['taxed_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $paymentStatuses = $this->normalizeFilterArray($filters['payment_statuses'] ?? null);

        $ordersQuery = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->with(['member', 'customer', 'employee', 'tenant', 'table', 'waiter', 'cashier', 'orderItems'])
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->orderBy('created_at', 'desc');

        if (!empty($tenantIds)) {
            $ordersQuery->whereIn('tenant_id', $tenantIds);
        }
        if (!empty($waiterIds)) {
            $ordersQuery->whereIn('waiter_id', $waiterIds);
        }
        if (!empty($cashierIds)) {
            $ordersQuery->whereIn('cashier_id', $cashierIds);
        }
        if (!empty($tableNos)) {
            $ordersQuery->whereHas('table', function ($q) use ($tableNos) {
                $q->whereIn('table_no', $tableNos);
            });
        }
        if (!empty($customerTypes)) {
            $ordersQuery->where(function ($q) use ($customerTypes) {
                $hasAny = false;
                if (in_array('member', $customerTypes, true)) {
                    $q->orWhereNotNull('member_id');
                    $hasAny = true;
                }
                if (in_array('guest', $customerTypes, true) || in_array('customer', $customerTypes, true)) {
                    $q->orWhereNotNull('customer_id');
                    $hasAny = true;
                }
                if (in_array('employee', $customerTypes, true)) {
                    $q->orWhereNotNull('employee_id');
                    $hasAny = true;
                }
                if (!$hasAny) {
                    $q->whereRaw('1=0');
                }
            });
        }
        if ($customerSearch) {
            $ordersQuery->where(function ($q) use ($customerSearch) {
                $q->whereHas('member', function ($mq) use ($customerSearch) {
                    $mq->where('full_name', 'like', "%{$customerSearch}%")
                        ->orWhere('membership_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('customer', function ($cq) use ($customerSearch) {
                    $cq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('customer_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('employee', function ($eq) use ($customerSearch) {
                    $eq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('employee_id', 'like', "%{$customerSearch}%");
                });
            });
        }
        if (!empty($paymentStatuses)) {
            $ordersQuery->where(function ($q) use ($paymentStatuses) {
                $statusValues = array_map(fn ($s) => strtolower(trim((string) $s)), $paymentStatuses);
                if (in_array('paid', $statusValues, true)) {
                    $q->orWhereRaw('LOWER(COALESCE(payment_status, "")) = "paid"');
                }
                if (in_array('unpaid', $statusValues, true)) {
                    $q->orWhereRaw('LOWER(COALESCE(payment_status, "")) != "paid"');
                }
                if (in_array('advance', $statusValues, true)) {
                    $q->orWhere('down_payment', '>', 0);
                }
            });
        }

        $orders = $ordersQuery->get();

        $orderIds = $orders->pluck('id')->values();
        $invoiceNoByOrderId = [];
        if ($orderIds->isNotEmpty()) {
            $invoiceQuery = FinancialInvoice::where('invoice_type', 'food_order');
            $invoiceQuery->where(function ($q) use ($orderIds) {
                foreach ($orderIds as $orderId) {
                    $q->orWhereJsonContains('data', ['order_id' => $orderId]);
                }
            });
            $invoices = $invoiceQuery->get();
            foreach ($invoices as $inv) {
                $oid = (int) ($inv->data['order_id'] ?? 0);
                if ($oid > 0 && !isset($invoiceNoByOrderId[$oid])) {
                    $invoiceNoByOrderId[$oid] = $inv->invoice_no;
                }
            }
        }

        $productIds = [];
        foreach ($orders as $order) {
            foreach ($order->orderItems as $oi) {
                $pid = $oi->order_item['id'] ?? null;
                if ($pid) {
                    $productIds[] = (int) $pid;
                }
            }
        }
        $productIds = array_values(array_unique(array_filter($productIds)));
        $menuCodesByProductId = !empty($productIds)
            ? Product::whereIn('id', $productIds)->pluck('menu_code', 'id')->toArray()
            : [];

        $salesData = [];
        $grandTotalQty = 0;
        $grandTotalAmount = 0;
        $grandTotalDiscount = 0;
        $grandTotalTax = 0;
        $grandTotalSale = 0;

        foreach ($orders as $order) {
            $orderItems = [];
            $invoiceTotalQty = 0;
            $invoiceTotalAmount = 0;
            $invoiceTotalDiscount = 0;
            $invoiceTotalTax = 0;
            $invoiceTotalSale = 0;

            $taxRate = (float) ($order->tax ?? 0);
            if ($taxRate > 1) {
                $taxRate = $taxRate / 100;
            }

            foreach ($order->orderItems as $orderItem) {
                $item = $orderItem->order_item ?? [];
                if (!is_array($item)) {
                    continue;
                }

                $categoryName = (string) ($item['category'] ?? '');
                if (!empty($categoryNames) && !in_array($categoryName, $categoryNames, true)) {
                    continue;
                }

                $pid = (int) ($item['id'] ?? 0);
                $menuCode = (string) ($item['menu_code'] ?? ($menuCodesByProductId[$pid] ?? 'N/A'));
                $itemName = (string) ($item['name'] ?? 'Unknown Item');

                if ($itemSearch) {
                    $haystack = strtolower(trim($itemName . ' ' . $menuCode . ' ' . $pid));
                    if (!str_contains($haystack, strtolower($itemSearch))) {
                        continue;
                    }
                }

                $qty = (float) ($item['quantity'] ?? 0);
                if ($qty <= 0) {
                    continue;
                }
                $price = (float) ($item['price'] ?? 0);
                $subTotal = $price * $qty;
                if ($subTotal <= 0) {
                    continue;
                }

                $discount = (float) ($item['discount_amount'] ?? 0);
                if ($discount < 0) {
                    $discount = 0;
                }
                if ($discount > $subTotal) {
                    $discount = $subTotal;
                }

                if ($discountedOnly && $discount <= 0) {
                    continue;
                }

                $isTaxable = (bool) ($item['is_taxable'] ?? false);
                $taxableNet = $isTaxable ? max(0, $subTotal - $discount) : 0;
                $tax = $taxableNet > 0 ? round($taxableNet * $taxRate) : 0;

                if ($taxedOnly && $tax <= 0) {
                    continue;
                }

                $totalSale = ($subTotal - $discount) + $tax;

                $orderItems[] = [
                    'code' => $menuCode,
                    'name' => $itemName,
                    'qty' => $qty,
                    'sale_price' => $price,
                    'sub_total' => $subTotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total_sale' => $totalSale,
                    'time' => $orderItem->created_at ? $orderItem->created_at->format('H:i:s') : null,
                ];

                $invoiceTotalQty += $qty;
                $invoiceTotalAmount += $subTotal;
                $invoiceTotalDiscount += $discount;
                $invoiceTotalTax += $tax;
                $invoiceTotalSale += $totalSale;
            }

            if (empty($orderItems)) {
                continue;
            }

            $customerName = $order->member ? $order->member->full_name : ($order->customer ? $order->customer->name : ($order->employee ? $order->employee->name : 'N/A'));

            $salesData[] = [
                'invoice_no' => $invoiceNoByOrderId[(int) $order->id] ?? $order->id,
                'date' => $order->start_date ? Carbon::parse($order->start_date)->format('d/m/Y') : $order->created_at->format('d/m/Y'),
                'customer' => $customerName,
                'order_via' => $order->order_type ?? 'N/A',
                'waiter' => $order->waiter ? $order->waiter->name : 'N/A',
                'table' => $order->table ? $order->table->table_no : 'N/A',
                'covers' => $order->person_count ?? 0,
                'items' => $orderItems,
                'total_qty' => $invoiceTotalQty,
                'total_amount' => $invoiceTotalAmount,
                'total_discount' => $invoiceTotalDiscount,
                'total_tax' => $invoiceTotalTax,
                'total_sale' => $invoiceTotalSale,
                'kot' => $order->kitchen_note ?? 'N/A',
            ];

            $grandTotalQty += $invoiceTotalQty;
            $grandTotalAmount += $invoiceTotalAmount;
            $grandTotalDiscount += $invoiceTotalDiscount;
            $grandTotalTax += $invoiceTotalTax;
            $grandTotalSale += $invoiceTotalSale;
        }

        return Inertia::render('App/Admin/Reports/SalesSummaryWithItems', [
            'salesData' => $salesData,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'grandTotalQty' => $grandTotalQty,
            'grandTotalAmount' => $grandTotalAmount,
            'grandTotalDiscount' => $grandTotalDiscount,
            'grandTotalTax' => $grandTotalTax,
            'grandTotalSale' => $grandTotalSale,
            'filters' => $filters,
            'tenants' => Tenant::select('id', 'name')->orderBy('name')->get(),
            'waiters' => Employee::select('id', 'name')->whereIn('id', $orders->pluck('waiter_id')->filter()->unique()->values())->orderBy('name')->get(),
            'cashiers' => User::select('id', 'name')->whereIn('id', $orders->pluck('cashier_id')->filter()->unique()->values())->orderBy('name')->get(),
        ]);
    }

    public function salesSummaryWithItemsPrint()
    {
        $filters = request()->only([
            'start_date',
            'end_date',
            'tenant_ids',
            'customer_types',
            'customer_search',
            'waiter_ids',
            'cashier_ids',
            'table_nos',
            'category_names',
            'item_search',
            'discounted_only',
            'taxed_only',
            'payment_statuses',
        ]);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $customerTypes = $this->normalizeFilterArray($filters['customer_types'] ?? null);
        $customerSearch = $this->normalizeFilterString($filters['customer_search'] ?? null);
        $waiterIds = $this->normalizeFilterIntArray($filters['waiter_ids'] ?? null);
        $cashierIds = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);
        $tableNos = $this->normalizeFilterArray($filters['table_nos'] ?? null);
        $categoryNames = $this->normalizeFilterArray($filters['category_names'] ?? null);
        $itemSearch = $this->normalizeFilterString($filters['item_search'] ?? null);
        $discountedOnly = filter_var($filters['discounted_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $taxedOnly = filter_var($filters['taxed_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $paymentStatuses = $this->normalizeFilterArray($filters['payment_statuses'] ?? null);

        $ordersQuery = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->with(['member', 'customer', 'employee', 'tenant', 'table', 'waiter', 'cashier', 'orderItems'])
            ->orderBy('start_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->orderBy('created_at', 'desc');

        if (!empty($tenantIds)) {
            $ordersQuery->whereIn('tenant_id', $tenantIds);
        }
        if (!empty($waiterIds)) {
            $ordersQuery->whereIn('waiter_id', $waiterIds);
        }
        if (!empty($cashierIds)) {
            $ordersQuery->whereIn('cashier_id', $cashierIds);
        }
        if (!empty($tableNos)) {
            $ordersQuery->whereHas('table', function ($q) use ($tableNos) {
                $q->whereIn('table_no', $tableNos);
            });
        }
        if (!empty($customerTypes)) {
            $ordersQuery->where(function ($q) use ($customerTypes) {
                $hasAny = false;
                if (in_array('member', $customerTypes, true)) {
                    $q->orWhereNotNull('member_id');
                    $hasAny = true;
                }
                if (in_array('guest', $customerTypes, true) || in_array('customer', $customerTypes, true)) {
                    $q->orWhereNotNull('customer_id');
                    $hasAny = true;
                }
                if (in_array('employee', $customerTypes, true)) {
                    $q->orWhereNotNull('employee_id');
                    $hasAny = true;
                }
                if (!$hasAny) {
                    $q->whereRaw('1=0');
                }
            });
        }
        if ($customerSearch) {
            $ordersQuery->where(function ($q) use ($customerSearch) {
                $q->whereHas('member', function ($mq) use ($customerSearch) {
                    $mq->where('full_name', 'like', "%{$customerSearch}%")
                        ->orWhere('membership_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('customer', function ($cq) use ($customerSearch) {
                    $cq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('customer_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('employee', function ($eq) use ($customerSearch) {
                    $eq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('employee_id', 'like', "%{$customerSearch}%");
                });
            });
        }
        if (!empty($paymentStatuses)) {
            $ordersQuery->where(function ($q) use ($paymentStatuses) {
                $statusValues = array_map(fn ($s) => strtolower(trim((string) $s)), $paymentStatuses);
                if (in_array('paid', $statusValues, true)) {
                    $q->orWhereRaw('LOWER(COALESCE(payment_status, "")) = "paid"');
                }
                if (in_array('unpaid', $statusValues, true)) {
                    $q->orWhereRaw('LOWER(COALESCE(payment_status, "")) != "paid"');
                }
                if (in_array('advance', $statusValues, true)) {
                    $q->orWhere('down_payment', '>', 0);
                }
            });
        }

        $orders = $ordersQuery->get();

        $orderIds = $orders->pluck('id')->values();
        $invoiceNoByOrderId = [];
        if ($orderIds->isNotEmpty()) {
            $invoiceQuery = FinancialInvoice::where('invoice_type', 'food_order');
            $invoiceQuery->where(function ($q) use ($orderIds) {
                foreach ($orderIds as $orderId) {
                    $q->orWhereJsonContains('data', ['order_id' => $orderId]);
                }
            });
            $invoices = $invoiceQuery->get();
            foreach ($invoices as $inv) {
                $oid = (int) ($inv->data['order_id'] ?? 0);
                if ($oid > 0 && !isset($invoiceNoByOrderId[$oid])) {
                    $invoiceNoByOrderId[$oid] = $inv->invoice_no;
                }
            }
        }

        $productIds = [];
        foreach ($orders as $order) {
            foreach ($order->orderItems as $oi) {
                $pid = $oi->order_item['id'] ?? null;
                if ($pid) {
                    $productIds[] = (int) $pid;
                }
            }
        }
        $productIds = array_values(array_unique(array_filter($productIds)));
        $menuCodesByProductId = !empty($productIds)
            ? Product::whereIn('id', $productIds)->pluck('menu_code', 'id')->toArray()
            : [];

        $salesData = [];
        $grandTotalQty = 0;
        $grandTotalAmount = 0;
        $grandTotalDiscount = 0;
        $grandTotalTax = 0;
        $grandTotalSale = 0;

        foreach ($orders as $order) {
            $orderItems = [];
            $invoiceTotalQty = 0;
            $invoiceTotalAmount = 0;
            $invoiceTotalDiscount = 0;
            $invoiceTotalTax = 0;
            $invoiceTotalSale = 0;

            $taxRate = (float) ($order->tax ?? 0);
            if ($taxRate > 1) {
                $taxRate = $taxRate / 100;
            }

            foreach ($order->orderItems as $orderItem) {
                $item = $orderItem->order_item ?? [];
                if (!is_array($item)) {
                    continue;
                }

                $categoryName = (string) ($item['category'] ?? '');
                if (!empty($categoryNames) && !in_array($categoryName, $categoryNames, true)) {
                    continue;
                }

                $pid = (int) ($item['id'] ?? 0);
                $menuCode = (string) ($item['menu_code'] ?? ($menuCodesByProductId[$pid] ?? 'N/A'));
                $itemName = (string) ($item['name'] ?? 'Unknown Item');

                if ($itemSearch) {
                    $haystack = strtolower(trim($itemName . ' ' . $menuCode . ' ' . $pid));
                    if (!str_contains($haystack, strtolower($itemSearch))) {
                        continue;
                    }
                }

                $qty = (float) ($item['quantity'] ?? 0);
                if ($qty <= 0) {
                    continue;
                }
                $price = (float) ($item['price'] ?? 0);
                $subTotal = $price * $qty;
                if ($subTotal <= 0) {
                    continue;
                }

                $discount = (float) ($item['discount_amount'] ?? 0);
                if ($discount < 0) {
                    $discount = 0;
                }
                if ($discount > $subTotal) {
                    $discount = $subTotal;
                }

                if ($discountedOnly && $discount <= 0) {
                    continue;
                }

                $isTaxable = (bool) ($item['is_taxable'] ?? false);
                $taxableNet = $isTaxable ? max(0, $subTotal - $discount) : 0;
                $tax = $taxableNet > 0 ? round($taxableNet * $taxRate) : 0;

                if ($taxedOnly && $tax <= 0) {
                    continue;
                }

                $totalSale = ($subTotal - $discount) + $tax;

                $orderItems[] = [
                    'code' => $menuCode,
                    'name' => $itemName,
                    'qty' => $qty,
                    'sale_price' => $price,
                    'sub_total' => $subTotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total_sale' => $totalSale,
                    'time' => $orderItem->created_at ? $orderItem->created_at->format('H:i:s') : null,
                ];

                $invoiceTotalQty += $qty;
                $invoiceTotalAmount += $subTotal;
                $invoiceTotalDiscount += $discount;
                $invoiceTotalTax += $tax;
                $invoiceTotalSale += $totalSale;
            }

            if (empty($orderItems)) {
                continue;
            }

            $customerName = $order->member ? $order->member->full_name : ($order->customer ? $order->customer->name : ($order->employee ? $order->employee->name : 'N/A'));

            $salesData[] = [
                'invoice_no' => $invoiceNoByOrderId[(int) $order->id] ?? $order->id,
                'date' => $order->start_date ? Carbon::parse($order->start_date)->format('d/m/Y') : $order->created_at->format('d/m/Y'),
                'customer' => $customerName,
                'order_via' => $order->order_type ?? 'N/A',
                'waiter' => $order->waiter ? $order->waiter->name : 'N/A',
                'table' => $order->table ? $order->table->table_no : 'N/A',
                'covers' => $order->person_count ?? 0,
                'items' => $orderItems,
                'total_qty' => $invoiceTotalQty,
                'total_amount' => $invoiceTotalAmount,
                'total_discount' => $invoiceTotalDiscount,
                'total_tax' => $invoiceTotalTax,
                'total_sale' => $invoiceTotalSale,
                'kot' => $order->kitchen_note ?? 'N/A',
            ];

            $grandTotalQty += $invoiceTotalQty;
            $grandTotalAmount += $invoiceTotalAmount;
            $grandTotalDiscount += $invoiceTotalDiscount;
            $grandTotalTax += $invoiceTotalTax;
            $grandTotalSale += $invoiceTotalSale;
        }

        return Inertia::render('App/Admin/Reports/SalesSummaryWithItemsPrint', [
            'salesData' => $salesData,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'grandTotalQty' => $grandTotalQty,
            'grandTotalAmount' => $grandTotalAmount,
            'grandTotalDiscount' => $grandTotalDiscount,
            'grandTotalTax' => $grandTotalTax,
            'grandTotalSale' => $grandTotalSale
        ]);
    }

    public function dailySalesListCashierWise()
    {
        $filters = request()->only([
            'start_date',
            'end_date',
            'tenant_ids',
            'cashier_ids',
            'waiter_ids',
            'table_nos',
            'order_types',
            'customer_types',
            'customer_search',
        ]);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $cashierIdsFilter = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);
        $waiterIds = $this->normalizeFilterIntArray($filters['waiter_ids'] ?? null);
        $tableNos = $this->normalizeFilterArray($filters['table_nos'] ?? null);
        $orderTypes = $this->normalizeFilterArray($filters['order_types'] ?? null);
        $customerTypes = $this->normalizeFilterArray($filters['customer_types'] ?? null);
        $customerSearch = $this->normalizeFilterString($filters['customer_search'] ?? null);

        $cashierListIds = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotNull('cashier_id')
            ->distinct()
            ->pluck('cashier_id')
            ->filter()
            ->values();
        $allCashiers = User::select('id', 'name')->whereIn('id', $cashierListIds)->orderBy('name')->get();

        $tenants = Tenant::select('id', 'name')->orderBy('name')->get();
        $waiters = Employee::select('id', 'name')
            ->whereIn('id', Order::whereBetween('start_date', [$startDate, $endDate])->whereNotNull('waiter_id')->distinct()->pluck('waiter_id')->filter()->values())
            ->orderBy('name')
            ->get();

        $ordersQuery = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->with(['cashier', 'orderItems', 'table', 'member', 'customer', 'employee']);

        if (!empty($tenantIds)) {
            $ordersQuery->whereIn('tenant_id', $tenantIds);
        }
        if (!empty($cashierIdsFilter)) {
            $ordersQuery->whereIn('cashier_id', $cashierIdsFilter);
        }
        if (!empty($waiterIds)) {
            $ordersQuery->whereIn('waiter_id', $waiterIds);
        }
        if (!empty($orderTypes)) {
            $ordersQuery->whereIn('order_type', $orderTypes);
        }
        if (!empty($tableNos)) {
            $ordersQuery->whereHas('table', function ($q) use ($tableNos) {
                $q->whereIn('table_no', $tableNos);
            });
        }
        if (!empty($customerTypes)) {
            $ordersQuery->where(function ($q) use ($customerTypes) {
                $hasAny = false;
                if (in_array('member', $customerTypes, true)) {
                    $q->orWhereNotNull('member_id');
                    $hasAny = true;
                }
                if (in_array('guest', $customerTypes, true) || in_array('customer', $customerTypes, true)) {
                    $q->orWhereNotNull('customer_id');
                    $hasAny = true;
                }
                if (in_array('employee', $customerTypes, true)) {
                    $q->orWhereNotNull('employee_id');
                    $hasAny = true;
                }
                if (!$hasAny) {
                    $q->whereRaw('1=0');
                }
            });
        }
        if ($customerSearch) {
            $ordersQuery->where(function ($q) use ($customerSearch) {
                $q->whereHas('member', function ($mq) use ($customerSearch) {
                    $mq->where('full_name', 'like', "%{$customerSearch}%")
                        ->orWhere('membership_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('customer', function ($cq) use ($customerSearch) {
                    $cq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('customer_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('employee', function ($eq) use ($customerSearch) {
                    $eq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('employee_id', 'like', "%{$customerSearch}%");
                });
            });
        }

        $orders = $ordersQuery->get();
        $orderIds = $orders->pluck('id')->values();

        $invoicesQuery = FinancialInvoice::where('invoice_type', 'food_order')
            ->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $startDate)
            ->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $endDate);

        if ($orderIds->isNotEmpty()) {
            $invoicesQuery->where(function ($q) use ($orderIds) {
                foreach ($orderIds as $orderId) {
                    $q->orWhereJsonContains('data', ['order_id' => $orderId]);
                }
            });
        } else {
            $invoicesQuery->whereRaw('1=0');
        }

        $invoices = $invoicesQuery->get();

        $ordersById = $orders->keyBy('id');

        $cashierData = [];
        foreach ($allCashiers as $cashier) {
            $cashierData[$cashier->id] = [
                'id' => $cashier->id,
                'name' => $cashier->name,
                'sale' => 0,
                'discount' => 0,
                's_tax_amt' => 0,
                'cash' => 0,
                'credit' => 0,
                'paid' => 0,
                'unpaid' => 0,
                'total' => 0,
            ];
        }

        $grandTotalSale = 0;
        $grandTotalDiscount = 0;
        $grandTotalSTax = 0;
        $grandTotalCash = 0;
        $grandTotalCredit = 0;
        $grandTotalPaid = 0;
        $grandTotalUnpaid = 0;
        $grandTotal = 0;

        foreach ($invoices as $invoice) {
            $orderId = (int) (($invoice->data['order_id'] ?? 0));
            if ($orderId <= 0) {
                continue;
            }
            $order = $ordersById->get($orderId);
            if (!$order || !$order->cashier) {
                continue;
            }

            $cashierId = (int) $order->cashier->id;
            if (!isset($cashierData[$cashierId])) {
                $cashierData[$cashierId] = [
                    'id' => $cashierId,
                    'name' => $order->cashier->name,
                    'sale' => 0,
                    'discount' => 0,
                    's_tax_amt' => 0,
                    'cash' => 0,
                    'credit' => 0,
                    'paid' => 0,
                    'unpaid' => 0,
                    'total' => 0,
                ];
            }

            $invoiceAmount = (float) ($invoice->amount ?? 0);
            $paidAmount = (float) ($invoice->paid_amount ?? 0);
            $unpaidAmount = $invoiceAmount - $paidAmount;

            $paymentMethod = strtolower((string) ($invoice->payment_method ?? ''));
            $cashAmount = 0;
            $creditAmount = 0;
            if ($paymentMethod === 'cash') {
                $cashAmount = $paidAmount;
            } elseif (in_array($paymentMethod, ['credit', 'credit_card', 'card', 'debit_card'], true)) {
                $creditAmount = $paidAmount;
            } else {
                $cashAmount = $paidAmount;
            }

            $taxRate = (float) ($order->tax ?? 0);
            if ($taxRate > 1) {
                $taxRate = $taxRate / 100;
            }
            $taxAmount = 0;
            $discountAmount = 0;
            foreach ($order->orderItems as $oi) {
                $item = $oi->order_item ?? [];
                if (!is_array($item)) {
                    continue;
                }
                $qty = (float) ($item['quantity'] ?? 0);
                $price = (float) ($item['price'] ?? 0);
                $subTotal = $qty * $price;
                if ($subTotal <= 0) {
                    continue;
                }
                $disc = (float) ($item['discount_amount'] ?? 0);
                if ($disc < 0) {
                    $disc = 0;
                }
                if ($disc > $subTotal) {
                    $disc = $subTotal;
                }
                $discountAmount += $disc;
                $isTaxable = (bool) ($item['is_taxable'] ?? false);
                if ($isTaxable) {
                    $taxableNet = max(0, $subTotal - $disc);
                    $taxAmount += $taxableNet > 0 ? round($taxableNet * $taxRate) : 0;
                }
            }

            $saleAmount = $invoiceAmount;

            $cashierData[$cashierId]['sale'] += $saleAmount;
            $cashierData[$cashierId]['discount'] += $discountAmount;
            $cashierData[$cashierId]['s_tax_amt'] += $taxAmount;
            $cashierData[$cashierId]['cash'] += $cashAmount;
            $cashierData[$cashierId]['credit'] += $creditAmount;
            $cashierData[$cashierId]['paid'] += $paidAmount;
            $cashierData[$cashierId]['unpaid'] += $unpaidAmount;
            $cashierData[$cashierId]['total'] += $invoiceAmount;

            $grandTotalSale += $saleAmount;
            $grandTotalDiscount += $discountAmount;
            $grandTotalSTax += $taxAmount;
            $grandTotalCash += $cashAmount;
            $grandTotalCredit += $creditAmount;
            $grandTotalPaid += $paidAmount;
            $grandTotalUnpaid += $unpaidAmount;
            $grandTotal += $invoiceAmount;
        }

        // Convert to array and sort by cashier name
        $cashierArray = array_values($cashierData);
        usort($cashierArray, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return Inertia::render('App/Admin/Reports/DailySalesListCashierWise', [
            'cashierData' => $cashierArray,
            'allCashiers' => $allCashiers,
            'tenants' => $tenants,
            'waiters' => $waiters,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'grandTotalSale' => $grandTotalSale,
            'grandTotalDiscount' => $grandTotalDiscount,
            'grandTotalSTax' => $grandTotalSTax,
            'grandTotalCash' => $grandTotalCash,
            'grandTotalCredit' => $grandTotalCredit,
            'grandTotalPaid' => $grandTotalPaid,
            'grandTotalUnpaid' => $grandTotalUnpaid,
            'grandTotal' => $grandTotal,
            'filters' => $filters
        ]);
    }

    public function dailySalesListCashierWisePrint()
    {
        $filters = request()->only([
            'start_date',
            'end_date',
            'tenant_ids',
            'cashier_ids',
            'waiter_ids',
            'table_nos',
            'order_types',
            'customer_types',
            'customer_search',
        ]);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $cashierIdsFilter = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);
        $waiterIds = $this->normalizeFilterIntArray($filters['waiter_ids'] ?? null);
        $tableNos = $this->normalizeFilterArray($filters['table_nos'] ?? null);
        $orderTypes = $this->normalizeFilterArray($filters['order_types'] ?? null);
        $customerTypes = $this->normalizeFilterArray($filters['customer_types'] ?? null);
        $customerSearch = $this->normalizeFilterString($filters['customer_search'] ?? null);

        $ordersQuery = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->with(['cashier', 'orderItems', 'table', 'member', 'customer', 'employee']);

        if (!empty($tenantIds)) {
            $ordersQuery->whereIn('tenant_id', $tenantIds);
        }
        if (!empty($cashierIdsFilter)) {
            $ordersQuery->whereIn('cashier_id', $cashierIdsFilter);
        }
        if (!empty($waiterIds)) {
            $ordersQuery->whereIn('waiter_id', $waiterIds);
        }
        if (!empty($orderTypes)) {
            $ordersQuery->whereIn('order_type', $orderTypes);
        }
        if (!empty($tableNos)) {
            $ordersQuery->whereHas('table', function ($q) use ($tableNos) {
                $q->whereIn('table_no', $tableNos);
            });
        }
        if (!empty($customerTypes)) {
            $ordersQuery->where(function ($q) use ($customerTypes) {
                $hasAny = false;
                if (in_array('member', $customerTypes, true)) {
                    $q->orWhereNotNull('member_id');
                    $hasAny = true;
                }
                if (in_array('guest', $customerTypes, true) || in_array('customer', $customerTypes, true)) {
                    $q->orWhereNotNull('customer_id');
                    $hasAny = true;
                }
                if (in_array('employee', $customerTypes, true)) {
                    $q->orWhereNotNull('employee_id');
                    $hasAny = true;
                }
                if (!$hasAny) {
                    $q->whereRaw('1=0');
                }
            });
        }
        if ($customerSearch) {
            $ordersQuery->where(function ($q) use ($customerSearch) {
                $q->whereHas('member', function ($mq) use ($customerSearch) {
                    $mq->where('full_name', 'like', "%{$customerSearch}%")
                        ->orWhere('membership_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('customer', function ($cq) use ($customerSearch) {
                    $cq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('customer_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('employee', function ($eq) use ($customerSearch) {
                    $eq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('employee_id', 'like', "%{$customerSearch}%");
                });
            });
        }

        $orders = $ordersQuery->get();
        $orderIds = $orders->pluck('id')->values();

        $invoicesQuery = FinancialInvoice::where('invoice_type', 'food_order')
            ->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $startDate)
            ->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $endDate);

        if ($orderIds->isNotEmpty()) {
            $invoicesQuery->where(function ($q) use ($orderIds) {
                foreach ($orderIds as $orderId) {
                    $q->orWhereJsonContains('data', ['order_id' => $orderId]);
                }
            });
        } else {
            $invoicesQuery->whereRaw('1=0');
        }

        $invoices = $invoicesQuery->get();
        $ordersById = $orders->keyBy('id');

        $cashierData = [];
        $grandTotalSale = 0;
        $grandTotalDiscount = 0;
        $grandTotalSTax = 0;
        $grandTotalCash = 0;
        $grandTotalCredit = 0;
        $grandTotalPaid = 0;
        $grandTotalUnpaid = 0;
        $grandTotal = 0;

        foreach ($invoices as $invoice) {
            $orderId = (int) (($invoice->data['order_id'] ?? 0));
            if ($orderId <= 0) {
                continue;
            }
            $order = $ordersById->get($orderId);
            if (!$order || !$order->cashier) {
                continue;
            }

            $cashierName = (string) $order->cashier->name;
            if (!isset($cashierData[$cashierName])) {
                $cashierData[$cashierName] = [
                    'name' => $cashierName,
                    'sale' => 0,
                    'discount' => 0,
                    's_tax_amt' => 0,
                    'cash' => 0,
                    'credit' => 0,
                    'paid' => 0,
                    'unpaid' => 0,
                    'total' => 0,
                ];
            }

            $invoiceAmount = (float) ($invoice->amount ?? 0);
            $paidAmount = (float) ($invoice->paid_amount ?? 0);
            $unpaidAmount = $invoiceAmount - $paidAmount;

            $paymentMethod = strtolower((string) ($invoice->payment_method ?? ''));
            $cashAmount = 0;
            $creditAmount = 0;
            if ($paymentMethod === 'cash') {
                $cashAmount = $paidAmount;
            } elseif (in_array($paymentMethod, ['credit', 'credit_card', 'card', 'debit_card'], true)) {
                $creditAmount = $paidAmount;
            } else {
                $cashAmount = $paidAmount;
            }

            $taxRate = (float) ($order->tax ?? 0);
            if ($taxRate > 1) {
                $taxRate = $taxRate / 100;
            }
            $taxAmount = 0;
            $discountAmount = 0;
            foreach ($order->orderItems as $oi) {
                $item = $oi->order_item ?? [];
                if (!is_array($item)) {
                    continue;
                }
                $qty = (float) ($item['quantity'] ?? 0);
                $price = (float) ($item['price'] ?? 0);
                $subTotal = $qty * $price;
                if ($subTotal <= 0) {
                    continue;
                }
                $disc = (float) ($item['discount_amount'] ?? 0);
                if ($disc < 0) {
                    $disc = 0;
                }
                if ($disc > $subTotal) {
                    $disc = $subTotal;
                }
                $discountAmount += $disc;
                $isTaxable = (bool) ($item['is_taxable'] ?? false);
                if ($isTaxable) {
                    $taxableNet = max(0, $subTotal - $disc);
                    $taxAmount += $taxableNet > 0 ? round($taxableNet * $taxRate) : 0;
                }
            }

            $saleAmount = $invoiceAmount;

            $cashierData[$cashierName]['sale'] += $saleAmount;
            $cashierData[$cashierName]['discount'] += $discountAmount;
            $cashierData[$cashierName]['s_tax_amt'] += $taxAmount;
            $cashierData[$cashierName]['cash'] += $cashAmount;
            $cashierData[$cashierName]['credit'] += $creditAmount;
            $cashierData[$cashierName]['paid'] += $paidAmount;
            $cashierData[$cashierName]['unpaid'] += $unpaidAmount;
            $cashierData[$cashierName]['total'] += $invoiceAmount;

            $grandTotalSale += $saleAmount;
            $grandTotalDiscount += $discountAmount;
            $grandTotalSTax += $taxAmount;
            $grandTotalCash += $cashAmount;
            $grandTotalCredit += $creditAmount;
            $grandTotalPaid += $paidAmount;
            $grandTotalUnpaid += $unpaidAmount;
            $grandTotal += $invoiceAmount;
        }

        $cashierArray = array_values($cashierData);
        usort($cashierArray, fn ($a, $b) => strcmp($a['name'], $b['name']));

        return Inertia::render('App/Admin/Reports/DailySalesListCashierWisePrint', [
            'cashierData' => $cashierArray,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'grandTotalSale' => $grandTotalSale,
            'grandTotalDiscount' => $grandTotalDiscount,
            'grandTotalSTax' => $grandTotalSTax,
            'grandTotalCash' => $grandTotalCash,
            'grandTotalCredit' => $grandTotalCredit,
            'grandTotalPaid' => $grandTotalPaid,
            'grandTotalUnpaid' => $grandTotalUnpaid,
            'grandTotal' => $grandTotal
        ]);
    }

    public function dailyDumpItemsReport()
    {
        $filters = request()->only([
            'start_date',
            'end_date',
            'tenant_ids',
            'table_nos',
            'waiter_ids',
            'cashier_ids',
            'cancelled_by_ids',
            'customer_types',
            'customer_search',
            'category_names',
            'item_search',
            'discounted_only',
            'taxed_only',
            'payment_statuses',
        ]);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        $tenantIds = $this->normalizeFilterIntArray($filters['tenant_ids'] ?? null);
        $tableNos = $this->normalizeFilterArray($filters['table_nos'] ?? null);
        $waiterIds = $this->normalizeFilterIntArray($filters['waiter_ids'] ?? null);
        $cashierIds = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);
        $cancelledByIds = $this->normalizeFilterIntArray($filters['cancelled_by_ids'] ?? null);
        $customerTypes = $this->normalizeFilterArray($filters['customer_types'] ?? null);
        $customerSearch = $this->normalizeFilterString($filters['customer_search'] ?? null);
        $categoryNames = $this->normalizeFilterArray($filters['category_names'] ?? null);
        $itemSearch = $this->normalizeFilterString($filters['item_search'] ?? null);
        $discountedOnly = filter_var($filters['discounted_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $taxedOnly = filter_var($filters['taxed_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $paymentStatuses = $this->normalizeFilterArray($filters['payment_statuses'] ?? null);

        // Get cancelled order items within date range
        $cancelledItems = OrderItem::whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->where('status', 'cancelled')
            ->with(['order' => function ($query) {
                $query->with(['table', 'member', 'customer', 'employee', 'waiter', 'cashier', 'tenant']);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // Process cancelled items data with deduplication
        $dumpItemsData = [];
        $processedItems = [];  // To avoid duplicates
        $totalQuantity = 0;
        $totalSalePrice = 0;
        $totalFoodValue = 0;

        foreach ($cancelledItems as $orderItem) {
            $order = $orderItem->order;
            if (!$order)
                continue;

            if (!empty($tenantIds) && !in_array((int) $order->tenant_id, $tenantIds, true)) {
                continue;
            }
            if (!empty($waiterIds) && !in_array((int) ($order->waiter_id ?? 0), $waiterIds, true)) {
                continue;
            }
            if (!empty($cashierIds) && !in_array((int) ($order->cashier_id ?? 0), $cashierIds, true)) {
                continue;
            }
            if (!empty($cancelledByIds) && !in_array((int) ($order->updated_by ?? 0), $cancelledByIds, true)) {
                continue;
            }
            if (!empty($tableNos)) {
                $tno = (string) ($order->table?->table_no ?? '');
                if ($tno === '' || !in_array($tno, $tableNos, true)) {
                    continue;
                }
            }
            if (!empty($customerTypes)) {
                $ok = false;
                if (in_array('member', $customerTypes, true) && $order->member_id) $ok = true;
                if ((in_array('guest', $customerTypes, true) || in_array('customer', $customerTypes, true)) && $order->customer_id) $ok = true;
                if (in_array('employee', $customerTypes, true) && $order->employee_id) $ok = true;
                if (!$ok) {
                    continue;
                }
            }
            if ($customerSearch) {
                $hay = strtolower(
                    trim(
                        (string) (
                            ($order->member?->full_name ?? '') . ' ' . ($order->member?->membership_no ?? '') . ' ' .
                            ($order->customer?->name ?? '') . ' ' . ($order->customer?->customer_no ?? '') . ' ' .
                            ($order->employee?->name ?? '') . ' ' . ($order->employee?->employee_id ?? '')
                        )
                    )
                );
                if (!str_contains($hay, strtolower($customerSearch))) {
                    continue;
                }
            }
            if (!empty($paymentStatuses)) {
                $statusValues = array_map(fn ($s) => strtolower(trim((string) $s)), $paymentStatuses);
                $paymentStatus = strtolower((string) ($order->payment_status ?? ''));
                $isAdvance = (float) ($order->down_payment ?? 0) > 0;
                $matches = false;
                if (in_array('paid', $statusValues, true) && $paymentStatus === 'paid') $matches = true;
                if (in_array('unpaid', $statusValues, true) && $paymentStatus !== 'paid') $matches = true;
                if (in_array('advance', $statusValues, true) && $isAdvance) $matches = true;
                if (!$matches) {
                    continue;
                }
            }
            $orderNo = $order->id;

            // Process the order_item JSON (single item object)
            $item = $orderItem->order_item;
            if ($item && is_array($item)) {
                $category = (string) ($item['category'] ?? '');
                if (!empty($categoryNames) && !in_array($category, $categoryNames, true)) {
                    continue;
                }
                $menuCodeFromItem = (string) ($item['menu_code'] ?? '');
                $itemName = (string) ($item['name'] ?? '');
                if ($itemSearch) {
                    $haystack = strtolower(trim($itemName . ' ' . $menuCodeFromItem));
                    if (!str_contains($haystack, strtolower($itemSearch))) {
                        continue;
                    }
                }

                $productId = $item['id'] ?? null;
                $itemName = $itemName !== '' ? $itemName : 'Unknown Item';

                // Create unique key to avoid duplicates
                $uniqueKey = $order->id . '_' . $productId . '_' . $itemName . '_' . $orderItem->id;

                // Skip if already processed
                if (!isset($processedItems[$uniqueKey])) {
                    $processedItems[$uniqueKey] = true;

                    $quantity = (float) ($item['quantity'] ?? 1);
                    $itemPrice = (float) ($item['price'] ?? 0);  // Price from order_item JSON
                    $totalPrice = (float) ($item['total_price'] ?? 0);  // Total price from order_item JSON
                    $salePrice = $itemPrice;  // Use price from order_item for SALE PRICE
                    $foodValue = $totalPrice;  // Use total_price from order_item for FOOD VALUE

                    $subTotal = $itemPrice * $quantity;
                    $disc = (float) ($item['discount_amount'] ?? 0);
                    if ($disc < 0) {
                        $disc = 0;
                    }
                    if ($disc > $subTotal) {
                        $disc = $subTotal;
                    }
                    if ($discountedOnly && $disc <= 0) {
                        continue;
                    }
                    $taxRate = (float) ($order->tax ?? 0);
                    if ($taxRate > 1) {
                        $taxRate = $taxRate / 100;
                    }
                    $isTaxable = (bool) ($item['is_taxable'] ?? false);
                    $taxableNet = $isTaxable ? max(0, $subTotal - $disc) : 0;
                    $taxAmount = $taxableNet > 0 ? round($taxableNet * $taxRate) : 0;
                    if ($taxedOnly && $taxAmount <= 0) {
                        continue;
                    }

                    // Get menu_code and product name from Product table
                    $menuCode = 'N/A';
                    $productName = $itemName;  // Default to order_item name

                    if ($productId) {
                        $product = Product::find($productId);
                        if ($product) {
                            $menuCode = $product->menu_code ?? 'N/A';
                            $productName = $product->name ?? $itemName;  // Use product name if available
                        }
                    }

                    $dumpItemsData[] = [
                        'invoice_kot' => $orderNo,
                        'table_no' => $order->table ? $order->table->table_no : 'N/A',
                        'date' => $orderItem->created_at->format('d/m/Y'),
                        'item_code' => $menuCode,
                        'item_name' => $productName,
                        'qty' => $quantity,
                        'status' => ucfirst($orderItem->status ?? 'Cancelled'),
                        'instructions' => $orderItem->instructions ?? 'N/A',
                        'reason' => $orderItem->remark ?? 'N/A',
                        'remarks' => $this->getCancelReason($orderItem->cancelType ?? ''),
                        'sale_price' => $salePrice,
                        'food_value' => $foodValue,
                        'cancelled_by' => User::find($order->updated_by ?: ($order->created_by ?: 0))->name ?? 'N/A'
                    ];

                    $totalQuantity += $quantity;
                    $totalSalePrice += $salePrice;
                    $totalFoodValue += $foodValue;
                }
            }
        }

        return Inertia::render('App/Admin/Reports/DailyDumpItemsReport', [
            'dumpItemsData' => $dumpItemsData,
            'tenants' => Tenant::select('id', 'name')->orderBy('name')->get(),
            'waiters' => Employee::select('id', 'name')->orderBy('name')->get(),
            'cashiers' => User::select('id', 'name')->orderBy('name')->get(),
            'cancelledByUsers' => User::select('id', 'name')->orderBy('name')->get(),
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalQuantity' => $totalQuantity,
            'totalSalePrice' => $totalSalePrice,
            'totalFoodValue' => $totalFoodValue,
            'filters' => $filters
        ]);
    }

    public function dailyDumpItemsReportPrint()
    {
        $filters = request()->only(['start_date', 'end_date']);
        $startDate = $filters['start_date'] ?? now()->toDateString();
        $endDate = $filters['end_date'] ?? now()->toDateString();

        // Get cancelled order items within date range
        $cancelledItems = OrderItem::whereDate('created_at', '>=', $startDate)
            ->whereDate('created_at', '<=', $endDate)
            ->where('status', 'cancelled')
            ->with(['order' => function ($query) {
                $query->with(['table']);
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        // Process cancelled items data with deduplication
        $dumpItemsData = [];
        $processedItems = [];  // To avoid duplicates
        $totalQuantity = 0;
        $totalSalePrice = 0;
        $totalFoodValue = 0;

        foreach ($cancelledItems as $orderItem) {
            $order = $orderItem->order;
            if (!$order)
                continue;

            // Get invoice number from FinancialInvoice
            $invoiceNo = 'N/A';
            $financialInvoice = FinancialInvoice::where('invoice_type', 'food_order')
                ->whereJsonContains('data', ['order_id' => $order->id])
                ->first();

            if ($financialInvoice) {
                $invoiceNo = $financialInvoice->invoice_no;
            }

            // Process the order_item JSON (single item object)
            $item = $orderItem->order_item;
            if ($item && is_array($item)) {
                $productId = $item['id'] ?? null;
                $itemName = $item['name'] ?? 'Unknown Item';

                // Create unique key to avoid duplicates
                $uniqueKey = $order->id . '_' . $productId . '_' . $itemName . '_' . $orderItem->id;

                // Skip if already processed
                if (!isset($processedItems[$uniqueKey])) {
                    $processedItems[$uniqueKey] = true;

                    $quantity = (float) ($item['quantity'] ?? 1);
                    $itemPrice = (float) ($item['price'] ?? 0);  // Price from order_item JSON
                    $totalPrice = (float) ($item['total_price'] ?? 0);  // Total price from order_item JSON
                    $salePrice = $itemPrice;  // Use price from order_item for SALE PRICE
                    $foodValue = $totalPrice;  // Use total_price from order_item for FOOD VALUE

                    // Get menu_code and product name from Product table
                    $menuCode = 'N/A';
                    $productName = $itemName;  // Default to order_item name

                    if ($productId) {
                        $product = Product::find($productId);
                        if ($product) {
                            $menuCode = $product->menu_code ?? 'N/A';
                            $productName = $product->name ?? $itemName;  // Use product name if available
                        }
                    }

                    $dumpItemsData[] = [
                        'invoice_kot' => $order->id,
                        'table_no' => $order->table ? $order->table->table_no : 'N/A',
                        'date' => $orderItem->created_at->format('d/m/Y'),
                        'item_code' => $menuCode,
                        'item_name' => $productName,
                        'qty' => $quantity,
                        'status' => ucfirst($orderItem->status ?? 'Cancelled'),
                        'instructions' => $orderItem->instructions ?? 'N/A',
                        'reason' => $orderItem->remark ?? 'N/A',
                        'remarks' => $this->getCancelReason($orderItem->cancelType ?? ''),
                        'sale_price' => $salePrice,
                        'food_value' => $foodValue,
                        'cancelled_by' => User::find($order->updated_by ?: ($order->created_by ?: 0))->name ?? 'N/A'
                    ];

                    $totalQuantity += $quantity;
                    $totalSalePrice += $salePrice;
                    $totalFoodValue += $foodValue;
                }
            }
        }

        return Inertia::render('App/Admin/Reports/DailyDumpItemsReportPrint', [
            'dumpItemsData' => $dumpItemsData,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'totalQuantity' => $totalQuantity,
            'totalSalePrice' => $totalSalePrice,
            'totalFoodValue' => $totalFoodValue
        ]);
    }

    private function getCancelReason($cancelType)
    {
        switch (strtolower($cancelType)) {
            case 'customer':
                return 'CANCELLED BY CUSTOMER';
            case 'guest':
                return 'GUEST MIND CHANGE';
            case 'kitchen':
                return 'KITCHEN ISSUE';
            case 'return':
                return 'Return';
            case 'void':
                return 'Void';
            default:
                return $cancelType ?: 'N/A';
        }
    }

    private function generateReportDataForTenant($tenantId, $startDate, $endDate)
    {
        // Get all orders within date range from ALL tenants (not just specific tenant)
        // We want to see all products sold that belong to this tenant
        $orders = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereIn('status', ['completed', 'paid'])
            ->get();

        // Initialize report structure
        $reportData = [];
        $totalQuantity = 0;

        // Group items by category - only include products that belong to this tenant
        foreach ($orders as $order) {
            foreach ($order->orderItems as $orderItem) {
                $items = $orderItem->order_item;
                Log::info('Items: ', $items);
                $this->processItem($items, $reportData, $totalQuantity, $tenantId);
            }
        }

        Log::info("Report data for tenant {$tenantId}:", $reportData);

        // Convert to array and sort
        $reportArray = array_values($reportData);

        // Sort categories by name
        usort($reportArray, function ($a, $b) {
            return strcmp($a['category_name'], $b['category_name']);
        });

        // Sort items within each category by quantity (descending)
        foreach ($reportArray as &$category) {
            $category['items'] = array_values($category['items']);
            usort($category['items'], function ($a, $b) {
                return $b['quantity'] - $a['quantity'];
            });
        }

        return [
            'categories' => $reportArray,
            'total_quantity' => $totalQuantity,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate
            ]
        ];
    }

    private function processItem($item, &$reportData, &$totalQuantity, $currentTenantId)
    {
        // Handle single item (not array)
        $productId = $item['id'] ?? null;
        $quantity = $item['quantity'] ?? 1;
        $categoryName = $item['category'] ?? 'Uncategorized';

        if (!$productId)
            return;

        // Get the product to check its tenant_id
        $product = Product::find($productId);

        if (!$product) {
            Log::info("Product {$productId} not found");
            return;
        }

        Log::info("Product {$product->tenant_id} vs {$currentTenantId} - checking ownership");

        // Only include products that belong to this tenant
        if ($product->tenant_id != $currentTenantId) {
            Log::info("Skipping product {$productId} - belongs to tenant {$product->tenant_id}, not {$currentTenantId}");
            return;  // Skip products from other restaurants
        }

        // Initialize category if not exists
        if (!isset($reportData[$categoryName])) {
            $reportData[$categoryName] = [
                'category_name' => $categoryName,
                'items' => [],
                'total_quantity' => 0
            ];
        }

        // Initialize item if not exists
        $itemName = $item['name'] ?? 'Unknown Item';
        if (!isset($reportData[$categoryName]['items'][$itemName])) {
            $reportData[$categoryName]['items'][$itemName] = [
                'name' => $itemName,
                'quantity' => 0,
                'product_id' => $productId,
                'menu_code' => $product->menu_code ?? 'N/A'
            ];
        }

        // Add quantity
        $reportData[$categoryName]['items'][$itemName]['quantity'] += $quantity;
        $reportData[$categoryName]['total_quantity'] += $quantity;
        $totalQuantity += $quantity;

        Log::info("Added product {$productId} ({$itemName}) to {$categoryName} - Qty: {$quantity}");
    }

    private function generateFinancialReportDataForTenant($tenantId, $startDate, $endDate, $filters = [])
    {
        $customerTypes = $this->normalizeFilterArray($filters['customer_types'] ?? null);
        $customerSearch = $this->normalizeFilterString($filters['customer_search'] ?? null);
        $waiterIds = $this->normalizeFilterIntArray($filters['waiter_ids'] ?? null);
        $cashierIds = $this->normalizeFilterIntArray($filters['cashier_ids'] ?? null);
        $tableNos = $this->normalizeFilterArray($filters['table_nos'] ?? null);
        $categoryNames = $this->normalizeFilterArray($filters['category_names'] ?? null);
        $itemSearch = $this->normalizeFilterString($filters['item_search'] ?? null);
        $discountedOnly = filter_var($filters['discounted_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $taxedOnly = filter_var($filters['taxed_only'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $paymentStatuses = $this->normalizeFilterArray($filters['payment_statuses'] ?? null);

        $ordersQuery = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->with(['orderItems', 'member', 'customer', 'employee', 'table']);

        if (!empty($waiterIds)) {
            $ordersQuery->whereIn('waiter_id', $waiterIds);
        }
        if (!empty($cashierIds)) {
            $ordersQuery->whereIn('cashier_id', $cashierIds);
        }
        if (!empty($tableNos)) {
            $ordersQuery->whereHas('table', function ($q) use ($tableNos) {
                $q->whereIn('table_no', $tableNos);
            });
        }
        if (!empty($customerTypes)) {
            $ordersQuery->where(function ($q) use ($customerTypes) {
                $hasAny = false;
                if (in_array('member', $customerTypes, true)) {
                    $q->orWhereNotNull('member_id');
                    $hasAny = true;
                }
                if (in_array('guest', $customerTypes, true) || in_array('customer', $customerTypes, true)) {
                    $q->orWhereNotNull('customer_id');
                    $hasAny = true;
                }
                if (in_array('employee', $customerTypes, true)) {
                    $q->orWhereNotNull('employee_id');
                    $hasAny = true;
                }
                if (!$hasAny) {
                    $q->whereRaw('1=0');
                }
            });
        }
        if ($customerSearch) {
            $ordersQuery->where(function ($q) use ($customerSearch) {
                $q->whereHas('member', function ($mq) use ($customerSearch) {
                    $mq->where('full_name', 'like', "%{$customerSearch}%")
                        ->orWhere('membership_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('customer', function ($cq) use ($customerSearch) {
                    $cq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('customer_no', 'like', "%{$customerSearch}%");
                })->orWhereHas('employee', function ($eq) use ($customerSearch) {
                    $eq->where('name', 'like', "%{$customerSearch}%")
                        ->orWhere('employee_id', 'like', "%{$customerSearch}%");
                });
            });
        }
        if (!empty($paymentStatuses)) {
            $ordersQuery->where(function ($q) use ($paymentStatuses) {
                $statusValues = array_map(fn ($s) => strtolower(trim((string) $s)), $paymentStatuses);
                if (in_array('paid', $statusValues, true)) {
                    $q->orWhereRaw('LOWER(COALESCE(payment_status, "")) = "paid"');
                }
                if (in_array('unpaid', $statusValues, true)) {
                    $q->orWhereRaw('LOWER(COALESCE(payment_status, "")) != "paid"');
                }
                if (in_array('advance', $statusValues, true)) {
                    $q->orWhere('down_payment', '>', 0);
                }
            });
        }

        $orders = $ordersQuery->get();

        // Initialize report structure
        $reportData = [];
        $totalQuantity = 0;
        $totalSubTotal = 0;
        $totalDiscount = 0;
        $totalTax = 0;
        $totalSale = 0;

        // Group items by category - only include products that belong to this tenant
        foreach ($orders as $order) {
            foreach ($order->orderItems as $orderItem) {
                $item = $orderItem->order_item;
                $this->processFinancialItem(
                    $item,
                    $reportData,
                    $totalQuantity,
                    $totalSubTotal,
                    $totalDiscount,
                    $totalTax,
                    $totalSale,
                    $tenantId,
                    (float) ($order->tax ?? 0),
                    [
                        'discounted_only' => $discountedOnly,
                        'taxed_only' => $taxedOnly,
                        'category_names' => $categoryNames,
                        'item_search' => $itemSearch,
                    ],
                );
            }
        }

        // Convert to array format and sort
        $categories = [];
        foreach ($reportData as $categoryData) {
            // Convert items object to array and sort by quantity (descending)
            $itemsArray = array_values($categoryData['items']);
            usort($itemsArray, function ($a, $b) {
                return $b['quantity'] <=> $a['quantity'];
            });

            $categoryData['items'] = $itemsArray;
            $categories[] = $categoryData;
        }

        // Sort categories alphabetically
        usort($categories, function ($a, $b) {
            return strcmp($a['category_name'], $b['category_name']);
        });

        return [
            'categories' => $categories,
            'total_quantity' => $totalQuantity,
            'total_sub_total' => $totalSubTotal,
            'total_discount' => $totalDiscount,
            'total_tax' => $totalTax,
            'total_sale' => $totalSale
        ];
    }

    private function processFinancialItem($item, &$reportData, &$totalQuantity, &$totalSubTotal, &$totalDiscount, &$totalTax, &$totalSale, $currentTenantId, $orderTaxRate = 0, $itemFilters = [])
    {
        $itemId = $item['id'] ?? null;
        $quantity = (float) ($item['quantity'] ?? 1);
        $price = (float) ($item['price'] ?? 0);
        $itemTenantId = $item['tenant_id'] ?? null;
        $categoryName = $item['category'] ?? 'Unknown Category';
        $itemName = $item['name'] ?? 'Unknown Item';

        // Only include items that belong to this tenant
        if ($itemTenantId != $currentTenantId) {
            return;
        }

        $categoryNames = $itemFilters['category_names'] ?? [];
        if (!empty($categoryNames) && !in_array($categoryName, $categoryNames, true)) {
            return;
        }

        $itemSearch = $itemFilters['item_search'] ?? null;
        if ($itemSearch) {
            $haystack = strtolower(trim((string) ($itemName . ' ' . ($item['menu_code'] ?? '') . ' ' . ($item['id'] ?? ''))));
            if (!str_contains($haystack, strtolower($itemSearch))) {
                return;
            }
        }

        $subTotal = $price * $quantity;
        if ($subTotal <= 0) {
            return;
        }

        $itemDiscount = (float) ($item['discount_amount'] ?? 0);
        if ($itemDiscount < 0) {
            $itemDiscount = 0;
        }
        if ($itemDiscount > $subTotal) {
            $itemDiscount = $subTotal;
        }

        $discountedOnly = (bool) ($itemFilters['discounted_only'] ?? false);
        if ($discountedOnly && $itemDiscount <= 0) {
            return;
        }

        $taxRate = (float) $orderTaxRate;
        if ($taxRate > 1) {
            $taxRate = $taxRate / 100;
        }
        $isTaxable = (bool) ($item['is_taxable'] ?? false);
        $taxableNet = $isTaxable ? max(0, $subTotal - $itemDiscount) : 0;
        $itemTax = $taxableNet > 0 ? round($taxableNet * $taxRate) : 0;

        $taxedOnly = (bool) ($itemFilters['taxed_only'] ?? false);
        if ($taxedOnly && $itemTax <= 0) {
            return;
        }

        $totalItemSale = ($subTotal - $itemDiscount) + $itemTax;

        $menuCode = (string) ($item['menu_code'] ?? 'N/A');

        // Initialize category if not exists
        if (!isset($reportData[$categoryName])) {
            $reportData[$categoryName] = [
                'category_name' => $categoryName,
                'items' => [],
                'total_quantity' => 0,
                'total_sub_total' => 0,
                'total_discount' => 0,
                'total_tax' => 0,
                'total_sale' => 0
            ];
        }

        // Initialize item if not exists
        if (!isset($reportData[$categoryName]['items'][$itemName])) {
            $reportData[$categoryName]['items'][$itemName] = [
                'name' => $itemName,
                'quantity' => 0,
                'price' => $price,
                'sub_total' => 0,
                'discount' => 0,
                'tax' => 0,
                'total_sale' => 0,
                'menu_code' => $menuCode
            ];
        }

        // Add values
        $reportData[$categoryName]['items'][$itemName]['quantity'] += $quantity;
        $reportData[$categoryName]['items'][$itemName]['sub_total'] += $subTotal;
        $reportData[$categoryName]['items'][$itemName]['discount'] += $itemDiscount;
        $reportData[$categoryName]['items'][$itemName]['tax'] += $itemTax;
        $reportData[$categoryName]['items'][$itemName]['total_sale'] += $totalItemSale;

        // Update category totals
        $reportData[$categoryName]['total_quantity'] += $quantity;
        $reportData[$categoryName]['total_sub_total'] += $subTotal;
        $reportData[$categoryName]['total_discount'] += $itemDiscount;
        $reportData[$categoryName]['total_tax'] += $itemTax;
        $reportData[$categoryName]['total_sale'] += $totalItemSale;

        // Update grand totals
        $totalQuantity += $quantity;
        $totalSubTotal += $subTotal;
        $totalDiscount += $itemDiscount;
        $totalTax += $itemTax;
        $totalSale += $totalItemSale;
    }

    private function buildDishBreakdownData($startDate, $endDate, $tenantIds = [], $categoryNames = [], $itemSearch = null)
    {
        $ordersQuery = Order::whereBetween('start_date', [$startDate, $endDate])
            ->whereNotIn('status', ['saved', 'cancelled'])
            ->with(['orderItems']);

        if (!empty($tenantIds)) {
            $ordersQuery->whereIn('tenant_id', $tenantIds);
        }

        $orders = $ordersQuery->get();

        $productIds = [];
        foreach ($orders as $order) {
            foreach ($order->orderItems as $oi) {
                $pid = $oi->order_item['id'] ?? null;
                if ($pid) {
                    $productIds[] = (int) $pid;
                }
            }
        }
        $productIds = array_values(array_unique(array_filter($productIds)));
        $menuCodesByProductId = !empty($productIds)
            ? Product::whereIn('id', $productIds)->pluck('menu_code', 'id')->toArray()
            : [];

        $rows = [];
        foreach ($orders as $order) {
            $taxRate = (float) ($order->tax ?? 0);
            if ($taxRate > 1) {
                $taxRate = $taxRate / 100;
            }
            foreach ($order->orderItems as $oi) {
                $item = $oi->order_item ?? [];
                if (!is_array($item)) {
                    continue;
                }
                $category = (string) ($item['category'] ?? '');
                if (!empty($categoryNames) && !in_array($category, $categoryNames, true)) {
                    continue;
                }

                $pid = (int) ($item['id'] ?? 0);
                $menuCode = (string) ($item['menu_code'] ?? ($menuCodesByProductId[$pid] ?? 'N/A'));
                $name = (string) ($item['name'] ?? 'Unknown Item');

                if ($itemSearch) {
                    $haystack = strtolower(trim($name . ' ' . $menuCode . ' ' . $pid));
                    if (!str_contains($haystack, strtolower($itemSearch))) {
                        continue;
                    }
                }

                $qty = (float) ($item['quantity'] ?? 0);
                if ($qty <= 0) {
                    continue;
                }
                $price = (float) ($item['price'] ?? 0);
                $subTotal = $price * $qty;
                if ($subTotal <= 0) {
                    continue;
                }

                $discount = (float) ($item['discount_amount'] ?? 0);
                if ($discount < 0) {
                    $discount = 0;
                }
                if ($discount > $subTotal) {
                    $discount = $subTotal;
                }

                $isTaxable = (bool) ($item['is_taxable'] ?? false);
                $taxableNet = $isTaxable ? max(0, $subTotal - $discount) : 0;
                $tax = $taxableNet > 0 ? round($taxableNet * $taxRate) : 0;

                $totalSale = ($subTotal - $discount) + $tax;

                $key = $menuCode . '|' . $pid . '|' . $name;
                if (!isset($rows[$key])) {
                    $rows[$key] = [
                        'code' => $menuCode,
                        'name' => $name,
                        'qty' => 0,
                        'sub_total' => 0,
                        'discount' => 0,
                        'tax' => 0,
                        'total_sale' => 0,
                    ];
                }
                $rows[$key]['qty'] += $qty;
                $rows[$key]['sub_total'] += $subTotal;
                $rows[$key]['discount'] += $discount;
                $rows[$key]['tax'] += $tax;
                $rows[$key]['total_sale'] += $totalSale;
            }
        }

        return array_values($rows);
    }

    private function normalizeFilterString($value)
    {
        $s = is_string($value) ? trim($value) : '';
        return $s !== '' ? $s : null;
    }

    private function normalizeFilterArray($value)
    {
        if (is_array($value)) {
            return array_values(array_filter(array_map(function ($v) {
                return is_string($v) ? trim($v) : (is_numeric($v) ? (string) $v : '');
            }, $value), fn ($v) => $v !== ''));
        }
        if (is_string($value)) {
            $parts = array_map('trim', explode(',', $value));
            return array_values(array_filter($parts, fn ($v) => $v !== ''));
        }
        return [];
    }

    private function normalizeFilterIntArray($value)
    {
        $arr = $this->normalizeFilterArray($value);
        $ints = [];
        foreach ($arr as $v) {
            if (is_numeric($v)) {
                $ints[] = (int) $v;
            }
        }
        return array_values(array_filter($ints, fn ($v) => $v > 0));
    }
}
