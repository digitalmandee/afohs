<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = PurchaseOrder::with('vendor', 'warehouse', 'tenant');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('po_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'approved', 'partially_received', 'received', 'cancelled'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->tenant_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('order_date', [$request->from, $request->to]);
        }

        $summaryQuery = clone $query;
        $statusBreakdown = (clone $query)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $summary = [
            'count' => (int) $summaryQuery->count(),
            'total_value' => (float) ((clone $query)->sum('grand_total') ?? 0),
            'draft' => (int) ($statusBreakdown['draft'] ?? 0),
            'approved' => (int) ($statusBreakdown['approved'] ?? 0),
            'received' => (int) (($statusBreakdown['partially_received'] ?? 0) + ($statusBreakdown['received'] ?? 0)),
            'cancelled' => (int) ($statusBreakdown['cancelled'] ?? 0),
        ];

        $orders = $query->orderByDesc('order_date')->paginate($perPage)->withQueryString();
        $latestActions = ApprovalAction::query()
            ->where('document_type', 'purchase_order')
            ->whereIn('document_id', $orders->getCollection()->pluck('id'))
            ->orderByDesc('id')
            ->get()
            ->unique('document_id')
            ->keyBy('document_id');
        $orders->getCollection()->transform(function ($order) use ($latestActions) {
            $action = $latestActions->get($order->id);
            $order->accounting_status = 'non_posting';
            $order->latest_approval_action = $action ? [
                'action' => $action->action,
                'remarks' => $action->remarks,
                'created_at' => $action->created_at,
            ] : null;
            return $order;
        });

        return Inertia::render('App/Admin/Procurement/PurchaseOrders/Index', [
            'orders' => $orders,
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'vendor_id', 'warehouse_id', 'tenant_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/PurchaseOrders/Create', [
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::with('tenant:id,name')
                ->orderBy('name')
                ->get(['id', 'name', 'tenant_id', 'status']),
            'products' => Product::query()
                ->procurementEligible()
                ->orderBy('name')
                ->get(['id', 'name', 'menu_code', 'base_price', 'unit_id']),
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:vendors,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date',
            'currency' => 'nullable|string|max:8',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => [
                'required',
                Rule::exists('products', 'id'),
            ],
            'items.*.qty_ordered' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            Log::channel('procurement')->warning('procurement.purchase_order.store.validation_failed', [
                'event' => 'procurement.purchase_order.store.validation_failed',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'vendor_id' => $request->input('vendor_id'),
                'warehouse_id' => $request->input('warehouse_id'),
                'item_count' => count($request->input('items', [])),
                'errors' => $validator->errors()->toArray(),
            ]);

            throw new ValidationException($validator);
        }

        $data = $validator->validated();
        $submittedItemIds = collect($data['items'] ?? [])
            ->pluck('product_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $eligibleIds = Product::query()
            ->procurementEligible()
            ->whereIn('id', $submittedItemIds)
            ->pluck('id')
            ->map(fn ($id) => (int) $id);

        $invalidIds = $submittedItemIds->diff($eligibleIds)->values();
        if ($invalidIds->isNotEmpty()) {
            $ineligibleErrors = [];
            foreach (($data['items'] ?? []) as $index => $item) {
                if (in_array((int) ($item['product_id'] ?? 0), $invalidIds->all(), true)) {
                    $ineligibleErrors["items.{$index}.product_id"] = 'Only active purchasable raw-material items can be ordered in PO.';
                }
            }

            Log::channel('procurement')->warning('procurement.purchase_order.store.ineligible_items', [
                'event' => 'procurement.purchase_order.store.ineligible_items',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'vendor_id' => $data['vendor_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'invalid_product_ids' => $invalidIds->all(),
            ]);

            throw ValidationException::withMessages($ineligibleErrors);
        }

        try {
            $warehouse = Warehouse::query()->findOrFail($data['warehouse_id']);

            if ((string) ($warehouse->status ?? 'inactive') !== 'active') {
                throw ValidationException::withMessages([
                    'warehouse_id' => 'The selected warehouse is inactive. Activate it before creating a purchase order.',
                ]);
            }

            $order = PurchaseOrder::create([
                'po_no' => 'PO-' . now()->format('YmdHis'),
                'vendor_id' => $data['vendor_id'],
                'tenant_id' => $warehouse->tenant_id ?: null,
                'warehouse_id' => $data['warehouse_id'],
                'order_date' => $data['order_date'],
                'expected_date' => $data['expected_date'] ?? null,
                'status' => 'draft',
                'currency' => $data['currency'] ?? 'PKR',
                'remarks' => $data['remarks'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $subTotal = 0;
            foreach ($data['items'] as $item) {
                $lineTotal = $item['qty_ordered'] * $item['unit_cost'];
                $subTotal += $lineTotal;
                $order->items()->create([
                    'product_id' => $item['product_id'],
                    'qty_ordered' => $item['qty_ordered'],
                    'unit_cost' => $item['unit_cost'],
                    'line_total' => $lineTotal,
                ]);
            }

            $order->update([
                'sub_total' => $subTotal,
                'grand_total' => $subTotal,
            ]);

            ApprovalAction::create([
                'document_type' => 'purchase_order',
                'document_id' => $order->id,
                'action' => 'submitted',
                'remarks' => 'PO created and submitted.',
                'action_by' => $request->user()?->id,
            ]);

            return redirect()->route('procurement.purchase-orders.index')->with('success', 'Purchase order created.');
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::channel('procurement')->error('procurement.purchase_order.store.failed', [
                'event' => 'procurement.purchase_order.store.failed',
                'request_id' => $request->attributes->get('request_id'),
                'user_id' => $request->user()?->id,
                'vendor_id' => $data['vendor_id'] ?? null,
                'warehouse_id' => $data['warehouse_id'] ?? null,
                'item_count' => is_array($data['items'] ?? null) ? count($data['items']) : 0,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->withInput()->withErrors([
                'error' => 'Failed to create purchase order. Please review inputs and try again.',
            ]);
        }
    }

    public function submit(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft purchase orders can be submitted.');
        }

        ApprovalAction::create([
            'document_type' => 'purchase_order',
            'document_id' => $purchaseOrder->id,
            'action' => 'submitted',
            'remarks' => 'PO submitted for approval.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Purchase order submitted.');
    }

    public function approve(Request $request, PurchaseOrder $purchaseOrder)
    {
        if ($purchaseOrder->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft purchase orders can be approved.');
        }

        $purchaseOrder->update([
            'status' => 'approved',
            'approved_by' => $request->user()?->id,
            'approved_at' => now(),
        ]);

        ApprovalAction::create([
            'document_type' => 'purchase_order',
            'document_id' => $purchaseOrder->id,
            'action' => 'approved',
            'remarks' => 'PO approved.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Purchase order approved.');
    }

    public function reject(Request $request, PurchaseOrder $purchaseOrder)
    {
        if (!in_array($purchaseOrder->status, ['draft', 'approved'], true)) {
            return redirect()->back()->with('error', 'This purchase order cannot be rejected.');
        }

        $purchaseOrder->update([
            'status' => 'cancelled',
        ]);

        ApprovalAction::create([
            'document_type' => 'purchase_order',
            'document_id' => $purchaseOrder->id,
            'action' => 'rejected',
            'remarks' => 'PO rejected/cancelled.',
            'action_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Purchase order rejected.');
    }
}
