<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\SupplierAdvance;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Services\Accounting\AccountingEventDispatcher;
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
        $query = SupplierAdvance::query()->with(['vendor:id,name', 'paymentAccount:id,name']);

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
            'advances' => $advances,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['vendor_id', 'status', 'per_page']),
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

            app(AccountingEventDispatcher::class)->dispatch(
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
        ]);

        $bill = VendorBill::query()->findOrFail((int) $data['vendor_bill_id']);
        $this->supplierAdvanceService->applyToBill(
            advance: $supplierAdvance,
            bill: $bill,
            amount: (float) $data['amount'],
            userId: $request->user()?->id
        );

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
}
