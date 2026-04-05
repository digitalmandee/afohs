<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\SupplierAdvance;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Services\Accounting\AccountingEventDispatcher;
use App\Services\Accounting\StrictAccountingSyncService;
use App\Services\Procurement\SupplierAdvanceService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplierAdvanceController extends Controller
{
    public function __construct(
        private readonly SupplierAdvanceService $supplierAdvanceService
    ) {
    }

    public function index(Request $request)
    {
        $query = SupplierAdvance::query()->with([
            'vendor:id,name',
            'paymentAccount:id,name',
            'purchaseOrder:id,po_no',
            'applications.vendorBill:id,bill_no,goods_receipt_id',
            'applications.vendorBill.goodsReceipt:id,purchase_order_id',
        ]);

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->integer('vendor_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        $advances = $query->latest('id')->paginate((int) $request->integer('per_page', 25))->withQueryString();

        if ($request->expectsJson()) {
            return response()->json($advances);
        }

        return Inertia::render('App/Admin/Procurement/SupplierAdvances/Index', [
            'advances' => $advances->through(function (SupplierAdvance $advance) {
                $total = (float) $advance->amount;
                $applied = (float) $advance->applied_amount;
                $remaining = max(0, $total - $applied);

                return [
                    'id' => $advance->id,
                    'advance_no' => $advance->advance_no,
                    'status' => $advance->status,
                    'vendor_id' => $advance->vendor_id,
                    'vendor' => $advance->vendor,
                    'payment_account_id' => $advance->payment_account_id,
                    'paymentAccount' => $advance->paymentAccount,
                    'advance_date' => $advance->advance_date,
                    'amount' => $advance->amount,
                    'applied_amount' => $advance->applied_amount,
                    'remaining_amount' => $remaining,
                    'reference' => $advance->reference,
                    'remarks' => $advance->remarks,
                    'purchase_order_id' => $advance->purchase_order_id,
                    'linked_po_no' => $advance->purchaseOrder?->po_no,
                    'applied_to_bills' => $advance->applications
                        ->map(fn ($application) => [
                            'vendor_bill_id' => $application->vendor_bill_id,
                            'bill_no' => $application->vendorBill?->bill_no,
                            'amount' => (float) $application->amount,
                            'target_purchase_order_id' => $application->target_purchase_order_id
                                ?: $application->vendorBill?->goodsReceipt?->purchase_order_id,
                            'override_po_lock' => (bool) $application->override_po_lock,
                            'override_reason' => $application->override_reason,
                        ])
                        ->values()
                        ->all(),
                ];
            }),
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'openBills' => VendorBill::query()
                ->whereIn('status', ['posted', 'partially_paid'])
                ->whereRaw('(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0)) > 0.009')
                ->orderBy('bill_date')
                ->limit(500)
                ->get(['id', 'bill_no', 'vendor_id', 'goods_receipt_id', 'grand_total', 'paid_amount', 'advance_applied_amount', 'return_applied_amount'])
                ->map(function (VendorBill $bill) {
                    $outstanding = max(
                        0,
                        (float) $bill->grand_total
                        - (float) $bill->paid_amount
                        - (float) $bill->advance_applied_amount
                        - (float) $bill->return_applied_amount
                    );

                    return [
                        'id' => $bill->id,
                        'bill_no' => $bill->bill_no,
                        'vendor_id' => $bill->vendor_id,
                        'goods_receipt_id' => $bill->goods_receipt_id,
                        'outstanding' => $outstanding,
                    ];
                })
                ->values()
                ->all(),
            'filters' => $request->only(['vendor_id', 'status', 'per_page']),
            'poLockOverrideAllowed' => $this->canOverridePoLock($request->user()),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'payment_account_id' => 'required|exists:payment_accounts,id',
            'advance_date' => 'required|date',
            'amount' => 'required|numeric|min:0.01',
            'reference' => 'nullable|string|max:255',
            'remarks' => 'nullable|string',
        ]);

        $vendor = Vendor::query()->findOrFail((int) $data['vendor_id']);
        $advance = SupplierAdvance::query()->create([
            'advance_no' => 'ADV-' . now()->format('YmdHis'),
            'vendor_id' => $vendor->id,
            'tenant_id' => $vendor->tenant_id,
            'purchase_order_id' => $data['purchase_order_id'] ?? null,
            'payment_account_id' => $data['payment_account_id'],
            'advance_date' => $data['advance_date'],
            'amount' => $data['amount'],
            'applied_amount' => 0,
            'status' => 'draft',
            'reference' => $data['reference'] ?? null,
            'remarks' => $data['remarks'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'supplier_advance',
            'document_id' => $advance->id,
            'action' => 'submitted',
            'remarks' => 'Supplier advance created.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Supplier advance created.');
    }

    public function submit(Request $request, SupplierAdvance $supplierAdvance)
    {
        if ($supplierAdvance->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft advances can be submitted.');
        }

        ApprovalAction::query()->create([
            'document_type' => 'supplier_advance',
            'document_id' => $supplierAdvance->id,
            'action' => 'submitted',
            'remarks' => 'Supplier advance submitted for approval.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Supplier advance submitted.');
    }

    public function approve(Request $request, SupplierAdvance $supplierAdvance)
    {
        if ($supplierAdvance->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft advances can be approved.');
        }

        DB::transaction(function () use ($supplierAdvance, $request) {
            $supplierAdvance->update([
                'status' => 'posted',
                'posted_by' => $request->user()?->id,
                'posted_at' => now(),
            ]);

            $event = app(AccountingEventDispatcher::class)->dispatch(
                'supplier_advance_posted',
                SupplierAdvance::class,
                (int) $supplierAdvance->id,
                [
                    'advance_no' => $supplierAdvance->advance_no,
                    'vendor_id' => $supplierAdvance->vendor_id,
                    'payment_account_id' => $supplierAdvance->payment_account_id,
                    'amount' => $supplierAdvance->amount,
                ],
                $request->user()?->id,
                $supplierAdvance->tenant_id
            );

            app(StrictAccountingSyncService::class)->enforceOrFail($event, "Supplier Advance {$supplierAdvance->advance_no}");

            ApprovalAction::query()->create([
                'document_type' => 'supplier_advance',
                'document_id' => $supplierAdvance->id,
                'action' => 'approved',
                'remarks' => 'Supplier advance approved and posted.',
                'action_by' => $request->user()?->id,
            ]);
        });

        return redirect()->back()->with('success', 'Supplier advance approved.');
    }

    public function apply(Request $request, SupplierAdvance $supplierAdvance)
    {
        $data = $request->validate([
            'vendor_bill_id' => 'required|exists:vendor_bills,id',
            'amount' => 'required|numeric|min:0.01',
            'override_po_lock' => 'nullable|boolean',
            'override_reason' => 'nullable|string|max:1000',
        ]);

        $overridePoLock = (bool) ($data['override_po_lock'] ?? false);
        if ($overridePoLock && !$this->canOverridePoLock($request->user())) {
            return redirect()->back()->withErrors([
                'override_po_lock' => 'You do not have permission to bypass PO lock.',
            ]);
        }

        $bill = VendorBill::query()->findOrFail((int) $data['vendor_bill_id']);
        $this->supplierAdvanceService->applyToBill(
            advance: $supplierAdvance,
            bill: $bill,
            amount: (float) $data['amount'],
            userId: $request->user()?->id,
            overridePoLock: $overridePoLock,
            overrideReason: $data['override_reason'] ?? null
        );

        if ($overridePoLock) {
            ApprovalAction::query()->create([
                'document_type' => 'supplier_advance',
                'document_id' => $supplierAdvance->id,
                'action' => 'override_applied',
                'remarks' => sprintf(
                    'PO lock override used to apply advance to bill %s. Reason: %s',
                    (string) $bill->bill_no,
                    trim((string) ($data['override_reason'] ?? 'N/A'))
                ),
                'action_by' => $request->user()?->id,
            ]);
        }

        return redirect()->back()->with('success', 'Supplier advance applied to bill.');
    }

    public function reject(Request $request, SupplierAdvance $supplierAdvance)
    {
        if ($supplierAdvance->status === 'applied' || $supplierAdvance->status === 'partially_applied') {
            return redirect()->back()->with('error', 'Cannot void a supplier advance that is already applied.');
        }

        $supplierAdvance->update(['status' => 'void']);
        ApprovalAction::query()->create([
            'document_type' => 'supplier_advance',
            'document_id' => $supplierAdvance->id,
            'action' => 'rejected',
            'remarks' => 'Supplier advance rejected/voided.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Supplier advance voided.');
    }

    private function canOverridePoLock($user): bool
    {
        if (!$user || !method_exists($user, 'hasRole')) {
            return false;
        }

        return $user->hasRole('Super Admin')
            || $user->hasRole('super-admin')
            || $user->hasRole('Procurement Admin')
            || $user->hasRole('procurement-admin');
    }
}
