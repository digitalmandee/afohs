<?php

namespace App\Http\Controllers\Procurement;

use App\Http\Controllers\Controller;
use App\Models\AccountingRule;
use App\Models\GoodsReceipt;
use App\Models\InventoryTransaction;
use App\Models\JournalEntry;
use App\Models\PurchaseOrder;
use App\Models\Vendor;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Services\Accounting\PostingService;
use Illuminate\Validation\ValidationException;

class GoodsReceiptController extends Controller
{
    public function index(Request $request)
    {
        $query = GoodsReceipt::with('vendor', 'warehouse', 'purchaseOrder');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('grn_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', function ($vendor) use ($search) {
                        $vendor->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'received', 'cancelled'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->vendor_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('received_date', [$request->from, $request->to]);
        }

        $summaryQuery = clone $query;
        $statusBreakdown = (clone $query)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');
        $summary = [
            'count' => (int) $summaryQuery->count(),
            'received' => (int) ($statusBreakdown['received'] ?? 0),
            'draft' => (int) ($statusBreakdown['draft'] ?? 0),
            'cancelled' => (int) ($statusBreakdown['cancelled'] ?? 0),
        ];

        $receipts = $query->orderByDesc('received_date')->paginate(25)->withQueryString();
        $postedIds = JournalEntry::query()
            ->where('module_type', 'goods_receipt')
            ->whereIn('module_id', $receipts->getCollection()->pluck('id'))
            ->pluck('module_id')
            ->all();
        $postedLookup = array_fill_keys($postedIds, true);
        $receipts->getCollection()->transform(function ($receipt) use ($postedLookup) {
            $receipt->gl_posted = (bool) ($postedLookup[$receipt->id] ?? false);
            return $receipt;
        });

        return Inertia::render('App/Admin/Procurement/GoodsReceipts/Index', [
            'receipts' => $receipts,
            'summary' => $summary,
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'status', 'vendor_id', 'warehouse_id', 'from', 'to']),
        ]);
    }

    public function create(Request $request)
    {
        $purchaseOrder = null;
        if ($request->filled('purchase_order_id')) {
            $purchaseOrder = PurchaseOrder::with('items.product')->find($request->purchase_order_id);
        }

        $purchaseOrders = PurchaseOrder::with(['vendor:id,name', 'warehouse:id,name', 'items.product:id,name'])
            ->orderByDesc('order_date')
            ->limit(200)
            ->get(['id', 'po_no', 'vendor_id', 'warehouse_id', 'order_date', 'status']);

        return Inertia::render('App/Admin/Procurement/GoodsReceipts/Create', [
            'purchaseOrder' => $purchaseOrder,
            'purchaseOrders' => $purchaseOrders,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'received_date' => 'required|date',
            'remarks' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.qty_received' => 'required|numeric|min:0.001',
            'items.*.unit_cost' => 'required|numeric|min:0',
        ]);

        $po = PurchaseOrder::with('vendor', 'warehouse')->findOrFail($data['purchase_order_id']);
        $poItems = $po->items()->get()->keyBy('id');

        $inputItemIds = collect($data['items'])->pluck('purchase_order_item_id')->all();
        $previousReceived = DB::table('goods_receipt_items')
            ->join('goods_receipts', 'goods_receipts.id', '=', 'goods_receipt_items.goods_receipt_id')
            ->whereIn('goods_receipt_items.purchase_order_item_id', $inputItemIds)
            ->where('goods_receipts.status', '!=', 'cancelled')
            ->select('goods_receipt_items.purchase_order_item_id', DB::raw('SUM(goods_receipt_items.qty_received) as qty_received'))
            ->groupBy('goods_receipt_items.purchase_order_item_id')
            ->pluck('qty_received', 'purchase_order_item_id');

        foreach ($data['items'] as $index => $item) {
            $poItem = $poItems->get($item['purchase_order_item_id']);
            if (!$poItem || (int) $poItem->purchase_order_id !== (int) $po->id) {
                throw ValidationException::withMessages([
                    "items.{$index}.purchase_order_item_id" => 'Selected item does not belong to this purchase order.',
                ]);
            }

            if ((int) $poItem->product_id !== (int) $item['product_id']) {
                throw ValidationException::withMessages([
                    "items.{$index}.product_id" => 'Product mismatch for selected purchase order item.',
                ]);
            }

            $alreadyReceived = (float) ($previousReceived[$poItem->id] ?? 0);
            $available = max(0, (float) $poItem->qty_ordered - $alreadyReceived);
            if ((float) $item['qty_received'] > $available + 0.0001) {
                throw ValidationException::withMessages([
                    "items.{$index}.qty_received" => "Cannot receive more than available qty ({$available}) for this item.",
                ]);
            }
        }

        $receipt = GoodsReceipt::create([
            'grn_no' => 'GRN-' . now()->format('YmdHis'),
            'purchase_order_id' => $po->id,
            'vendor_id' => $po->vendor_id,
            'warehouse_id' => $po->warehouse_id,
            'received_date' => $data['received_date'],
            'status' => 'received',
            'remarks' => $data['remarks'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        $total = 0;
        foreach ($data['items'] as $item) {
            $lineTotal = $item['qty_received'] * $item['unit_cost'];
            $total += $lineTotal;
            $receipt->items()->create([
                'purchase_order_item_id' => $item['purchase_order_item_id'],
                'product_id' => $item['product_id'],
                'qty_received' => $item['qty_received'],
                'unit_cost' => $item['unit_cost'],
                'line_total' => $lineTotal,
            ]);

            InventoryTransaction::create([
                'product_id' => $item['product_id'],
                'warehouse_id' => $po->warehouse_id,
                'transaction_date' => $data['received_date'],
                'type' => 'purchase',
                'qty_in' => $item['qty_received'],
                'qty_out' => 0,
                'unit_cost' => $item['unit_cost'],
                'total_cost' => $lineTotal,
                'reference_type' => GoodsReceipt::class,
                'reference_id' => $receipt->id,
                'created_by' => $request->user()?->id,
            ]);

            $poItem = $poItems->get($item['purchase_order_item_id']);
            if ($poItem) {
                $poItem->qty_received = (float) $poItem->qty_received + (float) $item['qty_received'];
                $poItem->save();
            }
        }

        $remaining = $po->items()->whereColumn('qty_received', '<', 'qty_ordered')->count();
        $po->status = $remaining === 0 ? 'received' : 'partially_received';
        $po->save();

        $rule = AccountingRule::where('code', 'purchase_receipt')->where('is_active', true)->first();
        if ($rule) {
            $lines = [];
            foreach ($rule->lines as $line) {
                $amount = $total * ($line['ratio'] ?? 1);
                $lines[] = [
                    'account_id' => $line['account_id'],
                    'debit' => ($line['side'] ?? 'debit') === 'debit' ? $amount : 0,
                    'credit' => ($line['side'] ?? 'debit') === 'credit' ? $amount : 0,
                    'vendor_id' => $po->vendor_id,
                    'warehouse_id' => $po->warehouse_id,
                    'reference_type' => GoodsReceipt::class,
                    'reference_id' => $receipt->id,
                ];
            }

            app(PostingService::class)->post(
                'goods_receipt',
                $receipt->id,
                $data['received_date'],
                'GRN ' . $receipt->grn_no,
                $lines,
                $request->user()?->id
            );
        }

        return redirect()->route('procurement.goods-receipts.index')->with('success', 'Goods receipt created.');
    }
}
