<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\Department;
use App\Models\InventoryDocument;
use App\Models\InventoryItem;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Models\WarehouseLocation;
use App\Services\Inventory\InventoryDocumentWorkflowService;
use App\Services\Inventory\InventoryMovementService;
use InvalidArgumentException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;
use Inertia\Inertia;

class InventoryDocumentFlowController extends Controller
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

        $types = [
            'store_issue_note',
            'warehouse_issue_note',
            'material_issue_note',
            'material_receipt_note',
            'warehouse_transfer',
            'stock_adjustment',
            'department_transfer_note',
            'department_adjustment',
        ];

        $query = InventoryDocument::query()
            ->whereIn('type', $types)
            ->with([
                'tenant:id,name',
                'sourceWarehouse:id,name,code',
                'destinationWarehouse:id,name,code',
                'lines.inventoryItem:id,name,sku',
            ]);

        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $documents = $query->latest('id')->paginate($perPage)->withQueryString();
        $documents->getCollection()->transform(function (InventoryDocument $document) {
            $document->workflow_state = $this->workflowService->resolveWorkflowState($document);
            $document->approval_required = $this->workflowService->requiresApproval($document->type);
            $document->auto_post = $this->workflowService->canAutoPost($document->type);
            return $document;
        });

        return Inertia::render('App/Admin/Inventory/DocumentFlows/Index', [
            'documents' => $documents,
            'summary' => [
                'count' => (int) $query->count(),
                'draft' => (int) (clone $query)->where('status', 'draft')->count(),
                'posted' => (int) (clone $query)->where('status', 'posted')->count(),
            ],
            'filters' => $request->only(['type', 'status', 'per_page']),
            'typeOptions' => $types,
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Inventory/DocumentFlows/Create', [
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name']),
            'locations' => WarehouseLocation::query()->orderBy('name')->get(['id', 'warehouse_id', 'name', 'code']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'inventoryItems' => InventoryItem::query()->warehouseOperationalEligible()->orderBy('name')->get(['id', 'name', 'sku', 'default_unit_cost']),
            'typeOptions' => [
                ['value' => 'store_issue_note', 'label' => 'Store Issue Note'],
                ['value' => 'warehouse_issue_note', 'label' => 'Warehouse Issue Note'],
                ['value' => 'material_issue_note', 'label' => 'Material Issue Note'],
                ['value' => 'material_receipt_note', 'label' => 'Material Receipt Note'],
                ['value' => 'warehouse_transfer', 'label' => 'Warehouse Transfer Note'],
                ['value' => 'stock_adjustment', 'label' => 'Stock Adjustment'],
                ['value' => 'department_transfer_note', 'label' => 'Department Transfer Note'],
                ['value' => 'department_adjustment', 'label' => 'Department Inventory Adjustment'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:store_issue_note,warehouse_issue_note,material_issue_note,material_receipt_note,warehouse_transfer,stock_adjustment,department_transfer_note,department_adjustment',
            'tenant_id' => 'nullable|exists:tenants,id',
            'department_id' => 'nullable|exists:departments,id',
            'subdepartment_id' => 'nullable|exists:subdepartments,id',
            'source_warehouse_id' => 'nullable|exists:warehouses,id',
            'source_warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'destination_warehouse_id' => 'nullable|exists:warehouses,id',
            'destination_warehouse_location_id' => 'nullable|exists:warehouse_locations,id',
            'transaction_date' => 'required|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'items.*.quantity' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
        ]);

        if (in_array($data['type'], ['department_transfer_note', 'department_adjustment', 'store_issue_note', 'material_issue_note'], true) && empty($data['department_id'])) {
            throw ValidationException::withMessages([
                'department_id' => 'Department is required for department/consumption issue documents.',
            ]);
        }

        $documentNo = $this->workflowService->nextDocumentNumber($data['type']);

        $document = DB::transaction(function () use ($data, $documentNo) {
            $document = InventoryDocument::query()->create([
                'document_no' => $documentNo,
                'tenant_id' => $data['tenant_id'] ?? null,
                'department_id' => $data['department_id'] ?? null,
                'subdepartment_id' => $data['subdepartment_id'] ?? null,
                'type' => $data['type'],
                'source_warehouse_id' => $data['source_warehouse_id'] ?? null,
                'source_warehouse_location_id' => $data['source_warehouse_location_id'] ?? null,
                'destination_warehouse_id' => $data['destination_warehouse_id'] ?? null,
                'destination_warehouse_location_id' => $data['destination_warehouse_location_id'] ?? null,
                'transaction_date' => $data['transaction_date'],
                'status' => 'draft',
                'approval_status' => 'draft',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            foreach ($data['items'] as $item) {
                $lineTotal = (float) $item['quantity'] * (float) ($item['unit_cost'] ?? 0);
                $document->lines()->create([
                    'inventory_item_id' => $item['inventory_item_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'line_total' => $lineTotal,
                ]);
            }

            if ($this->workflowService->shouldAutoPostOnCreate($document->type)) {
                $document->update([
                    'approval_status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);

                ApprovalAction::query()->create([
                    'document_type' => 'inventory_document',
                    'document_id' => $document->id,
                    'action' => 'auto_posted',
                    'remarks' => 'Auto-posted by document configuration.',
                    'action_by' => auth()->id(),
                ]);

                $this->postDocument($document);
            }

            return $document;
        });

        return redirect()->route('inventory.document-flows.index')
            ->with('success', "Document {$document->document_no} created.");
    }

    public function submit(InventoryDocument $inventoryDocument)
    {
        $this->workflowService->submitDocument($inventoryDocument, auth()->id());
        return back()->with('success', 'Document submitted.');
    }

    public function approve(InventoryDocument $inventoryDocument)
    {
        try {
            DB::transaction(function () use ($inventoryDocument) {
                $document = InventoryDocument::query()
                    ->lockForUpdate()
                    ->findOrFail($inventoryDocument->id);

                if ($document->status === 'posted') {
                    return;
                }

                $document = $this->workflowService->approveDocument($document, auth()->id());
                $this->postDocument($document);
            });
        } catch (InvalidArgumentException $exception) {
            throw ValidationException::withMessages([
                'document' => $exception->getMessage(),
            ]);
        } catch (Throwable $exception) {
            report($exception);
            return back()->with('error', 'Approve/Post failed. Please verify stock, warehouse/location, and document setup, then try again.');
        }

        return back()->with('success', 'Document approved and posted.');
    }

    public function reject(InventoryDocument $inventoryDocument, Request $request)
    {
        $this->workflowService->rejectDocument($inventoryDocument, auth()->id(), $request->input('remarks'));
        return back()->with('success', 'Document rejected.');
    }

    private function postDocument(InventoryDocument $document): InventoryDocument
    {
        $document->loadMissing('lines');

        foreach ($document->lines as $line) {
            $quantity = (float) $line->quantity;
            $unitCost = (float) $line->unit_cost;

            if (in_array($document->type, ['store_issue_note', 'warehouse_issue_note', 'material_issue_note', 'department_transfer_note'], true)) {
                if (!$document->source_warehouse_id) {
                    throw ValidationException::withMessages(['source_warehouse_id' => 'Source warehouse is required for issue/department transfer notes.']);
                }
                $this->assertWarehouseContext(
                    (int) $document->source_warehouse_id,
                    $document->source_warehouse_location_id ? (int) $document->source_warehouse_location_id : null,
                    $document->tenant_id ? (int) $document->tenant_id : null
                );

                $available = $this->movementService->availableQuantity(
                    (int) $line->inventory_item_id,
                    (int) $document->source_warehouse_id,
                    $document->source_warehouse_location_id ? (int) $document->source_warehouse_location_id : null
                );
                if ($available + 0.0001 < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for item {$line->inventory_item_id} in source warehouse/location.",
                    ]);
                }

                $this->movementService->record([
                    'inventory_item_id' => $line->inventory_item_id,
                    'tenant_id' => $document->tenant_id,
                    'warehouse_id' => $document->source_warehouse_id,
                    'warehouse_location_id' => $document->source_warehouse_location_id,
                    'transaction_date' => $document->transaction_date,
                    'type' => 'adjustment_out',
                    'qty_in' => 0,
                    'qty_out' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $document->id,
                    'reason' => $document->type,
                    'created_by' => auth()->id(),
                    'enforce_expiry' => true,
                ]);
            }

            if (in_array($document->type, ['material_receipt_note'], true)) {
                if (!$document->destination_warehouse_id) {
                    throw ValidationException::withMessages(['destination_warehouse_id' => 'Destination warehouse is required for material receipt note.']);
                }
                $this->assertWarehouseContext(
                    (int) $document->destination_warehouse_id,
                    $document->destination_warehouse_location_id ? (int) $document->destination_warehouse_location_id : null,
                    $document->tenant_id ? (int) $document->tenant_id : null
                );

                $this->movementService->record([
                    'inventory_item_id' => $line->inventory_item_id,
                    'tenant_id' => $document->tenant_id,
                    'warehouse_id' => $document->destination_warehouse_id,
                    'warehouse_location_id' => $document->destination_warehouse_location_id,
                    'transaction_date' => $document->transaction_date,
                    'type' => 'adjustment_in',
                    'qty_in' => $quantity,
                    'qty_out' => 0,
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $document->id,
                    'reason' => $document->type,
                    'created_by' => auth()->id(),
                ]);
            }

            if ($document->type === 'warehouse_transfer') {
                if (!$document->source_warehouse_id || !$document->destination_warehouse_id) {
                    throw ValidationException::withMessages(['warehouse' => 'Source and destination warehouses are required for warehouse transfers.']);
                }
                $this->assertWarehouseContext(
                    (int) $document->source_warehouse_id,
                    $document->source_warehouse_location_id ? (int) $document->source_warehouse_location_id : null,
                    $document->tenant_id ? (int) $document->tenant_id : null
                );
                $this->assertWarehouseContext(
                    (int) $document->destination_warehouse_id,
                    $document->destination_warehouse_location_id ? (int) $document->destination_warehouse_location_id : null,
                    $document->tenant_id ? (int) $document->tenant_id : null
                );

                $available = $this->movementService->availableQuantity(
                    (int) $line->inventory_item_id,
                    (int) $document->source_warehouse_id,
                    $document->source_warehouse_location_id ? (int) $document->source_warehouse_location_id : null
                );
                if ($available + 0.0001 < $quantity) {
                    throw ValidationException::withMessages([
                        'items' => "Insufficient stock for item {$line->inventory_item_id} in source warehouse/location.",
                    ]);
                }

                $this->movementService->record([
                    'inventory_item_id' => $line->inventory_item_id,
                    'tenant_id' => $document->tenant_id,
                    'warehouse_id' => $document->source_warehouse_id,
                    'warehouse_location_id' => $document->source_warehouse_location_id,
                    'transaction_date' => $document->transaction_date,
                    'type' => 'transfer_out',
                    'qty_in' => 0,
                    'qty_out' => $quantity,
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $document->id,
                    'reason' => $document->type,
                    'created_by' => auth()->id(),
                    'enforce_expiry' => true,
                ]);

                $this->movementService->record([
                    'inventory_item_id' => $line->inventory_item_id,
                    'tenant_id' => $document->tenant_id,
                    'warehouse_id' => $document->destination_warehouse_id,
                    'warehouse_location_id' => $document->destination_warehouse_location_id,
                    'transaction_date' => $document->transaction_date,
                    'type' => 'transfer_in',
                    'qty_in' => $quantity,
                    'qty_out' => 0,
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $document->id,
                    'reason' => $document->type,
                    'created_by' => auth()->id(),
                ]);
            }

            if ($document->type === 'stock_adjustment') {
                if ($document->source_warehouse_id && $document->destination_warehouse_id) {
                    throw ValidationException::withMessages(['warehouse' => 'Choose either source or destination warehouse for stock adjustment, not both.']);
                }

                if (!$document->source_warehouse_id && !$document->destination_warehouse_id) {
                    throw ValidationException::withMessages(['warehouse' => 'Warehouse is required for stock adjustment.']);
                }
                if ($document->source_warehouse_id) {
                    $this->assertWarehouseContext(
                        (int) $document->source_warehouse_id,
                        $document->source_warehouse_location_id ? (int) $document->source_warehouse_location_id : null,
                        $document->tenant_id ? (int) $document->tenant_id : null
                    );
                }
                if ($document->destination_warehouse_id) {
                    $this->assertWarehouseContext(
                        (int) $document->destination_warehouse_id,
                        $document->destination_warehouse_location_id ? (int) $document->destination_warehouse_location_id : null,
                        $document->tenant_id ? (int) $document->tenant_id : null
                    );
                }

                $isOut = (bool) $document->source_warehouse_id;
                if ($isOut) {
                    $available = $this->movementService->availableQuantity(
                        (int) $line->inventory_item_id,
                        (int) $document->source_warehouse_id,
                        $document->source_warehouse_location_id ? (int) $document->source_warehouse_location_id : null
                    );
                    if ($available + 0.0001 < $quantity) {
                        throw ValidationException::withMessages([
                            'items' => "Insufficient stock for item {$line->inventory_item_id} in source warehouse/location.",
                        ]);
                    }
                }
                $this->movementService->record([
                    'inventory_item_id' => $line->inventory_item_id,
                    'tenant_id' => $document->tenant_id,
                    'warehouse_id' => $isOut ? $document->source_warehouse_id : $document->destination_warehouse_id,
                    'warehouse_location_id' => $isOut ? $document->source_warehouse_location_id : $document->destination_warehouse_location_id,
                    'transaction_date' => $document->transaction_date,
                    'type' => $isOut ? 'adjustment_out' : 'adjustment_in',
                    'qty_in' => $isOut ? 0 : $quantity,
                    'qty_out' => $isOut ? $quantity : 0,
                    'unit_cost' => $unitCost,
                    'total_cost' => $quantity * $unitCost,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $document->id,
                    'reason' => $document->type,
                    'created_by' => auth()->id(),
                    'enforce_expiry' => $isOut,
                ]);
            }

            if (in_array($document->type, ['department_transfer_note', 'department_adjustment'], true) && $document->department_id) {
                $qtyIn = $quantity;
                $qtyOut = 0;
                if ($document->type === 'department_adjustment' && stripos((string) $document->remarks, 'decrease') !== false) {
                    $qtyIn = 0;
                    $qtyOut = $quantity;
                }

                $this->workflowService->applyDepartmentMovement([
                    'tenant_id' => $document->tenant_id,
                    'department_id' => $document->department_id,
                    'subdepartment_id' => $document->subdepartment_id,
                    'inventory_item_id' => $line->inventory_item_id,
                    'transaction_date' => $document->transaction_date,
                    'type' => $document->type,
                    'qty_in' => $qtyIn,
                    'qty_out' => $qtyOut,
                    'unit_cost' => $unitCost,
                    'reference_type' => InventoryDocument::class,
                    'reference_id' => $document->id,
                    'remarks' => $document->remarks,
                    'created_by' => auth()->id(),
                ]);
            }
        }

        $postingKey = $document->posting_key ?: "inventory-document:{$document->id}:posted";
        $document->update([
            'posting_key' => $postingKey,
            'status' => 'posted',
            'posted_at' => now(),
        ]);

        $document = $document->fresh();
        $this->workflowService->maybeQueueAccountingEvent($document);

        return $document;
    }

    private function assertWarehouseContext(int $warehouseId, ?int $locationId = null, ?int $tenantId = null): void
    {
        $warehouse = Warehouse::query()->findOrFail($warehouseId);
        if ($tenantId && (int) $warehouse->tenant_id !== (int) $tenantId) {
            throw ValidationException::withMessages([
                'tenant_id' => 'Selected warehouse does not belong to the selected restaurant.',
            ]);
        }

        if ($locationId) {
            $location = WarehouseLocation::query()->findOrFail($locationId);
            if ((int) $location->warehouse_id !== (int) $warehouse->id) {
                throw ValidationException::withMessages([
                    'warehouse_location_id' => 'Selected location does not belong to the selected warehouse.',
                ]);
            }
        }
    }
}
