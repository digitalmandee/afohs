<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\AccountingEventQueue;
use App\Models\ApprovalAction;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\JournalEntry;
use App\Models\OperationalAuditLog;
use App\Models\SupplierAdvance;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Services\Accounting\AccountingEventDispatcher;
use App\Services\Accounting\StrictAccountingSyncService;
use App\Services\Procurement\ProcurementDocumentNumberService;
use App\Services\Procurement\ProcurementPolicyService;
use App\Services\Procurement\SupplierAdvanceService;
use App\Support\Branding\StaticDocumentBrandingResolver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class VendorBillController extends Controller
{
    public function __construct(
        private readonly ProcurementPolicyService $policyService,
        private readonly SupplierAdvanceService $supplierAdvanceService,
        private readonly ProcurementDocumentNumberService $documentNumberService
    ) {
    }

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
            'outstanding' => (float) ((clone $query)->select(DB::raw('SUM(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0)) as balance'))->value('balance') ?? 0),
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

        $eventLookup = AccountingEventQueue::query()
            ->where('source_type', VendorBill::class)
            ->whereIn('source_id', $bills->getCollection()->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('source_id')
            ->keyBy('source_id');

        $bills->getCollection()->transform(function ($bill) use ($latestActions, $postedLookup, $eventLookup) {
            $action = $latestActions->get($bill->id);
            $event = $eventLookup->get($bill->id);
            $bill->gl_posted = (bool) ($postedLookup[$bill->id] ?? false);
            $bill->accounting_status = $event?->status ?? ($bill->gl_posted ? 'posted' : 'pending');
            $bill->accounting_failure_reason = $event?->error_message;
            $bill->accounting_correlation_id = (string) ($event?->payload['correlation_id'] ?? '');
            $bill->latest_approval_action = $action ? [
                'action' => $action->action,
                'remarks' => $action->remarks,
                'created_at' => $action->created_at,
            ] : null;
            $bill->posting_hint = in_array((string) $bill->status, ['draft'], true)
                ? 'Draft (non-posting)'
                : ($bill->gl_posted ? 'Posted (GL done)' : 'Posting pending');
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
            $receipt = GoodsReceipt::with('items.inventoryItem')->find($request->goods_receipt_id);
        }

        $vendors = Vendor::with('tenant:id,name')->orderBy('name')->get(['id', 'name', 'tenant_id', 'default_payment_account_id']);
        $receiptContext = $this->pendingGoodsReceipts();
        $receipts = $receiptContext['billableReceipts'];

        return Inertia::render('App/Admin/Procurement/VendorBills/Create', [
            'receipt' => $receipt,
            'vendors' => $vendors,
            'receipts' => $receipts,
            'vendorReceiptStatus' => $this->normalizeVendorReceiptStatus($vendors, $receiptContext['receiptReadinessSummary']),
            'availableAdvances' => $this->availableAdvancesByVendor($receipts),
            'procurementPolicy' => $this->policyService->all(),
        ]);
    }

    public function edit(VendorBill $vendorBill)
    {
        $bill = $vendorBill->load('items', 'otherCharges', 'goodsReceipt.items.inventoryItem');

        if ($bill->status !== 'draft') {
            return redirect()->route('procurement.vendor-bills.index')->with('error', 'Only draft bills can be edited.');
        }

        $vendors = Vendor::with('tenant:id,name')->orderBy('name')->get(['id', 'name', 'tenant_id', 'default_payment_account_id']);
        $receiptContext = $this->pendingGoodsReceipts($bill->id);
        $receipts = $receiptContext['billableReceipts'];
        if ($bill->goodsReceipt) {
            $includedIds = collect($receipts)->pluck('id')->map(fn ($id) => (int) $id)->all();
            if (!in_array((int) $bill->goods_receipt_id, $includedIds, true)) {
                $receipts->prepend($bill->goodsReceipt->setAttribute('billable_summary', [
                    'total_qty_received' => (float) $bill->goodsReceipt->items->sum('qty_received'),
                    'already_billed_qty' => 0.0,
                    'remaining_qty' => (float) $bill->goodsReceipt->items->sum('qty_received'),
                ]));
            }
        }

        return Inertia::render('App/Admin/Procurement/VendorBills/Edit', [
            'bill' => $bill,
            'vendors' => $vendors,
            'receipts' => $receipts,
            'vendorReceiptStatus' => $this->normalizeVendorReceiptStatus($vendors, $receiptContext['receiptReadinessSummary']),
            'availableAdvances' => $this->availableAdvancesByVendor($receipts),
            'procurementPolicy' => $this->policyService->all(),
        ]);
    }

    public function view(VendorBill $vendorBill)
    {
        return response()->view(
            'procurement.vendor-bills.document',
            $this->buildVendorBillDocumentPayload($vendorBill, false)
        );
    }

    public function print(VendorBill $vendorBill)
    {
        return response()->view(
            'procurement.vendor-bills.document',
            $this->buildVendorBillDocumentPayload($vendorBill, true)
        );
    }

    public function pdf(VendorBill $vendorBill)
    {
        $payload = $this->buildVendorBillDocumentPayload($vendorBill, false);

        return Pdf::loadView('procurement.vendor-bills.document', $payload)
            ->setPaper('a4', 'portrait')
            ->download(sprintf('%s-%s.pdf', (string) $vendorBill->bill_no, now()->format('Ymd-His')));
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);
        $this->enforceBillSourcePolicy($data);

        $receipt = !empty($data['goods_receipt_id']) ? GoodsReceipt::query()->find($data['goods_receipt_id']) : null;
        if ($receipt && (int) $receipt->vendor_id !== (int) $data['vendor_id']) {
            return redirect()->back()->withErrors([
                'vendor_id' => 'Selected vendor must match the linked goods receipt vendor.',
            ])->withInput();
        }

        $this->validateBillAgainstGoodsReceipt(
            goodsReceiptId: $data['goods_receipt_id'] ?? null,
            items: $data['items'],
            existingBillId: null
        );

        $vendor = Vendor::query()->findOrFail($data['vendor_id']);
        $bill = DB::transaction(function () use ($data, $request, $vendor, $receipt) {
            $tenantId = $receipt?->tenant_id ?: $vendor->tenant_id;
            $branchId = $tenantId ? (int) (Tenant::query()->whereKey($tenantId)->value('branch_id') ?? 0) : 0;
            if ($branchId <= 0) {
                throw ValidationException::withMessages([
                    'vendor_id' => 'Branch mapping missing for numbering. Assign branch to vendor restaurant before creating bill.',
                ]);
            }

            $billNo = $this->documentNumberService->generate(
                documentType: 'PINV',
                branchId: $branchId,
                documentDate: $data['bill_date']
            );

            $bill = VendorBill::query()->create([
                'bill_no' => $billNo,
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => $tenantId,
                'goods_receipt_id' => $data['goods_receipt_id'] ?? null,
                'bill_date' => $data['bill_date'],
                'due_date' => $data['due_date'] ?? null,
                'status' => 'draft',
                'currency' => 'PKR',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $totals = $this->syncBillLinesAndCharges($bill, $data);
            $bill->update($totals);

            ApprovalAction::create([
                'document_type' => 'vendor_bill',
                'document_id' => $bill->id,
                'action' => 'submitted',
                'remarks' => 'Vendor bill created and submitted.',
                'action_by' => $request->user()?->id,
            ]);

            return $bill;
        });

        return redirect()->route('procurement.vendor-bills.index')->with('success', "Vendor bill {$bill->bill_no} created.");
    }

    public function update(Request $request, VendorBill $vendorBill)
    {
        if ($vendorBill->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft bills can be updated.');
        }

        $data = $this->validatePayload($request);
        $this->enforceBillSourcePolicy($data);

        $receipt = !empty($data['goods_receipt_id']) ? GoodsReceipt::query()->find($data['goods_receipt_id']) : null;
        if ($receipt && (int) $receipt->vendor_id !== (int) $data['vendor_id']) {
            return redirect()->back()->withErrors([
                'vendor_id' => 'Selected vendor must match the linked goods receipt vendor.',
            ])->withInput();
        }

        $this->validateBillAgainstGoodsReceipt(
            goodsReceiptId: $data['goods_receipt_id'] ?? null,
            items: $data['items'],
            existingBillId: $vendorBill->id
        );

        DB::transaction(function () use ($vendorBill, $data, $request, $receipt) {
            $vendorBill->update([
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => $receipt?->tenant_id ?: Vendor::query()->whereKey($data['vendor_id'])->value('tenant_id'),
                'goods_receipt_id' => $data['goods_receipt_id'] ?? null,
                'bill_date' => $data['bill_date'],
                'due_date' => $data['due_date'] ?? null,
                'remarks' => $data['remarks'] ?? null,
            ]);

            $totals = $this->syncBillLinesAndCharges($vendorBill, $data);
            $vendorBill->update($totals);

            $this->recordOperationalEvent(
                'vendor_bill',
                (int) $vendorBill->id,
                'procurement.vendor_bill.updated',
                'Vendor bill updated.',
                $request->user()?->id,
                [
                    'display_action' => 'updated',
                    'bill_no' => (string) $vendorBill->bill_no,
                    'vendor_id' => (int) $vendorBill->vendor_id,
                    'goods_receipt_id' => $vendorBill->goods_receipt_id ? (int) $vendorBill->goods_receipt_id : null,
                ]
            );
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

        DB::transaction(function () use ($request, $vendorBill) {
            $vendorBill->update([
                'status' => 'posted',
                'posted_by' => $request->user()?->id,
                'posted_at' => now(),
            ]);

            if ($request->filled('supplier_advance_applications')) {
                $applications = collect((array) $request->input('supplier_advance_applications'));
                foreach ($applications as $application) {
                    if (!is_array($application)) {
                        continue;
                    }
                    $advanceId = (int) ($application['supplier_advance_id'] ?? 0);
                    $applyAmount = (float) ($application['amount'] ?? 0);
                    if ($advanceId <= 0 || $applyAmount <= 0.0) {
                        continue;
                    }
                    $advance = SupplierAdvance::query()->find($advanceId);
                    if ($advance) {
                        $this->supplierAdvanceService->applyToBill($advance, $vendorBill, $applyAmount, $request->user()?->id);
                    }
                }
            }

            $event = app(AccountingEventDispatcher::class)->dispatch(
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

            app(StrictAccountingSyncService::class)->enforceOrFail($event, "Vendor Bill {$vendorBill->bill_no}");

            ApprovalAction::create([
                'document_type' => 'vendor_bill',
                'document_id' => $vendorBill->id,
                'action' => 'approved',
                'remarks' => 'Vendor bill approved/posted.',
                'action_by' => $request->user()?->id,
            ]);
        });

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

    private function validatePayload(Request $request): array
    {
        return $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'goods_receipt_id' => 'nullable|exists:goods_receipts,id',
            'bill_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:bill_date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.description' => 'nullable|string',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'items.*.tax_amount' => 'nullable|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'other_charges' => 'nullable|array',
            'other_charges.*.account_id' => 'required|exists:coa_accounts,id',
            'other_charges.*.party_vendor_id' => 'nullable|exists:vendors,id',
            'other_charges.*.description' => 'nullable|string|max:255',
            'other_charges.*.amount' => 'required|numeric|min:0.01',
        ]);
    }

    private function enforceBillSourcePolicy(array $data): void
    {
        if ($this->policyService->billRequiresGrn() && empty($data['goods_receipt_id'])) {
            throw ValidationException::withMessages([
                'goods_receipt_id' => 'Goods receipt is required by procurement policy.',
            ]);
        }
    }

    private function syncBillLinesAndCharges(VendorBill $bill, array $data): array
    {
        $bill->items()->delete();
        $bill->otherCharges()->delete();

        $subTotal = 0.0;
        $taxTotal = 0.0;
        $discountTotal = 0.0;

        foreach ($data['items'] as $item) {
            $taxAmount = (float) ($item['tax_amount'] ?? 0);
            $discountAmount = (float) ($item['discount_amount'] ?? 0);
            $lineBase = (float) $item['qty'] * (float) $item['unit_cost'];
            $lineTotal = $lineBase + $taxAmount - $discountAmount;

            $subTotal += $lineTotal;
            $taxTotal += $taxAmount;
            $discountTotal += $discountAmount;

            $bill->items()->create([
                'inventory_item_id' => $item['inventory_item_id'],
                'description' => $item['description'] ?? null,
                'qty' => $item['qty'],
                'unit_cost' => $item['unit_cost'],
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'line_total' => $lineTotal,
            ]);
        }

        $otherChargesTotal = 0.0;
        foreach (($data['other_charges'] ?? []) as $charge) {
            $amount = (float) ($charge['amount'] ?? 0);
            $otherChargesTotal += $amount;
            $bill->otherCharges()->create([
                'account_id' => $charge['account_id'],
                'party_vendor_id' => $charge['party_vendor_id'] ?? null,
                'description' => $charge['description'] ?? null,
                'amount' => $amount,
            ]);
        }

        return [
            'sub_total' => $subTotal,
            'tax_total' => $taxTotal,
            'discount_total' => $discountTotal,
            'other_charges_total' => $otherChargesTotal,
            'grand_total' => $subTotal + $otherChargesTotal,
        ];
    }

    private function validateBillAgainstGoodsReceipt(?int $goodsReceiptId, array $items, ?int $existingBillId): void
    {
        if (!$goodsReceiptId) {
            return;
        }

        $allowedByItem = GoodsReceiptItem::query()
            ->where('goods_receipt_id', $goodsReceiptId)
            ->selectRaw('inventory_item_id, SUM(qty_received) as qty')
            ->groupBy('inventory_item_id')
            ->pluck('qty', 'inventory_item_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();

        $alreadyBilledByItem = DB::table('vendor_bill_items')
            ->join('vendor_bills', 'vendor_bills.id', '=', 'vendor_bill_items.vendor_bill_id')
            ->where('vendor_bills.goods_receipt_id', $goodsReceiptId)
            ->where('vendor_bills.status', '!=', 'void')
            ->when($existingBillId, fn ($q) => $q->where('vendor_bills.id', '!=', $existingBillId))
            ->selectRaw('vendor_bill_items.inventory_item_id, SUM(vendor_bill_items.qty) as qty')
            ->groupBy('vendor_bill_items.inventory_item_id')
            ->pluck('qty', 'inventory_item_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();

        $requestedByItem = [];
        foreach ($items as $item) {
            $itemId = (int) ($item['inventory_item_id'] ?? 0);
            if ($itemId <= 0) {
                continue;
            }
            $requestedByItem[$itemId] = ($requestedByItem[$itemId] ?? 0.0) + (float) ($item['qty'] ?? 0);
        }

        $errors = [];
        foreach ($requestedByItem as $itemId => $qty) {
            $allowed = (float) ($allowedByItem[$itemId] ?? 0.0);
            $already = (float) ($alreadyBilledByItem[$itemId] ?? 0.0);
            $remaining = max(0, $allowed - $already);
            if ($qty > $remaining + 0.0001) {
                $errors["items.{$itemId}"] = "Bill quantity exceeds GRN remaining quantity for item {$itemId}. Remaining: {$remaining}.";
            }
        }

        if (!empty($errors)) {
            throw ValidationException::withMessages($errors);
        }
    }

    private function pendingGoodsReceipts(?int $existingBillId = null): array
    {
        $receipts = GoodsReceipt::with(['vendor:id,name', 'tenant:id,name', 'items.inventoryItem:id,name'])
            ->orderBy('received_date')
            ->limit(500)
            ->get(['id', 'grn_no', 'vendor_id', 'tenant_id', 'purchase_order_id', 'received_date', 'status']);

        if ($receipts->isEmpty()) {
            return [
                'billableReceipts' => $receipts,
                'receiptReadinessSummary' => [],
            ];
        }

        $receiptIds = $receipts->pluck('id')->all();

        $grnQtyByReceipt = GoodsReceiptItem::query()
            ->whereIn('goods_receipt_id', $receiptIds)
            ->selectRaw('goods_receipt_id, SUM(qty_received) as qty')
            ->groupBy('goods_receipt_id')
            ->pluck('qty', 'goods_receipt_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();

        $billedQtyByReceipt = DB::table('vendor_bill_items')
            ->join('vendor_bills', 'vendor_bills.id', '=', 'vendor_bill_items.vendor_bill_id')
            ->whereIn('vendor_bills.goods_receipt_id', $receiptIds)
            ->where('vendor_bills.status', '!=', 'void')
            ->when($existingBillId, fn ($q) => $q->where('vendor_bills.id', '!=', $existingBillId))
            ->selectRaw('vendor_bills.goods_receipt_id as goods_receipt_id, SUM(vendor_bill_items.qty) as qty')
            ->groupBy('vendor_bills.goods_receipt_id')
            ->pluck('qty', 'goods_receipt_id')
            ->map(fn ($qty) => (float) $qty)
            ->all();

        $readinessSummary = [];

        $billableReceipts = $receipts
            ->map(function ($receipt) use ($grnQtyByReceipt, $billedQtyByReceipt, &$readinessSummary) {
                $received = (float) ($grnQtyByReceipt[$receipt->id] ?? 0.0);
                $billed = (float) ($billedQtyByReceipt[$receipt->id] ?? 0.0);
                $remaining = max(0.0, $received - $billed);
                $vendorId = (int) ($receipt->vendor_id ?? 0);

                $receipt->setAttribute('billable_summary', [
                    'total_qty_received' => $received,
                    'already_billed_qty' => $billed,
                    'remaining_qty' => $remaining,
                ]);

                if ($vendorId > 0) {
                    $summary = $readinessSummary[$vendorId] ?? [
                        'billable_count' => 0,
                        'fully_billed_count' => 0,
                        'pending_acceptance_count' => 0,
                        'other_status_count' => 0,
                        'total_receipts_count' => 0,
                        'latest_reason' => 'no_receipts',
                    ];

                    $summary['total_receipts_count']++;

                    if (in_array((string) $receipt->status, ['accepted', 'received'], true) && $remaining > 0.0001) {
                        $summary['billable_count']++;
                        $summary['latest_reason'] = 'billable';
                    } elseif (in_array((string) $receipt->status, ['accepted', 'received'], true)) {
                        $summary['fully_billed_count']++;
                        if ($summary['latest_reason'] !== 'billable') {
                            $summary['latest_reason'] = 'fully_billed';
                        }
                    } elseif ((string) $receipt->status === 'pending_acceptance') {
                        $summary['pending_acceptance_count']++;
                        if (!in_array($summary['latest_reason'], ['billable', 'fully_billed'], true)) {
                            $summary['latest_reason'] = 'pending_acceptance';
                        }
                    } else {
                        $summary['other_status_count']++;
                        if (!in_array($summary['latest_reason'], ['billable', 'fully_billed', 'pending_acceptance'], true)) {
                            $summary['latest_reason'] = 'other_status';
                        }
                    }

                    $readinessSummary[$vendorId] = $summary;
                }

                return $receipt;
            })
            ->filter(function ($receipt) {
                return in_array((string) $receipt->status, ['accepted', 'received'], true)
                    && ((float) ($receipt->billable_summary['remaining_qty'] ?? 0)) > 0.0001;
            })
            ->filter(fn ($receipt) => ((float) ($receipt->billable_summary['remaining_qty'] ?? 0)) > 0.0001)
            ->values();

        return [
            'billableReceipts' => $billableReceipts,
            'receiptReadinessSummary' => $readinessSummary,
        ];
    }

    private function normalizeVendorReceiptStatus($vendors, array $receiptReadinessSummary): array
    {
        return collect($vendors)->mapWithKeys(function ($vendor) use ($receiptReadinessSummary) {
            $summary = $receiptReadinessSummary[(int) $vendor->id] ?? [
                'billable_count' => 0,
                'fully_billed_count' => 0,
                'pending_acceptance_count' => 0,
                'other_status_count' => 0,
                'total_receipts_count' => 0,
                'latest_reason' => 'no_receipts',
            ];

            $summary['message'] = match ($summary['latest_reason']) {
                'billable' => 'Billable GRNs are ready for this vendor.',
                'fully_billed' => 'All accepted GRNs for this vendor are already fully billed.',
                'pending_acceptance' => 'GRNs exist for this vendor, but they are still awaiting acceptance.',
                'other_status' => 'GRNs exist for this vendor, but none are in a billable status yet.',
                default => 'No goods receipts found for this vendor.',
            };

            return [(string) $vendor->id => $summary];
        })->all();
    }

    private function availableAdvancesByVendor($receipts)
    {
        $vendorIds = collect($receipts)->pluck('vendor_id')->filter()->unique()->values()->all();
        if (empty($vendorIds)) {
            return [];
        }

        $advances = SupplierAdvance::query()
            ->with(['purchaseOrder:id,po_no'])
            ->whereIn('vendor_id', $vendorIds)
            ->whereIn('status', ['posted', 'partially_applied'])
            ->get(['id', 'advance_no', 'vendor_id', 'purchase_order_id', 'amount', 'applied_amount', 'status', 'advance_date']);

        return $advances
            ->map(function (SupplierAdvance $advance) {
                $remaining = max(0, (float) $advance->amount - (float) $advance->applied_amount);
                if ($remaining <= 0.0001) {
                    return null;
                }

                return [
                    'id' => $advance->id,
                    'advance_no' => $advance->advance_no,
                    'vendor_id' => $advance->vendor_id,
                    'purchase_order_id' => $advance->purchase_order_id,
                    'linked_po_no' => $advance->purchaseOrder?->po_no,
                    'advance_date' => optional($advance->advance_date)->format('Y-m-d'),
                    'status' => $advance->status,
                    'amount' => (float) $advance->amount,
                    'applied_amount' => (float) $advance->applied_amount,
                    'remaining_amount' => $remaining,
                ];
            })
            ->filter()
            ->values()
            ->all();
    }

    private function recordOperationalEvent(
        string $entityType,
        int $entityId,
        string $action,
        string $message,
        ?int $userId,
        array $context = []
    ): void {
        OperationalAuditLog::query()->create([
            'correlation_id' => (string) (request()?->headers->get('X-Correlation-ID') ?: request()?->attributes->get('correlation_id') ?: ''),
            'module' => 'procurement',
            'entity_type' => $entityType,
            'entity_id' => (string) $entityId,
            'action' => $action,
            'status' => 'completed',
            'severity' => 'info',
            'message' => $message,
            'context_json' => $context,
            'actor_id' => $userId,
            'request_path' => request()?->path(),
            'ip' => request()?->ip(),
        ]);
    }

    private function buildVendorBillDocumentPayload(VendorBill $vendorBill, bool $autoPrint): array
    {
        $vendorBill->loadMissing([
            'vendor',
            'tenant',
            'goodsReceipt:id,grn_no,received_date',
            'items.inventoryItem.unit',
            'otherCharges',
            'createdBy:id,name',
            'postedBy:id,name',
        ]);

        $lineItems = $vendorBill->items->map(function ($item) {
            $qty = (float) ($item->qty ?? 0);
            $unitCost = (float) ($item->unit_cost ?? 0);
            $lineTotal = (float) ($item->line_total ?? ($qty * $unitCost));

            return [
                'item_name' => $item->inventoryItem?->name ?? $item->description ?? ('Inventory Item #' . $item->inventory_item_id),
                'sku' => $item->inventoryItem?->sku ?: '-',
                'uom' => $item->inventoryItem?->unit?->name ?: '-',
                'qty' => number_format($qty, 3, '.', ','),
                'unit_cost' => number_format($unitCost, 2, '.', ','),
                'tax_amount' => number_format((float) ($item->tax_amount ?? 0), 2, '.', ','),
                'discount_amount' => number_format((float) ($item->discount_amount ?? 0), 2, '.', ','),
                'line_total' => number_format($lineTotal, 2, '.', ','),
            ];
        })->values()->all();

        $otherCharges = $vendorBill->otherCharges->map(function ($charge) {
            return [
                'description' => $charge->description ?: '-',
                'amount' => number_format((float) ($charge->amount ?? 0), 2, '.', ','),
            ];
        })->values()->all();

        $tenantName = $vendorBill->tenant?->name ?: config('app.name', 'AFOHS Club');

        return [
            'title' => 'Vendor Bill',
            'companyName' => $tenantName,
            'logoDataUri' => app(StaticDocumentBrandingResolver::class)->resolveLogoDataUri(),
            'generatedAt' => now()->format('d/m/Y h:i A'),
            'autoPrint' => $autoPrint,
            'bill' => [
                'number' => $vendorBill->bill_no,
                'status' => strtoupper(str_replace('_', ' ', (string) $vendorBill->status)),
                'bill_date' => optional($vendorBill->bill_date)->format('d/m/Y') ?: '-',
                'due_date' => optional($vendorBill->due_date)->format('d/m/Y') ?: '-',
                'currency' => $vendorBill->currency ?: 'PKR',
                'grn_no' => $vendorBill->goodsReceipt?->grn_no ?: '-',
                'grn_date' => optional($vendorBill->goodsReceipt?->received_date)->format('d/m/Y') ?: '-',
                'remarks' => $vendorBill->remarks ?: '-',
                'created_by' => $vendorBill->createdBy?->name ?: 'N/A',
                'created_at' => optional($vendorBill->created_at)->format('d/m/Y h:i A') ?: 'N/A',
                'posted_by' => $vendorBill->postedBy?->name ?: ((string) $vendorBill->status === 'draft' ? 'Pending' : 'N/A'),
                'posted_at' => optional($vendorBill->posted_at)->format('d/m/Y h:i A') ?: ((string) $vendorBill->status === 'draft' ? 'Pending' : 'N/A'),
            ],
            'vendor' => [
                'name' => $vendorBill->vendor?->name ?: '-',
                'code' => $vendorBill->vendor?->code ?: '-',
                'phone' => $vendorBill->vendor?->phone ?: '-',
                'email' => $vendorBill->vendor?->email ?: '-',
                'address' => $vendorBill->vendor?->address ?: '-',
            ],
            'lineItems' => $lineItems,
            'otherCharges' => $otherCharges,
            'totals' => [
                'sub_total' => number_format((float) ($vendorBill->sub_total ?? 0), 2, '.', ','),
                'tax_total' => number_format((float) ($vendorBill->tax_total ?? 0), 2, '.', ','),
                'discount_total' => number_format((float) ($vendorBill->discount_total ?? 0), 2, '.', ','),
                'other_charges_total' => number_format((float) ($vendorBill->other_charges_total ?? 0), 2, '.', ','),
                'grand_total' => number_format((float) ($vendorBill->grand_total ?? 0), 2, '.', ','),
            ],
        ];
    }
}
