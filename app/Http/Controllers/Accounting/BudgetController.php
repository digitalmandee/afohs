<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\CoaAccount;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;

class BudgetController extends Controller
{
    public function index(Request $request)
    {
        $emptyBudgets = new LengthAwarePaginator(
            collect(),
            0,
            25,
            1,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        if (!Schema::hasTable('budgets') || !Schema::hasTable('budget_lines')) {
            return Inertia::render('App/Admin/Accounting/Budgets/Index', [
                'budgets' => $emptyBudgets,
                'coaAccounts' => CoaAccount::orderBy('full_code')->get(['id', 'full_code', 'name']),
                'filters' => $request->only(['search', 'status', 'from', 'to']),
                'error' => 'Budget tables are not migrated yet. Run accounting migrations and refresh.',
            ]);
        }

        $query = Budget::with('lines.account');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'active', 'closed'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('start_date', [$request->from, $request->to]);
        }

        try {
            return Inertia::render('App/Admin/Accounting/Budgets/Index', [
                'budgets' => $query->orderByDesc('start_date')->paginate(25)->withQueryString(),
                'coaAccounts' => CoaAccount::orderBy('full_code')->get(['id', 'full_code', 'name']),
                'filters' => $request->only(['search', 'status', 'from', 'to']),
            ]);
        } catch (QueryException $e) {
            report($e);

            return Inertia::render('App/Admin/Accounting/Budgets/Index', [
                'budgets' => $emptyBudgets,
                'coaAccounts' => CoaAccount::orderBy('full_code')->get(['id', 'full_code', 'name']),
                'filters' => $request->only(['search', 'status', 'from', 'to']),
                'error' => 'Could not load budgets due to schema mismatch. Please verify migration state.',
            ]);
        }
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
            'status' => 'required|in:draft,active,closed',
            'remarks' => 'nullable|string',
            'lines' => 'required|array|min:1',
            'lines.*.account_id' => 'required|exists:coa_accounts,id',
            'lines.*.amount' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($data, $request) {
            $total = collect($data['lines'])->sum('amount');

            $budget = Budget::create([
                'name' => $data['name'],
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'],
                'status' => $data['status'],
                'remarks' => $data['remarks'] ?? null,
                'total_amount' => $total,
                'created_by' => $request->user()?->id,
            ]);

            foreach ($data['lines'] as $line) {
                $budget->lines()->create([
                    'account_id' => $line['account_id'],
                    'amount' => $line['amount'],
                ]);
            }
        });

        return redirect()->back()->with('success', 'Budget created.');
    }
}
