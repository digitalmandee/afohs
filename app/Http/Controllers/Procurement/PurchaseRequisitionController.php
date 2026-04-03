<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\Department;
use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequisition;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PurchaseRequisitionController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = PurchaseRequisition::query()
            ->with([
                'tenant:id,name',
                'department:id,name',
                'items:id,purchase_requisition_id,inventory_item_id,qty_requested,qty_converted,estimated_unit_cost',
                'items.inventoryItem:id,name,sku',
            ]);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder->where('pr_no', 'like', "%{$search}%")
                    ->orWhere('notes', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $requisitions = $query->latest('id')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/Procurement/PurchaseRequisitions/Index', [
            'requisitions' => $requisitions,
            'summary' => [
                'count' => (int) $query->count(),
                'draft' => (int) (clone $query)->where('status', 'draft')->count(),
                'submitted' => (int) (clone $query)->where('status', 'submitted')->count(),
                'approved' => (int) (clone $query)->where('status', 'approved')->count(),
                'converted' => (int) (clone $query)->where('status', 'converted_to_po')->count(),
            ],
            'filters' => $request->only(['search', 'status', 'per_page']),
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/PurchaseRequisitions/Create', [
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'requesters' => User::query()->orderBy('name')->get(['id', 'name']),
            'inventoryItems' => InventoryItem::query()
                ->procurementEligible()
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'default_unit_cost']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'department_id' => 'nullable|exists:departments,id',
            'subdepartment_id' => 'nullable|exists:subdepartments,id',
            'requested_by' => 'nullable|exists:users,id',
            'request_date' => 'required|date',
            'required_date' => 'nullable|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.qty_requested' => 'required|numeric|min:0.001',
            'items.*.estimated_unit_cost' => 'nullable|numeric|min:0',
            'items.*.remarks' => 'nullable|string',
        ]);

        $requisition = DB::transaction(function () use ($data) {
            $documentNo = 'PR-' . now()->format('YmdHis');
            $requisition = PurchaseRequisition::query()->create([
                'pr_no' => $documentNo,
                'tenant_id' => $data['tenant_id'] ?? null,
                'department_id' => $data['department_id'] ?? null,
                'subdepartment_id' => $data['subdepartment_id'] ?? null,
                'requested_by' => $data['requested_by'] ?? auth()->id(),
                'request_date' => $data['request_date'],
                'required_date' => $data['required_date'] ?? null,
                'status' => 'draft',
                'notes' => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $requisition->items()->create([
                    'inventory_item_id' => $item['inventory_item_id'],
                    'qty_requested' => $item['qty_requested'],
                    'estimated_unit_cost' => $item['estimated_unit_cost'] ?? 0,
                    'remarks' => $item['remarks'] ?? null,
                ]);
            }

            ApprovalAction::query()->create([
                'document_type' => 'purchase_requisition',
                'document_id' => $requisition->id,
                'action' => 'submitted',
                'remarks' => '[created] Purchase requisition created.',
                'action_by' => auth()->id(),
            ]);

            return $requisition;
        });

        return redirect()->route('procurement.purchase-requisitions.index')
            ->with('success', "Purchase requisition {$requisition->pr_no} created.");
    }

    public function submit(PurchaseRequisition $purchaseRequisition)
    {
        if ($purchaseRequisition->status !== 'draft') {
            throw ValidationException::withMessages([
                'status' => 'Only draft requisitions can be submitted.',
            ]);
        }

        $purchaseRequisition->update([
            'status' => 'submitted',
            'submitted_at' => now(),
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'purchase_requisition',
            'document_id' => $purchaseRequisition->id,
            'action' => 'submitted',
            'remarks' => 'Requisition submitted for approval.',
            'action_by' => auth()->id(),
        ]);

        return back()->with('success', 'Purchase requisition submitted.');
    }

    public function approve(PurchaseRequisition $purchaseRequisition)
    {
        if (!in_array($purchaseRequisition->status, ['submitted', 'draft'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Only draft/submitted requisitions can be approved.',
            ]);
        }

        $purchaseRequisition->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        ApprovalAction::query()->create([
            'document_type' => 'purchase_requisition',
            'document_id' => $purchaseRequisition->id,
            'action' => 'approved',
            'remarks' => 'Requisition approved.',
            'action_by' => auth()->id(),
        ]);

        return back()->with('success', 'Purchase requisition approved.');
    }

    public function reject(PurchaseRequisition $purchaseRequisition)
    {
        $purchaseRequisition->update(['status' => 'rejected']);

        ApprovalAction::query()->create([
            'document_type' => 'purchase_requisition',
            'document_id' => $purchaseRequisition->id,
            'action' => 'rejected',
            'remarks' => 'Requisition rejected.',
            'action_by' => auth()->id(),
        ]);

        return back()->with('success', 'Purchase requisition rejected.');
    }

    public function convertToPo(PurchaseRequisition $purchaseRequisition, Request $request)
    {
        if (!in_array($purchaseRequisition->status, ['approved', 'partially_converted'], true)) {
            throw ValidationException::withMessages([
                'status' => 'Only approved requisitions can be converted to PO.',
            ]);
        }

        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date',
            'items' => 'required|array|min:1',
            'items.*.requisition_item_id' => 'required|exists:purchase_requisition_items,id',
            'items.*.qty_ordered' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $po = DB::transaction(function () use ($purchaseRequisition, $data) {
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);

            $po = PurchaseOrder::query()->create([
                'po_no' => 'PO-' . now()->format('YmdHis'),
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => $warehouse->tenant_id ?: $purchaseRequisition->tenant_id,
                'warehouse_id' => $warehouse->id,
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'status' => 'draft',
                'currency' => 'PKR',
                'remarks' => 'Converted from ' . $purchaseRequisition->pr_no,
                'created_by' => auth()->id(),
            ]);

            $total = 0;
            foreach ($data['items'] as $line) {
                $reqItem = $purchaseRequisition->items()->findOrFail($line['requisition_item_id']);
                $remaining = (float) $reqItem->qty_requested - (float) $reqItem->qty_converted;
                if ((float) $line['qty_ordered'] > $remaining + 0.0001) {
                    throw ValidationException::withMessages([
                        'items' => "Ordered qty exceeds remaining qty for requisition item {$reqItem->id}.",
                    ]);
                }

                $lineTotal = (float) $line['qty_ordered'] * (float) $line['unit_cost'];
                $total += $lineTotal;
                $po->items()->create([
                    'inventory_item_id' => $reqItem->inventory_item_id,
                    'qty_ordered' => $line['qty_ordered'],
                    'unit_cost' => $line['unit_cost'],
                    'line_total' => $lineTotal,
                ]);

                $reqItem->increment('qty_converted', (float) $line['qty_ordered']);
            }

            $po->update([
                'sub_total' => $total,
                'grand_total' => $total,
            ]);

            $allConverted = $purchaseRequisition->items()
                ->get()
                ->every(fn ($item) => (float) $item->qty_converted + 0.0001 >= (float) $item->qty_requested);

            $purchaseRequisition->update([
                'status' => $allConverted ? 'converted_to_po' : 'partially_converted',
            ]);

            return $po;
        });

        return back()->with('success', "PO {$po->po_no} created from requisition.");
    }
}
