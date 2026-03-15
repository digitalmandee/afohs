<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\FinancialInvoice;
use App\Models\Tenant;
use App\Models\VendorBill;
use App\Models\JournalEntry;
use App\Models\AccountingEventQueue;
use App\Services\Accounting\Support\AccountingSourceResolver;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class AccountingOperationsController extends Controller
{
    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', 25);

        return in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
    }

    public function receivables(Request $request)
    {
        $sourceResolver = app(AccountingSourceResolver::class);
        $perPage = $this->resolvePerPage($request);
        $query = FinancialInvoice::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->with(['member:id,full_name,membership_no', 'corporateMember:id,full_name,membership_no', 'customer:id,name,customer_no', 'invoiceable']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhere('mem_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['unpaid', 'partial'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('issue_date', [$request->from, $request->to]);
        }

        $invoices = $query->orderByDesc('issue_date')->paginate($perPage)->withQueryString();
        $invoiceIds = $invoices->getCollection()->pluck('id')->all();
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
        $invoices->setCollection($invoices->getCollection()->map(function ($invoice) use ($events, $journals, $sourceResolver) {
            $source = $sourceResolver->resolveForFinancialInvoice(
                $invoice,
                $events->get($invoice->id)?->first(),
                $journals->get($invoice->id)?->first()
            );
            foreach ($source as $key => $value) {
                $invoice->{$key} = $value;
            }

            return $invoice;
        }));

        $allOpen = FinancialInvoice::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->get(['status', 'total_price', 'paid_amount']);

        $filteredRows = (clone $query)->get(['status', 'total_price', 'paid_amount']);
        $filteredOutstanding = $filteredRows->sum(function ($invoice) {
            return (float) ($invoice->total_price ?? 0) - (float) ($invoice->paid_amount ?? 0);
        });
        $globalOutstanding = $allOpen->sum(function ($invoice) {
            return (float) ($invoice->total_price ?? 0) - (float) ($invoice->paid_amount ?? 0);
        });

        return Inertia::render('App/Admin/Accounting/Receivables', [
            'invoices' => $invoices,
            'total' => $globalOutstanding,
            'summary' => [
                'records' => $filteredRows->count(),
                'unpaid_count' => $filteredRows->where('status', 'unpaid')->count(),
                'partial_count' => $filteredRows->where('status', 'partial')->count(),
                'filtered_outstanding' => $filteredOutstanding,
            ],
            'filters' => $request->only(['search', 'status', 'from', 'to', 'per_page']),
        ]);
    }

    public function outstanding(Request $request)
    {
        try {
            $sourceResolver = app(AccountingSourceResolver::class);
            $perPage = $this->resolvePerPage($request);
            $query = FinancialInvoice::query()
                ->whereIn('status', ['unpaid', 'partial'])
                ->with(['member:id,full_name,membership_no', 'corporateMember:id,full_name,membership_no', 'customer:id,name,customer_no', 'invoiceable'])
                ->orderByDesc('due_date');

            if ($request->filled('search')) {
                $search = trim((string) $request->search);
                $query->where(function ($q) use ($search) {
                    $q->where('invoice_no', 'like', "%{$search}%")
                        ->orWhere('mem_no', 'like', "%{$search}%");
                });
            }

            $invoices = $query->get();

            $today = Carbon::today();
            $invoiceIds = $invoices->pluck('id')->all();
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

            $rows = $invoices->map(function ($invoice) use ($today, $events, $journals, $sourceResolver) {
                $dueDate = $invoice->due_date ?? $invoice->issue_date ?? $invoice->created_at;
                $parsedDueDate = null;

                if ($dueDate) {
                    try {
                        $parsedDueDate = Carbon::parse($dueDate);
                    } catch (\Throwable $e) {
                        $parsedDueDate = null;
                    }
                }

                $age = $parsedDueDate ? $parsedDueDate->diffInDays($today) : 0;
                $balance = ($invoice->total_price ?? 0) - ($invoice->paid_amount ?? 0);
                $source = $sourceResolver->resolveForFinancialInvoice(
                    $invoice,
                    $events->get($invoice->id)?->first(),
                    $journals->get($invoice->id)?->first()
                );

                return [
                    'invoice_id' => $invoice->id,
                    'invoice_no' => $invoice->invoice_no,
                    'payer' => $invoice->member?->full_name
                        ?? $invoice->corporateMember?->full_name
                        ?? $invoice->customer?->name
                        ?? '-',
                    'source_type' => $source['source_type'],
                    'source_label' => $source['source_label'],
                    'source_module' => $source['source_module'],
                    'restaurant_id' => $source['restaurant_id'],
                    'restaurant_name' => $source['restaurant_name'],
                    'document_no' => $source['document_no'],
                    'document_url' => $source['document_url'],
                    'posting_status' => $source['posting_status'],
                    'journal_entry_id' => $source['journal_entry_id'],
                    'failure_reason' => $source['failure_reason'],
                    'source_resolution_status' => $source['source_resolution_status'],
                    'due_date' => $parsedDueDate?->toDateString(),
                    'age' => $age,
                    'balance' => $balance,
                    'bucket' => $age <= 30 ? '0-30' : ($age <= 60 ? '31-60' : ($age <= 90 ? '61-90' : '90+')),
                ];
            });

            if ($request->filled('bucket') && in_array($request->bucket, ['0-30', '31-60', '61-90', '90+'], true)) {
                $rows = $rows->where('bucket', $request->bucket)->values();
            }

            $bucketSummary = [
                '0-30' => 0,
                '31-60' => 0,
                '61-90' => 0,
                '90+' => 0,
            ];
            $bucketBalance = [
                '0-30' => 0.0,
                '31-60' => 0.0,
                '61-90' => 0.0,
                '90+' => 0.0,
            ];

            foreach ($rows as $row) {
                $bucket = $row['bucket'];
                if (!array_key_exists($bucket, $bucketSummary)) {
                    continue;
                }
                $bucketSummary[$bucket]++;
                $bucketBalance[$bucket] += (float) ($row['balance'] ?? 0);
            }

            $page = LengthAwarePaginator::resolveCurrentPage();
            $paginated = new LengthAwarePaginator(
                $rows->slice(($page - 1) * $perPage, $perPage)->values(),
                $rows->count(),
                $perPage,
                $page,
                ['path' => $request->url(), 'query' => $request->query()]
            );

            return Inertia::render('App/Admin/Accounting/Outstanding', [
                'rows' => $paginated,
                'summary' => [
                    'records' => $rows->count(),
                    'total_balance' => $rows->sum(fn($row) => (float) ($row['balance'] ?? 0)),
                    'average_age' => $rows->count() > 0 ? round($rows->avg('age'), 1) : 0,
                    'bucket_count' => $bucketSummary,
                    'bucket_balance' => $bucketBalance,
                ],
                'filters' => $request->only(['search', 'bucket', 'per_page']),
            ]);
        } catch (\Throwable $e) {
            report($e);

            $paginated = new LengthAwarePaginator(
                collect(),
                0,
                25,
                1,
                ['path' => $request->url(), 'query' => $request->query()]
            );

            return Inertia::render('App/Admin/Accounting/Outstanding', [
                'rows' => $paginated,
                'summary' => [
                    'records' => 0,
                    'total_balance' => 0,
                    'average_age' => 0,
                    'bucket_count' => ['0-30' => 0, '31-60' => 0, '61-90' => 0, '90+' => 0],
                    'bucket_balance' => ['0-30' => 0, '31-60' => 0, '61-90' => 0, '90+' => 0],
                ],
                'filters' => $request->only(['search', 'bucket', 'per_page']),
                'error' => 'Outstanding data is not available yet. Please verify invoices data and accounting migrations.',
            ]);
        }
    }

    public function payables(Request $request)
    {
        $sourceResolver = app(AccountingSourceResolver::class);
        $perPage = $this->resolvePerPage($request);
        $query = VendorBill::with('vendor', 'tenant')
            ->whereIn('status', ['draft', 'posted', 'partially_paid']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('bill_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'posted', 'partially_paid'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('bill_date', [$request->from, $request->to]);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        $bills = $query->orderByDesc('bill_date')->paginate($perPage)->withQueryString();
        $billIds = $bills->getCollection()->pluck('id')->all();
        $events = AccountingEventQueue::query()
            ->with('restaurant:id,name')
            ->where('source_type', VendorBill::class)
            ->whereIn('source_id', $billIds)
            ->latest('updated_at')
            ->get()
            ->groupBy('source_id');
        $journals = JournalEntry::query()
            ->where('module_type', 'vendor_bill')
            ->whereIn('module_id', $billIds)
            ->get()
            ->groupBy('module_id');
        $bills->setCollection($bills->getCollection()->map(function ($bill) use ($events, $journals, $sourceResolver) {
            $source = $sourceResolver->resolveForVendorBill($bill, $events->get($bill->id)?->first(), $journals->get($bill->id)?->first());
            foreach ($source as $key => $value) {
                $bill->{$key} = $value;
            }

            return $bill;
        }));

        $allOpen = VendorBill::query()
            ->whereIn('status', ['draft', 'posted', 'partially_paid'])
            ->get(['status', 'grand_total', 'paid_amount']);
        $filteredRows = (clone $query)->get(['status', 'grand_total', 'paid_amount']);
        $filteredOutstanding = $filteredRows->sum(function ($bill) {
            return (float) ($bill->grand_total ?? 0) - (float) ($bill->paid_amount ?? 0);
        });
        $total = $allOpen->sum(function ($bill) {
            return (float) ($bill->grand_total ?? 0) - (float) ($bill->paid_amount ?? 0);
        });

        return Inertia::render('App/Admin/Accounting/Payables', [
            'bills' => $bills,
            'total' => $total,
            'summary' => [
                'records' => $filteredRows->count(),
                'draft_count' => $filteredRows->where('status', 'draft')->count(),
                'posted_count' => $filteredRows->where('status', 'posted')->count(),
                'partial_count' => $filteredRows->where('status', 'partially_paid')->count(),
                'filtered_outstanding' => $filteredOutstanding,
            ],
            'filters' => $request->only(['search', 'status', 'from', 'to', 'tenant_id', 'per_page']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function expenses(Request $request)
    {
        $sourceResolver = app(AccountingSourceResolver::class);
        $perPage = $this->resolvePerPage($request);
        $query = VendorBill::with('vendor', 'tenant');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('bill_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'posted', 'partially_paid', 'paid', 'void'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('bill_date', [$request->from, $request->to]);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        $bills = $query->orderByDesc('bill_date')->paginate($perPage)->withQueryString();
        $billIds = $bills->getCollection()->pluck('id')->all();
        $events = AccountingEventQueue::query()
            ->with('restaurant:id,name')
            ->where('source_type', VendorBill::class)
            ->whereIn('source_id', $billIds)
            ->latest('updated_at')
            ->get()
            ->groupBy('source_id');
        $journals = JournalEntry::query()
            ->where('module_type', 'vendor_bill')
            ->whereIn('module_id', $billIds)
            ->get()
            ->groupBy('module_id');
        $bills->setCollection($bills->getCollection()->map(function ($bill) use ($events, $journals, $sourceResolver) {
            $source = $sourceResolver->resolveForVendorBill($bill, $events->get($bill->id)?->first(), $journals->get($bill->id)?->first());
            foreach ($source as $key => $value) {
                $bill->{$key} = $value;
            }

            return $bill;
        }));

        $allRows = VendorBill::query()->get(['status', 'grand_total', 'paid_amount']);
        $filteredRows = (clone $query)->get(['status', 'grand_total', 'paid_amount']);
        $total = $allRows->sum(fn($bill) => (float) ($bill->grand_total ?? 0));
        $filteredTotal = $filteredRows->sum(fn($bill) => (float) ($bill->grand_total ?? 0));
        $filteredPaid = $filteredRows->sum(fn($bill) => (float) ($bill->paid_amount ?? 0));

        return Inertia::render('App/Admin/Accounting/ExpenseManagement', [
            'bills' => $bills,
            'total' => $total,
            'summary' => [
                'records' => $filteredRows->count(),
                'filtered_total' => $filteredTotal,
                'filtered_paid' => $filteredPaid,
                'open_count' => $filteredRows->whereIn('status', ['draft', 'posted', 'partially_paid'])->count(),
                'closed_count' => $filteredRows->whereIn('status', ['paid', 'void'])->count(),
            ],
            'filters' => $request->only(['search', 'status', 'from', 'to', 'tenant_id', 'per_page']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }
}
