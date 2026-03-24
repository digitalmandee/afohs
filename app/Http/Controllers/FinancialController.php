<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Models\AccountingEventQueue;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\FinancialReceipt;
use App\Models\JournalEntry;
use App\Models\Member;
use App\Models\MemberCategory;
use App\Models\Tenant;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Models\TransactionType;
use App\Models\User;
use App\Services\Accounting\Support\AccountingSourceResolver;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinancialController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:financial.dashboard.view')->only('index');
        $this->middleware('permission:financial.view')->only('getAllTransactions', 'fetchRevenue', 'getMemberInvoices');
    }

    public function index(Request $request)
    {
        $perPage = $this->resolvePerPage($request, 10);
        // Member Statistics
        $totalMembers = Member::whereNull('parent_id')->count();
        $activeMembers = Member::whereNull('parent_id')->where('status', 'active')->count();
        $expiredMembers = Member::whereNull('parent_id')->where('status', 'expired')->count();
        $canceledMembers = Member::whereNull('parent_id')->whereIn('status', ['cancelled', 'suspended', 'terminated'])->count();

        // Transaction Statistics
        $totalTransactions = FinancialInvoice::count();

        // Revenue Breakdown using Item-Level Transactions (Credits)
        // Group by TransactionType->type field matching AppConstants
        $revenueByType = DB::table('transactions')
            ->join('financial_invoice_items', 'transactions.reference_id', '=', 'financial_invoice_items.id')
            ->join('transaction_types', 'financial_invoice_items.fee_type', '=', 'transaction_types.id')
            ->where('transactions.reference_type', 'App\Models\FinancialInvoiceItem')
            ->where('transactions.type', 'credit')
            ->select('transaction_types.type', DB::raw('sum(transactions.amount) as total'))
            ->groupBy('transaction_types.type')
            ->pluck('total', 'type');

        $membershipFeeRevenue = $revenueByType[AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP] ?? 0;
        $maintenanceFeeRevenue = $revenueByType[AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE] ?? 0;
        $subscriptionFeeRevenue = $revenueByType[AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION] ?? 0;

        // Reinstating Fee - specific lookup by name if needed, assuming it falls under Type 6 (Financial Charge) or similar
        // For now, we will try to find it by name for legacy support compatibility
        $reinstatingTypeId = \App\Models\TransactionType::where('name', 'Reinstating Fee')->value('id');
        $reinstatingFeeRevenue = 0;
        if ($reinstatingTypeId) {
            $reinstatingFeeRevenue = DB::table('transactions')
                ->join('financial_invoice_items', 'transactions.reference_id', '=', 'financial_invoice_items.id')
                ->where('transactions.reference_type', 'App\Models\FinancialInvoiceItem')
                ->where('transactions.type', 'credit')
                ->where('financial_invoice_items.fee_type', $reinstatingTypeId)
                ->sum('transactions.amount');
        }

        $totalMembershipRevenue = $membershipFeeRevenue + $maintenanceFeeRevenue + $subscriptionFeeRevenue + $reinstatingFeeRevenue;

        // Booking Revenue - Still relying on Invoice Type for now as migration continues
        $roomRevenue = FinancialInvoice::where('status', 'paid')  // approximate
            ->where('invoice_type', 'room_booking')
            ->sum('total_price');

        $eventRevenue = FinancialInvoice::where('status', 'paid')  // approximate
            ->where('invoice_type', 'event_booking')
            ->sum('total_price');

        $totalBookingRevenue = $roomRevenue + $eventRevenue;

        // Food Revenue
        $foodRevenue = FinancialInvoice::where('status', 'paid')
            ->where('invoice_type', 'food_order')
            ->sum('total_price');

        // Total Collected Revenue
        $totalRevenue = DB::table('transactions')
            ->where('type', 'credit')
            ->sum('amount');

        // Recent transactions
        $recentTransactions = FinancialInvoice::with([
            'member:id,full_name,membership_no,mobile_number_a',
            'corporateMember:id,full_name,membership_no',
            'customer:id,name,email',
            'createdBy:id,name',
            'items.transactions'  // Load item transactions
        ])
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $recentTransactions->setCollection($this->decorateInvoices($recentTransactions->getCollection()));

        $byStatus = FinancialInvoice::query()
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $journalLinkedIds = JournalEntry::query()
            ->whereIn('module_type', ['financial_invoice', 'membership_invoice', 'subscription_invoice', 'pos_invoice', 'room_invoice', 'event_invoice'])
            ->pluck('module_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $postedEventIds = AccountingEventQueue::query()
            ->where('source_type', FinancialInvoice::class)
            ->where('status', 'posted')
            ->pluck('source_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $failedEventIds = AccountingEventQueue::query()
            ->where('source_type', FinancialInvoice::class)
            ->where('status', 'failed')
            ->pluck('source_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $pendingEventIds = AccountingEventQueue::query()
            ->where('source_type', FinancialInvoice::class)
            ->where('status', 'pending')
            ->pluck('source_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $linkedInvoiceIds = $journalLinkedIds->merge($postedEventIds)->unique()->values();
        $inFlightInvoiceIds = $failedEventIds->merge($pendingEventIds)->unique()->values();
        $unlinkedCount = max(0, $totalTransactions - $linkedInvoiceIds->count() - $inFlightInvoiceIds->count());
        $coveragePercent = $totalTransactions > 0
            ? round(($linkedInvoiceIds->count() / $totalTransactions) * 100, 1)
            : 0;

        return Inertia::render('App/Admin/Finance/Dashboard', [
            'statistics' => [
                'total_members' => $totalMembers,
                'active_members' => $activeMembers,
                'expired_members' => $expiredMembers,
                'canceled_members' => $canceledMembers,
                'total_revenue' => $totalRevenue,
                'total_transactions' => $totalTransactions,
                'membership_fee_revenue' => $membershipFeeRevenue,
                'maintenance_fee_revenue' => $maintenanceFeeRevenue,
                'subscription_fee_revenue' => $subscriptionFeeRevenue,
                'reinstating_fee_revenue' => $reinstatingFeeRevenue,
                'total_membership_revenue' => $totalMembershipRevenue,
                'room_revenue' => $roomRevenue,
                'event_revenue' => $eventRevenue,
                'total_booking_revenue' => $totalBookingRevenue,
                'food_revenue' => $foodRevenue,
                'paid_invoices' => (int) ($byStatus['paid'] ?? 0),
                'open_invoices' => (int) (($byStatus['unpaid'] ?? 0) + ($byStatus['partial'] ?? 0) + ($byStatus['overdue'] ?? 0)),
                'failed_postings' => AccountingEventQueue::query()
                    ->where('source_type', FinancialInvoice::class)
                    ->where('status', 'failed')
                    ->count(),
                'pending_postings' => AccountingEventQueue::query()
                    ->where('source_type', FinancialInvoice::class)
                    ->where('status', 'pending')
                    ->count(),
                'linked_invoices' => $linkedInvoiceIds->count(),
                'unlinked_invoices' => $unlinkedCount,
                'integration_coverage_percent' => $coveragePercent,
            ],
            'recent_transactions' => $recentTransactions,
            'transaction_filters' => $request->only(['per_page']),
        ]);
    }

    public function fetchRevenue()
    {
        // Similar update for fetchRevenue endpoint if used by charts
        $totalRevenue = DB::table('transactions')->where('type', 'credit')->sum('amount');

        return response()->json([
            'totalRevenue' => $totalRevenue,
        ]);
    }

    public function getAllTransactions(Request $request)
    {
        $perPage = $this->resolvePerPage($request, 25);
        $search = $request->input('search', '');

        // Capture new filters for passing back to view
        $filters = $request->only(['status', 'type', 'start_date', 'end_date', 'created_by', 'customer_type', 'membership_no', 'member_name', 'invoice_no']);

        $query = FinancialInvoice::with([
            'member:id,full_name,membership_no,mobile_number_a',
            'corporateMember:id,full_name,membership_no',
            'customer:id,name,email',
            'createdBy:id,name',
            'invoiceable',
            'items.transactions'  // Eager load items and their transactions
        ]);

        // Apply Status Filter (supports comma-separated)
        if ($request->filled('status') && $request->status !== 'all') {
            $statuses = explode(',', $request->status);
            $query->whereIn('status', $statuses);
        }

        // Apply Mixed Fee Type Filter
        if ($request->filled('type') && $request->type !== 'all') {
            $selectedValues = explode(',', $request->type);

            $typeIds = [];
            $subIds = [];
            $chargeIds = [];

            foreach ($selectedValues as $val) {
                if (str_starts_with($val, 'sub_')) {
                    $subIds[] = substr($val, 4);
                } elseif (str_starts_with($val, 'charge_')) {
                    $chargeIds[] = substr($val, 7);
                } elseif (str_starts_with($val, 'type_')) {
                    $typeIds[] = substr($val, 5);
                } else {
                    // Fallback for legacy simple IDs (though frontend should send prefixes)
                    // If it's just a number, assume it's a type ID
                    if (is_numeric($val)) {
                        $typeIds[] = $val;
                    }
                }
            }

            $query->where(function ($q) use ($typeIds, $subIds, $chargeIds) {
                // Main Transaction Types
                if (!empty($typeIds)) {
                    $q->orWhere(function ($subQ) use ($typeIds) {
                        $subQ
                            ->whereIn('fee_type', $typeIds)
                            ->orWhereIn('invoice_type', $typeIds)
                            ->orWhereHas('items', function ($itemQ) use ($typeIds) {
                                $itemQ->whereIn('fee_type', $typeIds);
                            });
                    });
                }

                // Subscription Categories
                if (!empty($subIds)) {
                    $q->orWhereHas('items', function ($itemQ) use ($subIds) {
                        $itemQ->whereIn('subscription_type_id', $subIds);
                    });
                }

                // Financial Charges
                if (!empty($chargeIds)) {
                    $q->orWhereHas('items', function ($itemQ) use ($chargeIds) {
                        $itemQ->whereIn('financial_charge_type_id', $chargeIds);
                    });
                }
            });
        }

        /*
         * Removed separate 'subscription_category_id' and 'financial_charge_type_id' filters
         * as they are now merged into the main 'type' filter.
         */

        // Apply Created By Filter
        if ($request->filled('created_by') && $request->created_by !== 'all') {
            $creators = explode(',', $request->created_by);
            $query->whereIn('created_by', $creators);
        }

        // Apply Invoice No Filter
        if ($request->filled('invoice_no')) {
            $query->where('invoice_no', 'like', "%{$request->invoice_no}%");
        }

        // Apply Customer Type & Membership No Filter
        $customerType = $request->input('customer_type', 'all');
        $membershipNo = trim($request->input('membership_no'));
        $memberName = trim($request->input('member_name'));

        if ($customerType !== 'all') {
            if ($customerType === 'member') {
                $query->whereNotNull('member_id');
            } elseif ($customerType === 'corporate') {
                $query->whereNotNull('corporate_member_id');
            } elseif ($customerType === 'guest') {
                $query->whereNotNull('customer_id');
            }
        }

        if ($membershipNo) {
            $query->where(function ($q) use ($membershipNo) {
                $q->whereHas('member', function ($m) use ($membershipNo) {
                    $m->where('membership_no', 'like', "%{$membershipNo}%");
                })->orWhereHas('corporateMember', function ($cm) use ($membershipNo) {
                    $cm->where('membership_no', 'like', "%{$membershipNo}%");
                })->orWhereHas('customer', function ($c) use ($membershipNo) {
                    $c->where('customer_no', 'like', "%{$membershipNo}%");
                });
            });
        }

        if ($memberName) {
            $query->where(function ($q) use ($memberName) {
                $q->whereHas('member', function ($m) use ($memberName) {
                    $m->where('full_name', 'like', "%{$memberName}%");
                })->orWhereHas('corporateMember', function ($cm) use ($memberName) {
                    $cm->where('full_name', 'like', "%{$memberName}%");
                })->orWhereHas('customer', function ($c) use ($memberName) {
                    $c->where('name', 'like', "%{$memberName}%");
                });
            });
        }

        // Apply date range filter (matches "Date" column in table: issue_date, fallback to created_at)
        $start = $request->input('start_date');
        $end = $request->input('end_date');
        if ($start || $end) {
            $query->where(function ($q) use ($start, $end) {
                $q->where(function ($q2) use ($start, $end) {
                    $q2->whereNotNull('issue_date');
                    if ($start && $end) {
                        $q2->whereBetween('issue_date', [$start . ' 00:00:00', $end . ' 23:59:59']);
                    } elseif ($start) {
                        $q2->whereDate('issue_date', '>=', $start);
                    } elseif ($end) {
                        $q2->whereDate('issue_date', '<=', $end);
                    }
                })->orWhere(function ($q2) use ($start, $end) {
                    $q2->whereNull('issue_date');
                    if ($start && $end) {
                        $q2->whereBetween('created_at', [$start . ' 00:00:00', $end . ' 23:59:59']);
                    } elseif ($start) {
                        $q2->whereDate('created_at', '>=', $start);
                    } elseif ($end) {
                        $q2->whereDate('created_at', '<=', $end);
                    }
                });
            });
        }

        // Apply general search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q
                    ->where('invoice_no', 'like', "%{$search}%")
                    ->orWhere('payment_method', 'like', "%{$search}%")
                    ->orWhere('invoice_type', 'like', "%{$search}%")
                    ->orWhereHas('member', function ($q) use ($search) {
                        $q
                            ->where('full_name', 'like', "%{$search}%")
                            ->orWhere('membership_no', 'like', "%{$search}%");
                    })
                    ->orWhereHas('customer', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('items', function ($q) use ($search) {
                        $q
                            ->where('fee_type', 'like', "%{$search}%")  // User mentioned fee_type in items, adding this check
                            ->orWhere('description', 'like', "%{$search}%");
                    });
            });
        }

        $transactions = $query->latest()->paginate($perPage)->withQueryString();

        // Get limited transaction types (IDs 1-7)
        $mainTypeIds = [
            AppConstants::TRANSACTION_TYPE_ID_ROOM_BOOKING,
            AppConstants::TRANSACTION_TYPE_ID_EVENT_BOOKING,
            AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP,
            AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE,
            AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION,
            AppConstants::TRANSACTION_TYPE_ID_FINANCIAL_CHARGE,
            AppConstants::TRANSACTION_TYPE_ID_FOOD_ORDER
        ];
        $transactionTypes = \App\Models\TransactionType::whereIn('id', $mainTypeIds)->pluck('name', 'id')->toArray();

        // Fetch Subtables for Filters
        $subscriptionCategories = \App\Models\SubscriptionCategory::where('status', 'active')->select('id', 'name')->get();
        $financialChargeTypes = \App\Models\FinancialChargeType::where('status', 'active')->select('id', 'name')->get();

        // Transform transactions
        $transactions->setCollection($this->decorateInvoices($transactions->getCollection(), $transactionTypes));

        $summaryQuery = clone $query;
        $summaryRows = $summaryQuery->get();
        $summaryRows = $this->decorateInvoices($summaryRows, $transactionTypes);
        $summary = [
            'count' => $summaryRows->count(),
            'total_amount' => (float) $summaryRows->sum(fn ($invoice) => (float) ($invoice->total_price ?? 0)),
            'paid_amount' => (float) $summaryRows->sum(fn ($invoice) => (float) ($invoice->paid_amount ?? 0)),
            'balance' => (float) $summaryRows->sum(fn ($invoice) => (float) ($invoice->balance ?? 0)),
            'failed_postings' => (int) $summaryRows->where('posting_status', 'failed')->count(),
            'pending_postings' => (int) $summaryRows->where('posting_status', 'pending')->count(),
        ];

        return Inertia::render('App/Admin/Finance/Transaction', [
            'transactions' => $transactions,
            'filters' => array_merge([
                'search' => $search,
                'per_page' => $perPage,
                'status' => $request->input('status', 'all'),
                'type' => $request->input('type', 'all'),
                'subscription_category_id' => $request->input('subscription_category_id'),
                'financial_charge_type_id' => $request->input('financial_charge_type_id'),
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date'),
            ], $filters),
            'summary' => $summary,
            'users' => \App\Models\User::select('id', 'name')->orderBy('name')->get(),
            'transactionTypes' => $transactionTypes,
            'subscriptionCategories' => $subscriptionCategories,
            'financialChargeTypes' => $financialChargeTypes,
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    private function decorateInvoices($invoices, array $transactionTypes = [])
    {
        $sourceResolver = app(AccountingSourceResolver::class);
        $collection = collect($invoices);

        if ($collection->isEmpty()) {
            return $collection;
        }

        if (empty($transactionTypes)) {
            $transactionTypes = TransactionType::query()->pluck('name', 'id')->toArray();
        }

        $invoiceIds = $collection->pluck('id')->all();
        $events = AccountingEventQueue::query()
            ->with('restaurant:id,name')
            ->where('source_type', FinancialInvoice::class)
            ->whereIn('source_id', $invoiceIds)
            ->latest('updated_at')
            ->get()
            ->groupBy('source_id');

        $journals = JournalEntry::query()
            ->whereIn('module_type', ['financial_invoice', 'membership_invoice', 'subscription_invoice', 'pos_invoice', 'room_invoice', 'event_invoice'])
            ->whereIn('module_id', $invoiceIds)
            ->get()
            ->groupBy('module_id');

        return $collection->map(function ($invoice) use ($events, $journals, $transactionTypes) {
            $resolveType = function ($type) use ($transactionTypes) {
                if (isset($transactionTypes[$type])) {
                    return $transactionTypes[$type];
                }

                return ucwords(str_replace('_', ' ', (string) $type));
            };

            if ($invoice->items && $invoice->items->count() > 0) {
                $types = $invoice->items->pluck('fee_type')->filter()->unique();
                if ($types->count() === 1) {
                    $invoice->fee_type_formatted = $resolveType($types->first());
                } elseif ($types->count() > 1) {
                    $invoice->fee_type_formatted = 'Multiple Items';
                } else {
                    $invoice->fee_type_formatted = $resolveType($invoice->fee_type ?? $invoice->invoice_type);
                }
            } else {
                $invoice->fee_type_formatted = $resolveType($invoice->fee_type ?? $invoice->invoice_type);
            }

            $paid = $invoice->items
                ? $invoice->items->sum(fn ($item) => $item->transactions->where('type', 'credit')->sum('amount'))
                : (float) ($invoice->paid_amount ?? 0);

            $invoice->paid_amount = $paid;
            $invoice->balance = max(0, (float) ($invoice->total_price ?? 0) - (float) $paid);

            $event = $events->get($invoice->id)?->first();
            $journal = $journals->get($invoice->id)?->first();
            $restaurantId = $event?->restaurant_id ?? data_get($invoice, 'data.restaurant_id') ?? data_get($invoice, 'invoiceable.tenant_id');
            $restaurantName = $event?->restaurant?->name;
            $source = $sourceResolver->resolveForFinancialInvoice($invoice, $event, $journal);
            $invoice->posting_status = $source['posting_status'];
            $invoice->journal_entry_id = $source['journal_entry_id'];
            $invoice->source_module = $source['source_module'];
            $invoice->source_label = $source['source_label'];
            $invoice->source_type = $source['source_type'];
            $invoice->source_id = $source['source_id'];
            $invoice->restaurant_id = $source['restaurant_id'] ?? $restaurantId;
            $invoice->restaurant_name = $source['restaurant_name'] ?? $restaurantName;
            $invoice->document_no = $source['document_no'];
            $invoice->document_url = $source['document_url'];
            $invoice->failure_reason = $source['failure_reason'];
            $invoice->source_resolution_status = $source['source_resolution_status'];

            return $invoice;
        });
    }

    private function resolvePerPage(Request $request, int $default = 25): int
    {
        $perPage = (int) $request->input('per_page', $default);

        return in_array($perPage, [10, 25, 50, 100], true) ? $perPage : $default;
    }

    // Get Member Invoices - Accepts either member_id or invoice_id
    public function getFinancialInvoices($id)
    {
        // Common relations to load
        $relations = [
            'member',
            'member.memberType',
            'corporateMember',
            'customer',
            'customer.guestType',
            'subscriptionType',
            'subscriptionCategory',
            'invoiceable',
            'items.transactions',
        ];

        // 1. Try to find by invoice ID directly
        $invoice = FinancialInvoice::with($relations)->find($id);

        // 2. If not found by invoice ID, try to find by member ID (latest membership invoice)
        if (!$invoice) {
            $invoice = FinancialInvoice::where('member_id', $id)
                ->where('invoice_type', 'membership')
                ->with($relations)
                ->latest()
                ->first();
        }

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        // Load family members count if member exists
        if ($invoice->member) {
            $invoice->member->loadCount('familyMembers');
        } elseif ($invoice->corporateMember) {
            $invoice->corporateMember->loadCount('familyMembers');
        }

        if ($invoice->items) {
            $invoice->items->each(function ($item) {
                $item->paid_amount = $item->transactions
                    ->where('type', 'credit')
                    ->sum('amount');
            });

            $paid = $invoice->items->sum(function ($item) {
                return $item->transactions->where('type', 'credit')->sum('amount');
            });
            $invoice->paid_amount = $paid;
            $invoice->customer_charges = max(0, (float) ($invoice->total_price ?? 0) - (float) $paid);
        }

        $batchKey = data_get($invoice->data, 'pm_batch');
        if (!empty($batchKey) && $invoice->member_id) {
            $related = FinancialInvoice::with(['items.transactions'])
                ->where('member_id', $invoice->member_id)
                ->where('data->pm_batch', $batchKey)
                ->whereNotIn('status', ['cancelled', 'refunded'])
                ->orderBy('valid_from')
                ->get()
                ->map(function ($inv) {
                    if ($inv->items) {
                        $inv->items->each(function ($item) {
                            $item->paid_amount = $item->transactions
                                ->where('type', 'credit')
                                ->sum('amount');
                        });

                        $paid = $inv->items->sum(function ($item) {
                            return $item->transactions->where('type', 'credit')->sum('amount');
                        });
                        $inv->paid_amount = $paid;
                        $inv->customer_charges = max(0, (float) ($inv->total_price ?? 0) - (float) $paid);
                    }

                    $firstItem = $inv->items ? $inv->items->first() : null;
                    $description = $firstItem?->description;
                    if (!$description) {
                        $description = 'Maintenance Fee (Pending)';
                    }

                    return [
                        'id' => $inv->id,
                        'invoice_no' => $inv->invoice_no,
                        'description' => $description,
                        'status' => $inv->status,
                        'issue_date' => $inv->issue_date,
                        'payment_method' => $inv->payment_method,
                        'total_price' => $inv->total_price,
                        'paid_amount' => $inv->paid_amount,
                        'customer_charges' => $inv->customer_charges,
                        'start_date' => $firstItem?->start_date ?: $inv->valid_from,
                        'end_date' => $firstItem?->end_date ?: $inv->valid_to,
                    ];
                })
                ->values();

            $invoice->related_invoices = $related;
        }

        return response()->json(['invoice' => $invoice]);
    }

    public function status($memberId)
    {
        $year = now()->year;

        // Fetch invoices for this member & membership type
        $invoices = FinancialInvoice::where('member_id', $memberId)
            ->where('invoice_type', 'membership')
            ->whereYear('issue_date', $year)
            ->get();

        // quarter paid
        $paid_quarters = $invoices
            ->where('subscription_type', 'quarter')
            ->pluck('paid_for_quarter')
            ->unique()
            ->sort()
            ->values()
            ->all();

        // Monthly paid: group by quarter
        $paid_months = $invoices
            ->where('subscription_type', 'monthly')
            ->pluck('paid_for_month')
            ->unique()
            ->values()
            ->all();
        $paid_months = array_map(fn($m) => (int) $m, $paid_months);
        $paid_quarters_from_m = collect($paid_months)
            ->map(fn($m) => ceil($m / 3))
            ->unique()
            ->values()
            ->all();

        // Combine quarter paid from both
        $paid_quarters = array_unique(array_merge($paid_quarters, $paid_quarters_from_m));
        sort($paid_quarters);

        // All quarters 1-4
        $all = [1, 2, 3, 4];
        $remaining = array_values(array_diff($all, $paid_quarters));

        $currentQuarter = ceil(now()->month / 3);

        // Mark statuses
        $statuses = array_map(fn($q) => [
            'quarter' => $q,
            'paid' => in_array($q, $paid_quarters),
            'overdue' => !$thisYear = false,
            'from_monthly_missing' => $this->checkMonthlyMissing($q, $paid_months),
        ], $all);

        foreach ($statuses as &$st) {
            $st['overdue'] = (!$st['paid']) && $st['quarter'] < $currentQuarter;
        }

        return response()->json([
            'statuses' => $statuses,
            'remaining' => $remaining,
            'current_quarter' => $currentQuarter,
        ]);
    }

    private function checkMonthlyMissing($quart, $paid_months)
    {
        // For a quarter block, check months are all paid
        $start = ($quart - 1) * 3 + 1;
        $block = range($start, 3 * $quart);
        return !empty(array_diff($block, $paid_months));
    }

    public function createInvoices(Request $req, $memberId)
    {
        $quarters = $req->quarters;  // e.g. [2,3]
        $month = now()->month;
        $year = now()->year;
        $user = User::findOrFail($memberId);
        $fee = $user->member->memberCategory->subscription_fee;

        foreach ($quarters as $q) {
            // Create one invoice per quarter
            $invoice = FinancialInvoice::create([
                'member_id' => $memberId,
                'invoice_type' => 'membership',
                'subscription_type' => 'quarter',
                'amount' => 3 * $fee,
                'issue_date' => now(),
                'due_date' => now()->endOfQuarter(),
                'paid_for_quarter' => $q,
                'status' => 'unpaid',
            ]);

            // ✅ Create Invoice Item
            FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP,
                'description' => 'Quarterly Membership Fee (Q' . $q . ')',
                'qty' => 1,
                'amount' => 3 * $fee,
                'sub_total' => 3 * $fee,
                'total' => 3 * $fee,
            ]);

            // ✅ Ledger Logic (Debit Transaction) per Quarter Invoice
            Transaction::create([
                'type' => 'debit',
                'amount' => 3 * $fee,
                'date' => now(),
                'description' => 'Quarterly Membership Invoice #' . $invoice->invoice_no,
                'payable_type' => \App\Models\Member::class,
                'payable_id' => $memberId,
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
                'created_by' => Auth::id(),
            ]);

            // ✅ Ledger Logic (Debit Transaction) per Quarter Invoice
            Transaction::create([
                'type' => 'debit',
                'amount' => 3 * $fee,
                'date' => now(),
                'description' => 'Quarterly Membership Invoice #' . $invoice->invoice_no,
                'payable_type' => \App\Models\Member::class,
                'payable_id' => $memberId,  // Assuming this is member->id not user_id, based on usage '$user->member->memberCategory'
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
                'created_by' => Auth::id(),  // Note: $req->user()->id if Auth::id() is not set in API context, but assumed ok
            ]);
        }

        return response()->json(['success' => true]);
    }

    public function searchInvoices(Request $request)
    {
        $query = $request->input('query');

        if (empty($query)) {
            return response()->json([]);
        }

        $invoices = FinancialInvoice::with(['member', 'corporateMember', 'customer'])
            ->where('invoice_no', 'like', "%{$query}%")
            // Or search by payer name
            ->orWhereHas('member', function ($q) use ($query) {
                $q->where('full_name', 'like', "%{$query}%");
            })
            ->orWhereHas('corporateMember', function ($q) use ($query) {
                $q->where('full_name', 'like', "%{$query}%");
            })
            ->orWhereHas('customer', function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%");
            })
            ->latest()
            ->limit(20)
            ->get()
            ->map(function ($inv) {
                $name = 'Guest';
                $type = 'Guest';
                if ($inv->member) {
                    $name = $inv->member->full_name;
                    $type = 'Member';
                } elseif ($inv->corporateMember) {
                    $name = $inv->corporateMember->full_name;
                    $type = 'Corporate';
                } elseif ($inv->customer) {
                    $name = $inv->customer->name;
                    $type = 'Guest';
                } elseif (!empty($inv->data['member_name'])) {
                    $name = $inv->data['member_name'];
                }

                return [
                    'label' => "{$inv->invoice_no} - {$name} ($type)",
                    'value' => $inv->invoice_no,
                    'id' => $inv->id,
                    'name' => $name,
                    'type' => $type
                ];
            });

        return response()->json($invoices);
    }

    private function getInvoiceNo()
    {
        $invoiceNo = FinancialInvoice::max('invoice_no');
        $invoiceNo = $invoiceNo + 1;
        return $invoiceNo;
    }

    private function syncInvoiceLedgerDebits(FinancialInvoice $invoice): void
    {
        $debits = Transaction::where('invoice_id', $invoice->id)
            ->where('type', 'debit')
            ->orderBy('id')
            ->get();

        $target = (float) ($invoice->total_price ?? 0);
        $current = (float) $debits->sum('amount');
        $delta = $target - $current;

        if (abs($delta) < 0.01) {
            return;
        }

        if ($debits->isEmpty()) {
            Transaction::create([
                'payable_type' => $invoice->invoiceable_type ?: \App\Models\Member::class,
                'payable_id' => $invoice->invoiceable_id ?: $invoice->member_id,
                'type' => 'debit',
                'amount' => $target,
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
                'invoice_id' => $invoice->id,
                'description' => "Invoice #{$invoice->invoice_no} - Ledger Sync",
                'date' => now(),
                'created_by' => Auth::id(),
            ]);
            return;
        }

        if ($delta > 0) {
            $last = $debits->last();
            $last->amount = (float) $last->amount + $delta;
            $last->save();
            return;
        }

        $reduction = -$delta;
        foreach ($debits->reverse() as $debit) {
            if ($reduction <= 0.01) {
                break;
            }
            $amt = (float) $debit->amount;
            if ($amt <= 0) {
                continue;
            }
            $cut = min($amt, $reduction);
            $debit->amount = $amt - $cut;
            $debit->save();
            $reduction -= $cut;
        }
    }

    public function bulkApplyDiscount(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:financial_invoices,id',
            'amount' => 'required|numeric|min:0',
            'is_percent' => 'boolean'
        ]);

        DB::beginTransaction();
        try {
            $updatedCount = 0;
            $invoices = FinancialInvoice::whereIn('id', $request->ids)
                ->whereNotIn('status', ['paid', 'cancelled'])
                ->get();

            foreach ($invoices as $invoice) {
                // Calculate original net amount (excluding discount/overdue for safe recalc? Or just modify final total?)
                // Strategy: We adjust the CURRENT total_price.
                // But wait, if we apply discount multiple times, it stacks?
                // User requirement: "one time add discount".
                // Let's assume we are ADJUSTING the discount.
                // Actually safer to calculate discount based on (Items Total + Tax + Overdue).

                // Let's use the current 'amount' (subtotal usually) logic if possible, or total_price.
                // If usage is simple: Total = (Old Total + Old Discount) - New Discount.
                // But let's look at how MaintenanceFeePosting calculated it: Final = SubTotal + Tax + Overdue - Discount.

                // Reverse engineering current basics:
                // Base Amount = $invoice->total_price + $invoice->discount_amount - $invoice->tax_amount - $invoice->overdue_amount?
                // Depending on data integrity this might be risky.

                // Alternative: Just ADD to the current discount?
                // "Apply Bulk Discount" usually implies "Give 10% off".
                // Let's calculate the NEW discount value.

                // Calculate base for discount:
                $base = $invoice->items->sum('sub_total');  // Safer to sum items

                $newDiscount = 0;
                if ($request->is_percent) {
                    $newDiscount = ($base * $request->amount / 100);
                } else {
                    $newDiscount = $request->amount;
                }

                // If we want to ADD to existing discount:
                // $totalDiscount = $invoice->discount_amount + $newDiscount;
                // But usually bulk action overrides or adds. Let's ADD for now?
                // Or simply SET? "One time add" suggests adding.
                // However, if I run it twice, do I get 20%?
                // Let's assume SET is safer for "Apply 10% discount".
                // If they want another 10%, they should likely do it manually or we warn.
                // But "Bulk Discount" often means "Set Discount to X".

                // Actually, let's go with ADDING to existing discount if any, to support "Extra Discount".
                // $invoice->discount_amount += $newDiscount;
                // $invoice->total_price -= $newDiscount;

                // Update Invoice
                $invoice->discount_amount = ($invoice->discount_amount ?? 0) + $newDiscount;
                $invoice->total_price = $invoice->total_price - $newDiscount;

                // Verify not negative
                if ($invoice->total_price < 0) {
                    // Cap discount? Or error?
                    // Let's cap at 0.
                    $diff = 0 - $invoice->total_price;  // Amount we went under
                    $invoice->total_price = 0;
                    $invoice->discount_amount -= $diff;  // Reduce discount to match 0
                }

                $invoice->save();

                $this->syncInvoiceLedgerDebits($invoice);

                $paid = Transaction::where('invoice_id', $invoice->id)
                    ->where('type', 'credit')
                    ->sum('amount');
                $invoice->paid_amount = $paid;
                $invoice->customer_charges = max(0, (float) ($invoice->total_price ?? 0) - (float) $paid);

                // If paid_amount > total_price (due to discount), status becomes Paid?
                // Or is there a "Credit" balance?
                // Logic:
                if ($paid >= $invoice->total_price) {
                    $invoice->status = 'paid';
                    $invoice->customer_charges = 0;
                    $invoice->save();
                } elseif ($paid > 0) {
                    $invoice->status = 'unpaid';
                    $invoice->save();
                }

                $updatedCount++;
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => "Discount applied to {$updatedCount} invoices."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function bulkApplyOverdue(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:financial_invoices,id',
            'amount' => 'required|numeric|min:0',
            'is_percent' => 'boolean'
        ]);

        DB::beginTransaction();
        try {
            $updatedCount = 0;
            $invoices = FinancialInvoice::whereIn('id', $request->ids)
                ->whereNotIn('status', ['paid', 'cancelled'])
                ->get();

            foreach ($invoices as $invoice) {
                // Calculate Overdue
                $base = $invoice->items->sum('sub_total');

                $newOverdue = 0;
                if ($request->is_percent) {
                    $newOverdue = ($base * $request->amount / 100);
                } else {
                    $newOverdue = $request->amount;
                }

                // Add to existing Overdue
                // Use 'additional_charges' field if 'overdue_amount' is not consistent?
                // Model has 'overdue_amount'.

                $invoice->overdue_amount = ($invoice->overdue_amount ?? 0) + $newOverdue;
                $invoice->total_price = $invoice->total_price + $newOverdue;

                $invoice->save();

                $this->syncInvoiceLedgerDebits($invoice);

                $paid = Transaction::where('invoice_id', $invoice->id)
                    ->where('type', 'credit')
                    ->sum('amount');
                $invoice->paid_amount = $paid;
                $invoice->customer_charges = max(0, (float) ($invoice->total_price ?? 0) - (float) $paid);
                if ($paid >= $invoice->total_price) {
                    $invoice->status = 'paid';
                    $invoice->customer_charges = 0;
                } elseif ($paid > 0) {
                    $invoice->status = 'unpaid';
                }
                $invoice->save();

                $updatedCount++;
            }

            DB::commit();
            return response()->json(['success' => true, 'message' => "Overdue charges applied to {$updatedCount} invoices."]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
