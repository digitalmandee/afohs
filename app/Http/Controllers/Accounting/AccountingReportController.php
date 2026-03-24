<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\CoaAccount;
use App\Models\FinancialInvoice;
use App\Models\InventoryTransaction;
use App\Models\JournalEntry;
use App\Models\JournalLine;
use App\Models\PaymentAccount;
use App\Models\Budget;
use App\Models\Tenant;
use App\Models\VendorBill;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use App\Services\Accounting\Support\AccountingSourceResolver;
use App\Services\Accounting\Support\AccountingHealth;

class AccountingReportController extends Controller
{
    public function financialStatements(Request $request)
    {
        $report = $this->buildFinancialStatementsReport($request);

        if ($request->input('export') === 'csv') {
            return $this->downloadCsv(
                'financial-statements-comparison.csv',
                ['Metric', 'Current', 'Previous', 'Delta', 'Change %'],
                $report['csv_rows']
            );
        }

        return Inertia::render('App/Admin/Accounting/Reports/FinancialStatements', $report['page']);
    }

    public function trialBalance(Request $request)
    {
        $report = $this->buildTrialBalanceReport($request);

        if ($request->input('export') === 'csv') {
            return $this->downloadCsv(
                'trial-balance.csv',
                ['Code', 'Name', 'Type', 'Normal Balance', 'Level', 'Debit', 'Credit'],
                $report['csv_rows']
            );
        }

        return Inertia::render('App/Admin/Accounting/Reports/TrialBalance', $report['page']);
    }

    public function generalLedger(Request $request)
    {
        $health = app(AccountingHealth::class);
        $sourceResolver = app(AccountingSourceResolver::class);
        $perPage = $this->resolvePerPage($request);
        $status = $health->status(['journal_entries', 'journal_lines', 'coa_accounts'], ['tenants']);

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/GeneralLedger', [
                'lines' => $health->emptyPaginator($request, $perPage),
                'accounts' => Schema::hasTable('coa_accounts') ? CoaAccount::orderBy('full_code')->get(['id', 'full_code', 'name']) : collect(),
                'tenants' => Schema::hasTable('tenants') ? Tenant::query()->orderBy('name')->get(['id', 'name']) : collect(),
                'summary' => [
                    'records' => 0,
                    'total_debit' => 0,
                    'total_credit' => 0,
                ],
                'filters' => $request->only(['account_id', 'tenant_id', 'from', 'to', 'search', 'per_page']),
                'error' => $health->setupMessage('General ledger', $status['missing_required'], $status['missing_optional']),
            ]);
        }

        $accounts = CoaAccount::orderBy('full_code')->get(['id', 'full_code', 'name']);
        $query = JournalLine::with(['account', 'entry'])->orderBy('journal_entries.entry_date');

        $query->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id');

        if ($request->filled('account_id')) {
            $query->where('journal_lines.account_id', $request->account_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('journal_entries.entry_date', [$request->from, $request->to]);
        }

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('journal_entries.entry_no', 'like', "%{$search}%")
                    ->orWhere('journal_lines.description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('tenant_id')) {
            $query->where('journal_entries.tenant_id', $request->tenant_id);
        }

        $lines = $query->select('journal_lines.*', 'journal_entries.entry_date as entry_date', 'journal_entries.entry_no as entry_no')
            ->paginate($perPage)
            ->withQueryString();

        $entryIds = collect($lines->items())->pluck('journal_entry_id')->filter()->unique()->values()->all();
        $entryLookup = JournalEntry::query()
            ->with('tenant')
            ->whereIn('id', $entryIds)
            ->get()
            ->keyBy('id');

        $lines->setCollection(collect($lines->items())->map(function ($line) use ($entryLookup, $sourceResolver) {
            $entry = $entryLookup->get($line->journal_entry_id);
            $source = $entry ? $sourceResolver->resolveForJournalEntry($entry) : [
                'source_label' => 'General Journal',
                'document_url' => null,
                'restaurant_name' => null,
                'source_resolution_status' => 'unresolved',
            ];

            $line->source_label = $source['source_label'];
            $line->document_url = $source['document_url'];
            $line->restaurant_name = $source['restaurant_name'];
            $line->source_resolution_status = $source['source_resolution_status'];

            return $line;
        }));

        $summary = [
            'records' => $lines->total(),
            'total_debit' => (float) collect($lines->items())->sum(fn ($line) => (float) ($line->debit ?? 0)),
            'total_credit' => (float) collect($lines->items())->sum(fn ($line) => (float) ($line->credit ?? 0)),
        ];

        return Inertia::render('App/Admin/Accounting/GeneralLedger', [
            'lines' => $lines,
            'accounts' => $accounts,
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'summary' => $summary,
            'filters' => $request->only(['account_id', 'tenant_id', 'from', 'to', 'search', 'per_page']),
        ]);
    }

    public function balanceSheet(Request $request)
    {
        $report = $this->buildBalanceSheetReport($request);

        if ($request->input('export') === 'csv') {
            return $this->downloadCsv('balance-sheet.csv', ['Section', 'Code', 'Name', 'Balance'], $report['csv_rows']);
        }

        return Inertia::render('App/Admin/Accounting/Reports/BalanceSheet', $report['page']);
    }

    public function profitLoss(Request $request)
    {
        $report = $this->buildProfitLossReport($request);

        if ($request->input('export') === 'csv') {
            return $this->downloadCsv('profit-loss.csv', ['Section', 'Code', 'Name', 'Balance'], $report['csv_rows']);
        }

        return Inertia::render('App/Admin/Accounting/Reports/ProfitLoss', $report['page']);
    }

    public function receivablesAging(Request $request)
    {
        $report = $this->buildReceivablesAgingReport($request);

        return Inertia::render('App/Admin/Accounting/Reports/ReceivablesAging', $report['page']);
    }

    public function payablesAging(Request $request)
    {
        $report = $this->buildPayablesAgingReport($request);

        return Inertia::render('App/Admin/Accounting/Reports/PayablesAging', $report['page']);
    }

    public function receivablesAgingBySource(Request $request)
    {
        $report = $this->buildReceivablesBySourceReport($request);

        if ($request->input('export') === 'csv') {
            return $this->downloadCsv(
                'receivables-aging-by-source.csv',
                ['Document No', 'Source', 'Party', 'Issue Date', 'Due Date', 'Age Days', 'Bucket', 'Status', 'Total', 'Paid', 'Balance'],
                $report['csv_rows']
            );
        }

        return Inertia::render('App/Admin/Accounting/Reports/ReceivablesBySource', $report['page']);
    }

    public function trialBalancePrint(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildTrialBalanceReport($request), 'trial-balance', 'print');
    }

    public function trialBalancePdf(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildTrialBalanceReport($request), 'trial-balance', 'pdf');
    }

    public function balanceSheetPrint(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildBalanceSheetReport($request), 'balance-sheet', 'print');
    }

    public function balanceSheetPdf(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildBalanceSheetReport($request), 'balance-sheet', 'pdf');
    }

    public function profitLossPrint(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildProfitLossReport($request), 'profit-loss', 'print');
    }

    public function profitLossPdf(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildProfitLossReport($request), 'profit-loss', 'pdf');
    }

    public function financialStatementsPrint(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildFinancialStatementsReport($request), 'financial-statements', 'print');
    }

    public function financialStatementsPdf(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildFinancialStatementsReport($request), 'financial-statements', 'pdf');
    }

    public function receivablesAgingPrint(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildReceivablesAgingReport($request), 'receivables-aging', 'print');
    }

    public function receivablesAgingPdf(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildReceivablesAgingReport($request), 'receivables-aging', 'pdf');
    }

    public function receivablesBySourcePrint(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildReceivablesBySourceReport($request), 'receivables-by-source', 'print');
    }

    public function receivablesBySourcePdf(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildReceivablesBySourceReport($request), 'receivables-by-source', 'pdf');
    }

    public function payablesAgingPrint(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildPayablesAgingReport($request), 'payables-aging', 'print');
    }

    public function payablesAgingPdf(Request $request)
    {
        return $this->renderBrandedReportResponse($this->buildPayablesAgingReport($request), 'payables-aging', 'pdf');
    }

    public function managementPack(Request $request)
    {
        $from = $request->input('from') ?: Carbon::today()->startOfMonth()->toDateString();
        $to = $request->input('to') ?: Carbon::today()->toDateString();

        $cashInflows = 0.0;
        if (Schema::hasTable('financial_receipts')) {
            $cashInflows = (float) DB::table('financial_receipts')
                ->when(Schema::hasColumn('financial_receipts', 'receipt_date'), function ($q) use ($from, $to) {
                    $q->whereBetween(DB::raw('DATE(receipt_date)'), [$from, $to]);
                })
                ->sum('amount');
        }
        $cashOutflows = 0.0;
        if (Schema::hasTable('vendor_payments')) {
            $cashOutflows = (float) DB::table('vendor_payments')
                ->whereNotIn('status', ['void'])
                ->whereBetween(DB::raw('DATE(payment_date)'), [$from, $to])
                ->sum('amount');
        }

        $arTotal = Schema::hasTable('financial_invoices')
            ? (float) FinancialInvoice::query()
                ->whereIn('status', ['unpaid', 'partial', 'overdue'])
                ->select(DB::raw('SUM(total_price - paid_amount) as balance'))
                ->value('balance')
            : 0.0;
        $apTotal = Schema::hasTable('vendor_bills')
            ? (float) VendorBill::query()
                ->whereIn('status', ['draft', 'posted', 'partially_paid'])
                ->select(DB::raw('SUM(grand_total - paid_amount) as balance'))
                ->value('balance')
            : 0.0;

        $arBySource = collect();
        if (Schema::hasTable('financial_invoices')) {
            $arBySource = FinancialInvoice::query()
                ->whereIn('status', ['unpaid', 'partial', 'overdue'])
                ->select(
                    DB::raw("
                        CASE
                            WHEN (subscription_type_id IS NOT NULL OR subscription_category_id IS NOT NULL OR LOWER(COALESCE(invoice_type, '')) = 'subscription') THEN 'subscription'
                            WHEN LOWER(COALESCE(invoice_type, '')) = 'membership' THEN 'membership'
                            WHEN LOWER(COALESCE(invoice_type, '')) IN ('food_order','pos_sale') THEN 'pos'
                            WHEN LOWER(COALESCE(invoice_type, '')) = 'room_booking' THEN 'room'
                            WHEN LOWER(COALESCE(invoice_type, '')) = 'event_booking' THEN 'event'
                            ELSE COALESCE(LOWER(invoice_type), 'other')
                        END as source
                    "),
                    DB::raw('COUNT(*) as total_invoices'),
                    DB::raw('SUM(total_price - paid_amount) as outstanding')
                )
                ->groupBy('source')
                ->orderByDesc('outstanding')
                ->get();
        }

        $budgetSummary = [
            'budgeted' => 0.0,
            'actual' => 0.0,
            'variance' => 0.0,
        ];
        if (Schema::hasTable('budgets') && Schema::hasTable('budget_lines')) {
            $budgeted = (float) DB::table('budgets')
                ->whereIn('status', ['active', 'closed'])
                ->whereDate('start_date', '<=', $to)
                ->whereDate('end_date', '>=', $from)
                ->sum('total_amount');

            $budgetAccountIds = DB::table('budget_lines')->distinct()->pluck('account_id')->filter()->all();
            $actual = 0.0;
            if (!empty($budgetAccountIds)) {
                $actual = (float) JournalLine::query()
                    ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id')
                    ->whereIn('journal_lines.account_id', $budgetAccountIds)
                    ->whereBetween('journal_entries.entry_date', [$from, $to])
                    ->select(DB::raw('SUM(journal_lines.debit - journal_lines.credit) as actual'))
                    ->value('actual');
            }

            $budgetSummary = [
                'budgeted' => $budgeted,
                'actual' => $actual,
                'variance' => $budgeted - $actual,
            ];
        }

        $inventoryValuation = collect();
        if (Schema::hasTable('inventory_transactions')) {
            $inventoryValuation = InventoryTransaction::query()
                ->select(
                    'warehouse_id',
                    DB::raw('SUM(qty_in - qty_out) as net_qty'),
                    DB::raw('SUM(COALESCE(total_cost,0)) as total_cost')
                )
                ->groupBy('warehouse_id')
                ->orderByDesc('total_cost')
                ->get()
                ->map(function ($row) {
                    return [
                        'warehouse_id' => $row->warehouse_id,
                        'net_qty' => (float) $row->net_qty,
                        'valuation' => (float) $row->total_cost,
                    ];
                });
        }

        $bankPositions = collect();
        if (Schema::hasTable('financial_receipts') && Schema::hasTable('vendor_payments')) {
            $bankPositions = PaymentAccount::query()
                ->whereIn('payment_method', ['bank', 'bank_transfer', 'online', 'cheque'])
                ->select('id', 'name', 'payment_method')
                ->get()
                ->map(function ($acc) use ($from, $to) {
                $inflowsBefore = (float) DB::table('financial_receipts')
                    ->where('payment_account_id', $acc->id)
                    ->whereDate('receipt_date', '<', $from)
                    ->sum('amount');
                $outflowsBefore = (float) DB::table('vendor_payments')
                    ->where('payment_account_id', $acc->id)
                    ->whereNotIn('status', ['void'])
                    ->whereDate('payment_date', '<', $from)
                    ->sum('amount');
                $opening = $inflowsBefore - $outflowsBefore;

                $inflows = (float) DB::table('financial_receipts')
                    ->where('payment_account_id', $acc->id)
                    ->whereBetween(DB::raw('DATE(receipt_date)'), [$from, $to])
                    ->sum('amount');
                $outflows = (float) DB::table('vendor_payments')
                    ->where('payment_account_id', $acc->id)
                    ->whereNotIn('status', ['void'])
                    ->whereBetween(DB::raw('DATE(payment_date)'), [$from, $to])
                    ->sum('amount');

                return [
                    'id' => $acc->id,
                    'name' => $acc->name,
                    'opening' => $opening,
                    'inflows' => $inflows,
                    'outflows' => $outflows,
                    'closing' => $opening + $inflows - $outflows,
                ];
                });
        }

        return Inertia::render('App/Admin/Accounting/Reports/ManagementPack', [
            'filters' => ['from' => $from, 'to' => $to],
            'cashFlow' => [
                'inflows' => $cashInflows,
                'outflows' => $cashOutflows,
                'net' => $cashInflows - $cashOutflows,
            ],
            'workingCapital' => [
                'ar_total' => $arTotal,
                'ap_total' => $apTotal,
                'net_position' => $arTotal - $apTotal,
            ],
            'arBySource' => $arBySource,
            'budgetSummary' => $budgetSummary,
            'inventoryValuation' => $inventoryValuation,
            'bankPositions' => $bankPositions,
        ]);
    }

    private function buildFinancialStatementsReport(Request $request): array
    {
        [$from, $to, $compareFrom, $compareTo] = $this->resolveComparisonPeriods($request);

        $current = $this->statementSnapshot($from, $to);
        $previous = $this->statementSnapshot($compareFrom, $compareTo);

        $comparison = [
            'trial_balance_gap' => $this->comparisonMetric($current['trial_balance_gap'], $previous['trial_balance_gap']),
            'assets_total' => $this->comparisonMetric($current['assets_total'], $previous['assets_total']),
            'liabilities_total' => $this->comparisonMetric($current['liabilities_total'], $previous['liabilities_total']),
            'equity_total' => $this->comparisonMetric($current['equity_total'], $previous['equity_total']),
            'income_total' => $this->comparisonMetric($current['income_total'], $previous['income_total']),
            'expense_total' => $this->comparisonMetric($current['expense_total'], $previous['expense_total']),
            'net_profit' => $this->comparisonMetric($current['net_profit'], $previous['net_profit']),
        ];
        $currentHealth = $this->statementHealth($current);
        $previousHealth = $this->statementHealth($previous);
        $healthComparison = [
            'current_ratio' => $this->comparisonMetric($currentHealth['current_ratio'], $previousHealth['current_ratio']),
            'debt_to_equity' => $this->comparisonMetric($currentHealth['debt_to_equity'], $previousHealth['debt_to_equity']),
            'net_margin' => $this->comparisonMetric($currentHealth['net_margin'], $previousHealth['net_margin']),
        ];

        $csvRows = collect($comparison)->map(function ($metric, $name) {
            return [
                'Metric' => strtoupper(str_replace('_', ' ', $name)),
                'Current' => number_format((float) ($metric['current'] ?? 0), 2, '.', ''),
                'Previous' => number_format((float) ($metric['previous'] ?? 0), 2, '.', ''),
                'Delta' => number_format((float) ($metric['delta'] ?? 0), 2, '.', ''),
                'Change %' => is_null($metric['change_percent']) ? '' : number_format((float) $metric['change_percent'], 2, '.', ''),
            ];
        })->values()->all();

        return [
            'page' => [
                'filters' => [
                    'from' => $from,
                    'to' => $to,
                    'compare_from' => $compareFrom,
                    'compare_to' => $compareTo,
                ],
                'current' => $current,
                'previous' => $previous,
                'comparison' => $comparison,
                'currentHealth' => $currentHealth,
                'previousHealth' => $previousHealth,
                'healthComparison' => $healthComparison,
            ],
            'csv_rows' => $csvRows,
            'print' => $this->buildBrandedPayload(
                'Financial Statements',
                [
                    'Current From' => $from,
                    'Current To' => $to,
                    'Compare From' => $compareFrom,
                    'Compare To' => $compareTo,
                ],
                [
                    ['label' => 'Net Profit', 'value' => $comparison['net_profit']['current'] ?? 0],
                    ['label' => 'Assets', 'value' => $comparison['assets_total']['current'] ?? 0],
                    ['label' => 'Liabilities', 'value' => $comparison['liabilities_total']['current'] ?? 0],
                    ['label' => 'Equity', 'value' => $comparison['equity_total']['current'] ?? 0],
                ],
                [
                    [
                        'title' => 'Statement Comparison',
                        'columns' => ['Metric', 'Current', 'Previous', 'Delta', 'Change %'],
                        'rows' => $csvRows,
                    ],
                    [
                        'title' => 'Executive Health',
                        'columns' => ['Metric', 'Current', 'Previous', 'Delta'],
                        'rows' => [
                            ['Metric' => 'Current Ratio', 'Current' => number_format((float) ($currentHealth['current_ratio'] ?? 0), 2, '.', ''), 'Previous' => number_format((float) ($previousHealth['current_ratio'] ?? 0), 2, '.', ''), 'Delta' => number_format((float) ($healthComparison['current_ratio']['delta'] ?? 0), 2, '.', '')],
                            ['Metric' => 'Debt to Equity', 'Current' => number_format((float) ($currentHealth['debt_to_equity'] ?? 0), 2, '.', ''), 'Previous' => number_format((float) ($previousHealth['debt_to_equity'] ?? 0), 2, '.', ''), 'Delta' => number_format((float) ($healthComparison['debt_to_equity']['delta'] ?? 0), 2, '.', '')],
                            ['Metric' => 'Net Margin %', 'Current' => number_format((float) ($currentHealth['net_margin'] ?? 0), 2, '.', ''), 'Previous' => number_format((float) ($previousHealth['net_margin'] ?? 0), 2, '.', ''), 'Delta' => number_format((float) ($healthComparison['net_margin']['delta'] ?? 0), 2, '.', '')],
                        ],
                    ],
                ]
            ),
        ];
    }

    private function buildTrialBalanceReport(Request $request): array
    {
        $health = app(AccountingHealth::class);
        $from = $request->input('from');
        $to = $request->input('to');
        $status = $health->status(['journal_entries', 'journal_lines', 'coa_accounts']);

        if (!$status['ready']) {
            $page = [
                'rows' => [],
                'summary' => [
                    'total_debit' => 0,
                    'total_credit' => 0,
                    'difference' => 0,
                    'type_totals' => [],
                ],
                'filters' => ['from' => $from, 'to' => $to],
                'error' => $health->setupMessage('Trial balance', $status['missing_required'], $status['missing_optional']),
            ];

            return [
                'page' => $page,
                'csv_rows' => [],
                'print' => $this->buildBrandedPayload('Trial Balance', ['From' => $from, 'To' => $to], [], [], $page['error']),
            ];
        }

        $totals = $this->aggregateByAccount($from, $to);
        $ledgerReady = Schema::hasTable('journal_entries') && Schema::hasTable('journal_lines');

        $accounts = CoaAccount::orderBy('full_code')->get()->map(function ($acc) use ($totals, $from, $to, $health, $ledgerReady) {
            $line = $totals->get($acc->id);
            $trialBalance = $this->trialBalanceAmounts($acc, $line);
            $ledgerQuery = array_filter([
                'account_id' => $acc->id,
                'from' => $from,
                'to' => $to,
            ], fn ($value) => $value !== null && $value !== '');

            return [
                'id' => $acc->id,
                'code' => $acc->full_code,
                'name' => $acc->name,
                'type' => $acc->type,
                'normal_balance' => $acc->normal_balance,
                'level' => $acc->level,
                'is_postable' => (bool) $acc->is_postable,
                'debit' => $trialBalance['debit'],
                'credit' => $trialBalance['credit'],
                'ledger_url' => $ledgerReady ? $health->safeRoute('accounting.general-ledger', $ledgerQuery) : null,
            ];
        });

        $totalDebit = (float) $accounts->sum('debit');
        $totalCredit = (float) $accounts->sum('credit');
        $difference = $totalDebit - $totalCredit;
        $typeTotals = $accounts->groupBy('type')->map(function ($rows) {
            return [
                'count' => $rows->count(),
                'debit' => (float) $rows->sum('debit'),
                'credit' => (float) $rows->sum('credit'),
            ];
        });

        $csvRows = $accounts->map(function ($row) {
            return [
                'Code' => $row['code'],
                'Name' => $row['name'],
                'Type' => $row['type'],
                'Normal Balance' => $row['normal_balance'],
                'Level' => $row['level'],
                'Debit' => number_format((float) $row['debit'], 2, '.', ''),
                'Credit' => number_format((float) $row['credit'], 2, '.', ''),
            ];
        })->all();

        $csvRows[] = [
            'Code' => '',
            'Name' => 'TOTAL',
            'Type' => '',
            'Normal Balance' => '',
            'Level' => '',
            'Debit' => number_format($totalDebit, 2, '.', ''),
            'Credit' => number_format($totalCredit, 2, '.', ''),
        ];

        return [
            'page' => [
                'rows' => $accounts,
                'summary' => [
                    'total_debit' => $totalDebit,
                    'total_credit' => $totalCredit,
                    'difference' => $difference,
                    'type_totals' => $typeTotals,
                ],
                'filters' => ['from' => $from, 'to' => $to],
            ],
            'csv_rows' => $csvRows,
            'print' => $this->buildBrandedPayload(
                'Trial Balance',
                ['From' => $from, 'To' => $to],
                [
                    ['label' => 'Total Debit', 'value' => $totalDebit],
                    ['label' => 'Total Credit', 'value' => $totalCredit],
                    ['label' => 'Difference', 'value' => $difference],
                ],
                [[
                    'title' => 'Trial Balance Register',
                    'columns' => ['Code', 'Name', 'Type', 'Normal Balance', 'Level', 'Debit', 'Credit'],
                    'rows' => $csvRows,
                ]]
            ),
        ];
    }

    private function buildBalanceSheetReport(Request $request): array
    {
        $health = app(AccountingHealth::class);
        $from = $request->input('from');
        $to = $request->input('to');
        $status = $health->status(['journal_entries', 'journal_lines', 'coa_accounts']);

        if (!$status['ready']) {
            $page = [
                'assets' => [],
                'liabilities' => [],
                'equity' => [],
                'summary' => [
                    'assets_total' => 0,
                    'liabilities_total' => 0,
                    'equity_total' => 0,
                    'liabilities_equity_total' => 0,
                    'difference' => 0,
                ],
                'filters' => ['from' => $from, 'to' => $to],
                'error' => $health->setupMessage('Balance sheet', $status['missing_required'], $status['missing_optional']),
            ];

            return [
                'page' => $page,
                'csv_rows' => [],
                'print' => $this->buildBrandedPayload('Balance Sheet', ['From' => $from, 'To' => $to], [], [], $page['error']),
            ];
        }

        $lines = $this->aggregateByAccount($from, $to);
        $accounts = CoaAccount::orderBy('full_code')->get();

        $assets = $this->mapBalances($accounts->where('type', 'asset'), $lines, 'debit', $from, $to);
        $liabilities = $this->mapBalances($accounts->where('type', 'liability'), $lines, 'credit', $from, $to);
        $equity = $this->mapBalances($accounts->where('type', 'equity'), $lines, 'credit', $from, $to);
        $assetsTotal = (float) $assets->sum('balance');
        $liabilitiesTotal = (float) $liabilities->sum('balance');
        $equityTotal = (float) $equity->sum('balance');
        $difference = $assetsTotal - ($liabilitiesTotal + $equityTotal);

        $csvRows = collect();
        foreach ($assets as $row) {
            $csvRows->push(['Section' => 'Assets', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
        }
        foreach ($liabilities as $row) {
            $csvRows->push(['Section' => 'Liabilities', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
        }
        foreach ($equity as $row) {
            $csvRows->push(['Section' => 'Equity', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
        }
        $csvRows->push(['Section' => '', 'Code' => '', 'Name' => 'Assets Total', 'Balance' => number_format($assetsTotal, 2, '.', '')]);
        $csvRows->push(['Section' => '', 'Code' => '', 'Name' => 'Liabilities Total', 'Balance' => number_format($liabilitiesTotal, 2, '.', '')]);
        $csvRows->push(['Section' => '', 'Code' => '', 'Name' => 'Equity Total', 'Balance' => number_format($equityTotal, 2, '.', '')]);
        $csvRows->push(['Section' => '', 'Code' => '', 'Name' => 'Balance Gap', 'Balance' => number_format($difference, 2, '.', '')]);

        return [
            'page' => [
                'assets' => $assets,
                'liabilities' => $liabilities,
                'equity' => $equity,
                'summary' => [
                    'assets_total' => $assetsTotal,
                    'liabilities_total' => $liabilitiesTotal,
                    'equity_total' => $equityTotal,
                    'liabilities_equity_total' => $liabilitiesTotal + $equityTotal,
                    'difference' => $difference,
                ],
                'filters' => ['from' => $from, 'to' => $to],
            ],
            'csv_rows' => $csvRows->all(),
            'print' => $this->buildBrandedPayload(
                'Balance Sheet',
                ['From' => $from, 'To' => $to],
                [
                    ['label' => 'Assets', 'value' => $assetsTotal],
                    ['label' => 'Liabilities', 'value' => $liabilitiesTotal],
                    ['label' => 'Equity', 'value' => $equityTotal],
                    ['label' => 'Balance Gap', 'value' => $difference],
                ],
                [
                    ['title' => 'Assets', 'columns' => ['Code', 'Name', 'Balance'], 'rows' => $this->simpleSectionRows($assets)],
                    ['title' => 'Liabilities', 'columns' => ['Code', 'Name', 'Balance'], 'rows' => $this->simpleSectionRows($liabilities)],
                    ['title' => 'Equity', 'columns' => ['Code', 'Name', 'Balance'], 'rows' => $this->simpleSectionRows($equity)],
                ]
            ),
        ];
    }

    private function buildProfitLossReport(Request $request): array
    {
        $health = app(AccountingHealth::class);
        $from = $request->input('from');
        $to = $request->input('to');
        $status = $health->status(['journal_entries', 'journal_lines', 'coa_accounts']);

        if (!$status['ready']) {
            $page = [
                'income' => [],
                'expense' => [],
                'summary' => [
                    'income_total' => 0,
                    'expense_total' => 0,
                    'net_profit' => 0,
                ],
                'filters' => ['from' => $from, 'to' => $to],
                'error' => $health->setupMessage('Profit and loss', $status['missing_required'], $status['missing_optional']),
            ];

            return [
                'page' => $page,
                'csv_rows' => [],
                'print' => $this->buildBrandedPayload('Profit & Loss', ['From' => $from, 'To' => $to], [], [], $page['error']),
            ];
        }

        $lines = $this->aggregateByAccount($from, $to);
        $accounts = CoaAccount::orderBy('full_code')->get();
        $income = $this->mapBalances($accounts->where('type', 'income'), $lines, 'credit', $from, $to);
        $expense = $this->mapBalances($accounts->where('type', 'expense'), $lines, 'debit', $from, $to);
        $incomeTotal = (float) $income->sum('balance');
        $expenseTotal = (float) $expense->sum('balance');
        $netProfit = $incomeTotal - $expenseTotal;

        $csvRows = collect();
        foreach ($income as $row) {
            $csvRows->push(['Section' => 'Income', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
        }
        foreach ($expense as $row) {
            $csvRows->push(['Section' => 'Expense', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
        }
        $csvRows->push(['Section' => '', 'Code' => '', 'Name' => 'Income Total', 'Balance' => number_format($incomeTotal, 2, '.', '')]);
        $csvRows->push(['Section' => '', 'Code' => '', 'Name' => 'Expense Total', 'Balance' => number_format($expenseTotal, 2, '.', '')]);
        $csvRows->push(['Section' => '', 'Code' => '', 'Name' => 'Net Profit', 'Balance' => number_format($netProfit, 2, '.', '')]);

        return [
            'page' => [
                'income' => $income,
                'expense' => $expense,
                'summary' => [
                    'income_total' => $incomeTotal,
                    'expense_total' => $expenseTotal,
                    'net_profit' => $netProfit,
                ],
                'filters' => ['from' => $from, 'to' => $to],
            ],
            'csv_rows' => $csvRows->all(),
            'print' => $this->buildBrandedPayload(
                'Profit & Loss',
                ['From' => $from, 'To' => $to],
                [
                    ['label' => 'Income', 'value' => $incomeTotal],
                    ['label' => 'Expense', 'value' => $expenseTotal],
                    ['label' => 'Net Profit', 'value' => $netProfit],
                ],
                [
                    ['title' => 'Income', 'columns' => ['Code', 'Name', 'Balance'], 'rows' => $this->simpleSectionRows($income)],
                    ['title' => 'Expenses', 'columns' => ['Code', 'Name', 'Balance'], 'rows' => $this->simpleSectionRows($expense)],
                ]
            ),
        ];
    }

    private function buildReceivablesAgingReport(Request $request): array
    {
        $query = FinancialInvoice::query()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->with(['member:id,full_name', 'corporateMember:id,full_name', 'customer:id,name']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhere('mem_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('issue_date', [$request->from, $request->to]);
        }

        $today = Carbon::today();
        $rows = $query->orderByDesc('due_date')->get()->map(function ($invoice) use ($today) {
            $dueDate = $invoice->due_date ?? $invoice->issue_date ?? $invoice->created_at;
            $parsedDueDate = $this->safeParseDate($dueDate);
            $age = $parsedDueDate && $parsedDueDate->lessThanOrEqualTo($today)
                ? $parsedDueDate->diffInDays($today)
                : 0;
            $balance = max(0, ((float) ($invoice->total_price ?? 0)) - ((float) ($invoice->paid_amount ?? 0)));

            return [
                'id' => $invoice->id,
                'document_no' => $invoice->invoice_no,
                'party' => $invoice->member?->full_name ?? $invoice->corporateMember?->full_name ?? $invoice->customer?->name ?? '-',
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $parsedDueDate?->toDateString(),
                'age_days' => $age,
                'status' => $invoice->status,
                'total' => (float) ($invoice->total_price ?? 0),
                'paid' => (float) ($invoice->paid_amount ?? 0),
                'balance' => $balance,
                'bucket' => $this->agingBucket($age),
            ];
        })->filter(fn ($row) => $row['balance'] > 0)->values();

        if ($request->filled('bucket') && in_array($request->bucket, ['current', '1-30', '31-60', '61-90', '90+'], true)) {
            $rows = $rows->where('bucket', $request->bucket)->values();
        }

        $summary = $this->agingSummary($rows);

        return [
            'page' => [
                'rows' => $this->paginateCollection($rows, $request),
                'summary' => $summary,
                'filters' => $request->only(['search', 'from', 'to', 'bucket', 'per_page']),
            ],
            'csv_rows' => [],
            'print' => $this->buildBrandedPayload(
                'Receivables Aging',
                $request->only(['search', 'from', 'to', 'bucket']),
                [
                    ['label' => 'Open Documents', 'value' => $summary['records'] ?? 0, 'kind' => 'count'],
                    ['label' => 'Total Outstanding', 'value' => $summary['total_balance'] ?? 0],
                    ['label' => 'Average Age', 'value' => ($summary['average_age'] ?? 0) . ' days', 'raw' => true],
                    ['label' => '90+ Exposure', 'value' => $summary['bucket_balance']['90+'] ?? 0],
                ],
                [[
                    'title' => 'Receivables Aging Register',
                    'columns' => ['Document No', 'Party', 'Issue Date', 'Due Date', 'Age Days', 'Bucket', 'Status', 'Total', 'Paid', 'Balance'],
                    'rows' => collect($rows)->map(fn ($row) => [
                        'Document No' => $row['document_no'],
                        'Party' => $row['party'],
                        'Issue Date' => $row['issue_date'],
                        'Due Date' => $row['due_date'],
                        'Age Days' => $row['age_days'],
                        'Bucket' => $row['bucket'],
                        'Status' => $row['status'],
                        'Total' => number_format((float) $row['total'], 2, '.', ''),
                        'Paid' => number_format((float) $row['paid'], 2, '.', ''),
                        'Balance' => number_format((float) $row['balance'], 2, '.', ''),
                    ])->all(),
                ]],
                null,
                array_map(fn ($bucket) => sprintf('%s: %d | %s', $bucket, $summary['bucket_count'][$bucket] ?? 0, number_format((float) ($summary['bucket_balance'][$bucket] ?? 0), 2, '.', '')), ['current', '1-30', '31-60', '61-90', '90+'])
            ),
        ];
    }

    private function buildPayablesAgingReport(Request $request): array
    {
        $query = VendorBill::query()
            ->with('vendor:id,name')
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

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('bill_date', [$request->from, $request->to]);
        }

        $today = Carbon::today();
        $rows = $query->orderByDesc('due_date')->get()->map(function ($bill) use ($today) {
            $dueDate = $bill->due_date ?? $bill->bill_date ?? $bill->created_at;
            $parsedDueDate = $this->safeParseDate($dueDate);
            $age = $parsedDueDate && $parsedDueDate->lessThanOrEqualTo($today)
                ? $parsedDueDate->diffInDays($today)
                : 0;
            $balance = max(0, ((float) ($bill->grand_total ?? 0)) - ((float) ($bill->paid_amount ?? 0)));

            return [
                'id' => $bill->id,
                'document_no' => $bill->bill_no,
                'party' => $bill->vendor?->name ?? '-',
                'bill_date' => $bill->bill_date?->toDateString(),
                'due_date' => $parsedDueDate?->toDateString(),
                'age_days' => $age,
                'status' => $bill->status,
                'total' => (float) ($bill->grand_total ?? 0),
                'paid' => (float) ($bill->paid_amount ?? 0),
                'balance' => $balance,
                'bucket' => $this->agingBucket($age),
            ];
        })->filter(fn ($row) => $row['balance'] > 0)->values();

        if ($request->filled('bucket') && in_array($request->bucket, ['current', '1-30', '31-60', '61-90', '90+'], true)) {
            $rows = $rows->where('bucket', $request->bucket)->values();
        }

        $summary = $this->agingSummary($rows);

        return [
            'page' => [
                'rows' => $this->paginateCollection($rows, $request),
                'summary' => $summary,
                'filters' => $request->only(['search', 'from', 'to', 'bucket', 'per_page']),
            ],
            'csv_rows' => [],
            'print' => $this->buildBrandedPayload(
                'Payables Aging',
                $request->only(['search', 'from', 'to', 'bucket']),
                [
                    ['label' => 'Open Bills', 'value' => $summary['records'] ?? 0, 'kind' => 'count'],
                    ['label' => 'Total Outstanding', 'value' => $summary['total_balance'] ?? 0],
                    ['label' => 'Average Age', 'value' => ($summary['average_age'] ?? 0) . ' days', 'raw' => true],
                    ['label' => '90+ Exposure', 'value' => $summary['bucket_balance']['90+'] ?? 0],
                ],
                [[
                    'title' => 'Payables Aging Register',
                    'columns' => ['Document No', 'Vendor', 'Bill Date', 'Due Date', 'Age Days', 'Bucket', 'Status', 'Total', 'Paid', 'Balance'],
                    'rows' => collect($rows)->map(fn ($row) => [
                        'Document No' => $row['document_no'],
                        'Vendor' => $row['party'],
                        'Bill Date' => $row['bill_date'],
                        'Due Date' => $row['due_date'],
                        'Age Days' => $row['age_days'],
                        'Bucket' => $row['bucket'],
                        'Status' => $row['status'],
                        'Total' => number_format((float) $row['total'], 2, '.', ''),
                        'Paid' => number_format((float) $row['paid'], 2, '.', ''),
                        'Balance' => number_format((float) $row['balance'], 2, '.', ''),
                    ])->all(),
                ]],
                null,
                array_map(fn ($bucket) => sprintf('%s: %d | %s', $bucket, $summary['bucket_count'][$bucket] ?? 0, number_format((float) ($summary['bucket_balance'][$bucket] ?? 0), 2, '.', '')), ['current', '1-30', '31-60', '61-90', '90+'])
            ),
        ];
    }

    private function buildReceivablesBySourceReport(Request $request): array
    {
        $sourceResolver = app(AccountingSourceResolver::class);
        $query = FinancialInvoice::query()
            ->whereIn('status', ['unpaid', 'partial', 'overdue'])
            ->with(['member:id,full_name', 'corporateMember:id,full_name', 'customer:id,name', 'invoiceable']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('invoice_no', 'like', "%{$search}%")
                    ->orWhere('mem_no', 'like', "%{$search}%");
            });
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('issue_date', [$request->from, $request->to]);
        }

        $today = Carbon::today();
        $rows = $query->orderByDesc('due_date')->get()->map(function ($invoice) use ($today, $sourceResolver) {
            $dueDate = $invoice->due_date ?? $invoice->issue_date ?? $invoice->created_at;
            $parsedDueDate = $this->safeParseDate($dueDate);
            $age = $parsedDueDate && $parsedDueDate->lessThanOrEqualTo($today)
                ? $parsedDueDate->diffInDays($today)
                : 0;
            $balance = max(0, ((float) ($invoice->total_price ?? 0)) - ((float) ($invoice->paid_amount ?? 0)));
            $source = $sourceResolver->resolveForFinancialInvoice($invoice);

            return [
                'id' => $invoice->id,
                'document_no' => $source['document_no'],
                'source' => $source['source_label'],
                'document_url' => $source['document_url'],
                'restaurant_name' => $source['restaurant_name'],
                'party' => $invoice->member?->full_name ?? $invoice->corporateMember?->full_name ?? $invoice->customer?->name ?? '-',
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $parsedDueDate?->toDateString(),
                'age_days' => $age,
                'status' => $invoice->status,
                'total' => (float) ($invoice->total_price ?? 0),
                'paid' => (float) ($invoice->paid_amount ?? 0),
                'balance' => $balance,
                'bucket' => $this->agingBucket($age),
            ];
        })->filter(fn ($row) => $row['balance'] > 0)->values();

        if ($request->filled('source')) {
            $rows = $rows->where('source', (string) $request->source)->values();
        }

        if ($request->filled('bucket') && in_array($request->bucket, ['current', '1-30', '31-60', '61-90', '90+'], true)) {
            $rows = $rows->where('bucket', $request->bucket)->values();
        }

        $summary = $this->agingSummary($rows);
        $summary['source_totals'] = $rows
            ->groupBy('source')
            ->map(fn ($sourceRows) => [
                'count' => $sourceRows->count(),
                'balance' => (float) $sourceRows->sum('balance'),
            ])
            ->sortKeys()
            ->all();

        $csvRows = collect($rows)->map(function ($row) {
            return [
                'Document No' => $row['document_no'],
                'Source' => $row['source'],
                'Party' => $row['party'],
                'Issue Date' => $row['issue_date'],
                'Due Date' => $row['due_date'],
                'Age Days' => $row['age_days'],
                'Bucket' => $row['bucket'],
                'Status' => $row['status'],
                'Total' => number_format((float) $row['total'], 2, '.', ''),
                'Paid' => number_format((float) $row['paid'], 2, '.', ''),
                'Balance' => number_format((float) $row['balance'], 2, '.', ''),
            ];
        })->values()->all();

        return [
            'page' => [
                'rows' => $this->paginateCollection($rows, $request),
                'summary' => $summary,
                'sourceOptions' => collect($rows)->pluck('source')->unique()->sort()->values()->all(),
                'filters' => $request->only(['search', 'from', 'to', 'bucket', 'source']),
            ],
            'csv_rows' => $csvRows,
            'print' => $this->buildBrandedPayload(
                'Receivables by Source',
                $request->only(['search', 'from', 'to', 'bucket', 'source']),
                [
                    ['label' => 'Open Receivables', 'value' => $summary['records'] ?? 0, 'kind' => 'count'],
                    ['label' => 'Outstanding', 'value' => $summary['total_balance'] ?? 0],
                    ['label' => 'Average Age', 'value' => ($summary['average_age'] ?? 0) . ' days', 'raw' => true],
                    ['label' => '90+ Bucket', 'value' => $summary['bucket_balance']['90+'] ?? 0],
                ],
                [[
                    'title' => 'Receivables by Source Register',
                    'columns' => ['Document No', 'Source', 'Party', 'Issue Date', 'Due Date', 'Age Days', 'Bucket', 'Status', 'Total', 'Paid', 'Balance'],
                    'rows' => $csvRows,
                ]],
                null,
                collect($summary['source_totals'] ?? [])->map(fn ($stats, $source) => sprintf('%s: %d | %s', $source, $stats['count'] ?? 0, number_format((float) ($stats['balance'] ?? 0), 2, '.', '')))->values()->all()
            ),
        ];
    }

    private function renderBrandedReportResponse(array $report, string $slug, string $mode)
    {
        $payload = $report['print'];
        $payload['autoPrint'] = $mode === 'print';

        if ($mode === 'pdf') {
            return Pdf::loadView('accounting.reports.branded', $payload)
                ->setPaper('a4', 'portrait')
                ->download(sprintf('%s-%s.pdf', $slug, now()->format('Ymd-His')));
        }

        return response()->view('accounting.reports.branded', $payload);
    }

    private function buildBrandedPayload(string $title, array $filters = [], array $metrics = [], array $sections = [], ?string $error = null, array $badges = []): array
    {
        return [
            'title' => $title,
            'companyName' => 'AFOHS Club',
            'logoDataUri' => $this->reportLogoDataUri(),
            'generatedAt' => now()->format('d/m/Y h:i A'),
            'filters' => collect($filters)
                ->filter(fn ($value) => $value !== null && $value !== '')
                ->map(fn ($value) => is_array($value) ? implode(', ', array_filter($value)) : (string) $value)
                ->all(),
            'metrics' => collect($metrics)->map(function ($metric) {
                if (!empty($metric['raw'])) {
                    return $metric;
                }

                if (($metric['kind'] ?? null) === 'count') {
                    $metric['value'] = number_format((float) ($metric['value'] ?? 0), 0, '.', ',');
                } else {
                    $metric['value'] = number_format((float) ($metric['value'] ?? 0), 2, '.', ',');
                }

                return $metric;
            })->all(),
            'sections' => $sections,
            'error' => $error,
            'badges' => $badges,
        ];
    }

    private function simpleSectionRows($rows): array
    {
        return collect($rows)->map(fn ($row) => [
            'Code' => $row['code'],
            'Name' => $row['name'],
            'Balance' => number_format((float) ($row['balance'] ?? 0), 2, '.', ''),
        ])->values()->all();
    }

    private function reportLogoDataUri(): ?string
    {
        foreach (['assets/Logo.png', 'assets/logo.png', 'assets/slogo.png'] as $relativePath) {
            $path = public_path($relativePath);
            if (File::exists($path)) {
                $mime = File::mimeType($path) ?: 'image/png';
                return 'data:' . $mime . ';base64,' . base64_encode(File::get($path));
            }
        }

        return null;
    }

    private function aggregateByAccount(?string $from, ?string $to)
    {
        $query = JournalLine::query()
            ->select('journal_lines.account_id', DB::raw('SUM(journal_lines.debit) as debit'), DB::raw('SUM(journal_lines.credit) as credit'))
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id');

        if ($from && $to) {
            $query->whereBetween('journal_entries.entry_date', [$from, $to]);
        }

        return $query->groupBy('journal_lines.account_id')->get()->keyBy('account_id');
    }

    private function statementSnapshot(string $from, string $to): array
    {
        if (!Schema::hasTable('journal_entries') || !Schema::hasTable('journal_lines') || !Schema::hasTable('coa_accounts')) {
            return [
                'from' => $from,
                'to' => $to,
                'trial_debit' => 0,
                'trial_credit' => 0,
                'trial_balance_gap' => 0,
                'assets_total' => 0,
                'liabilities_total' => 0,
                'equity_total' => 0,
                'income_total' => 0,
                'expense_total' => 0,
                'net_profit' => 0,
                'balance_sheet_gap' => 0,
            ];
        }

        $lines = $this->aggregateByAccount($from, $to);
        $accounts = CoaAccount::query()->get(['id', 'type', 'normal_balance', 'opening_balance']);

        $totalDebit = (float) $lines->sum('debit');
        $totalCredit = (float) $lines->sum('credit');

        $assetsTotal = 0.0;
        $liabilitiesTotal = 0.0;
        $equityTotal = 0.0;
        $incomeTotal = 0.0;
        $expenseTotal = 0.0;

        foreach ($accounts as $account) {
            $line = $lines->get($account->id);
            $debit = (float) ($line?->debit ?? 0);
            $credit = (float) ($line?->credit ?? 0);
            $type = strtolower((string) $account->type);

            $balance = $this->accountBalanceAmount($account, $line);

            if ($type === 'asset') {
                $assetsTotal += $balance;
            } elseif ($type === 'liability') {
                $liabilitiesTotal += $balance;
            } elseif ($type === 'equity') {
                $equityTotal += $balance;
            } elseif ($type === 'income') {
                $incomeTotal += $balance;
            } elseif ($type === 'expense') {
                $expenseTotal += $balance;
            }
        }

        return [
            'from' => $from,
            'to' => $to,
            'trial_debit' => $totalDebit,
            'trial_credit' => $totalCredit,
            'trial_balance_gap' => $totalDebit - $totalCredit,
            'assets_total' => $assetsTotal,
            'liabilities_total' => $liabilitiesTotal,
            'equity_total' => $equityTotal,
            'income_total' => $incomeTotal,
            'expense_total' => $expenseTotal,
            'net_profit' => $incomeTotal - $expenseTotal,
            'balance_sheet_gap' => $assetsTotal - ($liabilitiesTotal + $equityTotal),
        ];
    }

    private function mapBalances($accounts, $lines, string $normalSide, ?string $from = null, ?string $to = null)
    {
        $health = app(AccountingHealth::class);
        $ledgerReady = Schema::hasTable('journal_entries') && Schema::hasTable('journal_lines');

        return $accounts->map(function ($acc) use ($lines, $normalSide, $from, $to, $health, $ledgerReady) {
            $line = $lines->get($acc->id);
            $balance = $this->accountBalanceAmount($acc, $line, $normalSide);
            $ledgerQuery = array_filter([
                'account_id' => $acc->id,
                'from' => $from,
                'to' => $to,
            ], fn($value) => $value !== null && $value !== '');

            return [
                'id' => $acc->id,
                'code' => $acc->full_code,
                'name' => $acc->name,
                'balance' => $balance,
                'ledger_url' => $ledgerReady ? $health->safeRoute('accounting.general-ledger', $ledgerQuery) : null,
            ];
        })->values();
    }

    private function agingBucket(int $ageDays): string
    {
        if ($ageDays <= 0) {
            return 'current';
        }
        if ($ageDays <= 30) {
            return '1-30';
        }
        if ($ageDays <= 60) {
            return '31-60';
        }
        if ($ageDays <= 90) {
            return '61-90';
        }

        return '90+';
    }

    private function trialBalanceAmounts(CoaAccount $account, mixed $line): array
    {
        $balance = $this->accountBalanceAmount($account, $line);

        return [
            'debit' => $balance >= 0 ? $balance : 0.0,
            'credit' => $balance < 0 ? abs($balance) : 0.0,
        ];
    }

    private function accountBalanceAmount(object $account, mixed $line, ?string $normalSide = null): float
    {
        $debit = (float) ($line?->debit ?? 0);
        $credit = (float) ($line?->credit ?? 0);
        $openingBalance = (float) ($account->opening_balance ?? 0);
        $normalSide = $normalSide ?: ((string) ($account->normal_balance ?: $this->defaultNormalBalance((string) $account->type)));

        if ($normalSide === 'credit') {
            return $openingBalance + ($credit - $debit);
        }

        return $openingBalance + ($debit - $credit);
    }

    private function defaultNormalBalance(string $type): string
    {
        return in_array($type, ['liability', 'equity', 'income'], true) ? 'credit' : 'debit';
    }

    private function agingSummary($rows): array
    {
        $buckets = ['current', '1-30', '31-60', '61-90', '90+'];
        $bucketCount = array_fill_keys($buckets, 0);
        $bucketBalance = array_fill_keys($buckets, 0.0);

        foreach ($rows as $row) {
            if (!isset($bucketCount[$row['bucket']])) {
                continue;
            }
            $bucketCount[$row['bucket']]++;
            $bucketBalance[$row['bucket']] += (float) ($row['balance'] ?? 0);
        }

        return [
            'records' => $rows->count(),
            'total_balance' => (float) $rows->sum('balance'),
            'average_age' => $rows->count() > 0 ? round((float) $rows->avg('age_days'), 1) : 0.0,
            'bucket_count' => $bucketCount,
            'bucket_balance' => $bucketBalance,
        ];
    }

    private function paginateCollection($rows, Request $request): LengthAwarePaginator
    {
        $perPage = $this->resolvePerPage($request);
        $page = LengthAwarePaginator::resolveCurrentPage();

        return new LengthAwarePaginator(
            $rows->slice(($page - 1) * $perPage, $perPage)->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );
    }

    private function resolvePerPage(Request $request): int
    {
        $perPage = (int) $request->integer('per_page', 25);

        return in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;
    }

    private function safeParseDate($value): ?Carbon
    {
        if (!$value) {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function downloadCsv(string $filename, array $headers, array $rows)
    {
        return response()->streamDownload(function () use ($headers, $rows) {
            $handle = fopen('php://output', 'w');
            if (!$handle) {
                return;
            }

            fputcsv($handle, $headers);
            foreach ($rows as $row) {
                $ordered = [];
                foreach ($headers as $header) {
                    $ordered[] = $row[$header] ?? '';
                }
                fputcsv($handle, $ordered);
            }
            fclose($handle);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    private function resolveComparisonPeriods(Request $request): array
    {
        $from = $this->safeParseDate($request->input('from'));
        $to = $this->safeParseDate($request->input('to'));

        if (!$from || !$to || $from->greaterThan($to)) {
            $to = Carbon::today();
            $from = $to->copy()->startOfMonth();
        }

        $compareFrom = $this->safeParseDate($request->input('compare_from'));
        $compareTo = $this->safeParseDate($request->input('compare_to'));

        if (!$compareFrom || !$compareTo || $compareFrom->greaterThan($compareTo)) {
            $days = $from->diffInDays($to) + 1;
            $compareTo = $from->copy()->subDay();
            $compareFrom = $compareTo->copy()->subDays($days - 1);
        }

        return [
            $from->toDateString(),
            $to->toDateString(),
            $compareFrom->toDateString(),
            $compareTo->toDateString(),
        ];
    }

    private function comparisonMetric(float $current, float $previous): array
    {
        $delta = $current - $previous;
        $changePercent = abs($previous) > 0.00001 ? (($delta / $previous) * 100) : null;

        return [
            'current' => $current,
            'previous' => $previous,
            'delta' => $delta,
            'change_percent' => $changePercent,
        ];
    }

    private function statementHealth(array $snapshot): array
    {
        $assets = (float) ($snapshot['assets_total'] ?? 0);
        $liabilities = (float) ($snapshot['liabilities_total'] ?? 0);
        $equity = (float) ($snapshot['equity_total'] ?? 0);
        $income = (float) ($snapshot['income_total'] ?? 0);
        $netProfit = (float) ($snapshot['net_profit'] ?? 0);

        return [
            'current_ratio' => $liabilities > 0 ? ($assets / $liabilities) : 0.0,
            'debt_to_equity' => $equity > 0 ? ($liabilities / $equity) : 0.0,
            'net_margin' => $income > 0 ? (($netProfit / $income) * 100) : 0.0,
        ];
    }

    private function resolveReceivableSource(FinancialInvoice $invoice): string
    {
        $type = strtolower((string) ($invoice->invoice_type ?? ''));
        $isSubscription = !empty($invoice->subscription_type_id) || !empty($invoice->subscription_category_id) || $type === 'subscription';

        if ($isSubscription) {
            return 'subscription';
        }
        if ($type === 'membership') {
            return 'membership';
        }
        if (in_array($type, ['food_order', 'pos_sale'], true)) {
            return 'pos';
        }
        if ($type === 'room_booking') {
            return 'room';
        }
        if ($type === 'event_booking') {
            return 'event';
        }

        return $type !== '' ? $type : 'other';
    }
}
