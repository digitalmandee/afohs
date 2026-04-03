<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\InventoryDocument;
use App\Models\InventoryItem;
use App\Models\Tenant;
use App\Models\Warehouse;
use App\Services\Inventory\InventoryDocumentWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DeliveryNoteController extends Controller
{
    public function __construct(
        private readonly InventoryDocumentWorkflowService $workflowService,
    ) {
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = InventoryDocument::query()
            ->where('type', 'delivery_note')
            ->with(['tenant:id,name', 'sourceWarehouse:id,name,code', 'destinationWarehouse:id,name,code']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($builder) use ($search) {
                $builder->where('document_no', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%");
            });
        }

        return Inertia::render('App/Admin/Procurement/DeliveryNotes/Index', [
            'deliveryNotes' => $query->latest('id')->paginate($perPage)->withQueryString(),
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/DeliveryNotes/Create', [
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name', 'code']),
            'inventoryItems' => InventoryItem::query()->procurementEligible()->orderBy('name')->get(['id', 'name', 'sku']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'tenant_id' => 'nullable|exists:tenants,id',
            'source_warehouse_id' => 'nullable|exists:warehouses,id',
            'destination_warehouse_id' => 'nullable|exists:warehouses,id',
            'transaction_date' => 'required|date',
            'remarks' => 'nullable|string',
            'source_document_type' => 'nullable|string|max:120',
            'source_document_id' => 'nullable|numeric',
            'items' => 'nullable|array',
            'items.*.inventory_item_id' => 'required_with:items|exists:inventory_items,id',
            'items.*.quantity' => 'required_with:items|numeric|min:0.001',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
        ]);

        DB::transaction(function () use ($data) {
            $documentNo = $this->workflowService->nextDocumentNumber('delivery_note');
            $shouldAutoPost = $this->workflowService->shouldAutoPostOnCreate('delivery_note');
            $approvalRequired = $this->workflowService->requiresApproval('delivery_note');

            $deliveryNote = InventoryDocument::query()->create([
                'document_no' => $documentNo,
                'tenant_id' => $data['tenant_id'] ?? null,
                'type' => 'delivery_note',
                'source_warehouse_id' => $data['source_warehouse_id'] ?? null,
                'destination_warehouse_id' => $data['destination_warehouse_id'] ?? null,
                'transaction_date' => $data['transaction_date'],
                'status' => $shouldAutoPost ? 'posted' : 'draft',
                'approval_status' => $shouldAutoPost ? 'approved' : ($approvalRequired ? 'draft' : 'approved'),
                'remarks' => $data['remarks'] ?? null,
                'source_document_type' => $data['source_document_type'] ?? null,
                'source_document_id' => $data['source_document_id'] ?? null,
                'posting_key' => $shouldAutoPost ? uniqid('dn-', true) : null,
                'approved_at' => $shouldAutoPost ? now() : null,
                'approved_by' => $shouldAutoPost ? auth()->id() : null,
                'posted_at' => $shouldAutoPost ? now() : null,
                'created_by' => auth()->id(),
                'updated_by' => auth()->id(),
            ]);

            foreach (($data['items'] ?? []) as $line) {
                $quantity = (float) $line['quantity'];
                $unitCost = (float) ($line['unit_cost'] ?? 0);
                $deliveryNote->lines()->create([
                    'inventory_item_id' => $line['inventory_item_id'],
                    'quantity' => $quantity,
                    'unit_cost' => $unitCost,
                    'line_total' => $quantity * $unitCost,
                ]);
            }

            ApprovalAction::query()->create([
                'document_type' => 'inventory_document',
                'document_id' => $deliveryNote->id,
                'action' => $shouldAutoPost ? 'auto_posted' : 'created',
                'remarks' => $shouldAutoPost ? 'Delivery note created and auto-posted by configuration.' : 'Delivery note created.',
                'action_by' => auth()->id(),
            ]);
        });

        return redirect()->route('procurement.delivery-notes.index')->with('success', 'Delivery note created.');
    }

    public function print(InventoryDocument $inventoryDocument)
    {
        abort_unless($inventoryDocument->type === 'delivery_note', 404);
        $inventoryDocument->load([
            'tenant:id,name',
            'sourceWarehouse:id,name,code',
            'destinationWarehouse:id,name,code',
            'lines.inventoryItem:id,name,sku',
        ]);

        return Inertia::render('App/Admin/Procurement/DeliveryNotes/Print', [
            'deliveryNote' => $inventoryDocument,
            'generatedAt' => now()->toDateTimeString(),
            'generatedBy' => auth()->user()?->name,
        ]);
    }
}
