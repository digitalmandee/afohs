<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
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
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use App\Services\Accounting\Support\AccountingSourceResolver;
use App\Services\Accounting\Support\AccountingHealth;

class AccountingReportController extends Controller
{
    public function financialStatements(Request $request)
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

        if ($request->input('export') === 'csv') {
            $rows = collect($comparison)->map(function ($metric, $name) {
                return [
                    'Metric' => strtoupper(str_replace('_', ' ', $name)),
                    'Current' => number_format((float) ($metric['current'] ?? 0), 2, '.', ''),
                    'Previous' => number_format((float) ($metric['previous'] ?? 0), 2, '.', ''),
                    'Delta' => number_format((float) ($metric['delta'] ?? 0), 2, '.', ''),
                    'Change %' => is_null($metric['change_percent']) ? '' : number_format((float) $metric['change_percent'], 2, '.', ''),
                ];
            })->values()->all();

            return $this->downloadCsv(
                'financial-statements-comparison.csv',
                ['Metric', 'Current', 'Previous', 'Delta', 'Change %'],
                $rows
            );
        }

        return Inertia::render('App/Admin/Accounting/Reports/FinancialStatements', [
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
        ]);
    }

    public function trialBalance(Request $request)
    {
        $health = app(AccountingHealth::class);
        $from = $request->input('from');
        $to = $request->input('to');
        $status = $health->status(['journal_entries', 'journal_lines', 'coa_accounts']);

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/Reports/TrialBalance', [
                'rows' => [],
                'summary' => [
                    'total_debit' => 0,
                    'total_credit' => 0,
                    'difference' => 0,
                    'type_totals' => [],
                ],
                'filters' => ['from' => $from, 'to' => $to],
                'error' => $health->setupMessage('Trial balance', $status['missing_required'], $status['missing_optional']),
            ]);
        }

        $query = JournalLine::query()
            ->select('journal_lines.account_id', DB::raw('SUM(journal_lines.debit) as debit'), DB::raw('SUM(journal_lines.credit) as credit'))
            ->join('journal_entries', 'journal_entries.id', '=', 'journal_lines.journal_entry_id');

        if ($from && $to) {
            $query->whereBetween('journal_entries.entry_date', [$from, $to]);
        }

        $totals = $query->groupBy('journal_lines.account_id')->get()->keyBy('account_id');
        $ledgerReady = Schema::hasTable('journal_entries') && Schema::hasTable('journal_lines');

        $accounts = CoaAccount::orderBy('full_code')->get()->map(function ($acc) use ($totals, $from, $to, $health, $ledgerReady) {
            $line = $totals->get($acc->id);
            $ledgerQuery = array_filter([
                'account_id' => $acc->id,
                'from' => $from,
                'to' => $to,
            ], fn($value) => $value !== null && $value !== '');

            return [
                'id' => $acc->id,
                'code' => $acc->full_code,
                'name' => $acc->name,
                'type' => $acc->type,
                'level' => $acc->level,
                'is_postable' => (bool) $acc->is_postable,
                'debit' => $line?->debit ?? 0,
                'credit' => $line?->credit ?? 0,
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

        if ($request->input('export') === 'csv') {
            $rows = $accounts->map(function ($row) {
                return [
                    'Code' => $row['code'],
                    'Name' => $row['name'],
                    'Type' => $row['type'],
                    'Level' => $row['level'],
                    'Debit' => number_format((float) $row['debit'], 2, '.', ''),
                    'Credit' => number_format((float) $row['credit'], 2, '.', ''),
                ];
            })->all();

            $rows[] = [
                'Code' => '',
                'Name' => 'TOTAL',
                'Type' => '',
                'Level' => '',
                'Debit' => number_format($totalDebit, 2, '.', ''),
                'Credit' => number_format($totalCredit, 2, '.', ''),
            ];

            return $this->downloadCsv('trial-balance.csv', ['Code', 'Name', 'Type', 'Level', 'Debit', 'Credit'], $rows);
        }

        return Inertia::render('App/Admin/Accounting/Reports/TrialBalance', [
            'rows' => $accounts,
            'summary' => [
                'total_debit' => $totalDebit,
                'total_credit' => $totalCredit,
                'difference' => $difference,
                'type_totals' => $typeTotals,
            ],
            'filters' => ['from' => $from, 'to' => $to],
        ]);
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
        $health = app(AccountingHealth::class);
        $from = $request->input('from');
        $to = $request->input('to');
        $status = $health->status(['journal_entries', 'journal_lines', 'coa_accounts']);

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/Reports/BalanceSheet', [
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
            ]);
        }

        $lines = $this->aggregateByAccount($from, $to);
        $accounts = CoaAccount::orderBy('full_code')->get();

        $assets = $this->mapBalances($accounts->where('type', 'asset'), $lines, 'debit', $from, $to);
        $liabilities = $this->mapBalances($accounts->where('type', 'liability'), $lines, 'credit', $from, $to);
        $equity = $this->mapBalances($accounts->where('type', 'equity'), $lines, 'credit', $from, $to);
        $assetsTotal = (float) $assets->sum('balance');
        $liabilitiesTotal = (float) $liabilities->sum('balance');
        $equityTotal = (float) $equity->sum('balance');

        if ($request->input('export') === 'csv') {
            $rows = collect();

            foreach ($assets as $row) {
                $rows->push(['Section' => 'Assets', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
            }
            foreach ($liabilities as $row) {
                $rows->push(['Section' => 'Liabilities', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
            }
            foreach ($equity as $row) {
                $rows->push(['Section' => 'Equity', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
            }

            $rows->push(['Section' => '', 'Code' => '', 'Name' => 'Assets Total', 'Balance' => number_format($assetsTotal, 2, '.', '')]);
            $rows->push(['Section' => '', 'Code' => '', 'Name' => 'Liabilities Total', 'Balance' => number_format($liabilitiesTotal, 2, '.', '')]);
            $rows->push(['Section' => '', 'Code' => '', 'Name' => 'Equity Total', 'Balance' => number_format($equityTotal, 2, '.', '')]);
            $rows->push(['Section' => '', 'Code' => '', 'Name' => 'Balance Gap', 'Balance' => number_format($assetsTotal - ($liabilitiesTotal + $equityTotal), 2, '.', '')]);

            return $this->downloadCsv('balance-sheet.csv', ['Section', 'Code', 'Name', 'Balance'], $rows->all());
        }

        return Inertia::render('App/Admin/Accounting/Reports/BalanceSheet', [
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'summary' => [
                'assets_total' => $assetsTotal,
                'liabilities_total' => $liabilitiesTotal,
                'equity_total' => $equityTotal,
                'liabilities_equity_total' => $liabilitiesTotal + $equityTotal,
                'difference' => $assetsTotal - ($liabilitiesTotal + $equityTotal),
            ],
            'filters' => ['from' => $from, 'to' => $to],
        ]);
    }

    public function profitLoss(Request $request)
    {
        $health = app(AccountingHealth::class);
        $from = $request->input('from');
        $to = $request->input('to');
        $status = $health->status(['journal_entries', 'journal_lines', 'coa_accounts']);

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/Reports/ProfitLoss', [
                'income' => [],
                'expense' => [],
                'summary' => [
                    'income_total' => 0,
                    'expense_total' => 0,
                    'net_profit' => 0,
                ],
                'filters' => ['from' => $from, 'to' => $to],
                'error' => $health->setupMessage('Profit and loss', $status['missing_required'], $status['missing_optional']),
            ]);
        }

        $lines = $this->aggregateByAccount($from, $to);
        $accounts = CoaAccount::orderBy('full_code')->get();

        $income = $this->mapBalances($accounts->where('type', 'income'), $lines, 'credit', $from, $to);
        $expense = $this->mapBalances($accounts->where('type', 'expense'), $lines, 'debit', $from, $to);
        $incomeTotal = (float) $income->sum('balance');
        $expenseTotal = (float) $expense->sum('balance');

        if ($request->input('export') === 'csv') {
            $rows = collect();

            foreach ($income as $row) {
                $rows->push(['Section' => 'Income', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
            }
            foreach ($expense as $row) {
                $rows->push(['Section' => 'Expense', 'Code' => $row['code'], 'Name' => $row['name'], 'Balance' => number_format((float) $row['balance'], 2, '.', '')]);
            }

            $rows->push(['Section' => '', 'Code' => '', 'Name' => 'Income Total', 'Balance' => number_format($incomeTotal, 2, '.', '')]);
            $rows->push(['Section' => '', 'Code' => '', 'Name' => 'Expense Total', 'Balance' => number_format($expenseTotal, 2, '.', '')]);
            $rows->push(['Section' => '', 'Code' => '', 'Name' => 'Net Profit', 'Balance' => number_format($incomeTotal - $expenseTotal, 2, '.', '')]);

            return $this->downloadCsv('profit-loss.csv', ['Section', 'Code', 'Name', 'Balance'], $rows->all());
        }

        return Inertia::render('App/Admin/Accounting/Reports/ProfitLoss', [
            'income' => $income,
            'expense' => $expense,
            'summary' => [
                'income_total' => $incomeTotal,
                'expense_total' => $expenseTotal,
                'net_profit' => $incomeTotal - $expenseTotal,
            ],
            'filters' => ['from' => $from, 'to' => $to],
        ]);
    }

    public function receivablesAging(Request $request)
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
            $bucket = $this->agingBucket($age);

            return [
                'id' => $invoice->id,
                'document_no' => $invoice->invoice_no,
                'party' => $invoice->member?->full_name
                    ?? $invoice->corporateMember?->full_name
                    ?? $invoice->customer?->name
                    ?? '-',
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $parsedDueDate?->toDateString(),
                'age_days' => $age,
                'status' => $invoice->status,
                'total' => (float) ($invoice->total_price ?? 0),
                'paid' => (float) ($invoice->paid_amount ?? 0),
                'balance' => $balance,
                'bucket' => $bucket,
            ];
        })->filter(fn($row) => $row['balance'] > 0)->values();

        if ($request->filled('bucket') && in_array($request->bucket, ['current', '1-30', '31-60', '61-90', '90+'], true)) {
            $rows = $rows->where('bucket', $request->bucket)->values();
        }

        $summary = $this->agingSummary($rows);
        $paginated = $this->paginateCollection($rows, $request);

        return Inertia::render('App/Admin/Accounting/Reports/ReceivablesAging', [
            'rows' => $paginated,
            'summary' => $summary,
            'filters' => $request->only(['search', 'from', 'to', 'bucket', 'per_page']),
        ]);
    }

    public function payablesAging(Request $request)
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
            $bucket = $this->agingBucket($age);

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
                'bucket' => $bucket,
            ];
        })->filter(fn($row) => $row['balance'] > 0)->values();

        if ($request->filled('bucket') && in_array($request->bucket, ['current', '1-30', '31-60', '61-90', '90+'], true)) {
            $rows = $rows->where('bucket', $request->bucket)->values();
        }

        $summary = $this->agingSummary($rows);
        $paginated = $this->paginateCollection($rows, $request);

        return Inertia::render('App/Admin/Accounting/Reports/PayablesAging', [
            'rows' => $paginated,
            'summary' => $summary,
            'filters' => $request->only(['search', 'from', 'to', 'bucket', 'per_page']),
        ]);
    }

    public function receivablesAgingBySource(Request $request)
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
        $rows = $query->orderByDesc('due_date')->get()->map(function ($invoice) use ($today) {
            $dueDate = $invoice->due_date ?? $invoice->issue_date ?? $invoice->created_at;
            $parsedDueDate = $this->safeParseDate($dueDate);
            $age = $parsedDueDate && $parsedDueDate->lessThanOrEqualTo($today)
                ? $parsedDueDate->diffInDays($today)
                : 0;
            $balance = max(0, ((float) ($invoice->total_price ?? 0)) - ((float) ($invoice->paid_amount ?? 0)));
            $bucket = $this->agingBucket($age);
            $source = $sourceResolver->resolveForFinancialInvoice($invoice);

            return [
                'id' => $invoice->id,
                'document_no' => $source['document_no'],
                'source' => $source['source_label'],
                'document_url' => $source['document_url'],
                'restaurant_name' => $source['restaurant_name'],
                'party' => $invoice->member?->full_name
                    ?? $invoice->corporateMember?->full_name
                    ?? $invoice->customer?->name
                    ?? '-',
                'issue_date' => $invoice->issue_date?->toDateString(),
                'due_date' => $parsedDueDate?->toDateString(),
                'age_days' => $age,
                'status' => $invoice->status,
                'total' => (float) ($invoice->total_price ?? 0),
                'paid' => (float) ($invoice->paid_amount ?? 0),
                'balance' => $balance,
                'bucket' => $bucket,
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

        if ($request->input('export') === 'csv') {
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

            return $this->downloadCsv(
                'receivables-aging-by-source.csv',
                ['Document No', 'Source', 'Party', 'Issue Date', 'Due Date', 'Age Days', 'Bucket', 'Status', 'Total', 'Paid', 'Balance'],
                $csvRows
            );
        }

        return Inertia::render('App/Admin/Accounting/Reports/ReceivablesBySource', [
            'rows' => $this->paginateCollection($rows, $request),
            'summary' => $summary,
            'sourceOptions' => collect($rows)->pluck('source')->unique()->sort()->values()->all(),
            'filters' => $request->only(['search', 'from', 'to', 'bucket', 'source']),
        ]);
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
        $accounts = CoaAccount::query()->get(['id', 'type']);

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

            if ($type === 'asset') {
                $assetsTotal += ($debit - $credit);
            } elseif ($type === 'liability') {
                $liabilitiesTotal += ($credit - $debit);
            } elseif ($type === 'equity') {
                $equityTotal += ($credit - $debit);
            } elseif ($type === 'income') {
                $incomeTotal += ($credit - $debit);
            } elseif ($type === 'expense') {
                $expenseTotal += ($debit - $credit);
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
            $debit = $line?->debit ?? 0;
            $credit = $line?->credit ?? 0;
            $balance = $normalSide === 'debit' ? ($debit - $credit) : ($credit - $debit);
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
