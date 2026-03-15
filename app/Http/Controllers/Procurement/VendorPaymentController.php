<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\JournalEntry;
use App\Models\PaymentAccount;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\Accounting\AccountingEventDispatcher;

class VendorPaymentController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = VendorPayment::with('vendor', 'paymentAccount', 'tenant');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('payment_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'posted', 'void'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('method') && in_array($request->method, ['cash', 'bank', 'cheque', 'online'], true)) {
            $query->where('method', $request->method);
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('payment_account_id')) {
            $query->where('payment_account_id', $request->payment_account_id);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('payment_date', [$request->from, $request->to]);
        }

        $summary = [
            'count' => (int) (clone $query)->count(),
            'total_amount' => (float) ((clone $query)->sum('amount') ?? 0),
            'posted' => (int) ((clone $query)->where('status', 'posted')->count()),
            'void' => (int) ((clone $query)->where('status', 'void')->count()),
        ];

        $payments = $query->orderByDesc('payment_date')->paginate($perPage)->withQueryString();
        $latestActions = ApprovalAction::query()
            ->where('document_type', 'vendor_payment')
            ->whereIn('document_id', $payments->getCollection()->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('document_id')
            ->keyBy('document_id');
        $postedIds = JournalEntry::query()
            ->where('module_type', 'vendor_payment')
            ->whereIn('module_id', $payments->getCollection()->pluck('id'))
            ->pluck('module_id')
            ->all();
        $postedLookup = array_fill_keys($postedIds, true);

        $payments->getCollection()->transform(function ($payment) use ($latestActions, $postedLookup) {
            $action = $latestActions->get($payment->id);
            $payment->gl_posted = (bool) ($postedLookup[$payment->id] ?? false);
            $payment->latest_approval_action = $action ? [
                'action' => $action->action,
                'remarks' => $action->remarks,
                'created_at' => $action->created_at,
            ] : null;
            return $payment;
        });

        return Inertia::render('App/Admin/Procurement/VendorPayments/Index', [
            'payments' => $payments,
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'paymentAccounts' => PaymentAccount::query()->orderBy('name')->get(['id', 'name']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'method', 'vendor_id', 'payment_account_id', 'tenant_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/VendorPayments/Create', [
            'vendors' => Vendor::with('tenant:id,name')->orderBy('name')->get(['id', 'name', 'tenant_id', 'default_payment_account_id']),
            'paymentAccounts' => PaymentAccount::orderBy('name')->get(['id', 'name', 'payment_method', 'coa_account_id', 'tenant_id']),
        ]);
    }

    public function edit(VendorPayment $vendorPayment)
    {
        if ($vendorPayment->status !== 'draft') {
            return redirect()->route('procurement.vendor-payments.index')->with('error', 'Only draft payments can be edited.');
        }

        return Inertia::render('App/Admin/Procurement/VendorPayments/Edit', [
            'payment' => $vendorPayment,
            'vendors' => Vendor::with('tenant:id,name')->orderBy('name')->get(['id', 'name', 'tenant_id', 'default_payment_account_id']),
            'paymentAccounts' => PaymentAccount::orderBy('name')->get(['id', 'name', 'payment_method', 'coa_account_id', 'tenant_id']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'payment_account_id' => 'nullable|exists:payment_accounts,id',
            'payment_date' => 'required|date',
            'method' => 'required|in:cash,bank,cheque,online',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        if (($data['method'] ?? 'cash') !== 'cash' && empty($data['payment_account_id'])) {
            return redirect()->back()->withErrors([
                'payment_account_id' => 'Payment account is required for non-cash payment methods.',
            ])->withInput();
        }

        if (!empty($data['payment_account_id'])) {
            $account = PaymentAccount::query()->find($data['payment_account_id']);
            $method = (string) ($data['method'] ?? 'cash');
            $accountMethod = (string) ($account?->payment_method ?? '');

            $allowedByMethod = [
                'cash' => ['cash'],
                'bank' => ['bank', 'bank_transfer'],
                'cheque' => ['cheque', 'bank'],
                'online' => ['online', 'bank', 'bank_transfer'],
            ];

            if (!in_array($accountMethod, $allowedByMethod[$method] ?? [], true)) {
                return redirect()->back()->withErrors([
                    'payment_account_id' => "Selected payment account method '{$accountMethod}' is not valid for '{$method}' payment.",
                ])->withInput();
            }
        }

        $vendor = Vendor::query()->findOrFail($data['vendor_id']);

        $payment = VendorPayment::create([
            'payment_no' => 'PAY-' . now()->format('YmdHis'),
            'vendor_id' => $data['vendor_id'],
            'tenant_id' => $vendor->tenant_id ?: PaymentAccount::query()->whereKey($data['payment_account_id'] ?? null)->value('tenant_id'),
            'payment_account_id' => $data['payment_account_id'] ?? null,
            'payment_date' => $data['payment_date'],
            'method' => $data['method'],
            'amount' => $data['amount'],
            'status' => 'draft',
            'reference' => $data['reference'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        ApprovalAction::create([
            'document_type' => 'vendor_payment',
            'document_id' => $payment->id,
            'action' => 'submitted',
            'remarks' => 'Vendor payment created and submitted.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->route('procurement.vendor-payments.index')->with('success', 'Vendor payment created.');
    }

    public function update(Request $request, VendorPayment $vendorPayment)
    {
        if ($vendorPayment->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft payments can be updated.');
        }

        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'payment_account_id' => 'nullable|exists:payment_accounts,id',
            'payment_date' => 'required|date',
            'method' => 'required|in:cash,bank,cheque,online',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        if (($data['method'] ?? 'cash') !== 'cash' && empty($data['payment_account_id'])) {
            return redirect()->back()->withErrors([
                'payment_account_id' => 'Payment account is required for non-cash payment methods.',
            ])->withInput();
        }

        if (!empty($data['payment_account_id'])) {
            $account = PaymentAccount::query()->find($data['payment_account_id']);
            $method = (string) ($data['method'] ?? 'cash');
            $accountMethod = (string) ($account?->payment_method ?? '');

            $allowedByMethod = [
                'cash' => ['cash'],
                'bank' => ['bank', 'bank_transfer'],
                'cheque' => ['cheque', 'bank'],
                'online' => ['online', 'bank', 'bank_transfer'],
            ];

            if (!in_array($accountMethod, $allowedByMethod[$method] ?? [], true)) {
                return redirect()->back()->withErrors([
                    'payment_account_id' => "Selected payment account method '{$accountMethod}' is not valid for '{$method}' payment.",
                ])->withInput();
            }
        }

        $vendorPayment->update([
            'vendor_id' => $data['vendor_id'],
            'tenant_id' => Vendor::query()->whereKey($data['vendor_id'])->value('tenant_id')
                ?: PaymentAccount::query()->whereKey($data['payment_account_id'] ?? null)->value('tenant_id'),
            'payment_account_id' => $data['payment_account_id'] ?? null,
            'payment_date' => $data['payment_date'],
            'method' => $data['method'],
            'amount' => $data['amount'],
            'reference' => $data['reference'] ?? null,
            'remarks' => $data['remarks'] ?? null,
        ]);

        ApprovalAction::create([
            'document_type' => 'vendor_payment',
            'document_id' => $vendorPayment->id,
            'action' => 'updated',
            'remarks' => 'Vendor payment updated.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->route('procurement.vendor-payments.index')->with('success', 'Vendor payment updated.');
    }

    public function submit(Request $request, VendorPayment $vendorPayment)
    {
        if ($vendorPayment->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft payments can be submitted.');
        }

        ApprovalAction::create([
            'document_type' => 'vendor_payment',
            'document_id' => $vendorPayment->id,
            'action' => 'submitted',
            'remarks' => 'Vendor payment submitted for approval.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Vendor payment submitted.');
    }

    public function approve(Request $request, VendorPayment $vendorPayment)
    {
        if ($vendorPayment->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft payments can be approved.');
        }

        $vendorPayment->update([
            'status' => 'posted',
            'posted_by' => $request->user()?->id,
            'posted_at' => now(),
        ]);

        app(AccountingEventDispatcher::class)->dispatch(
            'vendor_payment_posted',
            VendorPayment::class,
            (int) $vendorPayment->id,
            [
                'payment_no' => $vendorPayment->payment_no,
                'vendor_id' => $vendorPayment->vendor_id,
                'payment_account_id' => $vendorPayment->payment_account_id,
                'amount' => $vendorPayment->amount,
            ],
            $request->user()?->id,
            $vendorPayment->tenant_id
        );

        ApprovalAction::create([
            'document_type' => 'vendor_payment',
            'document_id' => $vendorPayment->id,
            'action' => 'approved',
            'remarks' => 'Vendor payment approved/posted.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Vendor payment approved.');
    }

    public function reject(Request $request, VendorPayment $vendorPayment)
    {
        if ($vendorPayment->status === 'void') {
            return redirect()->back()->with('error', 'Vendor payment is already void.');
        }

        $vendorPayment->update([
            'status' => 'void',
        ]);

        ApprovalAction::create([
            'document_type' => 'vendor_payment',
            'document_id' => $vendorPayment->id,
            'action' => 'rejected',
            'remarks' => 'Vendor payment rejected/voided.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Vendor payment rejected.');
    }
}
