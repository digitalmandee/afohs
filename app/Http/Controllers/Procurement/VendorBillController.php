<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\GoodsReceipt;
use App\Models\JournalEntry;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorBill;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\Accounting\AccountingEventDispatcher;

class VendorBillController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = VendorBill::with('vendor', 'tenant', 'goodsReceipt');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('bill_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'posted', 'partially_paid', 'paid', 'void'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('bill_date', [$request->from, $request->to]);
        }

        $summary = [
            'count' => (int) (clone $query)->count(),
            'total_value' => (float) ((clone $query)->sum('grand_total') ?? 0),
            'outstanding' => (float) ((clone $query)->select(DB::raw('SUM(grand_total - paid_amount) as balance'))->value('balance') ?? 0),
            'posted' => (int) ((clone $query)->where('status', 'posted')->count()),
        ];

        $bills = $query->orderByDesc('bill_date')->paginate($perPage)->withQueryString();
        $latestActions = ApprovalAction::query()
            ->where('document_type', 'vendor_bill')
            ->whereIn('document_id', $bills->getCollection()->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('document_id')
            ->keyBy('document_id');
        $postedIds = JournalEntry::query()
            ->where('module_type', 'vendor_bill')
            ->whereIn('module_id', $bills->getCollection()->pluck('id'))
            ->pluck('module_id')
            ->all();
        $postedLookup = array_fill_keys($postedIds, true);

        $bills->getCollection()->transform(function ($bill) use ($latestActions, $postedLookup) {
            $action = $latestActions->get($bill->id);
            $bill->gl_posted = (bool) ($postedLookup[$bill->id] ?? false);
            $bill->latest_approval_action = $action ? [
                'action' => $action->action,
                'remarks' => $action->remarks,
                'created_at' => $action->created_at,
            ] : null;
            return $bill;
        });

        return Inertia::render('App/Admin/Procurement/VendorBills/Index', [
            'bills' => $bills,
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'vendor_id', 'tenant_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function create(Request $request)
    {
        $receipt = null;
        if ($request->filled('goods_receipt_id')) {
            $receipt = GoodsReceipt::with('items.product')->find($request->goods_receipt_id);
        }

        $vendors = Vendor::with('tenant:id,name')->orderBy('name')->get(['id', 'name', 'tenant_id', 'default_payment_account_id']);
        $receipts = GoodsReceipt::with(['vendor:id,name', 'tenant:id,name', 'items.product:id,name'])
            ->orderByDesc('received_date')
            ->limit(200)
            ->get(['id', 'grn_no', 'vendor_id', 'tenant_id', 'received_date', 'status']);

        return Inertia::render('App/Admin/Procurement/VendorBills/Create', [
            'receipt' => $receipt,
            'vendors' => $vendors,
            'receipts' => $receipts,
        ]);
    }

    public function edit(VendorBill $vendorBill)
    {
        $bill = $vendorBill->load('items');

        if ($bill->status !== 'draft') {
            return redirect()->route('procurement.vendor-bills.index')->with('error', 'Only draft bills can be edited.');
        }

        $vendors = Vendor::with('tenant:id,name')->orderBy('name')->get(['id', 'name', 'tenant_id', 'default_payment_account_id']);
        $receipts = GoodsReceipt::with(['vendor:id,name', 'tenant:id,name', 'items.product:id,name'])
            ->orderByDesc('received_date')
            ->limit(200)
            ->get(['id', 'grn_no', 'vendor_id', 'tenant_id', 'received_date', 'status']);

        return Inertia::render('App/Admin/Procurement/VendorBills/Edit', [
            'bill' => $bill,
            'vendors' => $vendors,
            'receipts' => $receipts,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'goods_receipt_id' => 'nullable|exists:goods_receipts,id',
            'bill_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:bill_date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'nullable|string',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        if (!empty($data['goods_receipt_id'])) {
            $receiptVendorId = GoodsReceipt::query()
                ->whereKey($data['goods_receipt_id'])
                ->value('vendor_id');

            if ((int) $receiptVendorId !== (int) $data['vendor_id']) {
                return redirect()->back()->withErrors([
                    'vendor_id' => 'Selected vendor must match the linked goods receipt vendor.',
                ])->withInput();
            }
        }

        $vendor = Vendor::query()->findOrFail($data['vendor_id']);
        $receipt = !empty($data['goods_receipt_id']) ? GoodsReceipt::query()->find($data['goods_receipt_id']) : null;

        $bill = VendorBill::create([
            'bill_no' => 'BILL-' . now()->format('YmdHis'),
            'vendor_id' => $data['vendor_id'],
            'tenant_id' => $receipt?->tenant_id ?: $vendor->tenant_id,
            'goods_receipt_id' => $data['goods_receipt_id'] ?? null,
            'bill_date' => $data['bill_date'],
            'due_date' => $data['due_date'] ?? null,
            'status' => 'draft',
            'currency' => 'PKR',
            'remarks' => $data['remarks'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        $subTotal = 0;
        foreach ($data['items'] as $item) {
            $lineTotal = $item['qty'] * $item['unit_cost'];
            $subTotal += $lineTotal;
            $bill->items()->create([
                'description' => $item['description'] ?? null,
                'qty' => $item['qty'],
                'unit_cost' => $item['unit_cost'],
                'line_total' => $lineTotal,
            ]);
        }

        $bill->update([
            'sub_total' => $subTotal,
            'grand_total' => $subTotal,
        ]);

        ApprovalAction::create([
            'document_type' => 'vendor_bill',
            'document_id' => $bill->id,
            'action' => 'submitted',
            'remarks' => 'Vendor bill created and submitted.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->route('procurement.vendor-bills.index')->with('success', 'Vendor bill created.');
    }

    public function update(Request $request, VendorBill $vendorBill)
    {
        if ($vendorBill->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft bills can be updated.');
        }

        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'goods_receipt_id' => 'nullable|exists:goods_receipts,id',
            'bill_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:bill_date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'nullable|string',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        if (!empty($data['goods_receipt_id'])) {
            $receiptVendorId = GoodsReceipt::query()
                ->whereKey($data['goods_receipt_id'])
                ->value('vendor_id');

            if ((int) $receiptVendorId !== (int) $data['vendor_id']) {
                return redirect()->back()->withErrors([
                    'vendor_id' => 'Selected vendor must match the linked goods receipt vendor.',
                ])->withInput();
            }
        }

        DB::transaction(function () use ($vendorBill, $data, $request) {
            $subTotal = 0;
            $items = [];

            foreach ($data['items'] as $item) {
                $lineTotal = $item['qty'] * $item['unit_cost'];
                $subTotal += $lineTotal;
                $items[] = [
                    'description' => $item['description'] ?? null,
                    'qty' => $item['qty'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ];
            }

            $vendorBill->update([
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => GoodsReceipt::query()->whereKey($data['goods_receipt_id'] ?? null)->value('tenant_id')
                    ?: Vendor::query()->whereKey($data['vendor_id'])->value('tenant_id'),
                'goods_receipt_id' => $data['goods_receipt_id'] ?? null,
                'bill_date' => $data['bill_date'],
                'due_date' => $data['due_date'] ?? null,
                'remarks' => $data['remarks'] ?? null,
                'sub_total' => $subTotal,
                'grand_total' => $subTotal,
                'updated_at' => now(),
            ]);

            $vendorBill->items()->delete();
            $vendorBill->items()->createMany($items);

            ApprovalAction::create([
                'document_type' => 'vendor_bill',
                'document_id' => $vendorBill->id,
                'action' => 'updated',
                'remarks' => 'Vendor bill updated.',
                'action_by' => $request->user()?->id,
            ]);
        });

        return redirect()->route('procurement.vendor-bills.index')->with('success', 'Vendor bill updated.');
    }

    public function submit(Request $request, VendorBill $vendorBill)
    {
        if ($vendorBill->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft bills can be submitted.');
        }

        ApprovalAction::create([
            'document_type' => 'vendor_bill',
            'document_id' => $vendorBill->id,
            'action' => 'submitted',
            'remarks' => 'Vendor bill submitted for approval.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Vendor bill submitted.');
    }

    public function approve(Request $request, VendorBill $vendorBill)
    {
        if ($vendorBill->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft bills can be approved.');
        }

        $vendorBill->update([
            'status' => 'posted',
            'posted_by' => $request->user()?->id,
            'posted_at' => now(),
        ]);

        app(AccountingEventDispatcher::class)->dispatch(
            'vendor_bill_posted',
            VendorBill::class,
            (int) $vendorBill->id,
            [
                'bill_no' => $vendorBill->bill_no,
                'vendor_id' => $vendorBill->vendor_id,
                'grand_total' => $vendorBill->grand_total,
                'goods_receipt_id' => $vendorBill->goods_receipt_id,
            ],
            $request->user()?->id,
            $vendorBill->tenant_id
        );

        ApprovalAction::create([
            'document_type' => 'vendor_bill',
            'document_id' => $vendorBill->id,
            'action' => 'approved',
            'remarks' => 'Vendor bill approved/posted.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Vendor bill approved.');
    }

    public function reject(Request $request, VendorBill $vendorBill)
    {
        if ($vendorBill->status === 'void') {
            return redirect()->back()->with('error', 'Vendor bill is already void.');
        }

        $vendorBill->update([
            'status' => 'void',
        ]);

        ApprovalAction::create([
            'document_type' => 'vendor_bill',
            'document_id' => $vendorBill->id,
            'action' => 'rejected',
            'remarks' => 'Vendor bill rejected/voided.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Vendor bill rejected.');
    }
}
