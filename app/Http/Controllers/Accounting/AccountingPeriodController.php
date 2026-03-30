<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEventQueue;
use App\Models\AccountingPeriod;
use App\Models\BankReconciliationSession;
use App\Models\JournalEntry;
use App\Services\Accounting\Support\HistoricalAccountingPeriodAligner;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use App\Services\Accounting\Support\AccountingHealth;

class AccountingPeriodController extends Controller
{
    public function index(Request $request)
    {
        $health = app(AccountingHealth::class);
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
        $status = $health->status(['accounting_periods', 'journal_entries'], ['accounting_event_queues', 'bank_reconciliation_sessions', 'vendor_bills', 'purchase_orders', 'goods_receipts']);

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/Close/Periods', [
                'periods' => $health->emptyPaginator($request, $perPage),
                'filters' => $request->only(['status', 'per_page']),
                'error' => $health->setupMessage('Accounting periods', $status['missing_required'], $status['missing_optional']),
            ]);
        }

        $query = AccountingPeriod::query();

        if ($request->filled('status') && in_array($request->status, ['open', 'closed'], true)) {
            $query->where('status', $request->status);
        }

        $periods = $query->orderByDesc('start_date')->paginate($perPage)->withQueryString();
        $periods->getCollection()->transform(function ($period) {
            $period->checklist = $this->periodChecklist($period);
            return $period;
        });

        return Inertia::render('App/Admin/Accounting/Close/Periods', [
            'periods' => $periods,
            'filters' => $request->only(['status', 'per_page']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $overlap = AccountingPeriod::query()
            ->where(function ($q) use ($data) {
                $q->whereBetween('start_date', [$data['start_date'], $data['end_date']])
                    ->orWhereBetween('end_date', [$data['start_date'], $data['end_date']])
                    ->orWhere(function ($inside) use ($data) {
                        $inside->where('start_date', '<=', $data['start_date'])
                            ->where('end_date', '>=', $data['end_date']);
                    });
            })
            ->exists();

        if ($overlap) {
            return redirect()->back()->withErrors(['start_date' => 'Period overlaps with an existing accounting period.']);
        }

        AccountingPeriod::create([
            'name' => $data['name'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'status' => 'open',
        ]);

        return redirect()->back()->with('success', 'Accounting period created.');
    }

    public function lock(Request $request, AccountingPeriod $period)
    {
        if ($period->status === 'closed') {
            return redirect()->back()->with('error', 'Period is already closed.');
        }

        $checklist = $this->periodChecklist($period);
        $force = $request->boolean('force');
        if (!$force && !$checklist['can_close']) {
            return redirect()->back()->with('error', 'Close checklist has open items. Resolve issues or force close.');
        }

        $period->update([
            'status' => 'closed',
            'locked_at' => now(),
            'locked_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Period closed and locked.');
    }

    public function reopen(AccountingPeriod $period)
    {
        if ($period->status === 'open') {
            return redirect()->back()->with('error', 'Period is already open.');
        }

        $period->update([
            'status' => 'open',
            'locked_at' => null,
            'locked_by' => null,
        ]);

        return redirect()->back()->with('success', 'Period reopened.');
    }

    public function alignHistorical(HistoricalAccountingPeriodAligner $aligner)
    {
        $result = $aligner->align();

        return redirect()->back()->with(
            'success',
            "Historical accounting periods aligned. Created {$result['created']} missing period(s)."
        );
    }

    private function periodChecklist(AccountingPeriod $period): array
    {
        $from = Carbon::parse($period->start_date)->toDateString();
        $to = Carbon::parse($period->end_date)->toDateString();

        $draftJournals = JournalEntry::query()
            ->where('status', 'draft')
            ->whereBetween('entry_date', [$from, $to])
            ->count();

        $failedEvents = 0;
        if (Schema::hasTable('accounting_event_queues')) {
            $failedEvents = AccountingEventQueue::query()
                ->where('status', 'failed')
                ->whereBetween('created_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
                ->count();
        }

        $unreconciledBank = 0;
        if (Schema::hasTable('bank_reconciliation_sessions')) {
            $unreconciledBank = BankReconciliationSession::query()
                ->where('status', '!=', 'reconciled')
                ->whereDate('statement_end_date', '<=', $to)
                ->count();
        }

        $draftVendorBills = 0;
        if (Schema::hasTable('vendor_bills')) {
            $draftVendorBills = (int) \DB::table('vendor_bills')
                ->where('status', 'draft')
                ->whereBetween(\DB::raw('DATE(bill_date)'), [$from, $to])
                ->count();
        }

        $draftPurchaseOrders = 0;
        if (Schema::hasTable('purchase_orders')) {
            $draftPurchaseOrders = (int) \DB::table('purchase_orders')
                ->whereIn('status', ['draft', 'approved', 'partially_received'])
                ->whereBetween(\DB::raw('DATE(order_date)'), [$from, $to])
                ->count();
        }

        $unbilledReceipts = 0;
        if (Schema::hasTable('goods_receipts') && Schema::hasTable('vendor_bills')) {
            $unbilledReceipts = (int) \DB::table('goods_receipts as gr')
                ->leftJoin('vendor_bills as vb', function ($join) {
                    $join->on('vb.goods_receipt_id', '=', 'gr.id')
                        ->where('vb.status', '!=', 'void');
                })
                ->whereBetween(\DB::raw('DATE(gr.received_date)'), [$from, $to])
                ->where('gr.status', 'received')
                ->whereNull('vb.id')
                ->count();
        }

        $blocking = [
            'draft_journals' => $draftJournals,
            'failed_events' => $failedEvents,
            'unreconciled_bank' => $unreconciledBank,
            'draft_vendor_bills' => $draftVendorBills,
            'unbilled_receipts' => $unbilledReceipts,
        ];
        $warnings = [
            'open_purchase_orders' => $draftPurchaseOrders,
        ];

        return [
            'draft_journals' => $draftJournals,
            'failed_events' => $failedEvents,
            'unreconciled_bank' => $unreconciledBank,
            'draft_vendor_bills' => $draftVendorBills,
            'open_purchase_orders' => $draftPurchaseOrders,
            'unbilled_receipts' => $unbilledReceipts,
            'blocking_checks' => $blocking,
            'warning_checks' => $warnings,
            'can_close' => array_sum($blocking) === 0,
        ];
    }
}
