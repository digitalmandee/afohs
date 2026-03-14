<?php

namespace App\Http\Controllers;

use App\Models\PaymentAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PaymentAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentAccount::query()
            ->orderByDesc('id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('payment_method')) {
            if ($request->payment_method === 'bank_transfer') {
                $query->whereIn('payment_method', ['bank_transfer', 'bank']);
            } else {
                $query->where('payment_method', $request->payment_method);
            }
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $accounts = $query->paginate(10)->withQueryString();

        return Inertia::render('App/Admin/Finance/PaymentAccounts/Index', [
            'accounts' => $accounts,
            'filters' => $request->only(['search', 'payment_method', 'status']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Finance/PaymentAccounts/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'payment_method' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        if (($validated['payment_method'] ?? null) === 'bank') {
            $validated['payment_method'] = 'bank_transfer';
        }

        PaymentAccount::create($validated);

        return redirect()->route('finance.payment-accounts.index')->with('success', 'Payment account created successfully.');
    }

    public function edit($id)
    {
        $account = PaymentAccount::findOrFail($id);

        return Inertia::render('App/Admin/Finance/PaymentAccounts/Create', [
            'item' => $account,
        ]);
    }

    public function update(Request $request, $id)
    {
        $account = PaymentAccount::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'payment_method' => 'nullable|string|max:255',
            'status' => 'required|in:active,inactive',
        ]);

        if (($validated['payment_method'] ?? null) === 'bank') {
            $validated['payment_method'] = 'bank_transfer';
        }

        $account->update($validated);

        return redirect()->route('finance.payment-accounts.index')->with('success', 'Payment account updated successfully.');
    }

    public function destroy($id)
    {
        $account = PaymentAccount::findOrFail($id);
        $account->delete();

        return back()->with('success', 'Payment account deleted successfully.');
    }

    public function trashed(Request $request)
    {
        $accounts = PaymentAccount::onlyTrashed()
            ->orderByDesc('deleted_at')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('App/Admin/Finance/PaymentAccounts/Trashed', [
            'accounts' => $accounts,
        ]);
    }

    public function restore($id)
    {
        $account = PaymentAccount::withTrashed()->findOrFail($id);
        $account->restore();

        return redirect()->route('finance.payment-accounts.index')->with('success', 'Payment account restored successfully.');
    }

    public function forceDelete($id)
    {
        $account = PaymentAccount::withTrashed()->findOrFail($id);
        $account->forceDelete();

        return back()->with('success', 'Payment account permanently deleted.');
    }

    public function apiIndex(Request $request)
    {
        $query = PaymentAccount::query()
            ->select('id', 'name', 'payment_method')
            ->where('status', 'active')
            ->orderBy('name');

        if ($request->filled('payment_method')) {
            if ($request->payment_method === 'bank_transfer') {
                $query->whereIn('payment_method', ['bank_transfer', 'bank']);
            } else {
                $query->where('payment_method', $request->payment_method);
            }
        }

        return response()->json($query->get());
    }
}
