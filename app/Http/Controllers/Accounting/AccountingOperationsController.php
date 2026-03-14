<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\FinancialInvoice;
use App\Models\VendorBill;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;

class AccountingOperationsController extends Controller
{
    public function receivables(Request $request)
    {
        $query = FinancialInvoice::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->with(['member:id,full_name', 'corporateMember:id,full_name', 'customer:id,name']);

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

        $invoices = $query->orderByDesc('issue_date')->paginate(25)->withQueryString();

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
            'filters' => $request->only(['search', 'status', 'from', 'to']),
        ]);
    }

    public function outstanding(Request $request)
    {
        try {
            $query = FinancialInvoice::query()
                ->whereIn('status', ['unpaid', 'partial'])
                ->with(['member:id,full_name', 'corporateMember:id,full_name', 'customer:id,name'])
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
            $rows = $invoices->map(function ($invoice) use ($today) {
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

                return [
                    'invoice_no' => $invoice->invoice_no,
                    'payer' => $invoice->member?->full_name
                        ?? $invoice->corporateMember?->full_name
                        ?? $invoice->customer?->name
                        ?? '-',
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

            $perPage = 25;
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
                'filters' => $request->only(['search', 'bucket']),
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
                'filters' => $request->only(['search', 'bucket']),
                'error' => 'Outstanding data is not available yet. Please verify invoices data and accounting migrations.',
            ]);
        }
    }

    public function payables(Request $request)
    {
        $query = VendorBill::with('vendor')
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

        $bills = $query->orderByDesc('bill_date')->paginate(25)->withQueryString();

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
            'filters' => $request->only(['search', 'status', 'from', 'to']),
        ]);
    }

    public function expenses(Request $request)
    {
        $query = VendorBill::with('vendor');

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

        $bills = $query->orderByDesc('bill_date')->paginate(25)->withQueryString();

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
            'filters' => $request->only(['search', 'status', 'from', 'to']),
        ]);
    }
}
