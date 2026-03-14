<?php

namespace App\Http\Controllers;

use App\Models\FinancialInvoice;
use App\Models\GuestType;
use App\Models\Member;
use App\Models\MemberCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MemberFeeRevenueController extends Controller
{
    private function parseDateToYmd(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $value = trim((string) $value);
        if ($value === '') {
            return null;
        }

        $formats = ['d-m-Y', 'm-d-Y', 'Y-m-d', 'd/m/Y', 'm/d/Y'];

        foreach ($formats as $format) {
            try {
                return \Carbon\Carbon::createFromFormat($format, $value)->format('Y-m-d');
            } catch (\Exception $e) {
            }
        }

        return null;
    }

    public function maintenanceFeeRevenue(Request $request)
    {
        return Inertia::render('App/Admin/Membership/MaintenanceFeeRevenue', [
            'categories' => [],
            'statistics' => null,
            'filters' => [
                'status' => $request->input('status') ?? [],
                'categories' => $request->input('categories') ?? [],
                'date_from' => $request->input('date_from'),
                'date_to' => $request->input('date_to'),
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
        ]);
    }

    public function maintenanceFeeRevenueData(Request $request)
    {
        $statusFilter = $request->input('status');
        $categoryFilter = $request->input('categories');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $payload = $this->buildMaintenanceFeeRevenueData(
            $statusFilter,
            $categoryFilter,
            $this->parseDateToYmd($dateFrom),
            $this->parseDateToYmd($dateTo)
        );

        return response()->json($payload);
    }

    public function maintenanceFeeRevenuePrint(Request $request)
    {
        $statusFilter = $request->input('status');
        $categoryFilter = $request->input('categories');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');

        $payload = $this->buildMaintenanceFeeRevenueData(
            $statusFilter,
            $categoryFilter,
            $this->parseDateToYmd($dateFrom),
            $this->parseDateToYmd($dateTo)
        );

        return Inertia::render('App/Admin/Membership/MaintenanceFeeRevenuePrint', [
            'categories' => $payload['categories'],
            'statistics' => $payload['statistics'],
            'filters' => [
                'status' => $statusFilter ?? [],
                'categories' => $categoryFilter ?? [],
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
        ]);
    }

    private function buildMaintenanceFeeRevenueData($statusFilter, $categoryFilter, ?string $dateFromParsed, ?string $dateToParsed): array
    {
        $categoriesQuery = MemberCategory::query()
            ->select('id', 'name', 'description')
            ->when($categoryFilter, function ($q) use ($categoryFilter) {
                $q->whereIn('id', (array) $categoryFilter);
            })
            ->orderBy('name');

        $categoriesList = $categoriesQuery->get();
        $categoryIds = $categoriesList->pluck('id')->values();

        $membersBase = DB::table('members')
            ->whereNull('deleted_at')
            ->when($categoryIds->isNotEmpty(), function ($q) use ($categoryIds) {
                $q->whereIn('member_category_id', $categoryIds);
            })
            ->when($statusFilter, function ($q) use ($statusFilter) {
                $q->whereIn('status', (array) $statusFilter);
            });

        $totalMembersByCategory = (clone $membersBase)
            ->select('member_category_id', DB::raw('COUNT(*) as total_members'))
            ->groupBy('member_category_id')
            ->pluck('total_members', 'member_category_id');

        $invoicePaidAt = DB::table('financial_invoices')
            ->leftJoin('transactions as t', function ($join) {
                $join
                    ->on('financial_invoices.id', '=', 't.invoice_id')
                    ->where('t.type', '=', 'credit');
            })
            ->where('financial_invoices.status', 'paid')
            ->groupBy('financial_invoices.id', 'financial_invoices.member_id', 'financial_invoices.payment_date')
            ->select(
                'financial_invoices.id as invoice_id',
                'financial_invoices.member_id',
                DB::raw('COALESCE(financial_invoices.payment_date, MAX(t.date)) as paid_at')
            );

        $revenueAgg = DB::table('financial_invoice_items as fii')
            ->joinSub($invoicePaidAt, 'ip', function ($join) {
                $join->on('fii.invoice_id', '=', 'ip.invoice_id');
            })
            ->join('members as m', 'ip.member_id', '=', 'm.id')
            ->whereNull('fii.deleted_at')
            ->whereNull('m.deleted_at')
            ->where('fii.fee_type', '4')
            ->when($categoryIds->isNotEmpty(), function ($q) use ($categoryIds) {
                $q->whereIn('m.member_category_id', $categoryIds);
            })
            ->when($statusFilter, function ($q) use ($statusFilter) {
                $q->whereIn('m.status', (array) $statusFilter);
            })
            ->when($dateFromParsed, function ($q) use ($dateFromParsed) {
                $q->whereDate('ip.paid_at', '>=', $dateFromParsed);
            })
            ->when($dateToParsed, function ($q) use ($dateToParsed) {
                $q->whereDate('ip.paid_at', '<=', $dateToParsed);
            })
            ->groupBy('m.member_category_id')
            ->select(
                'm.member_category_id',
                DB::raw('SUM(COALESCE(fii.total, 0)) as total_maintenance_fee'),
                DB::raw('COUNT(DISTINCT ip.member_id) as members_with_maintenance')
            )
            ->get()
            ->keyBy('member_category_id');

        $rows = $categoriesList->map(function ($category) use ($totalMembersByCategory, $revenueAgg) {
            $agg = $revenueAgg->get($category->id);
            $totalMaintenance = (float) ($agg->total_maintenance_fee ?? 0);
            $membersWithMaintenance = (int) ($agg->members_with_maintenance ?? 0);
            $totalMembers = (int) ($totalMembersByCategory[$category->id] ?? 0);

            return [
                'id' => $category->id,
                'name' => $category->name,
                'code' => $category->code ?? $category->description,
                'total_members' => $totalMembers,
                'members_with_maintenance' => $membersWithMaintenance,
                'total_maintenance_fee' => $totalMaintenance,
                'average_fee_per_member' => $membersWithMaintenance > 0 ? round($totalMaintenance / $membersWithMaintenance, 2) : 0,
            ];
        })->values();

        $totalMembers = $rows->sum('total_members');
        $totalMembersWithMaintenance = $rows->sum('members_with_maintenance');
        $totalMaintenanceRevenue = $rows->sum('total_maintenance_fee');

        return [
            'categories' => $rows,
            'statistics' => [
                'total_members' => $totalMembers,
                'total_members_with_maintenance' => $totalMembersWithMaintenance,
                'total_maintenance_revenue' => $totalMaintenanceRevenue,
                'average_revenue_per_member' => $totalMembersWithMaintenance > 0 ? round($totalMaintenanceRevenue / $totalMembersWithMaintenance, 2) : 0,
            ],
        ];
    }

    public function pendingMaintenanceReport(Request $request)
    {
        $statusFilter = array_values(array_filter((array) ($request->input('status') ?? [])));
        if (empty($statusFilter)) {
            $statusFilter = ['active'];
        }
        $categoryFilter = $request->input('categories') ?? [];
        $untilDate = $this->parseDateToYmd($request->input('date')) ?: now()->format('Y-m-d');
        $quartersFilter = (string) ($request->input('quarters_pending') ?? '');
        if ($quartersFilter === '') {
            $quartersFilter = '1';
        }

        return Inertia::render('App/Admin/Membership/PendingMaintenanceReport', [
            'members' => null,
            'statistics' => null,
            'filters' => [
                'member_search' => $request->input('member_search') ?? '',
                'member_id' => $request->input('member_id') ?? '',
                'name_search' => $request->input('name_search') ?? '',
                'membership_no_search' => $request->input('membership_no_search') ?? '',
                'cnic_search' => $request->input('cnic_search') ?? '',
                'contact_search' => $request->input('contact_search') ?? '',
                'status' => $statusFilter,
                'categories' => $categoryFilter,
                'quarters_pending' => $quartersFilter,
                'per_page' => $request->input('per_page', 15),
                'date' => $untilDate,
            ],
            'all_statuses' => Member::distinct()->pluck('status')->filter()->values(),
            'all_categories' => MemberCategory::select('id', 'name')->get(),
        ]);
    }

    public function pendingMaintenanceReportData(Request $request)
    {
        $statusFilter = array_values(array_filter((array) ($request->input('status') ?? [])));
        if (empty($statusFilter)) {
            $statusFilter = ['active'];
        }
        $categoryFilter = $request->input('categories');
        $untilDate = $this->parseDateToYmd($request->input('date')) ?: now()->format('Y-m-d');
        $memberSearch = $request->input('member_search');
        $memberId = $request->input('member_id');
        $cnicSearch = $request->input('cnic_search');
        $contactSearch = $request->input('contact_search');
        $quartersFilter = (string) ($request->input('quarters_pending') ?? '');
        if ($quartersFilter === '') {
            $quartersFilter = '1';
        }
        $perPage = $request->input('per_page', 15);

        $latestMaintenance = \App\Models\FinancialInvoiceItem::select(
            'financial_invoices.member_id',
            \Illuminate\Support\Facades\DB::raw('MAX(financial_invoice_items.end_date) as last_valid_date'),
            \Illuminate\Support\Facades\DB::raw('MAX(transactions.date) as last_payment_date')
        )
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->leftJoin('transactions', function ($join) {
                $join
                    ->on('financial_invoices.id', '=', 'transactions.invoice_id')
                    ->where('transactions.type', 'credit');
            })
            ->where('financial_invoice_items.fee_type', '4')
            ->where('financial_invoices.status', 'paid')
            ->groupBy('financial_invoices.member_id');

        $maintenanceLedger = DB::table('transactions')
            ->join('financial_invoices', 'transactions.invoice_id', '=', 'financial_invoices.id')
            ->join('financial_invoice_items', function ($join) {
                $join
                    ->on('transactions.reference_id', '=', 'financial_invoice_items.id')
                    ->where('transactions.reference_type', '=', \App\Models\FinancialInvoiceItem::class);
            })
            ->whereNull('transactions.deleted_at')
            ->whereNull('financial_invoice_items.deleted_at')
            ->where('financial_invoice_items.fee_type', '4')
            ->whereNotIn('financial_invoices.status', ['cancelled', 'refunded'])
            ->groupBy('financial_invoices.member_id')
            ->select(
                'financial_invoices.member_id',
                DB::raw("SUM(CASE WHEN transactions.type = 'debit' THEN transactions.amount ELSE 0 END) as maintenance_debit"),
                DB::raw("SUM(CASE WHEN transactions.type = 'credit' THEN transactions.amount ELSE 0 END) as maintenance_credit")
            );

        $maintenanceDiscounts = DB::table('financial_invoice_items')
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->whereNull('financial_invoice_items.deleted_at')
            ->where('financial_invoice_items.fee_type', '4')
            ->whereNotIn('financial_invoices.status', ['cancelled', 'refunded'])
            ->groupBy('financial_invoices.member_id')
            ->select(
                'financial_invoices.member_id',
                DB::raw('SUM(COALESCE(financial_invoice_items.discount_amount, 0)) as maintenance_discount')
            );

        $query = Member::with(['memberCategory:id,name,description,subscription_fee'])
            ->leftJoinSub($latestMaintenance, 'latest_maintenance', function ($join) {
                $join->on('members.id', '=', 'latest_maintenance.member_id');
            })
            ->leftJoinSub($maintenanceLedger, 'maintenance_ledger', function ($join) {
                $join->on('members.id', '=', 'maintenance_ledger.member_id');
            })
            ->leftJoinSub($maintenanceDiscounts, 'maintenance_discounts', function ($join) {
                $join->on('members.id', '=', 'maintenance_discounts.member_id');
            })
            ->whereNull('parent_id')
            ->select(
                'members.*',
                'latest_maintenance.last_valid_date',
                'latest_maintenance.last_payment_date',
                'maintenance_ledger.maintenance_debit',
                'maintenance_ledger.maintenance_credit',
                'maintenance_discounts.maintenance_discount'
            );

        if ($categoryFilter) {
            $query->whereIn('member_category_id', (array) $categoryFilter);
        }

        $query->whereIn('status', $statusFilter);

        $nameSearch = $request->input('name_search');
        $noSearch = $request->input('membership_no_search');
        $memberIds = $request->input('member_ids');
        if ($memberIds) {
            $query->whereIn('members.id', (array) $memberIds);
        }

        if ($memberId) {
            $query->where('members.id', $memberId);
        } elseif ($memberSearch) {
            $query->where(function ($q) use ($memberSearch) {
                $q
                    ->where('full_name', 'like', "%{$memberSearch}%")
                    ->orWhere('membership_no', 'like', "%{$memberSearch}%");
            });
        }

        if ($nameSearch) {
            $query->where('full_name', 'like', "%{$nameSearch}%");
        }

        if ($noSearch) {
            $query->where('membership_no', 'like', "%{$noSearch}%");
        }

        if ($cnicSearch) {
            $query->where('cnic_no', 'like', "%{$cnicSearch}%");
        }

        if ($contactSearch) {
            $query->where(function ($q) use ($contactSearch) {
                $q
                    ->where('mobile_number_a', 'like', "%{$contactSearch}%")
                    ->orWhere('mobile_number_b', 'like', "%{$contactSearch}%")
                    ->orWhere('mobile_number_c', 'like', "%{$contactSearch}%");
            });
        }

        $query->where(function ($q) use ($untilDate) {
            $q
                ->whereNull('latest_maintenance.last_valid_date')
                ->orWhereDate('latest_maintenance.last_valid_date', '<=', $untilDate);
        });

        $currentDate = \Carbon\Carbon::parse($untilDate)->format('Y-m-d');
        $query->selectRaw("
            CASE
                WHEN DATE(COALESCE(latest_maintenance.last_valid_date, members.membership_date, members.created_at)) >= '$currentDate' THEN 0
                ELSE FLOOR(
                    GREATEST(0, TIMESTAMPDIFF(MONTH,
                        COALESCE(latest_maintenance.last_valid_date, members.membership_date, members.created_at),
                        '$currentDate'
                    )) / 3
                ) + 1
            END as pending_quarters_calc
        ");

        $query->having('pending_quarters_calc', '>', 0);

        if ($quartersFilter === '6+') {
            $query->having('pending_quarters_calc', '>=', 6);
        } else {
            $query->having('pending_quarters_calc', '=', (int) $quartersFilter);
        }

        if ($perPage === 'all') {
            $collection = $query->get();
            $mapped = $collection->map(function ($member) {
                $monthlyFee = (float) ($member->total_maintenance_fee ?? 0);
                if ($monthlyFee <= 0) {
                    $monthlyFee = (float) ($member->maintenance_fee ?? 0);
                }
                if ($monthlyFee <= 0 && $member->memberCategory) {
                    $monthlyFee = (float) ($member->memberCategory->subscription_fee ?? 0);
                }
                $pendingQuarters = (int) ($member->pending_quarters_calc ?? 0);
                $quarterlyFee = $monthlyFee * 3;
                $totalPendingAmount = $quarterlyFee * $pendingQuarters;

                $discount = (float) ($member->maintenance_discount ?? 0);
                $debit = (float) ($member->maintenance_debit ?? 0);
                $credit = (float) ($member->maintenance_credit ?? 0);
                $balance = $debit - $credit;

                return [
                    'id' => $member->id,
                    'membership_no' => $member->membership_no,
                    'full_name' => $member->full_name,
                    'contact' => $member->mobile_number_a,
                    'address' => $member->current_address,
                    'cnic' => $member->cnic_no,
                    'status' => $member->status,
                    'last_payment_date' => $member->last_payment_date,
                    'paid_until_date' => $member->last_valid_date,
                    'pending_quarters' => $pendingQuarters,
                    'monthly_fee' => $monthlyFee,
                    'quarterly_fee' => $quarterlyFee,
                    'discount' => $discount,
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance' => $balance,
                    'total_pending_amount' => $totalPendingAmount,
                    'category' => $member->memberCategory ? $member->memberCategory->name : '',
                ];
            });

            $members = new \Illuminate\Pagination\LengthAwarePaginator(
                $mapped,
                $mapped->count(),
                max(1, $mapped->count()),
                1,
                [
                    'path' => \Illuminate\Pagination\Paginator::resolveCurrentPath(),
                    'query' => $request->query(),
                ]
            );
        } else {
            $perPageInt = max(1, (int) $perPage);
            $members = $query->paginate($perPageInt)->withQueryString();
            $members->getCollection()->transform(function ($member) {
                $monthlyFee = (float) ($member->total_maintenance_fee ?? 0);
                if ($monthlyFee <= 0) {
                    $monthlyFee = (float) ($member->maintenance_fee ?? 0);
                }
                if ($monthlyFee <= 0 && $member->memberCategory) {
                    $monthlyFee = (float) ($member->memberCategory->subscription_fee ?? 0);
                }
                $pendingQuarters = (int) ($member->pending_quarters_calc ?? 0);
                $quarterlyFee = $monthlyFee * 3;
                $totalPendingAmount = $quarterlyFee * $pendingQuarters;

                $discount = (float) ($member->maintenance_discount ?? 0);
                $debit = (float) ($member->maintenance_debit ?? 0);
                $credit = (float) ($member->maintenance_credit ?? 0);
                $balance = $debit - $credit;

                return [
                    'id' => $member->id,
                    'membership_no' => $member->membership_no,
                    'full_name' => $member->full_name,
                    'contact' => $member->mobile_number_a,
                    'address' => $member->current_address,
                    'cnic' => $member->cnic_no,
                    'status' => $member->status,
                    'last_payment_date' => $member->last_payment_date,
                    'paid_until_date' => $member->last_valid_date,
                    'pending_quarters' => $pendingQuarters,
                    'monthly_fee' => $monthlyFee,
                    'quarterly_fee' => $quarterlyFee,
                    'discount' => $discount,
                    'debit' => $debit,
                    'credit' => $credit,
                    'balance' => $balance,
                    'total_pending_amount' => $totalPendingAmount,
                    'category' => $member->memberCategory ? $member->memberCategory->name : '',
                ];
            });
        }

        $rows = collect($members->items());
        $statistics = [
            'total_members' => $members->total(),
            'total_pending_amount' => $rows->sum('total_pending_amount'),
            'total_discount' => $rows->sum('discount'),
            'total_debit' => $rows->sum('debit'),
            'total_credit' => $rows->sum('credit'),
            'total_balance' => $rows->sum('balance'),
        ];

        return response()->json([
            'members' => $members,
            'statistics' => $statistics,
        ]);
    }

    public function pendingMaintenanceReportInvoice(Request $request)
    {
        $request->validate([
            'member_id' => 'required|integer|exists:members,id',
            'pending_quarters' => 'required|integer|min:1',
            'date' => 'nullable|string',
        ]);

        $untilDate = $this->parseDateToYmd($request->input('date')) ?: now()->format('Y-m-d');
        $pendingQuarters = (int) $request->input('pending_quarters');

        $member = Member::whereNull('parent_id')->findOrFail((int) $request->input('member_id'));

        $monthlyFee = (float) ($member->total_maintenance_fee ?? 0);
        if ($monthlyFee <= 0) {
            $monthlyFee = (float) ($member->maintenance_fee ?? 0);
        }
        if ($monthlyFee <= 0) {
            $category = $member->memberCategory()->select('id', 'subscription_fee')->first();
            $monthlyFee = (float) ($category?->subscription_fee ?? 0);
        }

        $quarterlyFee = $monthlyFee * 3;
        $amount = $quarterlyFee * $pendingQuarters;

        if ($amount <= 0) {
            return response()->json(['error' => 'Maintenance fee is not set for this member'], 422);
        }

        $baseStart = null;
        $lastPaidItem = \App\Models\FinancialInvoiceItem::query()
            ->select('financial_invoice_items.end_date')
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->where('financial_invoice_items.fee_type', '4')
            ->where('financial_invoices.member_id', $member->id)
            ->where('financial_invoices.status', 'paid')
            ->orderByDesc('financial_invoice_items.end_date')
            ->first();

        if ($lastPaidItem && !empty($lastPaidItem->end_date)) {
            $baseStart = \Carbon\Carbon::parse($lastPaidItem->end_date)->addDay();
        } elseif (!empty($member->membership_date)) {
            $baseStart = \Carbon\Carbon::parse($member->membership_date);
        } else {
            $baseStart = \Carbon\Carbon::parse($member->created_at);
        }

        $issueDate = \Carbon\Carbon::parse($untilDate)->format('Y-m-d');
        $batchKey = 'pm_batch:' . $member->id . ':' . $issueDate . ':' . $baseStart->toDateString() . ':' . $pendingQuarters;

        $invoices = [];
        for ($i = 0; $i < $pendingQuarters; $i++) {
            $startDate = $baseStart->copy()->addMonths($i * 3)->startOfDay();
            $endDate = $startDate->copy()->addMonths(3)->subDay()->startOfDay();

            $inv = $this->ensurePendingMaintenanceQuarterInvoice($member, $startDate, $endDate, $untilDate, $quarterlyFee, $batchKey);
            if ($inv) {
                $invoices[] = $inv;
            }
        }

        $invoice = $invoices[0] ?? null;

        if (!$invoice) {
            return response()->json(['error' => 'Unable to generate invoice'], 422);
        }

        return response()->json([
            'invoice_id' => $invoice->id,
            'invoice_no' => $invoice->invoice_no,
        ]);
    }

    public function pendingMaintenanceReportPrint(Request $request)
    {
        $statusFilter = array_values(array_filter((array) ($request->input('status') ?? [])));
        if (empty($statusFilter)) {
            $statusFilter = ['active'];
        }
        $categoryFilter = $request->input('categories');

        $untilDate = $this->parseDateToYmd($request->input('date')) ?: now()->format('Y-m-d');

        $memberSearch = $request->input('member_search');
        $memberId = $request->input('member_id');
        $cnicSearch = $request->input('cnic_search');
        $contactSearch = $request->input('contact_search');
        $quartersFilter = (string) ($request->input('quarters_pending') ?? '');
        if ($quartersFilter === '') {
            $quartersFilter = '1';
        }

        // Subquery to get the latest valid_to date for maintenance fees per member
        // Subquery to get the latest valid_to date for maintenance fees per member using Items
        $latestMaintenance = \App\Models\FinancialInvoiceItem::select(
            'financial_invoices.member_id',
            \Illuminate\Support\Facades\DB::raw('MAX(financial_invoice_items.end_date) as last_valid_date'),
            \Illuminate\Support\Facades\DB::raw('MAX(transactions.date) as last_payment_date')
        )
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->leftJoin('transactions', function ($join) {
                $join
                    ->on('financial_invoices.id', '=', 'transactions.invoice_id')
                    ->where('transactions.type', 'credit');
            })
            ->where('financial_invoice_items.fee_type', '4')
            ->where('financial_invoices.status', 'paid')
            ->groupBy('financial_invoices.member_id');

        $maintenanceLedger = DB::table('transactions')
            ->join('financial_invoices', 'transactions.invoice_id', '=', 'financial_invoices.id')
            ->join('financial_invoice_items', function ($join) {
                $join
                    ->on('transactions.reference_id', '=', 'financial_invoice_items.id')
                    ->where('transactions.reference_type', '=', \App\Models\FinancialInvoiceItem::class);
            })
            ->whereNull('transactions.deleted_at')
            ->whereNull('financial_invoice_items.deleted_at')
            ->where('financial_invoice_items.fee_type', '4')
            ->whereNotIn('financial_invoices.status', ['cancelled', 'refunded'])
            ->groupBy('financial_invoices.member_id')
            ->select(
                'financial_invoices.member_id',
                DB::raw("SUM(CASE WHEN transactions.type = 'debit' THEN transactions.amount ELSE 0 END) as maintenance_debit"),
                DB::raw("SUM(CASE WHEN transactions.type = 'credit' THEN transactions.amount ELSE 0 END) as maintenance_credit")
            );

        $maintenanceDiscounts = DB::table('financial_invoice_items')
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->whereNull('financial_invoice_items.deleted_at')
            ->where('financial_invoice_items.fee_type', '4')
            ->whereNotIn('financial_invoices.status', ['cancelled', 'refunded'])
            ->groupBy('financial_invoices.member_id')
            ->select(
                'financial_invoices.member_id',
                DB::raw('SUM(COALESCE(financial_invoice_items.discount_amount, 0)) as maintenance_discount')
            );

        // Main Query
        $query = Member::with(['memberCategory:id,name,description,subscription_fee'])
            ->leftJoinSub($latestMaintenance, 'latest_maintenance', function ($join) {
                $join->on('members.id', '=', 'latest_maintenance.member_id');
            })
            ->leftJoinSub($maintenanceLedger, 'maintenance_ledger', function ($join) {
                $join->on('members.id', '=', 'maintenance_ledger.member_id');
            })
            ->leftJoinSub($maintenanceDiscounts, 'maintenance_discounts', function ($join) {
                $join->on('members.id', '=', 'maintenance_discounts.member_id');
            })
            ->whereNull('parent_id')
            ->select(
                'members.*',
                'latest_maintenance.last_valid_date',
                'latest_maintenance.last_payment_date',
                'maintenance_ledger.maintenance_debit',
                'maintenance_ledger.maintenance_credit',
                'maintenance_discounts.maintenance_discount'
            );

        // Apply member category filter
        if ($categoryFilter) {
            $query->whereIn('member_category_id', (array) $categoryFilter);
        }

        // Apply status filter
        if ($statusFilter) {
            $query->whereIn('status', (array) $statusFilter);
        }

        // Apply search filters
        $nameSearch = $request->input('name_search');
        $noSearch = $request->input('membership_no_search');
        $memberIds = $request->input('member_ids');
        if ($memberIds) {
            $query->whereIn('members.id', (array) $memberIds);
        }

        if ($memberId) {
            $query->where('members.id', $memberId);
        } elseif ($memberSearch) {
            $query->where(function ($q) use ($memberSearch) {
                $q
                    ->where('full_name', 'like', "%{$memberSearch}%")
                    ->orWhere('membership_no', 'like', "%{$memberSearch}%");
            });
        }

        if ($nameSearch) {
            $query->where('full_name', 'like', "%{$nameSearch}%");
        }

        if ($noSearch) {
            $query->where('membership_no', 'like', "%{$noSearch}%");
        }

        if ($cnicSearch) {
            $query->where('cnic_no', 'like', "%{$cnicSearch}%");
        }

        if ($contactSearch) {
            $query->where(function ($q) use ($contactSearch) {
                $q
                    ->where('mobile_number_a', 'like', "%{$contactSearch}%")
                    ->orWhere('mobile_number_b', 'like', "%{$contactSearch}%")
                    ->orWhere('mobile_number_c', 'like', "%{$contactSearch}%");
            });
        }

        $query->where(function ($q) use ($untilDate) {
            $q
                ->whereNull('latest_maintenance.last_valid_date')
                ->orWhereDate('latest_maintenance.last_valid_date', '<=', $untilDate);
        });

        $currentDate = \Carbon\Carbon::parse($untilDate)->format('Y-m-d');
        $query->selectRaw("
            CASE
                WHEN DATE(COALESCE(latest_maintenance.last_valid_date, members.membership_date, members.created_at)) >= '$currentDate' THEN 0
                ELSE FLOOR(
                    GREATEST(0, TIMESTAMPDIFF(MONTH,
                        COALESCE(latest_maintenance.last_valid_date, members.membership_date, members.created_at),
                        '$currentDate'
                    )) / 3
                ) + 1
            END as pending_quarters_calc
        ");
        $query->having('pending_quarters_calc', '>', 0);
        if ($quartersFilter === '6+') {
            $query->having('pending_quarters_calc', '>=', 6);
        } else {
            $query->having('pending_quarters_calc', '=', (int) $quartersFilter);
        }

        $members = $query->get();

        $printRows = $members->map(function ($member) use ($untilDate) {
            $monthlyFee = (float) ($member->total_maintenance_fee ?? 0);
            if ($monthlyFee <= 0) {
                $monthlyFee = (float) ($member->maintenance_fee ?? 0);
            }
            if ($monthlyFee <= 0 && $member->memberCategory) {
                $monthlyFee = (float) ($member->memberCategory->subscription_fee ?? 0);
            }
            $pendingQuarters = (int) ($member->pending_quarters_calc ?? 0);
            $quarterlyFee = $monthlyFee * 3;
            $pendingAmount = $quarterlyFee * $pendingQuarters;

            $discount = (float) ($member->maintenance_discount ?? 0);
            $debit = (float) ($member->maintenance_debit ?? 0);
            $credit = (float) ($member->maintenance_credit ?? 0);
            $balance = $debit - $credit;

            $invoice = $this->ensurePendingMaintenanceInvoice($member, $pendingQuarters, $untilDate, $pendingAmount);

            return [
                'id' => $member->id,
                'membership_no' => $member->membership_no,
                'membership_date' => $member->membership_date,
                'full_name' => $member->full_name,
                'contact' => $member->mobile_number_a,
                'cnic' => $member->cnic_no,
                'address' => $member->current_address,
                'category' => $member->memberCategory ? $member->memberCategory->name : 'N/A',
                'monthly_fee' => $monthlyFee,
                'quarterly_fee' => $quarterlyFee,
                'discount' => $discount,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $balance,
                'total_pending_amount' => $pendingAmount,
                'last_payment_date' => $member->last_payment_date,
                'paid_until_date' => $member->last_valid_date,
                'status' => $member->status,
                'invoice_id' => $invoice ? $invoice->id : null,
                'invoice_no' => $invoice ? $invoice->invoice_no : null,
            ];
        });

        // Calculate summary statistics
        $totalMembers = $printRows->count();
        $totalPendingAmount = $printRows->sum('total_pending_amount');

        return Inertia::render('App/Admin/Membership/PendingMaintenanceReportPrint', [
            'members' => $printRows,
            'statistics' => [
                'total_members' => $totalMembers,
                'total_pending_amount' => $totalPendingAmount,
                'total_discount' => $printRows->sum('discount'),
                'total_debit' => $printRows->sum('debit'),
                'total_credit' => $printRows->sum('credit'),
                'total_balance' => $printRows->sum('balance'),
                'average_pending_per_member' => $totalMembers > 0 ? round($totalPendingAmount / $totalMembers, 2) : 0,
            ],
            'filters' => [
                'status' => $statusFilter ?? [],
                'categories' => $categoryFilter ?? [],
                'date' => $untilDate,
                'member_search' => $memberSearch,
                'member_id' => $memberId,
                'cnic_search' => $cnicSearch,
                'contact_search' => $contactSearch,
                'quarters_pending' => $quartersFilter,
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
        ]);
    }

    public function pendingMaintenanceBulkStatusChange(Request $request)
    {
        $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:members,id',
            'status' => 'required|string',
            'reason' => 'nullable|string',
        ]);

        $memberIds = $request->input('member_ids');
        $status = $request->input('status');
        $reason = $request->input('reason');

        // Logic to update status
        Member::whereIn('id', $memberIds)->update([
            'status' => $status,
            // 'status_change_reason' => $reason // Assuming there's a column or log for this. If not, we skip or add it.
        ]);

        // Log the change (Optional implementation detail)
        // if ($reason) { ... }

        return redirect()->back()->with('success', 'Members status updated successfully.');
    }

    public function pendingMaintenanceBulkPrint(Request $request)
    {
        $untilDate = $this->parseDateToYmd($request->input('date')) ?: now()->format('Y-m-d');
        $request->merge(['member_ids' => (array) $request->input('member_ids', [])]);

        return $this->pendingMaintenanceReportPrint($request);
    }

    public function pendingMaintenanceReportExport(Request $request)
    {
        $statusFilter = $request->input('status');
        $categoryFilter = $request->input('categories');

        $untilDate = $this->parseDateToYmd($request->input('date')) ?: now()->format('Y-m-d');

        $memberSearch = $request->input('member_search');
        $memberId = $request->input('member_id');
        $cnicSearch = $request->input('cnic_search');
        $contactSearch = $request->input('contact_search');
        $quartersFilter = (string) ($request->input('quarters_pending') ?? '');
        if ($quartersFilter === '') {
            $quartersFilter = '1';
        }

        $latestMaintenance = \App\Models\FinancialInvoiceItem::select(
            'financial_invoices.member_id',
            \Illuminate\Support\Facades\DB::raw('MAX(financial_invoice_items.end_date) as last_valid_date'),
            \Illuminate\Support\Facades\DB::raw('MAX(transactions.date) as last_payment_date')
        )
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->leftJoin('transactions', function ($join) {
                $join
                    ->on('financial_invoices.id', '=', 'transactions.invoice_id')
                    ->where('transactions.type', 'credit');
            })
            ->where('financial_invoice_items.fee_type', '4')
            ->where('financial_invoices.status', 'paid')
            ->groupBy('financial_invoices.member_id');

        $maintenanceLedger = DB::table('transactions')
            ->join('financial_invoices', 'transactions.invoice_id', '=', 'financial_invoices.id')
            ->join('financial_invoice_items', function ($join) {
                $join
                    ->on('transactions.reference_id', '=', 'financial_invoice_items.id')
                    ->where('transactions.reference_type', '=', \App\Models\FinancialInvoiceItem::class);
            })
            ->whereNull('transactions.deleted_at')
            ->whereNull('financial_invoice_items.deleted_at')
            ->where('financial_invoice_items.fee_type', '4')
            ->whereNotIn('financial_invoices.status', ['cancelled', 'refunded'])
            ->groupBy('financial_invoices.member_id')
            ->select(
                'financial_invoices.member_id',
                DB::raw("SUM(CASE WHEN transactions.type = 'debit' THEN transactions.amount ELSE 0 END) as maintenance_debit"),
                DB::raw("SUM(CASE WHEN transactions.type = 'credit' THEN transactions.amount ELSE 0 END) as maintenance_credit")
            );

        $maintenanceDiscounts = DB::table('financial_invoice_items')
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->whereNull('financial_invoice_items.deleted_at')
            ->where('financial_invoice_items.fee_type', '4')
            ->whereNotIn('financial_invoices.status', ['cancelled', 'refunded'])
            ->groupBy('financial_invoices.member_id')
            ->select(
                'financial_invoices.member_id',
                DB::raw('SUM(COALESCE(financial_invoice_items.discount_amount, 0)) as maintenance_discount')
            );

        $query = Member::with(['memberCategory:id,name,description,subscription_fee'])
            ->leftJoinSub($latestMaintenance, 'latest_maintenance', function ($join) {
                $join->on('members.id', '=', 'latest_maintenance.member_id');
            })
            ->leftJoinSub($maintenanceLedger, 'maintenance_ledger', function ($join) {
                $join->on('members.id', '=', 'maintenance_ledger.member_id');
            })
            ->leftJoinSub($maintenanceDiscounts, 'maintenance_discounts', function ($join) {
                $join->on('members.id', '=', 'maintenance_discounts.member_id');
            })
            ->whereNull('parent_id')
            ->select(
                'members.*',
                'latest_maintenance.last_valid_date',
                'latest_maintenance.last_payment_date',
                'maintenance_ledger.maintenance_debit',
                'maintenance_ledger.maintenance_credit',
                'maintenance_discounts.maintenance_discount'
            );

        if ($categoryFilter) {
            $query->whereIn('member_category_id', (array) $categoryFilter);
        }

        if ($statusFilter) {
            $query->whereIn('status', (array) $statusFilter);
        }

        $nameSearch = $request->input('name_search');
        $noSearch = $request->input('membership_no_search');
        $memberIds = $request->input('member_ids');
        if ($memberIds) {
            $query->whereIn('members.id', (array) $memberIds);
        }

        if ($memberId) {
            $query->where('members.id', $memberId);
        } elseif ($memberSearch) {
            $query->where(function ($q) use ($memberSearch) {
                $q
                    ->where('full_name', 'like', "%{$memberSearch}%")
                    ->orWhere('membership_no', 'like', "%{$memberSearch}%");
            });
        }

        if ($nameSearch) {
            $query->where('full_name', 'like', "%{$nameSearch}%");
        }

        if ($noSearch) {
            $query->where('membership_no', 'like', "%{$noSearch}%");
        }

        if ($cnicSearch) {
            $query->where('cnic_no', 'like', "%{$cnicSearch}%");
        }

        if ($contactSearch) {
            $query->where(function ($q) use ($contactSearch) {
                $q
                    ->where('mobile_number_a', 'like', "%{$contactSearch}%")
                    ->orWhere('mobile_number_b', 'like', "%{$contactSearch}%")
                    ->orWhere('mobile_number_c', 'like', "%{$contactSearch}%");
            });
        }

        $query->where(function ($q) use ($untilDate) {
            $q
                ->whereNull('latest_maintenance.last_valid_date')
                ->orWhereDate('latest_maintenance.last_valid_date', '<=', $untilDate);
        });

        $currentDate = \Carbon\Carbon::parse($untilDate)->format('Y-m-d');
        $query->selectRaw("
            CASE
                WHEN DATE(COALESCE(latest_maintenance.last_valid_date, members.membership_date, members.created_at)) >= '$currentDate' THEN 0
                ELSE FLOOR(
                    GREATEST(0, TIMESTAMPDIFF(MONTH,
                        COALESCE(latest_maintenance.last_valid_date, members.membership_date, members.created_at),
                        '$currentDate'
                    )) / 3
                ) + 1
            END as pending_quarters_calc
        ");
        $query->having('pending_quarters_calc', '>', 0);
        if ($quartersFilter === '6+') {
            $query->having('pending_quarters_calc', '>=', 6);
        } else {
            $query->having('pending_quarters_calc', '=', (int) $quartersFilter);
        }

        $members = $query->get();
        $rows = $members->map(function ($member) {
            $monthlyFee = (float) ($member->total_maintenance_fee ?? 0);
            if ($monthlyFee <= 0) {
                $monthlyFee = (float) ($member->maintenance_fee ?? 0);
            }
            if ($monthlyFee <= 0 && $member->memberCategory) {
                $monthlyFee = (float) ($member->memberCategory->subscription_fee ?? 0);
            }
            $pendingQuarters = (int) ($member->pending_quarters_calc ?? 0);
            $quarterlyFee = $monthlyFee * 3;
            $totalPendingAmount = $quarterlyFee * $pendingQuarters;

            $discount = (float) ($member->maintenance_discount ?? 0);
            $debit = (float) ($member->maintenance_debit ?? 0);
            $credit = (float) ($member->maintenance_credit ?? 0);
            $balance = $debit - $credit;

            return [
                'id' => $member->id,
                'membership_no' => $member->membership_no,
                'full_name' => $member->full_name,
                'contact' => $member->mobile_number_a,
                'address' => $member->current_address,
                'category' => $member->memberCategory ? $member->memberCategory->name : '',
                'quarterly_fee' => $quarterlyFee,
                'discount' => $discount,
                'debit' => $debit,
                'credit' => $credit,
                'balance' => $balance,
                'total_pending_amount' => $totalPendingAmount,
                'status' => $member->status,
            ];
        });

        $filename = 'pending-maintenance-report-' . now()->format('Ymd-His') . '.csv';

        return response()->streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, [
                'ID',
                'Membership No',
                'Name',
                'Contact',
                'Address',
                'Category',
                'Per Quarter',
                'Discount',
                'Debit',
                'Credit',
                'Balance',
                'Pending Amount',
                'Status',
            ]);

            foreach ($rows as $row) {
                fputcsv($out, [
                    $row['id'] ?? '',
                    $row['membership_no'] ?? '',
                    $row['full_name'] ?? '',
                    $row['contact'] ?? '',
                    $row['address'] ?? '',
                    $row['category'] ?? '',
                    $row['quarterly_fee'] ?? 0,
                    $row['discount'] ?? 0,
                    $row['debit'] ?? 0,
                    $row['credit'] ?? 0,
                    $row['balance'] ?? 0,
                    $row['total_pending_amount'] ?? 0,
                    $row['status'] ?? '',
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    private function ensurePendingMaintenanceInvoice($member, int $pendingQuarters, string $untilDate, float $amount): ?FinancialInvoice
    {
        if ($pendingQuarters <= 0 || $amount <= 0) {
            return null;
        }

        $baseStart = null;
        if (!empty($member->last_valid_date)) {
            $baseStart = \Carbon\Carbon::parse($member->last_valid_date)->addDay();
        } elseif (!empty($member->membership_date)) {
            $baseStart = \Carbon\Carbon::parse($member->membership_date);
        } else {
            $baseStart = \Carbon\Carbon::parse($member->created_at);
        }

        $startDate = $baseStart->copy()->startOfDay();
        $endDate = $startDate->copy()->addMonths($pendingQuarters * 3)->subDay()->startOfDay();

        $existingItem = \App\Models\FinancialInvoiceItem::query()
            ->where('fee_type', '4')
            ->whereDate('start_date', $startDate->toDateString())
            ->whereDate('end_date', $endDate->toDateString())
            ->whereHas('invoice', function ($q) use ($member) {
                $q
                    ->where('member_id', $member->id)
                    ->whereNotIn('status', ['cancelled', 'refunded']);
            })
            ->with('invoice')
            ->first();

        if ($existingItem && $existingItem->invoice) {
            return $existingItem->invoice;
        }

        return DB::transaction(function () use ($member, $startDate, $endDate, $untilDate, $amount) {
            $issueDate = \Carbon\Carbon::parse($untilDate)->startOfDay();
            $invoiceNo = $this->generateNextInvoiceNumber();

            $invoice = FinancialInvoice::create([
                'invoice_no' => $invoiceNo,
                'member_id' => $member->id,
                'invoiceable_id' => $member->id,
                'invoiceable_type' => Member::class,
                'fee_type' => 'maintenance_fee',
                'invoice_type' => 'invoice',
                'amount' => (int) round($amount, 0),
                'total_price' => (int) round($amount, 0),
                'paid_amount' => 0,
                'customer_charges' => (int) round($amount, 0),
                'status' => 'unpaid',
                'issue_date' => $issueDate,
                'due_date' => $issueDate->copy()->addDays(10),
                'created_by' => \Illuminate\Support\Facades\Auth::id(),
                'data' => [
                    'member_name' => $member->full_name,
                    'action' => 'pending_maintenance_report_print',
                ],
            ]);

            $item = \App\Models\FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => '4',
                'description' => 'Maintenance Fee (Pending)',
                'qty' => 1,
                'amount' => (int) round($amount, 0),
                'sub_total' => (int) round($amount, 0),
                'tax_percentage' => 0,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total' => (int) round($amount, 0),
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ]);

            \App\Models\Transaction::create([
                'payable_type' => Member::class,
                'payable_id' => $member->id,
                'type' => 'debit',
                'amount' => (int) round($amount, 0),
                'reference_type' => \App\Models\FinancialInvoiceItem::class,
                'reference_id' => $item->id,
                'invoice_id' => $invoice->id,
                'description' => "Invoice #{$invoice->invoice_no} - Maintenance Fee (Pending)",
                'date' => $issueDate,
                'created_by' => \Illuminate\Support\Facades\Auth::id(),
            ]);

            return $invoice;
        });
    }

    private function ensurePendingMaintenanceQuarterInvoice($member, \Carbon\Carbon $startDate, \Carbon\Carbon $endDate, string $untilDate, float $amount, string $batchKey): ?FinancialInvoice
    {
        if ($amount <= 0) {
            return null;
        }

        $startDate = $startDate->copy()->startOfDay();
        $endDate = $endDate->copy()->startOfDay();

        $existingItem = \App\Models\FinancialInvoiceItem::query()
            ->where('fee_type', '4')
            ->whereDate('start_date', $startDate->toDateString())
            ->whereDate('end_date', $endDate->toDateString())
            ->whereHas('invoice', function ($q) use ($member) {
                $q
                    ->where('member_id', $member->id)
                    ->whereNotIn('status', ['cancelled', 'refunded']);
            })
            ->with('invoice')
            ->first();

        if ($existingItem && $existingItem->invoice) {
            $invoice = $existingItem->invoice;
            $data = (array) ($invoice->data ?? []);
            $data = array_merge($data, [
                'member_name' => $member->full_name,
                'action' => 'pending_maintenance_report_print',
                'pm_batch' => $batchKey,
                'pm_period_start' => $startDate->toDateString(),
                'pm_period_end' => $endDate->toDateString(),
            ]);
            $invoice->data = $data;
            $invoice->valid_from = $startDate->toDateString();
            $invoice->valid_to = $endDate->toDateString();
            $invoice->save();

            return $invoice;
        }

        return DB::transaction(function () use ($member, $startDate, $endDate, $untilDate, $amount, $batchKey) {
            $issueDate = \Carbon\Carbon::parse($untilDate)->startOfDay();
            $invoiceNo = $this->generateNextInvoiceNumber();

            $invoice = FinancialInvoice::create([
                'invoice_no' => $invoiceNo,
                'member_id' => $member->id,
                'invoiceable_id' => $member->id,
                'invoiceable_type' => Member::class,
                'fee_type' => 'maintenance_fee',
                'invoice_type' => 'invoice',
                'amount' => (int) round($amount, 0),
                'total_price' => (int) round($amount, 0),
                'paid_amount' => 0,
                'customer_charges' => (int) round($amount, 0),
                'status' => 'unpaid',
                'issue_date' => $issueDate,
                'due_date' => $issueDate->copy()->addDays(10),
                'valid_from' => $startDate->toDateString(),
                'valid_to' => $endDate->toDateString(),
                'created_by' => \Illuminate\Support\Facades\Auth::id(),
                'data' => [
                    'member_name' => $member->full_name,
                    'action' => 'pending_maintenance_report_print',
                    'pm_batch' => $batchKey,
                    'pm_period_start' => $startDate->toDateString(),
                    'pm_period_end' => $endDate->toDateString(),
                ],
            ]);

            $item = \App\Models\FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => '4',
                'description' => 'Maintenance Fee (Pending)',
                'qty' => 1,
                'amount' => (int) round($amount, 0),
                'sub_total' => (int) round($amount, 0),
                'tax_percentage' => 0,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total' => (int) round($amount, 0),
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ]);

            \App\Models\Transaction::create([
                'payable_type' => Member::class,
                'payable_id' => $member->id,
                'type' => 'debit',
                'amount' => (int) round($amount, 0),
                'reference_type' => \App\Models\FinancialInvoiceItem::class,
                'reference_id' => $item->id,
                'invoice_id' => $invoice->id,
                'description' => "Invoice #{$invoice->invoice_no} - Maintenance Fee (Pending)",
                'date' => $issueDate,
                'created_by' => \Illuminate\Support\Facades\Auth::id(),
            ]);

            return $invoice;
        });
    }

    private function generateNextInvoiceNumber(): string
    {
        $lastInvoice = FinancialInvoice::withTrashed()
            ->orderBy('invoice_no', 'desc')
            ->whereNotNull('invoice_no')
            ->first();

        $nextNumber = 1;
        if ($lastInvoice && $lastInvoice->invoice_no !== null) {
            $nextNumber = (int) $lastInvoice->invoice_no + 1;
        }

        while (FinancialInvoice::withTrashed()->where('invoice_no', (string) $nextNumber)->exists()) {
            $nextNumber++;
        }

        return (string) $nextNumber;
    }

    public function supplementaryCardReport(Request $request)
    {
        return Inertia::render('App/Admin/Membership/SupplementaryCardReport', [
            'categories' => [],
            'statistics' => new \stdClass(),
            'filters' => [
                'categories' => $request->input('categories') ?? [],
                'card_status' => $request->input('card_status') ?? [],
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_card_statuses' => [
                'In-Process',
                'Printed',
                'Received',
                'Issued',
                'Applied',
                'Re-Printed',
                'Not Applied',
                'Expired',
                'Not Applicable',
                'E-Card Issued',
            ],
        ]);
    }

    public function supplementaryCardReportData(Request $request)
    {
        $data = $this->getSupplementaryCardReportData($request);
        unset($data['all_categories'], $data['all_card_statuses']);
        return response()->json($data);
    }

    public function supplementaryCardReportPrint(Request $request)
    {
        $data = $this->getSupplementaryCardReportData($request);
        return Inertia::render('App/Admin/Membership/SupplementaryCardReportPrint', $data);
    }

    private function getSupplementaryCardReportData(Request $request): array
    {
        $categoryFilter = $request->input('categories');
        $cardStatusFilter = $request->input('card_status');

        $allCardStatuses = [
            'In-Process',
            'Printed',
            'Received',
            'Issued',
            'Applied',
            'Re-Printed',
            'Not Applied',
            'Expired',
            'Not Applicable',
            'E-Card Issued',
        ];

        $statusKeyMap = [
            'Issued' => 'issued_supplementary_members',
            'Printed' => 'printed_supplementary_members',
            'Re-Printed' => 're_printed_supplementary_members',
            'In-Process' => 'in_process',
            'Received' => 'received',
            'Applied' => 'applied',
            'Not Applied' => 'not_applied',
            'Expired' => 'expired',
            'Not Applicable' => 'not_applicable',
            'E-Card Issued' => 'e_card_issued',
        ];

        $categoryQuery = MemberCategory::select('id', 'name', 'description');
        if ($categoryFilter) {
            $categoryQuery->whereIn('id', (array) $categoryFilter);
        }

        $categoryStats = $categoryQuery->get()->map(function ($category) use ($allCardStatuses, $statusKeyMap) {
            $row = [
                'id' => $category->id,
                'name' => $category->name,
                'code' => $category->description,
                'total_cards_applied' => 0,
            ];
            foreach ($allCardStatuses as $status) {
                $key = $statusKeyMap[$status] ?? null;
                if ($key) {
                    $row[$key] = 0;
                }
            }
            return $row;
        })->keyBy('id');

        if (!$categoryFilter) {
            $row = [
                'id' => 0,
                'name' => 'Uncategorized',
                'code' => 'N/A',
                'total_cards_applied' => 0,
            ];
            foreach ($allCardStatuses as $status) {
                $key = $statusKeyMap[$status] ?? null;
                if ($key) {
                    $row[$key] = 0;
                }
            }
            $categoryStats->put(0, $row);
        }

        $statsQuery = DB::table('members as child')
            ->join('members as parent', 'child.parent_id', '=', 'parent.id')
            ->leftJoin('member_categories as cat', 'parent.member_category_id', '=', 'cat.id')
            ->whereNotNull('child.parent_id')
            ->whereNull('child.deleted_at')
            ->whereNull('parent.deleted_at');

        if ($categoryFilter) {
            $statsQuery->whereIn('parent.member_category_id', (array) $categoryFilter);
        }

        if ($cardStatusFilter) {
            $statsQuery->whereIn('child.card_status', (array) $cardStatusFilter);
        }

        $counts = $statsQuery
            ->selectRaw('COALESCE(cat.id, 0) as category_id, child.card_status as card_status, COUNT(*) as total_count')
            ->groupByRaw('COALESCE(cat.id, 0), child.card_status')
            ->get();

        foreach ($counts as $row) {
            $categoryId = (int) $row->category_id;
            if (!$categoryStats->has($categoryId)) {
                continue;
            }
            $status = (string) ($row->card_status ?? '');
            $count = (int) $row->total_count;

            $current = $categoryStats->get($categoryId);
            $current['total_cards_applied'] += $count;
            $key = $statusKeyMap[$status] ?? null;
            if ($key) {
                $current[$key] = ($current[$key] ?? 0) + $count;
            }
            $categoryStats->put($categoryId, $current);
        }

        $categories = $categoryStats->values();

        $totalStats = [
            'total_cards_applied' => (int) $categories->sum('total_cards_applied'),
            'issued_supplementary_members' => (int) $categories->sum('issued_supplementary_members'),
            'printed_supplementary_members' => (int) $categories->sum('printed_supplementary_members'),
            're_printed_supplementary_members' => (int) $categories->sum('re_printed_supplementary_members'),
        ];

        return [
            'categories' => $categories,
            'statistics' => $totalStats,
            'filters' => [
                'categories' => $categoryFilter ?? [],
                'card_status' => $cardStatusFilter ?? [],
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_card_statuses' => $allCardStatuses,
        ];
    }

    public function sleepingMembersReport(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $categoryFilter = $request->input('categories');
        $statusFilter = $request->input('status');

        $query = $this->buildSleepingMembersQuery($memberSearch, $categoryFilter, $statusFilter);
        $primaryMembers = (clone $query)->paginate(15)->withQueryString();
        $allPrimaryMembers = (clone $query)->get();

        // Calculate statistics by category and status using all members (not paginated)
        $categoryStats = MemberCategory::select('id', 'name', 'description')
            ->get()
            ->map(function ($category) use ($allPrimaryMembers) {
                $categoryMembers = $allPrimaryMembers->where('member_category_id', $category->id);

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'code' => $category->description,
                    'total_members' => $categoryMembers->count(),
                    'active' => $categoryMembers->where('status', 'active')->count(),
                    'suspended' => $categoryMembers->where('status', 'suspended')->count(),
                    'cancelled' => $categoryMembers->where('status', 'cancelled')->count(),
                    'absent' => $categoryMembers->where('status', 'absent')->count(),
                    'expired' => $categoryMembers->where('status', 'expired')->count(),
                    'terminated' => $categoryMembers->where('status', 'terminated')->count(),
                    'not_assign' => $categoryMembers->where('status', 'not_assign')->count(),
                    'in_suspension_process' => $categoryMembers->where('status', 'in_suspension_process')->count(),
                ];
            });

        // Calculate overall statistics using all members (not paginated)
        $totalStats = [
            'total_members' => $allPrimaryMembers->count(),
            'active' => $allPrimaryMembers->where('status', 'active')->count(),
            'suspended' => $allPrimaryMembers->where('status', 'suspended')->count(),
            'cancelled' => $allPrimaryMembers->where('status', 'cancelled')->count(),
            'absent' => $allPrimaryMembers->where('status', 'absent')->count(),
            'expired' => $allPrimaryMembers->where('status', 'expired')->count(),
            'terminated' => $allPrimaryMembers->where('status', 'terminated')->count(),
            'not_assign' => $allPrimaryMembers->where('status', 'not_assign')->count(),
            'in_suspension_process' => $allPrimaryMembers->where('status', 'in_suspension_process')->count(),
        ];

        // Get all possible member statuses
        $allMemberStatuses = [
            'active',
            'suspended',
            'cancelled',
            'absent',
            'expired',
            'terminated',
            'not_assign',
            'in_suspension_process'
        ];

        return Inertia::render('App/Admin/Membership/SleepingMembersReport', [
            'categories' => $categoryStats,
            'primary_members' => $primaryMembers,
            'statistics' => $totalStats,
            'filters' => [
                'member_search' => $memberSearch ?? '',
                'categories' => $categoryFilter ?? [],
                'status' => $statusFilter ?? [],
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_member_statuses' => $allMemberStatuses,
        ]);
    }

    public function sleepingMembersReportPrint(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $categoryFilter = $request->input('categories');
        $statusFilter = $request->input('status');
        $page = $request->input('page', 1);

        $query = $this->buildSleepingMembersQuery($memberSearch, $categoryFilter, $statusFilter);
        $primaryMembers = (clone $query)->paginate(15, ['*'], 'page', $page);
        $allPrimaryMembers = (clone $query)->get();

        // Calculate statistics by category and status using all members
        $categoryStats = MemberCategory::select('id', 'name', 'description')
            ->get()
            ->map(function ($category) use ($allPrimaryMembers) {
                $categoryMembers = $allPrimaryMembers->where('member_category_id', $category->id);

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'code' => $category->description,
                    'total_members' => $categoryMembers->count(),
                    'active' => $categoryMembers->where('status', 'active')->count(),
                    'suspended' => $categoryMembers->where('status', 'suspended')->count(),
                    'cancelled' => $categoryMembers->where('status', 'cancelled')->count(),
                    'absent' => $categoryMembers->where('status', 'absent')->count(),
                    'expired' => $categoryMembers->where('status', 'expired')->count(),
                    'terminated' => $categoryMembers->where('status', 'terminated')->count(),
                    'not_assign' => $categoryMembers->where('status', 'not_assign')->count(),
                    'in_suspension_process' => $categoryMembers->where('status', 'in_suspension_process')->count(),
                ];
            });

        // Calculate overall statistics using all members
        $totalStats = [
            'total_members' => $allPrimaryMembers->count(),
            'active' => $allPrimaryMembers->where('status', 'active')->count(),
            'suspended' => $allPrimaryMembers->where('status', 'suspended')->count(),
            'cancelled' => $allPrimaryMembers->where('status', 'cancelled')->count(),
            'absent' => $allPrimaryMembers->where('status', 'absent')->count(),
            'expired' => $allPrimaryMembers->where('status', 'expired')->count(),
            'terminated' => $allPrimaryMembers->where('status', 'terminated')->count(),
            'not_assign' => $allPrimaryMembers->where('status', 'not_assign')->count(),
            'in_suspension_process' => $allPrimaryMembers->where('status', 'in_suspension_process')->count(),
        ];

        return Inertia::render('App/Admin/Membership/SleepingMembersReportPrint', [
            'categories' => $categoryStats,
            'primary_members' => $primaryMembers,
            'statistics' => $totalStats,
            'filters' => [
                'member_search' => $memberSearch ?? '',
                'categories' => $categoryFilter ?? [],
                'status' => $statusFilter ?? [],
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
        ]);
    }

    private function buildSleepingMembersQuery($memberSearch, $categoryFilter, $statusFilter)
    {
        $inactiveDays = 90;
        $cutoffDate = now()->subDays($inactiveDays)->toDateString();

        $invoiceActivity = "(SELECT MAX(DATE(COALESCE(fi.payment_date, fi.created_at)))
            FROM financial_invoices fi
            JOIN financial_invoice_items fii ON fii.invoice_id = fi.id
            WHERE fi.member_id = members.id
              AND fi.status = 'paid'
              AND fii.fee_type IN ('4','5')
        )";

        $roomActivity = "(SELECT MAX(DATE(COALESCE(rb.check_in_date, rb.booking_date, rb.created_at)))
            FROM room_bookings rb
            WHERE rb.member_id = members.id
              AND rb.status NOT IN ('cancelled','refunded','no_show')
        )";

        $eventActivity = "(SELECT MAX(DATE(COALESCE(eb.event_date, eb.booking_date, eb.created_at)))
            FROM event_bookings eb
            WHERE eb.member_id = members.id
              AND eb.status NOT IN ('cancelled','refunded','no_show')
        )";

        $orderActivity = "(SELECT MAX(DATE(COALESCE(o.start_date, o.created_at)))
            FROM orders o
            WHERE o.member_id = members.id
              AND o.payment_status = 'paid'
        )";

        $lastActivityRaw = "NULLIF(GREATEST(
            COALESCE($invoiceActivity, '1900-01-01'),
            COALESCE($roomActivity, '1900-01-01'),
            COALESCE($eventActivity, '1900-01-01'),
            COALESCE($orderActivity, '1900-01-01')
        ), '1900-01-01')";

        $query = Member::with(['memberCategory:id,name,description'])
            ->whereNull('parent_id')
            ->select('members.*')
            ->selectRaw("DATE(COALESCE(members.membership_date, members.created_at)) as membership_date_display")
            ->selectRaw("$lastActivityRaw as last_activity_date");

        if ($categoryFilter) {
            $query->whereIn('member_category_id', (array) $categoryFilter);
        }

        if (!empty($memberSearch)) {
            $search = trim((string) $memberSearch);
            $query->where(function ($q) use ($search) {
                $q
                    ->where('membership_no', 'like', "%{$search}%")
                    ->orWhere('full_name', 'like', "%{$search}%");
            });
        }

        if ($statusFilter) {
            $query->whereIn('status', (array) $statusFilter);
        }

        $query->havingRaw("((last_activity_date IS NULL AND membership_date_display <= ?) OR last_activity_date <= ?)", [$cutoffDate, $cutoffDate]);

        return $query->orderByRaw("COALESCE(last_activity_date, membership_date_display) asc");
    }

    public function memberCardDetailReport(Request $request)
    {
        return Inertia::render('App/Admin/Membership/MemberCardDetailReport', [
            'categories' => [],
            'statistics' => new \stdClass(),
            'filters' => [
                'categories' => $request->input('categories') ?? [],
                'card_status' => $request->input('card_status') ?? [],
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_card_statuses' => [
                'In-Process',
                'Printed',
                'Received',
                'Issued',
                'Applied',
                'Re-Printed',
                'Not Applied',
                'Expired',
                'Not Applicable',
                'E-Card Issued',
            ],
        ]);
    }

    public function memberCardDetailReportData(Request $request)
    {
        $data = $this->getMemberCardDetailReportData($request);
        unset($data['all_categories'], $data['all_card_statuses']);
        return response()->json($data);
    }

    public function memberCardDetailReportPrint(Request $request)
    {
        $data = $this->getMemberCardDetailReportData($request);
        unset($data['all_card_statuses']);
        return Inertia::render('App/Admin/Membership/MemberCardDetailReportPrint', $data);
    }

    private function getMemberCardDetailReportData(Request $request): array
    {
        $categoryFilter = $request->input('categories');
        $cardStatusFilter = $request->input('card_status');

        $allCardStatuses = [
            'In-Process',
            'Printed',
            'Received',
            'Issued',
            'Applied',
            'Re-Printed',
            'Not Applied',
            'Expired',
            'Not Applicable',
            'E-Card Issued',
        ];

        $statusKeyMap = [
            'Issued' => 'issued_primary_members',
            'Printed' => 'printed_primary_members',
            'Re-Printed' => 're_printed_primary_members',
            'E-Card Issued' => 'e_card_issued_primary_members',
            'In-Process' => 'in_process',
            'Received' => 'received',
            'Applied' => 'applied',
            'Not Applied' => 'not_applied',
            'Expired' => 'expired',
            'Not Applicable' => 'not_applicable',
        ];

        $pendingStatuses = ['In-Process', 'Applied', 'Not Applied'];

        $categoryQuery = MemberCategory::select('id', 'name', 'description');
        if ($categoryFilter) {
            $categoryQuery->whereIn('id', (array) $categoryFilter);
        }

        $categoryStats = $categoryQuery->get()->map(function ($category) use ($allCardStatuses, $statusKeyMap) {
            $row = [
                'id' => $category->id,
                'name' => $category->name,
                'code' => $category->description,
                'total_cards_applied' => 0,
                'pending_cards' => 0,
            ];
            foreach ($allCardStatuses as $status) {
                $key = $statusKeyMap[$status] ?? null;
                if ($key) {
                    $row[$key] = 0;
                }
            }
            return $row;
        })->keyBy('id');

        if (!$categoryFilter) {
            $row = [
                'id' => 0,
                'name' => 'Uncategorized',
                'code' => 'N/A',
                'total_cards_applied' => 0,
                'pending_cards' => 0,
            ];
            foreach ($allCardStatuses as $status) {
                $key = $statusKeyMap[$status] ?? null;
                if ($key) {
                    $row[$key] = 0;
                }
            }
            $categoryStats->put(0, $row);
        }

        $statsQuery = DB::table('members as m')
            ->leftJoin('member_categories as cat', 'm.member_category_id', '=', 'cat.id')
            ->whereNull('m.parent_id')
            ->whereNull('m.deleted_at');

        if ($categoryFilter) {
            $statsQuery->whereIn('m.member_category_id', (array) $categoryFilter);
        }

        if ($cardStatusFilter) {
            $statsQuery->whereIn('m.card_status', (array) $cardStatusFilter);
        }

        $counts = $statsQuery
            ->selectRaw('COALESCE(cat.id, 0) as category_id, m.card_status as card_status, COUNT(*) as total_count')
            ->groupByRaw('COALESCE(cat.id, 0), m.card_status')
            ->get();

        foreach ($counts as $row) {
            $categoryId = (int) $row->category_id;
            if (!$categoryStats->has($categoryId)) {
                continue;
            }
            $status = (string) ($row->card_status ?? '');
            $count = (int) $row->total_count;

            $current = $categoryStats->get($categoryId);
            $current['total_cards_applied'] += $count;
            if (in_array($status, $pendingStatuses, true)) {
                $current['pending_cards'] += $count;
            }
            $key = $statusKeyMap[$status] ?? null;
            if ($key) {
                $current[$key] = ($current[$key] ?? 0) + $count;
            }
            $categoryStats->put($categoryId, $current);
        }

        $categories = $categoryStats->values();

        $totalStats = [
            'total_cards_applied' => (int) $categories->sum('total_cards_applied'),
            'issued_primary_members' => (int) $categories->sum('issued_primary_members'),
            'printed_primary_members' => (int) $categories->sum('printed_primary_members'),
            're_printed_primary_members' => (int) $categories->sum('re_printed_primary_members'),
            'e_card_issued_primary_members' => (int) $categories->sum('e_card_issued_primary_members'),
            'pending_cards' => (int) $categories->sum('pending_cards'),
        ];

        return [
            'categories' => $categories,
            'statistics' => $totalStats,
            'filters' => [
                'categories' => $categoryFilter ?? [],
                'card_status' => $cardStatusFilter ?? [],
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_card_statuses' => $allCardStatuses,
        ];
    }

    public function monthlyMaintenanceFeeReport(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $membershipNoSearch = $request->input('membership_no_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $dateFrom ? \Carbon\Carbon::createFromFormat('d-m-Y', $dateFrom)->format('Y-m-d') : null;
        $dateToParsed = $dateTo ? \Carbon\Carbon::createFromFormat('d-m-Y', $dateTo)->format('Y-m-d') : null;
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $cashierFilter = $request->input('cashier');

        // Get maintenance fee transactions - using Items for Mixed support
        // Include createdBy relation to show who created the receipt
        $query = \App\Models\FinancialInvoiceItem::with(['invoice.member.memberCategory', 'invoice.createdBy'])
            ->where('fee_type', '4')
            // Only paid invoices
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->select('financial_invoice_items.*');

        // Apply member search filter
        if ($memberSearch) {
            $query->whereHas('invoice.member', function ($q) use ($memberSearch) {
                $q->where('full_name', 'like', "%{$memberSearch}%");
            });
        }

        // Apply membership number search filter
        if ($membershipNoSearch) {
            $query->whereHas('invoice.member', function ($q) use ($membershipNoSearch) {
                $q->where('membership_no', 'like', "%{$membershipNoSearch}%");
            });
        }

        // Apply invoice search filter
        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        // Apply date range filter by payment (credit) date
        if ($dateFromParsed) {
            $query->whereHas('invoice.transactions', function ($q) use ($dateFromParsed) {
                $q->where('type', 'credit')->whereDate('date', '>=', $dateFromParsed);
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice.transactions', function ($q) use ($dateToParsed) {
                $q->where('type', 'credit')->whereDate('date', '<=', $dateToParsed);
            });
        }

        // Apply city filter
        if ($cityFilter) {
            $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                $q->where('current_city', $cityFilter);
            });
        }

        // Apply payment method filter (normalize labels to stored values)
        if ($paymentMethodFilter) {
            $map = [
                'Cash' => ['cash'],
                'Credit Card' => ['credit_card'],
                'Cheque' => ['cheque'],
                'Bank Transfer' => ['bank_online', 'online'],
            ];
            $methods = $map[$paymentMethodFilter] ?? [$paymentMethodFilter];
            $query->whereHas('invoice', function ($q) use ($methods) {
                $q->whereIn('payment_method', $methods);
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                $q->whereIn('member_category_id', (array) $categoryFilter);
            });
        }

        // Apply gender filter
        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        // Apply cashier filter (user who created the receipt)
        if ($cashierFilter) {
            $query->whereHas('invoice', function ($q) use ($cashierFilter) {
                $q->where('created_by', $cashierFilter);
            });
        }

        // Get paginated results
        $transactions = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Calculate statistics
        // Need to sum ITEM amounts now, or 'total'.
        $statsQuery = clone $query;
        // Optimization: Don't load relations for stats
        $statsQuery->with = [];

        $totalAmount = $statsQuery->sum('total');
        $totalTransactions = $statsQuery->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        // Get filter options
        $allCities = Member::distinct()->pluck('current_city')->filter()->values();
        $allPaymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Cheque'];
        $allGenders = ['Male', 'Female'];
        // Get all users for cashier filter
        $allCashiers = \App\Models\User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('App/Admin/Membership/MonthlyMaintenanceFeeReport', [
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
            'filters' => [
                'member_search' => $memberSearch,
                'membership_no_search' => $membershipNoSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
                'cashier' => $cashierFilter,
            ],
            'all_cities' => $allCities,
            'all_payment_methods' => $allPaymentMethods,
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_genders' => $allGenders,
            'all_cashiers' => $allCashiers,
        ]);
    }

    public function monthlyMaintenanceFeeReportPrint(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $membershipNoSearch = $request->input('membership_no_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $dateFrom ? \Carbon\Carbon::createFromFormat('d-m-Y', $dateFrom)->format('Y-m-d') : null;
        $dateToParsed = $dateTo ? \Carbon\Carbon::createFromFormat('d-m-Y', $dateTo)->format('Y-m-d') : null;
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $page = $request->input('page', 1);

        // Get maintenance fee transactions with pagination - using Items for Mixed support
        $query = \App\Models\FinancialInvoiceItem::with(['invoice.member.memberCategory', 'invoice'])
            ->where('fee_type', '4')
            // Only paid invoices
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->select('financial_invoice_items.*');

        // Apply member search filter
        if ($memberSearch) {
            $query->whereHas('invoice.member', function ($q) use ($memberSearch) {
                $q->where('full_name', 'like', "%{$memberSearch}%");
            });
        }

        // Apply membership number search filter
        if ($membershipNoSearch) {
            $query->whereHas('invoice.member', function ($q) use ($membershipNoSearch) {
                $q->where('membership_no', 'like', "%{$membershipNoSearch}%");
            });
        }

        // Apply invoice search filter
        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        // Apply date range filter by payment (credit) date
        if ($dateFromParsed) {
            $query->whereHas('invoice.transactions', function ($q) use ($dateFromParsed) {
                $q->where('type', 'credit')->whereDate('date', '>=', $dateFromParsed);
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice.transactions', function ($q) use ($dateToParsed) {
                $q->where('type', 'credit')->whereDate('date', '<=', $dateToParsed);
            });
        }

        // Apply city filter
        if ($cityFilter) {
            $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                $q->where('current_city', $cityFilter);
            });
        }

        // Apply payment method filter (normalize labels to stored values)
        if ($paymentMethodFilter) {
            $map = [
                'Cash' => ['cash'],
                'Credit Card' => ['credit_card'],
                'Cheque' => ['cheque'],
                'Bank Transfer' => ['bank_online', 'online'],
            ];
            $methods = $map[$paymentMethodFilter] ?? [$paymentMethodFilter];
            $query->whereHas('invoice', function ($q) use ($methods) {
                $q->whereIn('payment_method', $methods);
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                $q->whereIn('member_category_id', (array) $categoryFilter);
            });
        }

        // Apply gender filter
        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        // Get paginated results (same 15 per page)
        $transactions = $query->orderBy('created_at', 'desc')->paginate(15, ['*'], 'page', $page);

        // Calculate statistics from all filtered transactions
        $allTransactions = $query->get();
        $totalAmount = $allTransactions->sum('total');
        $totalTransactions = $allTransactions->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        return Inertia::render('App/Admin/Membership/MonthlyMaintenanceFeeReportPrint', [
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
            'filters' => [
                'member_search' => $memberSearch,
                'membership_no_search' => $membershipNoSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
        ]);
    }

    public function newYearEveReport(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $cashierFilter = $request->input('cashier');
        $page = $request->input('page', 1);

        $allCities = Member::distinct()->pluck('current_city')->filter()->values();
        $allPaymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Cheque'];
        $allGenders = ['Male', 'Female'];
        $allCashiers = \App\Models\User::select('id', 'name')->orderBy('name')->get();

        return Inertia::render('App/Admin/Membership/NewYearEveReport', [
            'transactions' => null,
            'statistics' => null,
            'filters' => [
                'member_search' => $memberSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
                'cashier' => $cashierFilter,
                'page' => $page,
            ],
            'all_cities' => $allCities,
            'all_payment_methods' => $allPaymentMethods,
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_genders' => $allGenders,
            'all_cashiers' => $allCashiers,
        ]);
    }

    public function newYearEveReportData(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $cashierFilter = $request->input('cashier');
        $page = $request->input('page', 1);

        $dateFromParsed = $this->parseDateToYmd($dateFrom);
        $dateToParsed = $this->parseDateToYmd($dateTo);

        $query = \App\Models\FinancialInvoiceItem::query()
            ->with(['invoice.member.memberCategory', 'invoice.customer.guestType', 'invoice.createdBy'])
            ->where('fee_type', '6')
            ->whereIn('financial_charge_type_id', [3, 4])
            ->select('financial_invoice_items.*');

        if ($memberSearch) {
            $query->whereHas('invoice', function ($q) use ($memberSearch) {
                $q->where(function ($inner) use ($memberSearch) {
                    $inner
                        ->whereHas('member', function ($m) use ($memberSearch) {
                            $m
                                ->where('full_name', 'like', "%{$memberSearch}%")
                                ->orWhere('membership_no', 'like', "%{$memberSearch}%");
                        })
                        ->orWhereHas('customer', function ($c) use ($memberSearch) {
                            $c
                                ->where('name', 'like', "%{$memberSearch}%")
                                ->orWhere('customer_no', 'like', "%{$memberSearch}%");
                        });
                });
            });
        }

        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        if ($dateFromParsed) {
            $query->whereHas('invoice', function ($q) use ($dateFromParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $dateFromParsed);
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice', function ($q) use ($dateToParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $dateToParsed);
            });
        }

        if ($cityFilter) {
            $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                $q->where('current_city', 'like', "%{$cityFilter}%");
            });
        }

        if ($paymentMethodFilter) {
            $query->whereHas('invoice', function ($q) use ($paymentMethodFilter) {
                $q->where('payment_method', $paymentMethodFilter);
            });
        }

        if ($categoryFilter) {
            $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                $q->whereIn('member_category_id', (array) $categoryFilter);
            });
        }

        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        if ($cashierFilter) {
            $query->whereHas('invoice', function ($q) use ($cashierFilter) {
                $q->where('created_by', $cashierFilter);
            });
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15, ['*'], 'page', $page);

        $statsQuery = clone $query;
        $statsQuery->with = [];
        $totalAmount = $statsQuery->sum('total');
        $totalTransactions = $statsQuery->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        return response()->json([
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
        ]);
    }

    public function newYearEveReportPrint(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $this->parseDateToYmd($dateFrom);
        $dateToParsed = $this->parseDateToYmd($dateTo);
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $cashierFilter = $request->input('cashier');
        $page = $request->input('page', 1);

        // Get all fee transactions with pagination
        // Query FinancialInvoiceItem with fee_type = 6 (Charges) and financial_charge_type_id IN (3, 4) for New Year Eve
        $query = \App\Models\FinancialInvoiceItem::with(['invoice.member.memberCategory', 'invoice.customer.guestType', 'invoice.createdBy'])
            ->where('fee_type', '6')  // 6 = Charges
            ->whereIn('financial_charge_type_id', [3, 4])  // 3 = New Year Eve (Member), 4 = New Year Eve (Guest)
            ->select('financial_invoice_items.*');

        // Apply member search filter
        if ($memberSearch) {
            $query->whereHas('invoice', function ($q) use ($memberSearch) {
                $q->where(function ($inner) use ($memberSearch) {
                    $inner
                        ->whereHas('member', function ($m) use ($memberSearch) {
                            $m
                                ->where('full_name', 'like', "%{$memberSearch}%")
                                ->orWhere('membership_no', 'like', "%{$memberSearch}%");
                        })
                        ->orWhereHas('customer', function ($c) use ($memberSearch) {
                            $c
                                ->where('name', 'like', "%{$memberSearch}%")
                                ->orWhere('customer_no', 'like', "%{$memberSearch}%");
                        });
                });
            });
        }

        // Apply invoice search filter
        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        // Apply date range filter
        if ($dateFromParsed) {
            $query->whereHas('invoice', function ($q) use ($dateFromParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $dateFromParsed);
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice', function ($q) use ($dateToParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $dateToParsed);
            });
        }

        // Apply city filter
        if ($cityFilter) {
            $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                $q->where('current_city', 'like', "%{$cityFilter}%");
            });
        }

        // Apply payment method filter
        if ($paymentMethodFilter) {
            $query->whereHas('invoice', function ($q) use ($paymentMethodFilter) {
                $q->where('payment_method', $paymentMethodFilter);
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                $q->whereIn('member_category_id', (array) $categoryFilter);
            });
        }

        // Apply gender filter
        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        // Apply cashier filter
        if ($cashierFilter) {
            $query->whereHas('invoice', function ($q) use ($cashierFilter) {
                $q->where('created_by', $cashierFilter);
            });
        }

        // Get paginated results (same 15 per page)
        $transactions = $query->orderBy('created_at', 'desc')->paginate(15, ['*'], 'page', $page);

        // Calculate statistics from all filtered transactions
        $allTransactions = $query->get();
        $totalAmount = $allTransactions->sum('total');
        $totalTransactions = $allTransactions->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        return Inertia::render('App/Admin/Membership/NewYearEveReportPrint', [
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
            'filters' => [
                'member_search' => $memberSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
                'cashier' => $cashierFilter,
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_cashiers' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function reinstatingFeeReport(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $this->parseDateToYmd($dateFrom);
        $dateToParsed = $this->parseDateToYmd($dateTo);
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $cashierFilter = $request->input('cashier');
        $page = $request->input('page', 1);

        // Get reinstating fee transactions with pagination
        // Query FinancialInvoiceItem with fee_type = 6 (Charges) and financial_charge_type_id = 2 (Reinstating Fee)
        $query = \App\Models\FinancialInvoiceItem::with(['invoice.member.memberCategory', 'invoice.createdBy'])
            ->where('fee_type', '6')  // 6 = Charges
            ->where('financial_charge_type_id', 2)  // 2 = Reinstating Fee
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->select('financial_invoice_items.*');

        // Apply member search filter
        if ($memberSearch) {
            $query->whereHas('invoice.member', function ($q) use ($memberSearch) {
                $q
                    ->where('full_name', 'like', "%{$memberSearch}%")
                    ->orWhere('membership_no', 'like', "%{$memberSearch}%");
            });
        }

        // Apply invoice search filter
        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        // Apply date range filter
        if ($dateFromParsed) {
            $query->whereHas('invoice', function ($q) use ($dateFromParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $dateFromParsed);
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice', function ($q) use ($dateToParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $dateToParsed);
            });
        }

        // Apply city filter
        if ($cityFilter) {
            $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                $q->where('current_city', 'like', "%{$cityFilter}%");
            });
        }

        // Apply payment method filter
        if ($paymentMethodFilter) {
            $query->whereHas('invoice', function ($q) use ($paymentMethodFilter) {
                $q->where('payment_method', $paymentMethodFilter);
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                $q->whereIn('member_category_id', (array) $categoryFilter);
            });
        }

        // Apply gender filter
        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        // Apply cashier filter
        if ($cashierFilter) {
            $query->whereHas('invoice', function ($q) use ($cashierFilter) {
                $q->where('created_by', $cashierFilter);
            });
        }

        $transactions = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        $statsQuery = clone $query;
        $statsQuery->with = [];
        $totalAmount = $statsQuery->sum('total');
        $totalTransactions = $statsQuery->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        // Get filter options
        $allCities = Member::distinct()->pluck('current_city')->filter()->values();
        $allPaymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Cheque', 'Online'];
        $allGenders = ['Male', 'Female'];

        return Inertia::render('App/Admin/Membership/ReinstatingFeeReport', [
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
            'filters' => [
                'member_search' => $memberSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
                'cashier' => $cashierFilter,
            ],
            'all_cities' => $allCities,
            'all_payment_methods' => $allPaymentMethods,
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_genders' => $allGenders,
            'all_cashiers' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function reinstatingFeeReportPrint(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $this->parseDateToYmd($dateFrom);
        $dateToParsed = $this->parseDateToYmd($dateTo);
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $cashierFilter = $request->input('cashier');
        $page = $request->input('page', 1);

        $query = \App\Models\FinancialInvoiceItem::with(['invoice.member.memberCategory', 'invoice.createdBy'])
            ->where('fee_type', '6')  // 6 = Charges
            ->where('financial_charge_type_id', 2)  // 2 = Reinstating Fee
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->select('financial_invoice_items.*');

        // Apply member search filter
        if ($memberSearch) {
            $query->whereHas('invoice.member', function ($q) use ($memberSearch) {
                $q
                    ->where('full_name', 'like', "%{$memberSearch}%")
                    ->orWhere('membership_no', 'like', "%{$memberSearch}%");
            });
        }

        // Apply invoice search filter
        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        // Apply date range filter
        if ($dateFromParsed) {
            $query->whereHas('invoice', function ($q) use ($dateFromParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $dateFromParsed);
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice', function ($q) use ($dateToParsed) {
                $q->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $dateToParsed);
            });
        }

        // Apply city filter
        if ($cityFilter) {
            $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                $q->where('current_city', 'like', "%{$cityFilter}%");
            });
        }

        // Apply payment method filter
        if ($paymentMethodFilter) {
            $query->whereHas('invoice', function ($q) use ($paymentMethodFilter) {
                $q->where('payment_method', $paymentMethodFilter);
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                $q->whereIn('member_category_id', (array) $categoryFilter);
            });
        }

        // Apply gender filter
        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        // Apply cashier filter
        if ($cashierFilter) {
            $query->whereHas('invoice', function ($q) use ($cashierFilter) {
                $q->where('created_by', $cashierFilter);
            });
        }

        // Get paginated results (same 15 per page)
        $transactions = $query->orderBy('created_at', 'desc')->paginate(15, ['*'], 'page', $page);

        $statsQuery = clone $query;
        $statsQuery->with = [];
        $totalAmount = $statsQuery->sum('total');
        $totalTransactions = $statsQuery->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        return Inertia::render('App/Admin/Membership/ReinstatingFeeReportPrint', [
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
            'filters' => [
                'member_search' => $memberSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
                'cashier' => $cashierFilter,
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_cashiers' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
        ]);
    }

    public function sportsSubscriptionsReport(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $membershipNoSearch = $request->input('membership_no_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $this->parseDateToYmd($dateFrom);
        $dateToParsed = $this->parseDateToYmd($dateTo);
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $familyMemberFilter = $request->input('family_member');
        $customerTypeFilter = $request->input('customer_type');  // member, corporate, guest, or guest-<id>
        $guestTypeId = null;
        if (is_string($customerTypeFilter) && str_starts_with($customerTypeFilter, 'guest-')) {
            $guestTypeId = (int) substr($customerTypeFilter, strlen('guest-'));
        }
        $subscriptionCategoryFilter = $request->input('subscription_category_id');
        $cashierFilter = $request->input('cashier');

        // Get subscription fee transactions only - using Items for Mixed Invoice support
        // Include createdBy for payment receiver and customer for guest subscriptions
        $query = \App\Models\FinancialInvoiceItem::with(['invoice.member.memberCategory', 'invoice.corporateMember.memberCategory', 'invoice.customer', 'invoice.createdBy', 'subscriptionType', 'subscriptionCategory', 'familyMember'])
            ->where('fee_type', '5')  // 5 = Subscription
            // Only paid invoices
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->select('financial_invoice_items.*');

        // Apply member search filter
        if ($memberSearch) {
            if ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($memberSearch) {
                    $q->where('full_name', 'like', "%{$memberSearch}%");
                });
            } elseif ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($memberSearch) {
                    $q->where('full_name', 'like', "%{$memberSearch}%");
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                $query->whereHas('invoice.customer', function ($q) use ($memberSearch, $guestTypeId) {
                    $q->where('name', 'like', "%{$memberSearch}%");
                    if ($guestTypeId) {
                        $q->where('guest_type_id', $guestTypeId);
                    }
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($memberSearch) {
                    $q
                        ->whereHas('member', function ($m) use ($memberSearch) {
                            $m->where('full_name', 'like', "%{$memberSearch}%");
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($memberSearch) {
                            $m->where('full_name', 'like', "%{$memberSearch}%");
                        })
                        ->orWhereHas('customer', function ($c) use ($memberSearch) {
                            $c->where('name', 'like', "%{$memberSearch}%");
                        });
                });
            }
        }

        // Apply membership number search filter
        if ($membershipNoSearch) {
            if ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($membershipNoSearch) {
                    $q->where('membership_no', 'like', "%{$membershipNoSearch}%");
                });
            } elseif ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($membershipNoSearch) {
                    $q->where('membership_no', 'like', "%{$membershipNoSearch}%");
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                $query->whereHas('invoice.customer', function ($q) use ($membershipNoSearch, $guestTypeId) {
                    $q->where('customer_no', 'like', "%{$membershipNoSearch}%");
                    if ($guestTypeId) {
                        $q->where('guest_type_id', $guestTypeId);
                    }
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($membershipNoSearch) {
                    $q
                        ->whereHas('member', function ($m) use ($membershipNoSearch) {
                            $m->where('membership_no', 'like', "%{$membershipNoSearch}%");
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($membershipNoSearch) {
                            $m->where('membership_no', 'like', "%{$membershipNoSearch}%");
                        })
                        ->orWhereHas('customer', function ($c) use ($membershipNoSearch) {
                            $c->where('customer_no', 'like', "%{$membershipNoSearch}%");
                        });
                });
            }
        }

        // Apply invoice search filter
        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        // Apply date range filter by payment date (fallback to credit transaction date)
        if ($dateFromParsed) {
            $query->whereHas('invoice', function ($q) use ($dateFromParsed) {
                $q->where(function ($sub) use ($dateFromParsed) {
                    $sub
                        ->whereDate('payment_date', '>=', $dateFromParsed)
                        ->orWhereHas('transactions', function ($t) use ($dateFromParsed) {
                            $t->where('type', 'credit')->whereDate('date', '>=', $dateFromParsed);
                        });
                });
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice', function ($q) use ($dateToParsed) {
                $q->where(function ($sub) use ($dateToParsed) {
                    $sub
                        ->whereDate('payment_date', '<=', $dateToParsed)
                        ->orWhereHas('transactions', function ($t) use ($dateToParsed) {
                            $t->where('type', 'credit')->whereDate('date', '<=', $dateToParsed);
                        });
                });
            });
        }

        // Apply city filter
        if ($cityFilter) {
            if ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($cityFilter) {
                    $q->where('current_city', $cityFilter);
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                // guests don't have city on member profile
            } elseif ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                    $q->where('current_city', $cityFilter);
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($cityFilter) {
                    $q
                        ->whereHas('member', function ($m) use ($cityFilter) {
                            $m->where('current_city', $cityFilter);
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($cityFilter) {
                            $m->where('current_city', $cityFilter);
                        });
                });
            }
        }

        // Apply payment method filter
        if ($paymentMethodFilter) {
            $query->whereHas('invoice', function ($q) use ($paymentMethodFilter) {
                $q->where('payment_method', $paymentMethodFilter);
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            if ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($categoryFilter) {
                    $q->whereIn('member_category_id', (array) $categoryFilter);
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                // guests don't have member category
            } elseif ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                    $q->whereIn('member_category_id', (array) $categoryFilter);
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($categoryFilter) {
                    $q
                        ->whereHas('member', function ($m) use ($categoryFilter) {
                            $m->whereIn('member_category_id', (array) $categoryFilter);
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($categoryFilter) {
                            $m->whereIn('member_category_id', (array) $categoryFilter);
                        });
                });
            }
        }

        // Apply gender filter
        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        // Apply family member filter
        if ($familyMemberFilter) {
            $query->whereHas('familyMember', function ($q) use ($familyMemberFilter) {
                $q->where('relation', $familyMemberFilter);
            });
        }

        // Apply customer type filter (member, corporate, or guest)
        if ($customerTypeFilter === 'member') {
            $query->whereHas('invoice', function ($q) {
                $q->whereNotNull('member_id');
            });
        } elseif ($customerTypeFilter === 'corporate') {
            $query->whereHas('invoice', function ($q) {
                $q->whereNotNull('corporate_member_id');
            });
        } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
            $query->whereHas('invoice', function ($q) {
                $q->whereNotNull('customer_id');
            });
            if ($guestTypeId) {
                $query->whereHas('invoice.customer', function ($q) use ($guestTypeId) {
                    $q->where('guest_type_id', $guestTypeId);
                });
            }
        }

        // Apply subscription category filter
        // Apply subscription category filter
        if ($subscriptionCategoryFilter) {
            $query->where('subscription_category_id', $subscriptionCategoryFilter);
        }

        // Apply cashier filter (user who received payment)
        if ($cashierFilter) {
            $query->whereHas('invoice', function ($q) use ($cashierFilter) {
                $q->where('created_by', $cashierFilter);
            });
        }

        // Get paginated results
        $transactions = $query->orderBy('created_at', 'desc')->paginate(15)->withQueryString();

        // Calculate statistics
        // Need to sum ITEM amounts now, or 'total'.
        // To avoid re-querying everything efficiently, we can clone the query.
        $statsQuery = clone $query;
        // Optimization: Don't load relations for stats
        $statsQuery->with = [];

        $totalAmount = $statsQuery->sum('total');
        $totalTransactions = $statsQuery->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        // Get filter options
        $allCities = Member::distinct()->pluck('current_city')->filter()->values();
        $allPaymentMethods = ['Cash', 'Credit Card', 'Bank Transfer', 'Cheque'];
        $allGenders = ['Male', 'Female'];
        $allFamilyMembers = ['SELF', 'Father', 'Son', 'Daughter', 'Wife', 'Mother', 'Grand Son', 'Grand Daughter', 'Second Wife', 'Husband', 'Sister', 'Brother', 'Nephew', 'Niece', 'Father in law', 'Mother in Law'];

        return Inertia::render('App/Admin/Membership/SportsSubscriptionsReport', [
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
            'filters' => [
                'member_search' => $memberSearch,
                'membership_no_search' => $membershipNoSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
                'family_member' => $familyMemberFilter,
                'customer_type' => $customerTypeFilter,
                'subscription_category_id' => $subscriptionCategoryFilter,
                'cashier' => $cashierFilter,
            ],
            'all_cities' => $allCities,
            'all_payment_methods' => $allPaymentMethods,
            'all_categories' => MemberCategory::select('id', 'name')->get(),
            'all_genders' => $allGenders,
            'all_family_members' => $allFamilyMembers,
            'subscription_categories' => \App\Models\SubscriptionCategory::select('id', 'name')->orderBy('name')->get(),
            'guest_types' => GuestType::where('status', 1)->select('id', 'name')->orderBy('name')->get(),
            'all_cashiers' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
            'all_members' => Member::select('id', 'full_name', 'membership_no', 'status')
                ->orderBy('full_name')
                ->limit(200)
                ->get()
                ->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'full_name' => $member->full_name,
                        'name' => $member->full_name,
                        'membership_no' => $member->membership_no,
                        'customer_no' => null,
                        'status' => $member->status
                    ];
                })
                ->concat(
                    \App\Models\Customer::select('id', 'name', 'customer_no')
                        ->orderBy('name')
                        ->limit(100)
                        ->get()
                        ->map(function ($customer) {
                            return [
                                'id' => 'customer_' . $customer->id,
                                'full_name' => $customer->name,
                                'name' => $customer->name,
                                'membership_no' => null,
                                'customer_no' => $customer->customer_no,
                                'status' => 'guest'
                            ];
                        })
                )
                ->values(),
        ]);
    }

    public function sportsSubscriptionsReportPrint(Request $request)
    {
        $memberSearch = $request->input('member_search');
        $membershipNoSearch = $request->input('membership_no_search');
        $invoiceSearch = $request->input('invoice_search');
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $this->parseDateToYmd($dateFrom);
        $dateToParsed = $this->parseDateToYmd($dateTo);
        $cityFilter = $request->input('city');
        $paymentMethodFilter = $request->input('payment_method');
        $categoryFilter = $request->input('categories');
        $genderFilter = $request->input('gender');
        $familyMemberFilter = $request->input('family_member');
        $customerTypeFilter = $request->input('customer_type');
        $guestTypeId = null;
        if (is_string($customerTypeFilter) && str_starts_with($customerTypeFilter, 'guest-')) {
            $guestTypeId = (int) substr($customerTypeFilter, strlen('guest-'));
        }
        $subscriptionCategoryFilter = $request->input('subscription_category_id');
        $cashierFilter = $request->input('cashier');
        $page = $request->input('page', 1);

        // Get subscription fee transactions with pagination - using Items for Mixed support
        $query = \App\Models\FinancialInvoiceItem::with(['invoice.member.memberCategory', 'invoice.corporateMember.memberCategory', 'invoice.customer', 'invoice.createdBy', 'subscriptionType', 'subscriptionCategory', 'familyMember'])
            ->where('fee_type', '5')
            // Only paid invoices
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->select('financial_invoice_items.*');

        // Apply member search filter
        if ($memberSearch) {
            if ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($memberSearch) {
                    $q->where('full_name', 'like', "%{$memberSearch}%");
                });
            } elseif ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($memberSearch) {
                    $q->where('full_name', 'like', "%{$memberSearch}%");
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                $query->whereHas('invoice.customer', function ($q) use ($memberSearch, $guestTypeId) {
                    $q->where('name', 'like', "%{$memberSearch}%");
                    if ($guestTypeId) {
                        $q->where('guest_type_id', $guestTypeId);
                    }
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($memberSearch) {
                    $q
                        ->whereHas('member', function ($m) use ($memberSearch) {
                            $m->where('full_name', 'like', "%{$memberSearch}%");
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($memberSearch) {
                            $m->where('full_name', 'like', "%{$memberSearch}%");
                        })
                        ->orWhereHas('customer', function ($c) use ($memberSearch) {
                            $c->where('name', 'like', "%{$memberSearch}%");
                        });
                });
            }
        }

        // Apply membership number search filter
        if ($membershipNoSearch) {
            if ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($membershipNoSearch) {
                    $q->where('membership_no', 'like', "%{$membershipNoSearch}%");
                });
            } elseif ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($membershipNoSearch) {
                    $q->where('membership_no', 'like', "%{$membershipNoSearch}%");
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                $query->whereHas('invoice.customer', function ($q) use ($membershipNoSearch, $guestTypeId) {
                    $q->where('customer_no', 'like', "%{$membershipNoSearch}%");
                    if ($guestTypeId) {
                        $q->where('guest_type_id', $guestTypeId);
                    }
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($membershipNoSearch) {
                    $q
                        ->whereHas('member', function ($m) use ($membershipNoSearch) {
                            $m->where('membership_no', 'like', "%{$membershipNoSearch}%");
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($membershipNoSearch) {
                            $m->where('membership_no', 'like', "%{$membershipNoSearch}%");
                        })
                        ->orWhereHas('customer', function ($c) use ($membershipNoSearch) {
                            $c->where('customer_no', 'like', "%{$membershipNoSearch}%");
                        });
                });
            }
        }

        // Apply invoice search filter
        if ($invoiceSearch) {
            $query->whereHas('invoice', function ($q) use ($invoiceSearch) {
                $q->where('invoice_no', 'like', "%{$invoiceSearch}%");
            });
        }

        // Apply date range filter by payment date (fallback to credit transaction date)
        if ($dateFromParsed) {
            $query->whereHas('invoice', function ($q) use ($dateFromParsed) {
                $q->where(function ($sub) use ($dateFromParsed) {
                    $sub
                        ->whereDate('payment_date', '>=', $dateFromParsed)
                        ->orWhereHas('transactions', function ($t) use ($dateFromParsed) {
                            $t->where('type', 'credit')->whereDate('date', '>=', $dateFromParsed);
                        });
                });
            });
        }
        if ($dateToParsed) {
            $query->whereHas('invoice', function ($q) use ($dateToParsed) {
                $q->where(function ($sub) use ($dateToParsed) {
                    $sub
                        ->whereDate('payment_date', '<=', $dateToParsed)
                        ->orWhereHas('transactions', function ($t) use ($dateToParsed) {
                            $t->where('type', 'credit')->whereDate('date', '<=', $dateToParsed);
                        });
                });
            });
        }

        // Apply city filter
        if ($cityFilter) {
            if ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($cityFilter) {
                    $q->where('current_city', $cityFilter);
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                // guests don't have city on member profile
            } elseif ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($cityFilter) {
                    $q->where('current_city', $cityFilter);
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($cityFilter) {
                    $q
                        ->whereHas('member', function ($m) use ($cityFilter) {
                            $m->where('current_city', $cityFilter);
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($cityFilter) {
                            $m->where('current_city', $cityFilter);
                        });
                });
            }
        }

        // Apply payment method filter
        if ($paymentMethodFilter) {
            $query->whereHas('invoice', function ($q) use ($paymentMethodFilter) {
                $q->where('payment_method', $paymentMethodFilter);
            });
        }

        // Apply category filter
        if ($categoryFilter) {
            if ($customerTypeFilter === 'corporate') {
                $query->whereHas('invoice.corporateMember', function ($q) use ($categoryFilter) {
                    $q->whereIn('member_category_id', (array) $categoryFilter);
                });
            } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
                // guests don't have member category
            } elseif ($customerTypeFilter === 'member') {
                $query->whereHas('invoice.member', function ($q) use ($categoryFilter) {
                    $q->whereIn('member_category_id', (array) $categoryFilter);
                });
            } else {
                $query->whereHas('invoice', function ($q) use ($categoryFilter) {
                    $q
                        ->whereHas('member', function ($m) use ($categoryFilter) {
                            $m->whereIn('member_category_id', (array) $categoryFilter);
                        })
                        ->orWhereHas('corporateMember', function ($m) use ($categoryFilter) {
                            $m->whereIn('member_category_id', (array) $categoryFilter);
                        });
                });
            }
        }

        // Apply gender filter
        if ($genderFilter) {
            $query->whereHas('invoice.member', function ($q) use ($genderFilter) {
                $q->where('gender', $genderFilter);
            });
        }

        // Apply family member filter
        // Apply family member filter
        if ($familyMemberFilter) {
            $query->whereHas('familyMember', function ($q) use ($familyMemberFilter) {
                $q->where('relation', $familyMemberFilter);
            });
        }

        // Apply customer type filter (member, corporate, or guest)
        if ($customerTypeFilter === 'member') {
            $query->whereHas('invoice', function ($q) {
                $q->whereNotNull('member_id');
            });
        } elseif ($customerTypeFilter === 'corporate') {
            $query->whereHas('invoice', function ($q) {
                $q->whereNotNull('corporate_member_id');
            });
        } elseif ($customerTypeFilter === 'guest' || $guestTypeId) {
            $query->whereHas('invoice', function ($q) {
                $q->whereNotNull('customer_id');
            });
            if ($guestTypeId) {
                $query->whereHas('invoice.customer', function ($q) use ($guestTypeId) {
                    $q->where('guest_type_id', $guestTypeId);
                });
            }
        }

        // Apply subscription category filter
        if ($subscriptionCategoryFilter) {
            $query->where('subscription_category_id', $subscriptionCategoryFilter);
        }

        // Apply cashier filter (user who received payment)
        if ($cashierFilter) {
            $query->whereHas('invoice', function ($q) use ($cashierFilter) {
                $q->where('created_by', $cashierFilter);
            });
        }

        // Get paginated results (same 15 per page)
        $transactions = $query->orderBy('created_at', 'desc')->paginate(15, ['*'], 'page', $page);

        // Calculate statistics from all filtered transactions
        // Need to sum ITEM amounts now, or 'total'.
        $statsQuery = clone $query;
        // Optimization: Don't load relations for stats
        $statsQuery->with = [];

        $totalAmount = $statsQuery->sum('total');
        $totalTransactions = $statsQuery->count();
        $averageAmount = $totalTransactions > 0 ? round($totalAmount / $totalTransactions, 2) : 0;

        return Inertia::render('App/Admin/Membership/SportsSubscriptionsReportPrint', [
            'transactions' => $transactions,
            'statistics' => [
                'total_amount' => $totalAmount,
                'total_transactions' => $totalTransactions,
                'average_amount' => $averageAmount,
            ],
            'filters' => [
                'member_search' => $memberSearch,
                'membership_no_search' => $membershipNoSearch,
                'invoice_search' => $invoiceSearch,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'city' => $cityFilter,
                'payment_method' => $paymentMethodFilter,
                'categories' => $categoryFilter ?? [],
                'gender' => $genderFilter,
                'family_member' => $familyMemberFilter,
                'customer_type' => $customerTypeFilter,
                'subscription_category_id' => $subscriptionCategoryFilter,
                'cashier' => $cashierFilter,
            ],
            'all_categories' => MemberCategory::select('id', 'name')->get(),
        ]);
    }

    public function subscriptionsMaintenanceSummary(Request $request)
    {
        $data = $this->getSubscriptionMaintenanceSummaryData($request);
        return Inertia::render('App/Admin/Membership/SubscriptionsMaintenanceSummary', $data);
    }

    public function subscriptionsMaintenanceSummaryPrint(Request $request)
    {
        $data = $this->getSubscriptionMaintenanceSummaryData($request);
        return Inertia::render('App/Admin/Membership/SubscriptionsMaintenanceSummaryPrint', $data);
    }

    private function getSubscriptionMaintenanceSummaryData(Request $request)
    {
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $dateFromParsed = $this->parseDateToYmd($dateFrom);
        $dateToParsed = $this->parseDateToYmd($dateTo);
        $categoryFilter = $request->input('category');

        // Aggregated query for subscription and maintenance fees - using Items for Mixed support
        // We need to join invoice to get payment_method and status
        $query = \App\Models\FinancialInvoiceItem::join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->leftJoin('members', 'financial_invoices.member_id', '=', 'members.id')
            ->leftJoin('corporate_members', 'financial_invoices.corporate_member_id', '=', 'corporate_members.id')
            ->leftJoin('member_categories as member_categories_member', 'members.member_category_id', '=', 'member_categories_member.id')
            ->leftJoin('member_categories as member_categories_corporate', 'corporate_members.member_category_id', '=', 'member_categories_corporate.id')
            ->whereIn('financial_invoice_items.fee_type', ['5', '4'])  // 5 = Subscription, 4 = Maintenance
            ->where('financial_invoices.status', 'paid')
            ->selectRaw('
                COALESCE(member_categories_member.name, member_categories_corporate.name, "Guest") as category_name,
                financial_invoices.payment_method as payment_method,
                sum(financial_invoice_items.total) as total_amount
            ')
            ->groupByRaw('COALESCE(member_categories_member.name, member_categories_corporate.name, "Guest"), financial_invoices.payment_method');

        // Apply date range filter
        if ($dateFromParsed) {
            $query->whereDate(DB::raw('COALESCE(financial_invoices.payment_date, financial_invoices.created_at)'), '>=', $dateFromParsed);
        }
        if ($dateToParsed) {
            $query->whereDate(DB::raw('COALESCE(financial_invoices.payment_date, financial_invoices.created_at)'), '<=', $dateToParsed);
        }

        // Apply category filter
        if ($categoryFilter) {
            // Support array or single value for category filter
            if (is_array($categoryFilter)) {
                $query->where(function ($q) use ($categoryFilter) {
                    $q
                        ->whereIn('members.member_category_id', $categoryFilter)
                        ->orWhereIn('corporate_members.member_category_id', $categoryFilter);
                });
            } else {
                $query->where(function ($q) use ($categoryFilter) {
                    $q
                        ->where('members.member_category_id', $categoryFilter)
                        ->orWhere('corporate_members.member_category_id', $categoryFilter);
                });
            }
        }

        $aggregatedResults = $query->get();

        // Initialize summary structure with ALL categories
        $summary = [];
        $grandTotals = [
            'cash' => 0,
            'credit_card' => 0,
            'bank_online' => 0,
            'total' => 0
        ];

        // Get all categories and initialize them in summary
        $allCategoriesQuery = MemberCategory::select('id', 'name');

        // Apply category filter to the categories we show if filtered
        if ($categoryFilter) {
            if (is_array($categoryFilter)) {
                $allCategoriesQuery->whereIn('id', $categoryFilter);
            } else {
                $allCategoriesQuery->where('id', $categoryFilter);
            }
        }

        $allCategories = $allCategoriesQuery->get();

        // Initialize all categories in summary (even if they have no transactions)
        foreach ($allCategories as $category) {
            $summary[$category->name] = [
                'cash' => 0,
                'credit_card' => 0,
                'bank_online' => 0,
                'total' => 0
            ];
        }

        if (!$categoryFilter) {
            $summary['Guest'] = [
                'cash' => 0,
                'credit_card' => 0,
                'bank_online' => 0,
                'total' => 0,
            ];
        }

        foreach ($aggregatedResults as $result) {
            $categoryName = $result->category_name;
            // Handle null payment method safely
            $paymentMethod = strtolower((string) $result->payment_method);
            $amount = $result->total_amount;

            // Skip if category doesn't exist in summary
            if (!isset($summary[$categoryName])) {
                continue;
            }

            // Map payment methods - normalizing inputs
            if ($paymentMethod === 'cash') {
                $summary[$categoryName]['cash'] += $amount;
                $grandTotals['cash'] += $amount;
            } elseif (in_array($paymentMethod, ['credit_card', 'credit card', 'debit_card', 'debit card'])) {
                // Group Credit and Debit cards together
                $summary[$categoryName]['credit_card'] += $amount;
                $grandTotals['credit_card'] += $amount;
            } elseif (in_array($paymentMethod, ['bank_transfer', 'bank transfer', 'bank', 'online', 'bank_online', 'bank / online'])) {
                $summary[$categoryName]['bank_online'] += $amount;
                $grandTotals['bank_online'] += $amount;
            } elseif (in_array($paymentMethod, ['cheque', 'check'])) {
                $summary[$categoryName]['bank_online'] += $amount;
                $grandTotals['bank_online'] += $amount;
            } else {
                // Bank Transfer, Online, Cheque, etc.
                // Includes: 'online', 'cheque', 'bank transfer'
                $summary[$categoryName]['bank_online'] += $amount;
                $grandTotals['bank_online'] += $amount;
            }

            $summary[$categoryName]['total'] += $amount;
            $grandTotals['total'] += $amount;
        }

        // Get all categories for filter dropdown
        $allCategoriesForFilter = MemberCategory::select('id', 'name')->get();

        return [
            'summary' => $summary,
            'grand_totals' => $grandTotals,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'category' => $categoryFilter,
            ],
            'all_categories' => $allCategoriesForFilter,
        ];
    }

    public function pendingMaintenanceQuartersReport(Request $request)
    {
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $categoryFilter = $request->input('category');

        // Subquery for latest valid maintenance date using Items
        $latestMaintenance = \App\Models\FinancialInvoiceItem::select('financial_invoices.member_id', DB::raw('MAX(financial_invoice_items.end_date) as last_valid_date'))
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->where('financial_invoice_items.fee_type', '4')
            ->where('financial_invoices.status', 'paid')
            ->groupBy('financial_invoices.member_id');

        // Get all members with query optimization
        $membersQuery = Member::with(['memberCategory'])
            ->leftJoinSub($latestMaintenance, 'latest_maintenance', function ($join) {
                $join->on('members.id', '=', 'latest_maintenance.member_id');
            })
            ->select('members.*', 'latest_maintenance.last_valid_date')
            ->where('status', 'active');

        // Apply category filter
        if ($categoryFilter) {
            $membersQuery->where('member_category_id', $categoryFilter);
        }

        $members = $membersQuery->get();

        // Initialize summary structure with ALL categories
        $summary = [];
        $grandTotals = [
            '1_quarter_pending' => ['count' => 0, 'amount' => 0],
            '2_quarters_pending' => ['count' => 0, 'amount' => 0],
            '3_quarters_pending' => ['count' => 0, 'amount' => 0],
            '4_quarters_pending' => ['count' => 0, 'amount' => 0],
            '5_quarters_pending' => ['count' => 0, 'amount' => 0],
            '6_quarters_pending' => ['count' => 0, 'amount' => 0],
            'more_than_6_quarters_pending' => ['count' => 0, 'amount' => 0],
            'maintenance_fee_quarterly' => 0,
            'total_values' => 0
        ];

        // Get all categories and initialize them in summary
        $allCategoriesQuery = MemberCategory::select('id', 'name', 'subscription_fee');

        // Apply category filter to the categories we show
        if ($categoryFilter) {
            $allCategoriesQuery->where('id', $categoryFilter);
        }

        $allCategories = $allCategoriesQuery->get();

        // Initialize all categories in summary with count+amount structure
        foreach ($allCategories as $category) {
            $summary[$category->name] = [
                'category_id' => $category->id,
                '1_quarter_pending' => ['count' => 0, 'amount' => 0],
                '2_quarters_pending' => ['count' => 0, 'amount' => 0],
                '3_quarters_pending' => ['count' => 0, 'amount' => 0],
                '4_quarters_pending' => ['count' => 0, 'amount' => 0],
                '5_quarters_pending' => ['count' => 0, 'amount' => 0],
                '6_quarters_pending' => ['count' => 0, 'amount' => 0],
                'more_than_6_quarters_pending' => ['count' => 0, 'amount' => 0],
                'maintenance_fee_quarterly' => 0,  // Will be calculated dynamically
                'total_values' => 0,
                'total_quarters' => 0  // Track total quarters to calculate average fee
            ];
        }

        $asOfDate = $this->parseDateToYmd($dateTo) ?: now()->format('Y-m-d');
        $currentDate = \Carbon\Carbon::parse($asOfDate);

        foreach ($members as $member) {
            $categoryName = $member->memberCategory->name ?? 'Unknown';

            if (!isset($summary[$categoryName])) {
                continue;
            }

            // Calculate pending quarters efficiently in memory
            // Logic:
            // Use last_valid_date from subquery.
            // If exists, start date = last_valid_date.
            // If not, start date = membership_date or created_at.

            $coverageEnd = null;
            if ($member->last_valid_date) {
                $coverageEnd = \Carbon\Carbon::parse($member->last_valid_date);
            } else {
                $coverageEnd = $member->membership_date ? \Carbon\Carbon::parse($member->membership_date) : \Carbon\Carbon::parse($member->created_at);
            }

            $pendingQuarters = 0;
            if ($coverageEnd->lt($currentDate)) {
                $pendingMonths = $coverageEnd->diffInMonths($currentDate);
                $pendingQuarters = intdiv(max(0, $pendingMonths), 3) + 1;
            }

            if ($pendingQuarters > 0) {
                // Calculate pending amount for this member
                $monthlyFee = (float) ($member->total_maintenance_fee ?? 0);
                if ($monthlyFee <= 0) {
                    $monthlyFee = (float) ($member->maintenance_fee ?? 0);
                }
                if ($monthlyFee <= 0 && $member->memberCategory) {
                    $monthlyFee = (float) ($member->memberCategory->subscription_fee ?? 0);
                }
                $quarterlyFee = $monthlyFee * 3;
                $totalPendingAmount = $pendingQuarters * $quarterlyFee;

                // Determine bucket key
                $bucketKey = '';
                if ($pendingQuarters == 1) {
                    $bucketKey = '1_quarter_pending';
                } elseif ($pendingQuarters == 2) {
                    $bucketKey = '2_quarters_pending';
                } elseif ($pendingQuarters == 3) {
                    $bucketKey = '3_quarters_pending';
                } elseif ($pendingQuarters == 4) {
                    $bucketKey = '4_quarters_pending';
                } elseif ($pendingQuarters == 5) {
                    $bucketKey = '5_quarters_pending';
                } elseif ($pendingQuarters == 6) {
                    $bucketKey = '6_quarters_pending';
                } else {
                    $bucketKey = 'more_than_6_quarters_pending';
                }

                // Update count and amount for the bucket
                $summary[$categoryName][$bucketKey]['count']++;
                $summary[$categoryName][$bucketKey]['amount'] += $totalPendingAmount;
                $grandTotals[$bucketKey]['count']++;
                $grandTotals[$bucketKey]['amount'] += $totalPendingAmount;

                // Also update total values and quarters
                $summary[$categoryName]['total_values'] += $totalPendingAmount;
                $summary[$categoryName]['total_quarters'] += $pendingQuarters;
                $grandTotals['total_values'] += $totalPendingAmount;
            }
        }

        // Calculate effective average quarterly fee for each category
        foreach ($summary as $key => $data) {
            if ($data['total_quarters'] > 0) {
                $summary[$key]['maintenance_fee_quarterly'] = $data['total_values'] / $data['total_quarters'];
            }
        }

        // Set maintenance fee quarterly for grand totals
        if (!empty($summary)) {
            $fees = array_column($summary, 'maintenance_fee_quarterly');
            // Filter out 0 fees to avoid skewing average if needed, or just average all
            $fees = array_filter($fees, fn($f) => $f > 0);
            $grandTotals['maintenance_fee_quarterly'] = count($fees) > 0 ? array_sum($fees) / count($fees) : 0;
        }

        // Get all categories for filter dropdown
        $allCategoriesForFilter = MemberCategory::select('id', 'name')->get();

        return Inertia::render('App/Admin/Membership/PendingMaintenanceQuartersReport', [
            'summary' => $summary,
            'grand_totals' => $grandTotals,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'category' => $categoryFilter,
            ],
            'all_categories' => $allCategoriesForFilter,
            'all_statuses' => Member::distinct()->pluck('status')->filter()->values(),
        ]);
    }

    public function pendingMaintenanceQuartersReportPrint(Request $request)
    {
        $dateFrom = $request->input('date_from');
        $dateTo = $request->input('date_to');
        $categoryFilter = $request->input('category');

        // Subquery for latest valid maintenance date using Items
        $latestMaintenance = \App\Models\FinancialInvoiceItem::select('financial_invoices.member_id', DB::raw('MAX(financial_invoice_items.end_date) as last_valid_date'))
            ->join('financial_invoices', 'financial_invoice_items.invoice_id', '=', 'financial_invoices.id')
            ->where('financial_invoice_items.fee_type', '4')
            ->where('financial_invoices.status', 'paid')
            ->groupBy('financial_invoices.member_id');

        // Get all members with query optimization
        $membersQuery = Member::with(['memberCategory'])
            ->leftJoinSub($latestMaintenance, 'latest_maintenance', function ($join) {
                $join->on('members.id', '=', 'latest_maintenance.member_id');
            })
            ->select('members.*', 'latest_maintenance.last_valid_date')
            ->where('status', 'active');

        // Apply category filter
        if ($categoryFilter) {
            $membersQuery->where('member_category_id', $categoryFilter);
        }

        $members = $membersQuery->get();

        $summary = [];
        $grandTotals = [
            '1_quarter_pending' => ['count' => 0, 'amount' => 0],
            '2_quarters_pending' => ['count' => 0, 'amount' => 0],
            '3_quarters_pending' => ['count' => 0, 'amount' => 0],
            '4_quarters_pending' => ['count' => 0, 'amount' => 0],
            '5_quarters_pending' => ['count' => 0, 'amount' => 0],
            '6_quarters_pending' => ['count' => 0, 'amount' => 0],
            'more_than_6_quarters_pending' => ['count' => 0, 'amount' => 0],
            'maintenance_fee_quarterly' => 0,
            'total_values' => 0
        ];

        // Get all categories and initialize them in summary
        $allCategoriesQuery = MemberCategory::select('id', 'name', 'subscription_fee');

        // Apply category filter to the categories we show
        if ($categoryFilter) {
            $allCategoriesQuery->where('id', $categoryFilter);
        }

        $allCategories = $allCategoriesQuery->get();

        // Initialize all categories in summary with count+amount structure
        foreach ($allCategories as $category) {
            $summary[$category->name] = [
                'category_id' => $category->id,
                '1_quarter_pending' => ['count' => 0, 'amount' => 0],
                '2_quarters_pending' => ['count' => 0, 'amount' => 0],
                '3_quarters_pending' => ['count' => 0, 'amount' => 0],
                '4_quarters_pending' => ['count' => 0, 'amount' => 0],
                '5_quarters_pending' => ['count' => 0, 'amount' => 0],
                '6_quarters_pending' => ['count' => 0, 'amount' => 0],
                'more_than_6_quarters_pending' => ['count' => 0, 'amount' => 0],
                'maintenance_fee_quarterly' => 0,  // Will be calculated dynamically
                'total_values' => 0,
                'total_quarters' => 0  // Track total quarters
            ];
        }

        $asOfDate = $this->parseDateToYmd($dateTo) ?: now()->format('Y-m-d');
        $currentDate = \Carbon\Carbon::parse($asOfDate);

        foreach ($members as $member) {
            $categoryName = $member->memberCategory->name ?? 'Unknown';

            if (!isset($summary[$categoryName])) {
                continue;
            }

            $coverageEnd = null;
            if ($member->last_valid_date) {
                $coverageEnd = \Carbon\Carbon::parse($member->last_valid_date);
            } else {
                $coverageEnd = $member->membership_date ? \Carbon\Carbon::parse($member->membership_date) : \Carbon\Carbon::parse($member->created_at);
            }

            $pendingQuarters = 0;
            if ($coverageEnd->lt($currentDate)) {
                $pendingMonths = $coverageEnd->diffInMonths($currentDate);
                $pendingQuarters = intdiv(max(0, $pendingMonths), 3) + 1;
            }

            if ($pendingQuarters > 0) {
                $bucketKey = '';
                if ($pendingQuarters == 1) {
                    $bucketKey = '1_quarter_pending';
                } elseif ($pendingQuarters == 2) {
                    $bucketKey = '2_quarters_pending';
                } elseif ($pendingQuarters == 3) {
                    $bucketKey = '3_quarters_pending';
                } elseif ($pendingQuarters == 4) {
                    $bucketKey = '4_quarters_pending';
                } elseif ($pendingQuarters == 5) {
                    $bucketKey = '5_quarters_pending';
                } elseif ($pendingQuarters == 6) {
                    $bucketKey = '6_quarters_pending';
                } else {
                    $bucketKey = 'more_than_6_quarters_pending';
                }

                $monthlyFee = (float) ($member->total_maintenance_fee ?? 0);
                if ($monthlyFee <= 0) {
                    $monthlyFee = (float) ($member->maintenance_fee ?? 0);
                }
                if ($monthlyFee <= 0 && $member->memberCategory) {
                    $monthlyFee = (float) ($member->memberCategory->subscription_fee ?? 0);
                }
                $quarterlyFee = $monthlyFee * 3;
                $totalPendingAmount = $pendingQuarters * $quarterlyFee;

                $summary[$categoryName][$bucketKey]['count']++;
                $summary[$categoryName][$bucketKey]['amount'] += $totalPendingAmount;
                $grandTotals[$bucketKey]['count']++;
                $grandTotals[$bucketKey]['amount'] += $totalPendingAmount;
                $summary[$categoryName]['total_values'] += $totalPendingAmount;
                $summary[$categoryName]['total_quarters'] += $pendingQuarters;
                $grandTotals['total_values'] += $totalPendingAmount;
            }
        }

        // Calculate effective average quarterly fee for each category
        foreach ($summary as $key => $data) {
            if ($data['total_quarters'] > 0) {
                $summary[$key]['maintenance_fee_quarterly'] = $data['total_values'] / $data['total_quarters'];
            }
        }

        // Set maintenance fee quarterly for grand totals
        if (!empty($summary)) {
            $fees = array_column($summary, 'maintenance_fee_quarterly');
            $fees = array_filter($fees, fn($f) => $f > 0);
            $grandTotals['maintenance_fee_quarterly'] = count($fees) > 0 ? array_sum($fees) / count($fees) : 0;
        }

        // Get all categories for filter dropdown
        $allCategoriesForFilter = MemberCategory::select('id', 'name')->get();

        return Inertia::render('App/Admin/Membership/PendingMaintenanceQuartersReportPrint', [
            'summary' => $summary,
            'grand_totals' => $grandTotals,
            'filters' => [
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'category' => $categoryFilter,
            ],
            'all_categories' => $allCategoriesForFilter,
        ]);
    }

    private function calculatePendingQuarters($member, $dateFrom = null, $dateTo = null)
    {
        // Get member's maintenance fee transactions
        $query = FinancialInvoice::where('member_id', $member->id)
            ->where('fee_type', '4')
            ->where('status', 'paid');

        // Apply date filters if provided
        if ($dateFrom) {
            $query->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate(DB::raw('COALESCE(issue_date, created_at)'), '<=', $dateTo);
        }

        $paidTransactions = $query->get();

        // Calculate quarters since membership started
        $membershipDate = \Carbon\Carbon::parse($member->membership_date);
        $currentDate = now();
        $quartersSinceMembership = $membershipDate->diffInMonths($currentDate) / 3;
        $totalQuartersExpected = floor($quartersSinceMembership);

        // Count paid quarters
        $paidQuarters = $paidTransactions->count();

        // Calculate pending quarters
        $pendingQuarters = max(0, $totalQuartersExpected - $paidQuarters);

        return min($pendingQuarters, 10);  // Cap at 10 for display purposes
    }

    public function reportsIndex()
    {
        $reports = [
            [
                'id' => 1,
                'title' => 'Maintenance Fee Revenue',
                'description' => 'View maintenance fee revenue by member categories with payment statistics',
                'icon' => 'AttachMoney',
                'color' => '#063455',
                'route' => 'membership.maintanance-fee-revenue',
                'stats' => 'Revenue Analysis'
            ],
            [
                'id' => 2,
                'title' => 'Pending Maintenance Report',
                'description' => 'Track members with pending maintenance fee payments',
                'icon' => 'Schedule',
                'color' => '#063455',
                'route' => 'membership.pending-maintenance-report',
                'stats' => 'Payment Tracking'
            ],
            [
                'id' => 3,
                'title' => 'Monthly Maintenance Fee Report',
                'description' => 'Monthly breakdown of maintenance fee transactions',
                'icon' => 'CalendarMonth',
                'color' => '#063455',
                'route' => 'membership.monthly-maintenance-fee-report',
                'stats' => 'Monthly Analysis'
            ],
            [
                'id' => 4,
                'title' => 'Sports Subscriptions Report',
                'description' => 'Track sports facility subscriptions and family member usage',
                'icon' => 'FitnessCenter',
                'color' => '#063455',
                'route' => 'membership.sports-subscriptions-report',
                'stats' => 'Sports Analytics'
            ],
            [
                'id' => 5,
                'title' => 'New Year Eve Report',
                'description' => 'Special event fee collections and member participation',
                'icon' => 'Celebration',
                'color' => '#063455',
                'route' => 'membership.new-year-eve-report',
                'stats' => 'Event Revenue'
            ],
            [
                'id' => 6,
                'title' => 'Reinstating Fee Report',
                'description' => 'Track member reactivation fees and reinstatement process',
                'icon' => 'Refresh',
                'color' => '#063455',
                'route' => 'membership.reinstating-fee-report',
                'stats' => 'Reactivation Tracking'
            ],
            [
                'id' => 7,
                'title' => 'MEMBER REVENUE BY PAYMENT METHOD REPORT',
                'description' => 'Category-wise revenue summary by payment methods',
                'icon' => 'Assessment',
                'color' => '#063455',
                'route' => 'membership.subscriptions-maintenance-summary',
                'stats' => 'Revenue Summary'
            ],
            [
                'id' => 8,
                'title' => 'Pending Maintenance Quarters Summary (Category-wise)',
                'description' => 'Quarter-wise analysis of pending maintenance payments by category',
                'icon' => 'Timeline',
                'color' => '#063455',
                'route' => 'membership.pending-maintenance-quarters-report',
                'stats' => 'Quarter Analysis'
            ],
            [
                'id' => 9,
                'title' => 'Supplementary Card Report',
                'description' => 'Track supplementary membership cards and family members',
                'icon' => 'CreditCard',
                'color' => '#063455',
                'route' => 'membership.supplementary-card-report',
                'stats' => 'Card Management'
            ],
            [
                'id' => 10,
                'title' => 'Sleeping Members Report',
                'description' => 'Identify inactive members and dormant accounts',
                'icon' => 'PersonOff',
                'color' => '#063455',
                'route' => 'membership.sleeping-members-report',
                'stats' => 'Member Activity'
            ],
            [
                'id' => 11,
                'title' => 'Member Card Detail Report',
                'description' => 'Detailed member card information and status tracking',
                'icon' => 'Badge',
                'color' => '#063455',
                'route' => 'membership.member-card-detail-report',
                'stats' => 'Card Details'
            ]
        ];

        return Inertia::render('App/Admin/Membership/ReportsIndex', [
            'reports' => $reports
        ]);
    }
}
