<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\StockAudit;
use App\Services\Inventory\InventoryDocumentWorkflowService;
use App\Services\Inventory\InventoryMovementService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockAuditController extends Controller
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

        $query = StockAudit::query()->with(['items', 'items.inventoryItem:id,name,sku', 'warehouse:id,name']);
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return Inertia::render('App/Admin/Inventory/Audits/Index', [
            'audits' => $query->latest('id')->paginate($perPage)->withQueryString(),
            'summary' => [
                'count' => (int) $query->count(),
                'draft' => (int) (clone $query)->where('status', 'draft')->count(),
                'posted' => (int) (clone $query)->where('status', 'posted')->count(),
            ],
            'filters' => $request->only(['status', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Inventory/Audits/Create', [
            'warehouses' => \App\Models\Warehouse::query()->orderBy('name')->get(['id', 'name']),
            'locations' => \App\Models\WarehouseLocation::query()->orderBy('name')->get(['id', 'warehouse_id', 'name', 'code']),
            'inventoryItems' => InventoryItem::query()->warehouseOperationalEligible()->orderBy('name')->get(['id', 'name', 'sku', 'default_unit_cost']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'audit_date' => 'required|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.counted_qty' => 'required|numeric|min:0',
        ]);

        $stockAudit = DB::transaction(function () use ($data) {
            $auditNo = $this->workflowService->nextDocumentNumber('stock_audit');

            $stockAudit = StockAudit::query()->create([
                'audit_no' => $auditNo,
                'tenant_id' => $data['tenant_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'],
                'warehouse_location_id' => $data['warehouse_location_id'] ?? null,
                'audit_date' => $data['audit_date'],
                'status' => 'draft',
                'remarks' => $data['remarks'] ?? null,
                'frozen_at' => now(),
                'created_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $line) {
                $systemQty = (float) InventoryTransaction::query()
                    ->where('inventory_item_id', $line['inventory_item_id'])
                    ->where('warehouse_id', $data['warehouse_id'])
                    ->when($data['warehouse_location_id'] ?? null, fn ($query) => $query->where('warehouse_location_id', $data['warehouse_location_id']))
                    ->selectRaw('COALESCE(SUM(qty_in - qty_out), 0) as qty')
                    ->value('qty');

                $itemModel = InventoryItem::query()->find($line['inventory_item_id']);
                $unitCost = (float) ($itemModel?->default_unit_cost ?? 0);
                $variance = (float) $line['counted_qty'] - $systemQty;

                $stockAudit->items()->create([
                    'inventory_item_id' => $line['inventory_item_id'],
                    'system_qty' => $systemQty,
                    'counted_qty' => (float) $line['counted_qty'],
                    'variance_qty' => $variance,
                    'unit_cost' => $unitCost,
                    'variance_value' => $variance * $unitCost,
                ]);
            }

            return $stockAudit;
        });

        return redirect()->route('inventory.audits.index')
            ->with('success', "Stock audit {$stockAudit->audit_no} created.");
    }

    public function submit(StockAudit $stockAudit)
    {
        $stockAudit->update(['status' => 'submitted', 'submitted_at' => now()]);
        return back()->with('success', 'Stock audit submitted.');
    }

    public function approve(StockAudit $stockAudit)
    {
        DB::transaction(function () use ($stockAudit) {
            $stockAudit->load('items');
            foreach ($stockAudit->items as $line) {
                $variance = (float) $line->variance_qty;
                if (abs($variance) < 0.0001) {
                    continue;
                }

                $direction = $variance > 0 ? 'in' : 'out';
                $qty = abs($variance);

                $this->movementService->createAdjustment([
                    'tenant_id' => $stockAudit->tenant_id,
                    'warehouse_id' => $stockAudit->warehouse_id,
                    'warehouse_location_id' => $stockAudit->warehouse_location_id,
                    'inventory_item_id' => $line->inventory_item_id,
                    'transaction_date' => $stockAudit->audit_date,
                    'direction' => $direction,
                    'quantity' => $qty,
                    'unit_cost' => $line->unit_cost,
                    'remarks' => "Stock audit {$stockAudit->audit_no} variance adjustment",
                    'created_by' => auth()->id(),
                ]);
            }

            $stockAudit->update([
                'status' => 'posted',
                'approved_at' => now(),
                'approved_by' => auth()->id(),
                'posted_at' => now(),
            ]);
        });

        return back()->with('success', 'Stock audit approved and variances posted.');
    }
}
