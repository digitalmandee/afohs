<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEventQueue;
use App\Models\AccountingRule;
use App\Models\CoaAccount;
use App\Models\FinancialInvoice;
use App\Models\JournalEntry;
use App\Models\PaymentAccount;
use App\Models\Vendor;
use App\Models\VendorBill;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class AccountingDashboardController extends Controller
{
    public function index(Request $request)
    {
        $expectedRuleCodes = [
            'membership_invoice',
            'membership_receipt',
            'subscription_invoice',
            'subscription_receipt',
            'pos_invoice',
            'pos_receipt',
            'room_invoice',
            'room_receipt',
            'event_invoice',
            'event_receipt',
            'purchase_receipt',
            'vendor_bill',
            'vendor_payment',
        ];

        $activeRuleCodes = AccountingRule::query()
            ->where('is_active', true)
            ->pluck('code')
            ->all();

        $missingRuleCodes = array_values(array_diff($expectedRuleCodes, $activeRuleCodes));

        $receivables = FinancialInvoice::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->select(DB::raw('SUM(total_price - paid_amount) as balance'))
            ->value('balance') ?? 0;

        $payables = VendorBill::query()
            ->whereIn('status', ['draft', 'posted', 'partially_paid'])
            ->select(DB::raw('SUM(grand_total - paid_amount) as balance'))
            ->value('balance') ?? 0;

        $cutoff90 = Carbon::today()->subDays(90)->toDateString();
        $receivables90Plus = FinancialInvoice::query()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->whereDate(DB::raw('COALESCE(due_date, issue_date)'), '<=', $cutoff90)
            ->select(DB::raw('SUM(total_price - paid_amount) as balance'))
            ->value('balance') ?? 0;

        $payables90Plus = VendorBill::query()
            ->whereIn('status', ['draft', 'posted', 'partially_paid'])
            ->whereDate(DB::raw('COALESCE(due_date, bill_date)'), '<=', $cutoff90)
            ->select(DB::raw('SUM(grand_total - paid_amount) as balance'))
            ->value('balance') ?? 0;

        $latestTransactionsQuery = JournalEntry::query()
            ->orderByDesc('entry_date')
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $latestTransactionsQuery->where(function ($query) use ($search) {
                $query->where('entry_no', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'posted', 'reversed'], true)) {
            $latestTransactionsQuery->where('status', $request->status);
        }

        if ($request->filled('module_type')) {
            $latestTransactionsQuery->where('module_type', trim((string) $request->module_type));
        }

        if ($request->filled('from') && $request->filled('to')) {
            $latestTransactionsQuery->whereBetween('entry_date', [$request->from, $request->to]);
        }

        $data = [
            'total_accounts' => CoaAccount::count(),
            'total_vendors' => Vendor::count(),
            'receivables' => $receivables,
            'payables' => $payables,
            'receivables_90_plus' => $receivables90Plus,
            'payables_90_plus' => $payables90Plus,
            'bank_accounts' => PaymentAccount::whereIn('payment_method', ['bank_transfer', 'bank', 'online', 'cheque'])->count(),
            'cash_accounts' => PaymentAccount::where('payment_method', 'cash')->count(),
            'recent_entries' => JournalEntry::orderByDesc('entry_date')->limit(5)->get(),
            'entry_mix' => JournalEntry::query()
                ->select('module_type', DB::raw('COUNT(*) as total'))
                ->groupBy('module_type')
                ->orderByDesc('total')
                ->limit(6)
                ->get(),
            'rule_coverage' => [
                'expected' => $expectedRuleCodes,
                'active' => $activeRuleCodes,
                'missing' => $missingRuleCodes,
            ],
            'exceptions' => [
                'failed_postings' => AccountingEventQueue::where('status', 'failed')->count(),
                'pending_postings' => AccountingEventQueue::where('status', 'pending')->count(),
                'recent_failures' => AccountingEventQueue::query()
                    ->where('status', 'failed')
                    ->latest('updated_at')
                    ->limit(5)
                    ->get(['id', 'event_type', 'source_type', 'source_id', 'error_message', 'updated_at']),
            ],
        ];

        return Inertia::render('App/Admin/Accounting/Dashboard', [
            'stats' => $data,
            'latestTransactions' => $latestTransactionsQuery
                ->paginate(15)
                ->withQueryString()
                ->through(fn ($entry) => [
                    'id' => $entry->id,
                    'entry_no' => $entry->entry_no,
                    'entry_date' => optional($entry->entry_date)->toDateString(),
                    'status' => $entry->status,
                    'description' => $entry->description,
                    'module_type' => $entry->module_type,
                    'module_id' => $entry->module_id,
                    'created_at' => $entry->created_at,
                ]),
            'transactionFilters' => $request->only(['search', 'status', 'module_type', 'from', 'to']),
            'moduleOptions' => JournalEntry::query()
                ->whereNotNull('module_type')
                ->where('module_type', '<>', '')
                ->distinct()
                ->orderBy('module_type')
                ->pluck('module_type')
                ->values(),
        ]);
    }
}
