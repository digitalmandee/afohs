<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingEventQueue;
use App\Models\AccountingRule;
use App\Models\CoaAccount;
use App\Models\FinancialInvoice;
use App\Models\JournalEntry;
use App\Models\PaymentAccount;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Services\Accounting\Support\AccountingHealth;
use App\Services\Accounting\Support\AccountingSourceResolver;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class AccountingDashboardController extends Controller
{
    public function index(Request $request)
    {
        $health = app(AccountingHealth::class);
        $sourceResolver = app(AccountingSourceResolver::class);
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $status = $health->status(
            requiredTables: ['journal_entries', 'coa_accounts'],
            optionalTables: ['accounting_rules', 'financial_invoices', 'vendor_bills', 'payment_accounts', 'accounting_event_queues', 'vendors', 'tenants']
        );

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/Dashboard', [
                'stats' => [
                    'total_accounts' => 0,
                    'total_vendors' => 0,
                    'receivables' => 0,
                    'payables' => 0,
                    'receivables_90_plus' => 0,
                    'payables_90_plus' => 0,
                    'bank_accounts' => 0,
                    'cash_accounts' => 0,
                    'recent_entries' => [],
                    'entry_mix' => [],
                    'rule_coverage' => ['expected' => [], 'active' => [], 'missing' => []],
                    'exceptions' => [
                        'posted_postings' => 0,
                        'failed_postings' => 0,
                        'pending_postings' => 0,
                        'skipped_postings' => 0,
                        'unresolved_postings' => 0,
                        'module_counts' => [],
                        'recent_failures' => [],
                    ],
                ],
                'latestTransactions' => $health->emptyPaginator($request, $perPage),
                'transactionFilters' => $request->only(['search', 'status', 'module_type', 'tenant_id', 'from', 'to', 'per_page']),
                'moduleOptions' => collect(),
                'tenants' => collect(),
                'error' => $health->setupMessage('Accounting Dashboard', $status['missing_required'], $status['missing_optional']),
            ]);
        }

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

        $activeRuleCodes = Schema::hasTable('accounting_rules')
            ? AccountingRule::query()->where('is_active', true)->pluck('code')->all()
            : [];

        $missingRuleCodes = array_values(array_diff($expectedRuleCodes, $activeRuleCodes));

        $receivables = Schema::hasTable('financial_invoices')
            ? FinancialInvoice::query()
                ->whereIn('status', ['unpaid', 'partial'])
                ->select(DB::raw('SUM(total_price - paid_amount) as balance'))
                ->value('balance') ?? 0
            : 0;

        $payables = Schema::hasTable('vendor_bills')
            ? VendorBill::query()
                ->whereIn('status', ['draft', 'posted', 'partially_paid'])
                ->select(DB::raw('SUM(grand_total - paid_amount) as balance'))
                ->value('balance') ?? 0
            : 0;

        $cutoff90 = Carbon::today()->subDays(90)->toDateString();
        $receivables90Plus = Schema::hasTable('financial_invoices')
            ? FinancialInvoice::query()
                ->whereIn('status', ['unpaid', 'partial', 'overdue'])
                ->whereDate(DB::raw('COALESCE(due_date, issue_date)'), '<=', $cutoff90)
                ->select(DB::raw('SUM(total_price - paid_amount) as balance'))
                ->value('balance') ?? 0
            : 0;

        $payables90Plus = Schema::hasTable('vendor_bills')
            ? VendorBill::query()
                ->whereIn('status', ['draft', 'posted', 'partially_paid'])
                ->whereDate(DB::raw('COALESCE(due_date, bill_date)'), '<=', $cutoff90)
                ->select(DB::raw('SUM(grand_total - paid_amount) as balance'))
                ->value('balance') ?? 0
            : 0;

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

        if ($request->filled('tenant_id')) {
            $latestTransactionsQuery->where('tenant_id', $request->tenant_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $latestTransactionsQuery->whereBetween('entry_date', [$request->from, $request->to]);
        }

        $statusCounts = Schema::hasTable('accounting_event_queues')
            ? AccountingEventQueue::query()
                ->select('status', DB::raw('COUNT(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status')
            : collect();

        $nonPostedEvents = Schema::hasTable('accounting_event_queues')
            ? AccountingEventQueue::query()
                ->with('restaurant:id,name')
                ->whereIn('status', ['failed', 'pending', 'skipped'])
                ->latest('updated_at')
                ->get(['id', 'event_type', 'source_type', 'source_id', 'restaurant_id', 'journal_entry_id', 'status', 'error_message', 'updated_at', 'payload'])
            : collect();

        $resolvedEvents = $nonPostedEvents->map(function ($event) use ($sourceResolver) {
            return array_merge(
                [
                    'id' => $event->id,
                    'event_type' => $event->event_type,
                    'updated_at' => optional($event->updated_at)->toDateTimeString(),
                ],
                $sourceResolver->resolveForEvent($event)
            );
        });

        $moduleCounts = [];
        foreach ($resolvedEvents as $event) {
            $module = $event['source_module'] ?? 'finance';
            $moduleCounts[$module] = ($moduleCounts[$module] ?? 0) + 1;
        }

        $data = [
            'total_accounts' => CoaAccount::count(),
            'total_vendors' => Schema::hasTable('vendors') ? Vendor::count() : 0,
            'receivables' => $receivables,
            'payables' => $payables,
            'receivables_90_plus' => $receivables90Plus,
            'payables_90_plus' => $payables90Plus,
            'bank_accounts' => Schema::hasTable('payment_accounts') ? PaymentAccount::whereIn('payment_method', ['bank_transfer', 'bank', 'online', 'cheque'])->count() : 0,
            'cash_accounts' => Schema::hasTable('payment_accounts') ? PaymentAccount::where('payment_method', 'cash')->count() : 0,
            'recent_entries' => JournalEntry::with('tenant')->orderByDesc('entry_date')->limit(5)->get()->map(function ($entry) use ($sourceResolver) {
                $source = $sourceResolver->resolveForJournalEntry($entry);

                return [
                    'id' => $entry->id,
                    'entry_no' => $entry->entry_no,
                    'entry_date' => optional($entry->entry_date)->toDateString(),
                    'status' => $entry->status,
                    'description' => $entry->description,
                    'source_label' => $source['source_label'],
                    'restaurant_name' => $source['restaurant_name'],
                ];
            }),
            'entry_mix' => JournalEntry::query()
                ->select('module_type', DB::raw('COUNT(*) as total'))
                ->groupBy('module_type')
                ->orderByDesc('total')
                ->limit(6)
                ->get()
                ->map(fn ($row) => [
                    'module_type' => $row->module_type,
                    'module_label' => $sourceResolver->moduleTypeLabel($row->module_type),
                    'total' => $row->total,
                ]),
            'rule_coverage' => [
                'expected' => $expectedRuleCodes,
                'active' => $activeRuleCodes,
                'missing' => $missingRuleCodes,
            ],
            'exceptions' => [
                'posted_postings' => (int) ($statusCounts['posted'] ?? 0),
                'failed_postings' => (int) ($statusCounts['failed'] ?? 0),
                'pending_postings' => (int) ($statusCounts['pending'] ?? 0),
                'skipped_postings' => (int) ($statusCounts['skipped'] ?? 0),
                'unresolved_postings' => (int) $resolvedEvents->where('source_resolution_status', 'unresolved')->count(),
                'module_counts' => $moduleCounts,
                'recent_failures' => $resolvedEvents
                    ->where('posting_status', 'failed')
                    ->take(5)
                    ->values(),
            ],
        ];

        return Inertia::render('App/Admin/Accounting/Dashboard', [
            'stats' => $data,
            'latestTransactions' => $latestTransactionsQuery
                ->paginate($perPage)
                ->withQueryString()
                ->through(function ($entry) use ($sourceResolver) {
                    $source = $sourceResolver->resolveForJournalEntry($entry->loadMissing('tenant'));

                    return [
                        'id' => $entry->id,
                        'entry_no' => $entry->entry_no,
                        'entry_date' => optional($entry->entry_date)->toDateString(),
                        'status' => $entry->status,
                        'description' => $entry->description,
                        'module_type' => $entry->module_type,
                        'module_id' => $entry->module_id,
                        'tenant_id' => $entry->tenant_id,
                        'created_at' => $entry->created_at,
                        'source_label' => $source['source_label'],
                        'source_module' => $source['source_module'],
                        'document_no' => $source['document_no'],
                        'document_url' => $source['document_url'],
                        'restaurant_name' => $source['restaurant_name'],
                        'source_resolution_status' => $source['source_resolution_status'],
                    ];
                }),
            'transactionFilters' => $request->only(['search', 'status', 'module_type', 'tenant_id', 'from', 'to', 'per_page']),
            'moduleOptions' => JournalEntry::query()
                ->whereNotNull('module_type')
                ->where('module_type', '<>', '')
                ->distinct()
                ->orderBy('module_type')
                ->pluck('module_type')
                ->map(fn ($module) => ['value' => $module, 'label' => $sourceResolver->moduleTypeLabel($module)])
                ->values(),
            'tenants' => Schema::hasTable('tenants') ? Tenant::query()->orderBy('name')->get(['id', 'name']) : collect(),
            'error' => !empty($status['missing_optional'])
                ? $health->setupMessage('Accounting Dashboard', [], $status['missing_optional'])
                : null,
        ]);
    }
}
