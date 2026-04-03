<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\CashPurchase;
use App\Models\InventoryDocument;
use App\Models\InventoryItem;
use App\Models\PaymentAccount;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\Inventory\InventoryDocumentWorkflowService;
use App\Services\Inventory\InventoryMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CashPurchaseController extends Controller
{
    public function __construct(
        private readonly InventoryMovementService $movementService,
        private readonly InventoryDocumentWorkflowService $workflowService,
    ) {
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = CashPurchase::query()->with(['vendor:id,name', 'warehouse:id,name', 'paymentAccount:id,name']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder->where('cp_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', fn ($vendor) => $vendor->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $cashPurchases = $query->latest('id')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/Procurement/CashPurchases/Index', [
            'cashPurchases' => $cashPurchases,
            'summary' => [
                'count' => (int) $query->count(),
                'total_value' => (float) (clone $query)->sum('grand_total'),
                'draft' => (int) (clone $query)->where('status', 'draft')->count(),
                'posted' => (int) (clone $query)->where('status', 'posted')->count(),
            ],
            'filters' => $request->only(['search', 'status', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/CashPurchases/Create', [
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name', 'tenant_id']),
            'paymentAccounts' => PaymentAccount::query()->orderBy('name')->get(['id', 'name']),
            'inventoryItems' => InventoryItem::query()->procurementEligible()->orderBy('name')->get(['id', 'name', 'sku', 'default_unit_cost']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'nullable|exists:vendors,id',
            'tenant_id' => 'nullable|exists:tenants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'payment_account_id' => 'nullable|exists:payment_accounts,id',
            'purchase_date' => 'required|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $cashPurchase = DB::transaction(function () use ($data) {
            $cpNo = $this->workflowService->nextDocumentNumber('cash_purchase');
            $cashPurchase = CashPurchase::query()->create([
                'cp_no' => $cpNo,
                'vendor_id' => $data['vendor_id'] ?? null,
                'tenant_id' => $data['tenant_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'],
                'warehouse_location_id' => $data['warehouse_location_id'] ?? null,
                'payment_account_id' => $data['payment_account_id'] ?? null,
                'purchase_date' => $data['purchase_date'],
                'status' => 'draft',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => auth()->id(),
            ]);

            $total = 0;
            foreach ($data['items'] as $item) {
                $lineTotal = (float) $item['qty'] * (float) $item['unit_cost'];
                $total += $lineTotal;
                $cashPurchase->items()->create([
                    'inventory_item_id' => $item['inventory_item_id'],
                    'qty' => $item['qty'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ]);
            }

            $cashPurchase->update(['grand_total' => $total]);
            return $cashPurchase->fresh('items');
        });

        return redirect()->route('procurement.cash-purchases.index')
            ->with('success', "Cash purchase {$cashPurchase->cp_no} created.");
    }

    public function submit(CashPurchase $cashPurchase)
    {
        if ($cashPurchase->status !== 'draft') {
            return back()->with('error', 'Only draft cash purchases can be submitted.');
        }

        $cashPurchase->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'cash_purchase',
            'document_id' => $cashPurchase->id,
            'action' => 'submitted',
            'remarks' => 'Cash purchase submitted.',
            'action_by' => auth()->id(),
        ]);

        return back()->with('success', 'Cash purchase submitted.');
    }

    public function approve(CashPurchase $cashPurchase)
    {
        if (!in_array($cashPurchase->status, ['submitted', 'draft'], true)) {
            return back()->with('error', 'Cash purchase cannot be approved in current state.');
        }

        DB::transaction(function () use ($cashPurchase) {
            $cashPurchase->load('items');

            $inventoryDocument = InventoryDocument::query()->create([
                'document_no' => $cashPurchase->cp_no,
                'tenant_id' => $cashPurchase->tenant_id,
                'type' => 'cash_purchase',
                'destination_warehouse_id' => $cashPurchase->warehouse_id,
                'destination_warehouse_location_id' => $cashPurchase->warehouse_location_id,
                'transaction_date' => $cashPurchase->purchase_date,
                'status' => 'posted',
                'approval_status' => 'approved',
                'remarks' => $cashPurchase->remarks ?: 'Cash purchase stock receipt.',
                'source_document_type' => CashPurchase::class,
                'source_document_id' => $cashPurchase->id,
                'posting_key' => "cash-purchase:{$cashPurchase->id}",
                'approved_at' => now(),
                'approved_by' => auth()->id(),
                'posted_at' => now(),
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            foreach ($cashPurchase->items as $line) {
                $this->movementService->record([
                    'inventory_item_id' => $line->inventory_item_id,
                    'tenant_id' => $cashPurchase->tenant_id,
                    'warehouse_id' => $cashPurchase->warehouse_id,
                    'warehouse_location_id' => $cashPurchase->warehouse_location_id,
                    'transaction_date' => $cashPurchase->purchase_date,
                    'type' => 'purchase',
                    'qty_in' => $line->qty,
                    'qty_out' => 0,
                    'unit_cost' => $line->unit_cost,
                    'total_cost' => $line->line_total,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $inventoryDocument->id,
                    'reason' => 'Cash purchase receipt',
                    'created_by' => auth()->id(),
                ]);
            }

            $this->workflowService->maybeQueueAccountingEvent($inventoryDocument);

            $cashPurchase->update([
                'status' => 'posted',
                'approved_at' => now(),
                'posted_at' => now(),
            ]);
        });

        return back()->with('success', 'Cash purchase approved and posted.');
    }

    public function reject(CashPurchase $cashPurchase)
    {
        $cashPurchase->update(['status' => 'rejected']);
        return back()->with('success', 'Cash purchase rejected.');
    }
}
