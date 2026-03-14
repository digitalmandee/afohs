<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\ApprovalAction;
use App\Models\JournalEntry;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = PurchaseOrder::with('vendor', 'warehouse');

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
        $postedIds = JournalEntry::query()
            ->where('module_type', 'purchase_order')
            ->whereIn('module_id', $orders->getCollection()->pluck('id'))
            ->pluck('module_id')
            ->all();
        $postedLookup = array_fill_keys($postedIds, true);

        $orders->getCollection()->transform(function ($order) use ($latestActions, $postedLookup) {
            $action = $latestActions->get($order->id);
            $order->gl_posted = (bool) ($postedLookup[$order->id] ?? false);
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
            'filters' => $request->only(['search', 'status', 'vendor_id', 'warehouse_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function create()
    {
        return Inertia::render('App/Admin/Procurement/PurchaseOrders/Create', [
            'vendors' => Vendor::orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::orderBy('name')->get(['id', 'name']),
            'products' => Product::orderBy('name')->get(['id', 'name', 'price']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => 'required|exists:vendors,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date',
            'currency' => 'nullable|string|max:8',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty_ordered' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $order = PurchaseOrder::create([
            'po_no' => 'PO-' . now()->format('YmdHis'),
            'vendor_id' => $data['vendor_id'],
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
