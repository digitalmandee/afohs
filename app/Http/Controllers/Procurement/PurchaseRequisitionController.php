<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\Branch;
use App\Models\Department;
use App\Models\InventoryItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequisition;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Vendor;
use App\Models\Warehouse;
use App\Services\Procurement\ProcurementDocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
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
                'branch:id,name',
                'warehouse:id,name',
                'latestPurchaseOrder:purchase_orders.id,purchase_orders.purchase_requisition_id,purchase_orders.po_no,purchase_orders.status',
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
        $requisitions->getCollection()->transform(function (PurchaseRequisition $requisition) {
            $requestFor = (string) ($requisition->request_for ?: ($requisition->tenant_id ? 'restaurant' : 'other'));
            $locationLabel = match ($requestFor) {
                'restaurant' => $requisition->tenant?->name ?: 'Restaurant',
                'office' => $requisition->branch?->name ?: 'Head Office',
                'warehouse' => $requisition->warehouse?->name ?: 'Warehouse',
                default => $requisition->other_location_label ?: 'Other',
            };
            if (!$requisition->request_for && !$requisition->tenant_id) {
                $locationLabel = trim("{$locationLabel} (legacy)");
            }

            $requisition->request_for_label = ucfirst($requestFor);
            $requisition->location_label = $locationLabel;
            $requisition->has_remaining_qty = $requisition->items->contains(function ($item) {
                return ((float) $item->qty_requested - (float) $item->qty_converted) > 0.0001;
            });
            return $requisition;
        });

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
        $departments = Department::query()
            ->where(function ($query) {
                $query->where('status', 'active')
                    ->orWhere('status', true)
                    ->orWhere('status', 1);
            })
            ->orderBy('name')
            ->get(['id', 'name']);

        $departmentOptionsByRequestFor = $this->buildDepartmentOptionsByRequestFor($departments);
        $headOfficeBranchId = config('procurement.head_office_branch_id');
        $headOfficeBranch = $headOfficeBranchId ? Branch::query()->find($headOfficeBranchId) : null;

        return Inertia::render('App/Admin/Procurement/PurchaseRequisitions/Create', [
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'departments' => $departments,
            'departmentsByRequestFor' => $departmentOptionsByRequestFor,
            'requestForOptions' => $this->requestForOptions(),
            'warehouses' => Warehouse::query()->where('status', 'active')->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->where('status', true)->orderBy('name')->get(['id', 'name']),
            'headOfficeBranchId' => $headOfficeBranch?->id,
            'headOfficeBranchName' => $headOfficeBranch?->name,
            'requesters' => User::query()->orderBy('name')->get(['id', 'name']),
            'inventoryItems' => InventoryItem::query()
                ->requisitionEligible()
                ->orderBy('name')
                ->get(['id', 'name', 'sku', 'default_unit_cost']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'request_for' => 'required|in:restaurant,office,warehouse,other',
            'tenant_id' => 'nullable|exists:tenants,id',
            'branch_id' => 'nullable|exists:branches,id',
            'warehouse_id' => 'nullable|exists:warehouses,id',
            'other_location_label' => 'nullable|string|max:120',
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

        $data = $this->normalizeRequestContext($data);

        if (!empty($data['department_id']) && !$this->isDepartmentAllowedForRequestFor(
            (int) $data['department_id'],
            (string) $data['request_for']
        )) {
            throw ValidationException::withMessages([
                'department_id' => 'Selected department is not allowed for this request type.',
            ]);
        }

        $requisition = DB::transaction(function () use ($data) {
            $documentNo = 'PR-' . now()->format('YmdHis');
            $requisition = PurchaseRequisition::query()->create([
                'pr_no' => $documentNo,
                'request_for' => $data['request_for'],
                'tenant_id' => $data['tenant_id'] ?? null,
                'branch_id' => $data['branch_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'other_location_label' => $data['other_location_label'] ?? null,
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

    public function show(PurchaseRequisition $purchaseRequisition)
    {
        $purchaseRequisition->load([
            'tenant:id,name',
            'branch:id,name',
            'warehouse:id,name',
            'department:id,name',
            'subdepartment:id,name',
            'requester:id,name',
            'approver:id,name',
            'items:id,purchase_requisition_id,inventory_item_id,qty_requested,qty_converted,estimated_unit_cost,remarks',
            'items.inventoryItem:id,name,sku',
        ]);

        $approvalHistory = ApprovalAction::query()
            ->where('document_type', 'purchase_requisition')
            ->where('document_id', $purchaseRequisition->id)
            ->latest('id')
            ->get(['id', 'document_id', 'action', 'remarks', 'action_by', 'created_at']);
        $historyUsers = User::query()
            ->whereIn('id', $approvalHistory->pluck('action_by')->filter()->unique()->values())
            ->pluck('name', 'id');
        $approvalHistory = $approvalHistory->map(function (ApprovalAction $action) use ($historyUsers) {
            $action->action_by_name = $historyUsers[$action->action_by] ?? null;
            return $action;
        })->values();

        $requestFor = (string) ($purchaseRequisition->request_for ?: ($purchaseRequisition->tenant_id ? 'restaurant' : 'other'));
        $locationLabel = match ($requestFor) {
            'restaurant' => $purchaseRequisition->tenant?->name ?: 'Restaurant',
            'office' => $purchaseRequisition->branch?->name ?: 'Head Office',
            'warehouse' => $purchaseRequisition->warehouse?->name ?: 'Warehouse',
            default => $purchaseRequisition->other_location_label ?: 'Other',
        };
        if (!$purchaseRequisition->request_for && !$purchaseRequisition->tenant_id) {
            $locationLabel = trim("{$locationLabel} (legacy)");
        }

        return Inertia::render('App/Admin/Procurement/PurchaseRequisitions/Show', [
            'requisition' => $purchaseRequisition,
            'meta' => [
                'request_for_label' => ucfirst($requestFor),
                'location_label' => $locationLabel,
                'total_qty' => (float) $purchaseRequisition->items->sum('qty_requested'),
                'total_estimated' => (float) $purchaseRequisition->items->sum(fn ($item) => (float) $item->qty_requested * (float) $item->estimated_unit_cost),
            ],
            'history' => $approvalHistory,
        ]);
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

            $tenantId = $warehouse->tenant_id ?: $purchaseRequisition->tenant_id;
            $branchId = $tenantId ? (int) (Tenant::query()->whereKey($tenantId)->value('branch_id') ?? 0) : 0;
            if ($branchId <= 0) {
                throw ValidationException::withMessages([
                    'warehouse_id' => 'Branch mapping missing for numbering. Assign branch to selected context before converting to PO.',
                ]);
            }

            $poNo = app(ProcurementDocumentNumberService::class)->generate(
                documentType: 'PO',
                branchId: $branchId,
                documentDate: $data['order_date']
            );

            $po = PurchaseOrder::query()->create([
                'po_no' => $poNo,
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => $tenantId,
                'warehouse_id' => $warehouse->id,
                'purchase_requisition_id' => $purchaseRequisition->id,
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

    private function requestForOptions(): array
    {
        return [
            ['value' => 'restaurant', 'label' => 'Restaurant'],
            ['value' => 'office', 'label' => 'Office'],
            ['value' => 'warehouse', 'label' => 'Warehouse'],
            ['value' => 'other', 'label' => 'Other'],
        ];
    }

    private function normalizeRequestContext(array $data): array
    {
        $requestFor = (string) ($data['request_for'] ?? 'restaurant');

        $normalized = $data;
        $normalized['other_location_label'] = isset($normalized['other_location_label'])
            ? trim((string) $normalized['other_location_label'])
            : null;

        if ($requestFor === 'restaurant') {
            if (empty($normalized['tenant_id'])) {
                throw ValidationException::withMessages([
                    'tenant_id' => 'Restaurant is required when request type is Restaurant.',
                ]);
            }
            $normalized['branch_id'] = null;
            $normalized['warehouse_id'] = null;
            $normalized['other_location_label'] = null;
            return $normalized;
        }

        if ($requestFor === 'office') {
            $headOfficeBranchId = config('procurement.head_office_branch_id');
            if (!$headOfficeBranchId || !Branch::query()->whereKey($headOfficeBranchId)->exists()) {
                throw ValidationException::withMessages([
                    'request_for' => 'Head Office branch is not configured. Set procurement.head_office_branch_id.',
                ]);
            }

            $normalized['tenant_id'] = null;
            $normalized['branch_id'] = (int) $headOfficeBranchId;
            $normalized['warehouse_id'] = null;
            $normalized['other_location_label'] = null;
            return $normalized;
        }

        if ($requestFor === 'warehouse') {
            if (empty($normalized['warehouse_id'])) {
                throw ValidationException::withMessages([
                    'warehouse_id' => 'Warehouse is required when request type is Warehouse.',
                ]);
            }
            $normalized['tenant_id'] = null;
            $normalized['branch_id'] = null;
            $normalized['other_location_label'] = null;
            return $normalized;
        }

        if (empty($normalized['other_location_label'])) {
            throw ValidationException::withMessages([
                'other_location_label' => 'Location / Business Unit is required when request type is Other.',
            ]);
        }

        $normalized['tenant_id'] = null;
        $normalized['branch_id'] = null;
        $normalized['warehouse_id'] = null;

        return $normalized;
    }

    private function buildDepartmentOptionsByRequestFor(Collection $departments): array
    {
        $departmentMap = [];

        foreach (array_keys($this->departmentRules()) as $requestFor) {
            $allowedIds = $this->allowedDepartmentIdsForRequestFor($departments, $requestFor);
            $departmentMap[$requestFor] = $departments
                ->whereIn('id', $allowedIds)
                ->values()
                ->map(fn (Department $department) => ['id' => $department->id, 'name' => $department->name])
                ->all();
        }

        return $departmentMap;
    }

    private function isDepartmentAllowedForRequestFor(int $departmentId, string $requestFor): bool
    {
        $departments = Department::query()
            ->where(function ($query) {
                $query->where('status', 'active')
                    ->orWhere('status', true)
                    ->orWhere('status', 1);
            })
            ->get(['id', 'name']);

        $allowedIds = $this->allowedDepartmentIdsForRequestFor($departments, $requestFor);
        return in_array($departmentId, $allowedIds, true);
    }

    private function allowedDepartmentIdsForRequestFor(Collection $departments, string $requestFor): array
    {
        $rules = $this->departmentRules();
        $keywords = $rules[$requestFor] ?? [];

        if (empty($keywords)) {
            return $departments->pluck('id')->map(fn ($id) => (int) $id)->all();
        }

        return $departments
            ->filter(function (Department $department) use ($keywords) {
                $name = Str::lower((string) $department->name);
                foreach ($keywords as $keyword) {
                    if (Str::contains($name, Str::lower((string) $keyword))) {
                        return true;
                    }
                }
                return false;
            })
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();
    }

    private function departmentRules(): array
    {
        $configuredRules = config('procurement.request_for_department_rules', []);

        return array_merge([
            'restaurant' => [],
            'office' => [],
            'warehouse' => [],
            'other' => [],
        ], is_array($configuredRules) ? $configuredRules : []);
    }
}
