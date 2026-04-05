<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\AccountingRule;
use App\Models\ApprovalAction;
use App\Models\PaymentAccount;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\VendorPayment;
use App\Models\VendorPaymentAllocation;
use App\Services\Accounting\PostingService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class ProcurementInsightsController extends Controller
{
    public function discrepancies(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        if (
            !Schema::hasTable('goods_receipts')
            || !Schema::hasTable('goods_receipt_items')
            || !Schema::hasTable('purchase_orders')
            || !Schema::hasTable('purchase_order_items')
            || !Schema::hasTable('vendor_bills')
        ) {
            return Inertia::render('App/Admin/Procurement/Insights/Discrepancies', [
                'rows' => $this->paginateCollection(collect(), $request, 25),
                'summary' => [
                    'total' => 0,
                    'unbilled' => 0,
                    'over_billed' => 0,
                    'under_billed' => 0,
                    'price_variance' => 0,
                    'matched' => 0,
                ],
                'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
                'filters' => $request->only(['search', 'vendor_id', 'type', 'from', 'to', 'show_matched', 'per_page']),
                'error' => 'Required procurement tables are not available yet. Please run migrations.',
            ]);
        }

        $query = DB::table('goods_receipts as gr')
            ->join('purchase_orders as po', 'po.id', '=', 'gr.purchase_order_id')
            ->join('vendors as v', 'v.id', '=', 'gr.vendor_id')
            ->where('gr.status', 'received')
            ->select([
                'gr.id',
                'gr.grn_no',
                'gr.received_date',
                'po.po_no',
                'v.id as vendor_id',
                'v.name as vendor_name',
            ]);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('gr.grn_no', 'like', "%{$search}%")
                    ->orWhere('po.po_no', 'like', "%{$search}%")
                    ->orWhere('v.name', 'like', "%{$search}%");
            });
        }

        if ($request->filled('vendor_id')) {
            $query->where('gr.vendor_id', $request->vendor_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('gr.received_date', [$request->from, $request->to]);
        }

        $receipts = $query->orderByDesc('gr.received_date')->get();
        $receiptIds = $receipts->pluck('id');

        $receiptTotals = DB::table('goods_receipt_items')
            ->whereIn('goods_receipt_id', $receiptIds)
            ->select('goods_receipt_id', DB::raw('SUM(line_total) as total'))
            ->groupBy('goods_receipt_id')
            ->pluck('total', 'goods_receipt_id');

        $billStats = DB::table('vendor_bills')
            ->whereIn('goods_receipt_id', $receiptIds)
            ->where('status', '!=', 'void')
            ->select(
                'goods_receipt_id',
                DB::raw('SUM(grand_total) as total'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('goods_receipt_id')
            ->get()
            ->keyBy('goods_receipt_id');

        $priceVariance = DB::table('goods_receipt_items as gri')
            ->join('purchase_order_items as poi', 'poi.id', '=', 'gri.purchase_order_item_id')
            ->whereIn('gri.goods_receipt_id', $receiptIds)
            ->select(
                'gri.goods_receipt_id',
                DB::raw('SUM(CASE WHEN ABS(gri.unit_cost - poi.unit_cost) > 0.0001 THEN ABS(gri.unit_cost - poi.unit_cost) * gri.qty_received ELSE 0 END) as variance_amount'),
                DB::raw('SUM(CASE WHEN ABS(gri.unit_cost - poi.unit_cost) > 0.0001 THEN 1 ELSE 0 END) as variance_lines')
            )
            ->groupBy('gri.goods_receipt_id')
            ->get()
            ->keyBy('goods_receipt_id');

        $today = Carbon::today();
        $rows = $receipts->map(function ($receipt) use ($receiptTotals, $billStats, $priceVariance, $today) {
            $grnTotal = (float) ($receiptTotals[$receipt->id] ?? 0);
            $billTotal = (float) (($billStats[$receipt->id]->total ?? 0));
            $billCount = (int) (($billStats[$receipt->id]->count ?? 0));
            $varianceAmount = (float) (($priceVariance[$receipt->id]->variance_amount ?? 0));
            $varianceLines = (int) (($priceVariance[$receipt->id]->variance_lines ?? 0));
            $delta = $billTotal - $grnTotal;
            $daysSinceReceipt = Carbon::parse($receipt->received_date)->diffInDays($today);

            $type = 'matched';
            if ($billCount === 0 && $daysSinceReceipt > 3) {
                $type = 'unbilled';
            } elseif ($delta > 0.01) {
                $type = 'over_billed';
            } elseif ($delta < -0.01 && $billCount > 0) {
                $type = 'under_billed';
            } elseif ($varianceAmount > 0.01) {
                $type = 'price_variance';
            }

            return [
                'id' => $receipt->id,
                'grn_no' => $receipt->grn_no,
                'po_no' => $receipt->po_no,
                'vendor_id' => $receipt->vendor_id,
                'vendor_name' => $receipt->vendor_name,
                'received_date' => $receipt->received_date,
                'days_since_receipt' => $daysSinceReceipt,
                'receipt_total' => $grnTotal,
                'billed_total' => $billTotal,
                'delta_amount' => $delta,
                'bill_count' => $billCount,
                'price_variance_amount' => $varianceAmount,
                'price_variance_lines' => $varianceLines,
                'type' => $type,
            ];
        });

        if (!$request->boolean('show_matched')) {
            $rows = $rows->where('type', '!=', 'matched')->values();
        }

        if ($request->filled('type') && in_array($request->type, ['unbilled', 'over_billed', 'under_billed', 'price_variance', 'matched'], true)) {
            $rows = $rows->where('type', $request->type)->values();
        }

        $summary = [
            'total' => $rows->count(),
            'unbilled' => $rows->where('type', 'unbilled')->count(),
            'over_billed' => $rows->where('type', 'over_billed')->count(),
            'under_billed' => $rows->where('type', 'under_billed')->count(),
            'price_variance' => $rows->where('type', 'price_variance')->count(),
            'matched' => $rows->where('type', 'matched')->count(),
        ];

        return Inertia::render('App/Admin/Procurement/Insights/Discrepancies', [
            'rows' => $this->paginateCollection($rows, $request, $perPage),
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'vendor_id', 'type', 'from', 'to', 'show_matched', 'per_page']),
        ]);
    }

    public function paymentRun(Request $request)
    {
        $perPage = $this->resolvePerPage($request);
        $query = VendorBill::query()
            ->with('vendor:id,name')
            ->whereIn('status', ['posted', 'partially_paid'])
            ->whereRaw('(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0)) > 0.009');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('bill_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('due_to')) {
            $query->whereDate(DB::raw('COALESCE(due_date, bill_date)'), '<=', $request->due_to);
        }

        if ($request->filled('min_age_days')) {
            $query->whereRaw('DATEDIFF(CURDATE(), COALESCE(due_date, bill_date)) >= ?', [(int) $request->min_age_days]);
        }

        if ($request->filled('bucket')) {
            $bucket = (string) $request->bucket;
            if ($bucket === '0-30') {
                $query->whereRaw('GREATEST(DATEDIFF(CURDATE(), COALESCE(due_date, bill_date)), 0) BETWEEN 0 AND 30');
            } elseif ($bucket === '31-60') {
                $query->whereRaw('GREATEST(DATEDIFF(CURDATE(), COALESCE(due_date, bill_date)), 0) BETWEEN 31 AND 60');
            } elseif ($bucket === '61-90') {
                $query->whereRaw('GREATEST(DATEDIFF(CURDATE(), COALESCE(due_date, bill_date)), 0) BETWEEN 61 AND 90');
            } elseif ($bucket === '90+') {
                $query->whereRaw('GREATEST(DATEDIFF(CURDATE(), COALESCE(due_date, bill_date)), 0) >= 91');
            }
        }

        $summaryQuery = clone $query;
        $bills = $query->orderBy('due_date')->orderBy('bill_date')->paginate($perPage)->withQueryString();

        $today = Carbon::today();
        $bills->getCollection()->transform(function ($bill) use ($today) {
            $dueRef = $bill->due_date ?: $bill->bill_date;
            $ageDays = $dueRef ? Carbon::parse($dueRef)->diffInDays($today, false) : 0;
            $ageDays = max(0, $ageDays);
            $outstanding = max(0, (float) $bill->grand_total - (float) $bill->paid_amount - (float) $bill->advance_applied_amount - (float) $bill->return_applied_amount);
            $bucket = $ageDays <= 30 ? '0-30' : ($ageDays <= 60 ? '31-60' : ($ageDays <= 90 ? '61-90' : '90+'));
            $bill->outstanding = $outstanding;
            $bill->age_days = $ageDays;
            $bill->bucket = $bucket;
            return $bill;
        });

        $summary = [
            'count' => (int) $summaryQuery->count(),
            'outstanding' => (float) ((clone $summaryQuery)->select(DB::raw('SUM(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0)) as balance'))->value('balance') ?? 0),
            'overdue_90_plus' => (float) ((clone $summaryQuery)
                ->whereRaw('GREATEST(DATEDIFF(CURDATE(), COALESCE(due_date, bill_date)), 0) >= 91')
                ->select(DB::raw('SUM(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0)) as balance'))
                ->value('balance') ?? 0),
        ];

        return Inertia::render('App/Admin/Procurement/Insights/PaymentRun', [
            'bills' => $bills,
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'paymentAccounts' => PaymentAccount::query()->orderBy('name')->get(['id', 'name', 'payment_method']),
            'filters' => $request->only(['search', 'vendor_id', 'due_to', 'min_age_days', 'bucket', 'per_page']),
        ]);
    }

    public function executePaymentRun(Request $request)
    {
        $data = $request->validate([
            'payment_date' => 'required|date',
            'method' => 'required|in:cash,bank,cheque,online',
            'payment_account_id' => 'nullable|exists:payment_accounts,id',
            'reference' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
            'allocations' => 'required|array|min:1',
            'allocations.*.bill_id' => 'required|exists:vendor_bills,id',
            'allocations.*.amount' => 'required|numeric|min:0.01',
        ]);

        if (($data['method'] ?? 'cash') !== 'cash' && empty($data['payment_account_id'])) {
            return redirect()->back()->withErrors([
                'payment_account_id' => 'Payment account is required for non-cash payment methods.',
            ]);
        }

        if (!empty($data['payment_account_id'])) {
            $account = PaymentAccount::query()->find($data['payment_account_id']);
            $allowedByMethod = [
                'cash' => ['cash'],
                'bank' => ['bank', 'bank_transfer'],
                'cheque' => ['cheque', 'bank'],
                'online' => ['online', 'bank', 'bank_transfer'],
            ];
            if (!in_array((string) ($account?->payment_method ?? ''), $allowedByMethod[$data['method']] ?? [], true)) {
                return redirect()->back()->withErrors([
                    'payment_account_id' => "Selected payment account method '{$account?->payment_method}' is not valid for '{$data['method']}' payment.",
                ]);
            }
        }

        $allocations = collect($data['allocations'])
            ->map(fn ($row) => [
                'bill_id' => (int) $row['bill_id'],
                'amount' => (float) $row['amount'],
            ])
            ->filter(fn ($row) => $row['amount'] > 0)
            ->values();

        if ($allocations->isEmpty()) {
            return redirect()->back()->withErrors([
                'allocations' => 'At least one positive allocation is required.',
            ]);
        }

        $bills = VendorBill::query()
            ->whereIn('id', $allocations->pluck('bill_id'))
            ->get()
            ->keyBy('id');

        $perBill = $allocations->groupBy('bill_id')->map(fn ($rows) => (float) $rows->sum('amount'));
        foreach ($perBill as $billId => $allocatedAmount) {
            $bill = $bills->get($billId);
            if (!$bill || !in_array($bill->status, ['posted', 'partially_paid'], true)) {
                return redirect()->back()->withErrors([
                    'allocations' => "Bill #{$billId} is not eligible for payment run.",
                ]);
            }

            $outstanding = max(0, (float) $bill->grand_total - (float) $bill->paid_amount - (float) $bill->advance_applied_amount - (float) $bill->return_applied_amount);
            if ($allocatedAmount > $outstanding + 0.01) {
                return redirect()->back()->withErrors([
                    'allocations' => "Allocated amount exceeds outstanding for bill {$bill->bill_no}.",
                ]);
            }
        }

        $rule = AccountingRule::query()->where('code', 'vendor_payment')->where('is_active', true)->first();
        $createdPayments = [];

        DB::transaction(function () use ($allocations, $bills, $data, $request, $rule, &$createdPayments) {
            $groupedByVendor = $allocations
                ->groupBy(fn ($row) => (int) ($bills->get($row['bill_id'])?->vendor_id));

            foreach ($groupedByVendor as $vendorId => $vendorAllocations) {
                $paymentTotal = (float) $vendorAllocations->sum('amount');

                $payment = VendorPayment::create([
                    'payment_no' => 'PAYRUN-' . now()->format('YmdHis') . '-' . $vendorId,
                    'vendor_id' => (int) $vendorId,
                    'payment_account_id' => $data['payment_account_id'] ?? null,
                    'payment_date' => $data['payment_date'],
                    'method' => $data['method'],
                    'amount' => $paymentTotal,
                    'status' => 'posted',
                    'reference' => $data['reference'] ?? null,
                    'remarks' => trim((string) ($data['remarks'] ?? '')) ?: 'Created from payment run.',
                    'created_by' => $request->user()?->id,
                    'posted_by' => $request->user()?->id,
                    'posted_at' => now(),
                ]);

                foreach ($vendorAllocations as $allocation) {
                    $bill = $bills->get($allocation['bill_id']);

                    VendorPaymentAllocation::create([
                        'vendor_payment_id' => $payment->id,
                        'vendor_bill_id' => $bill->id,
                        'amount' => $allocation['amount'],
                    ]);

                    $maxPayable = max(0, (float) $bill->grand_total - (float) $bill->advance_applied_amount - (float) $bill->return_applied_amount);
                    $updatedPaid = min($maxPayable, (float) $bill->paid_amount + (float) $allocation['amount']);
                    $bill->paid_amount = $updatedPaid;
                    $bill->status = ($updatedPaid + (float) $bill->advance_applied_amount + (float) $bill->return_applied_amount) >= ((float) $bill->grand_total - 0.01) ? 'paid' : 'partially_paid';
                    $bill->save();
                }

                ApprovalAction::create([
                    'document_type' => 'vendor_payment',
                    'document_id' => $payment->id,
                    'action' => 'approved',
                    'remarks' => 'Auto-posted from payment run.',
                    'action_by' => $request->user()?->id,
                ]);

                if ($rule) {
                    $lines = [];
                    foreach ((array) $rule->lines as $line) {
                        $amount = $paymentTotal * ((float) ($line['ratio'] ?? 1));
                        $lines[] = [
                            'account_id' => $line['account_id'],
                            'debit' => ($line['side'] ?? 'debit') === 'debit' ? $amount : 0,
                            'credit' => ($line['side'] ?? 'debit') === 'credit' ? $amount : 0,
                            'vendor_id' => (int) $vendorId,
                            'reference_type' => VendorPayment::class,
                            'reference_id' => $payment->id,
                        ];
                    }

                    app(PostingService::class)->post(
                        'vendor_payment',
                        $payment->id,
                        $data['payment_date'],
                        'Vendor Payment Run ' . $payment->payment_no,
                        $lines,
                        $request->user()?->id
                    );
                }

                $createdPayments[] = $payment->payment_no;
            }
        });

        return redirect()->back()->with(
            'success',
            'Payment run posted. Payments: ' . implode(', ', $createdPayments)
        );
    }

    private function paginateCollection(Collection $items, Request $request, int $perPage): LengthAwarePaginator
    {
        $page = LengthAwarePaginator::resolveCurrentPage();
        $total = $items->count();

        return new LengthAwarePaginator(
            $items->slice(($page - 1) * $perPage, $perPage)->values(),
            $total,
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );
    }

    private function resolvePerPage(Request $request, int $default = 25): int
    {
        $perPage = (int) $request->integer('per_page', $default);

        return in_array($perPage, [10, 25, 50, 100], true) ? $perPage : $default;
    }
}
