<?php

namespace App\Http\Controllers\Reporting;

use App\Http\Controllers\Controller;
use App\Models\CashPurchase;
use App\Models\Branch;
use App\Models\Department;
use App\Models\GoodsReceipt;
use App\Models\InventoryDocument;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use App\Models\PurchaseOrder;
use App\Models\PurchaseRequisition;
use App\Models\PurchaseReturn;
use App\Models\StockAudit;
use App\Models\SupplierAdvance;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\VendorPayment;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ModuleReportController extends Controller
{
    public function index(Request $request, string $domain, string $report)
    {
        $payload = $this->buildReportPayload($request, $domain, $report);

        return Inertia::render('App/Admin/Reports/ModuleReport', $payload['page']);
    }

    public function print(Request $request, string $domain, string $report)
    {
        $payload = $this->buildReportPayload($request, $domain, $report);
        $print = $payload['print'];
        $print['autoPrint'] = true;

        return response()->view('accounting.reports.branded', $print);
    }

    public function pdf(Request $request, string $domain, string $report)
    {
        $payload = $this->buildReportPayload($request, $domain, $report);
        $print = $payload['print'];

        return Pdf::loadView('accounting.reports.branded', $print)
            ->setPaper('a4', 'landscape')
            ->download(sprintf('%s-%s.pdf', "{$domain}-{$report}", now()->format('Ymd-His')));
    }

    public function csv(Request $request, string $domain, string $report)
    {
        $payload = $this->buildReportPayload($request, $domain, $report);
        $csvRows = $payload['csv_rows'];
        $headers = $payload['csv_headers'];

        return response()->streamDownload(function () use ($headers, $csvRows) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, $headers);
            foreach ($csvRows as $row) {
                $ordered = [];
                foreach ($headers as $header) {
                    $ordered[] = data_get($row, $header, '');
                }
                fputcsv($handle, $ordered);
            }
            fclose($handle);
        }, sprintf('%s-%s.csv', $domain, $report), [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function xlsx(Request $request, string $domain, string $report)
    {
        $payload = $this->buildReportPayload($request, $domain, $report);
        $headers = $payload['csv_headers'];
        $rows = $payload['csv_rows'];

        $xml = $this->buildSpreadsheetXml($headers, $rows);

        return Response::make($xml, 200, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition' => sprintf('attachment; filename="%s-%s.xlsx"', $domain, $report),
        ]);
    }

    private function buildReportPayload(Request $request, string $domain, string $report): array
    {
        $allowed = $this->allowedReports();
        abort_unless(isset($allowed[$domain][$report]), 404);

        $dataset = $this->resolveDataset($request, $domain, $report);
        $filters = $this->normalizeFilters($request);

        $routeParams = ['domain' => $domain, 'report' => $report];
        $routeNames = [
            'index' => 'module-reports.index',
            'print' => 'module-reports.print',
            'pdf' => 'module-reports.pdf',
            'csv' => 'module-reports.csv',
            'xlsx' => 'module-reports.xlsx',
        ];

        $printRows = collect($dataset['rows'] ?? [])->map(function (array $row) use ($dataset) {
            $printRow = [];
            foreach ($dataset['csv_headers'] as $header) {
                $printRow[$header] = data_get($row, $header, '');
            }
            return $printRow;
        })->all();

        return [
            'page' => [
                'title' => $dataset['title'],
                'subtitle' => $dataset['subtitle'],
                'domain' => $domain,
                'report' => $report,
                'columns' => $dataset['columns'],
                'rows' => $dataset['paginated'],
                'summary' => $dataset['summary'],
                'filters' => $filters,
                'options' => $this->filterOptions(),
                'routeNames' => $routeNames,
                'routeParams' => $routeParams,
            ],
            'print' => $this->buildBrandedPayload(
                $dataset['title'],
                $filters,
                collect($dataset['summary'])->map(fn ($value, $label) => ['label' => Str::headline((string) $label), 'value' => is_numeric($value) ? number_format((float) $value, 2) : (string) $value])->values()->all(),
                [[
                    'title' => $dataset['title'],
                    'columns' => $dataset['csv_headers'],
                    'rows' => $printRows,
                ]],
                null,
                [Str::headline($domain), Str::headline(str_replace('-', ' ', $report))],
            ),
            'csv_headers' => $dataset['csv_headers'],
            'csv_rows' => $dataset['rows'],
        ];
    }

    private function resolveDataset(Request $request, string $domain, string $report): array
    {
        return match ("{$domain}.{$report}") {
            'procurement.purchase-requisitions' => $this->purchaseRequisitionsReport($request),
            'procurement.purchase-orders' => $this->purchaseOrdersReport($request),
            'procurement.goods-receipts' => $this->goodsReceiptsReport($request),
            'procurement.vendor-bills' => $this->vendorBillsReport($request),
            'procurement.vendor-payments' => $this->vendorPaymentsReport($request),
            'procurement.supplier-advances' => $this->supplierAdvancesReport($request),
            'procurement.purchase-returns' => $this->purchaseReturnsReport($request),
            'procurement.cash-purchases' => $this->cashPurchasesReport($request),
            'procurement.delivery-notes' => $this->deliveryNotesReport($request),
            'procurement.discrepancies' => $this->discrepanciesReport($request),
            'procurement.payment-run' => $this->paymentRunReport($request),
            'inventory.documents' => $this->inventoryDocumentsReport($request),
            'inventory.valuation' => $this->inventoryValuationReport($request),
            'inventory.operations' => $this->inventoryOperationsReport($request),
            'inventory.stock-audits' => $this->stockAuditsReport($request),
            default => abort(404),
        };
    }

    private function purchaseRequisitionsReport(Request $request): array
    {
        $query = PurchaseRequisition::query()->with(['tenant:id,name', 'department:id,name'])
            ->with(['branch:id,name', 'warehouse:id,name'])
            ->withSum('items as total_qty_requested', 'qty_requested')
            ->withSum('items as total_estimated_cost', DB::raw('qty_requested * estimated_unit_cost'));

        $this->applyCommonFilters($query, $request, 'request_date', 'status');
        if ($request->filled('request_for')) {
            $query->where('request_for', (string) $request->request_for);
        }
        if ($request->filled('department_id')) {
            $query->where('department_id', (int) $request->department_id);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('pr_no', 'like', "%{$search}%");
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();

        $rows = collect($paginated->items())->map(function (PurchaseRequisition $row) {
            $requestFor = (string) ($row->request_for ?: ($row->tenant_id ? 'restaurant' : 'other'));
            $location = match ($requestFor) {
                'restaurant' => $row->tenant?->name ?: 'Restaurant',
                'office' => $row->branch?->name ?: 'Head Office',
                'warehouse' => $row->warehouse?->name ?: 'Warehouse',
                default => $row->other_location_label ?: 'Other',
            };

            if (!$row->request_for && !$row->tenant_id) {
                $location = trim("{$location} (legacy)");
            }

            return [
                'id' => "pr-{$row->id}",
                'Document No' => $row->pr_no,
                'Date' => optional($row->request_date)->toDateString(),
                'Request For' => ucfirst($requestFor),
                'Location / Business Unit' => $location,
                'Department' => $row->department?->name ?: '-',
                'Status' => $row->status,
                'Qty' => number_format((float) ($row->total_qty_requested ?? 0), 3, '.', ''),
                'Total' => number_format((float) ($row->total_estimated_cost ?? 0), 2, '.', ''),
                'Drilldown' => route('procurement.purchase-requisitions.index', ['search' => $row->pr_no]),
            ];
        })->values();

        return $this->buildDataset('Purchase Requisitions Report', 'Demand capture and approval pipeline with estimated values.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_qty' => $rows->sum(fn ($r) => (float) $r['Qty']),
            'total_value' => $rows->sum(fn ($r) => (float) $r['Total']),
        ]);
    }

    private function purchaseOrdersReport(Request $request): array
    {
        $query = PurchaseOrder::query()->with(['vendor:id,name', 'tenant:id,name', 'warehouse:id,name']);
        $this->applyCommonFilters($query, $request, 'order_date', 'status');
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('po_no', 'like', "%{$search}%")
                    ->orWhereHas('vendor', fn ($v) => $v->where('name', 'like', "%{$search}%"));
            });
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (PurchaseOrder $row) => [
            'id' => "po-{$row->id}",
            'Document No' => $row->po_no,
            'Date' => optional($row->order_date)->toDateString(),
            'Vendor' => $row->vendor?->name ?: '-',
            'Restaurant' => $row->tenant?->name ?: '-',
            'Warehouse' => $row->warehouse?->name ?: '-',
            'Status' => $row->status,
            'Total' => number_format((float) $row->grand_total, 2, '.', ''),
            'Drilldown' => route('procurement.purchase-orders.view', $row),
        ])->values();

        return $this->buildDataset('Purchase Orders Report', 'Commercial commitments and receiving progress.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_value' => $rows->sum(fn ($r) => (float) $r['Total']),
        ]);
    }

    private function goodsReceiptsReport(Request $request): array
    {
        $query = GoodsReceipt::query()->with(['vendor:id,name', 'tenant:id,name', 'warehouse:id,name']);
        $this->applyCommonFilters($query, $request, 'received_date', 'status');
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('grn_no', 'like', "%{$search}%");
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (GoodsReceipt $row) => [
            'id' => "grn-{$row->id}",
            'Document No' => $row->grn_no,
            'Date' => optional($row->received_date)->toDateString(),
            'Vendor' => $row->vendor?->name ?: '-',
            'Restaurant' => $row->tenant?->name ?: '-',
            'Warehouse' => $row->warehouse?->name ?: '-',
            'Status' => $row->status,
            'Drilldown' => route('procurement.goods-receipts.view', $row),
        ])->values();

        return $this->buildDataset('Goods Receipts Report', 'Inbound stock receipts pending/accepted/posted tracking.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'accepted' => $rows->where('Status', 'accepted')->count(),
        ]);
    }

    private function vendorBillsReport(Request $request): array
    {
        $query = VendorBill::query()->with(['vendor:id,name', 'tenant:id,name']);
        $this->applyCommonFilters($query, $request, 'bill_date', 'status');
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('bill_no', 'like', "%{$search}%");
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(function (VendorBill $row) {
            $outstanding = max(0, (float) $row->grand_total - (float) $row->paid_amount - (float) $row->advance_applied_amount - (float) $row->return_applied_amount);
            return [
                'id' => "vb-{$row->id}",
                'Document No' => $row->bill_no,
                'Date' => optional($row->bill_date)->toDateString(),
                'Vendor' => $row->vendor?->name ?: '-',
                'Restaurant' => $row->tenant?->name ?: '-',
                'Status' => $row->status,
                'Total' => number_format((float) $row->grand_total, 2, '.', ''),
                'Outstanding' => number_format($outstanding, 2, '.', ''),
                'Drilldown' => route('procurement.vendor-bills.index', ['search' => $row->bill_no]),
            ];
        })->values();

        return $this->buildDataset('Vendor Bills Report', 'AP invoices with paid/advance/return adjustments.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_billed' => $rows->sum(fn ($r) => (float) $r['Total']),
            'total_outstanding' => $rows->sum(fn ($r) => (float) $r['Outstanding']),
        ]);
    }

    private function vendorPaymentsReport(Request $request): array
    {
        $query = VendorPayment::query()->with(['vendor:id,name', 'tenant:id,name']);
        $this->applyCommonFilters($query, $request, 'payment_date', 'status');
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where('payment_no', 'like', "%{$search}%");
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (VendorPayment $row) => [
            'id' => "vp-{$row->id}",
            'Document No' => $row->payment_no,
            'Date' => optional($row->payment_date)->toDateString(),
            'Vendor' => $row->vendor?->name ?: '-',
            'Restaurant' => $row->tenant?->name ?: '-',
            'Method' => $row->method,
            'Status' => $row->status,
            'Amount' => number_format((float) $row->amount, 2, '.', ''),
            'Drilldown' => route('procurement.vendor-payments.index', ['search' => $row->payment_no]),
        ])->values();

        return $this->buildDataset('Vendor Payments Report', 'Invoice-wise and ledger-wise settlement outputs.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_paid' => $rows->sum(fn ($r) => (float) $r['Amount']),
        ]);
    }

    private function supplierAdvancesReport(Request $request): array
    {
        $query = SupplierAdvance::query()->with(['vendor:id,name']);
        $this->applyCommonFilters($query, $request, 'advance_date', 'status');
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('search')) {
            $query->where('advance_no', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (SupplierAdvance $row) => [
            'id' => "sa-{$row->id}",
            'Document No' => $row->advance_no,
            'Date' => optional($row->advance_date)->toDateString(),
            'Vendor' => $row->vendor?->name ?: '-',
            'Status' => $row->status,
            'Amount' => number_format((float) $row->amount, 2, '.', ''),
            'Applied' => number_format((float) $row->applied_amount, 2, '.', ''),
            'Remaining' => number_format(max(0, (float) $row->amount - (float) $row->applied_amount), 2, '.', ''),
            'Drilldown' => route('procurement.supplier-advances.index', ['search' => $row->advance_no]),
        ])->values();

        return $this->buildDataset('Supplier Advances Report', 'Advance postings and utilization trail.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_advance' => $rows->sum(fn ($r) => (float) $r['Amount']),
            'total_remaining' => $rows->sum(fn ($r) => (float) $r['Remaining']),
        ]);
    }

    private function purchaseReturnsReport(Request $request): array
    {
        $query = PurchaseReturn::query()->with(['vendor:id,name', 'tenant:id,name']);
        $this->applyCommonFilters($query, $request, 'return_date', 'status');
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }
        if ($request->filled('search')) {
            $query->where('return_no', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (PurchaseReturn $row) => [
            'id' => "prtn-{$row->id}",
            'Document No' => $row->return_no,
            'Date' => optional($row->return_date)->toDateString(),
            'Vendor' => $row->vendor?->name ?: '-',
            'Restaurant' => $row->tenant?->name ?: '-',
            'Status' => $row->status,
            'Credit Status' => $row->credit_status ?: '-',
            'Amount' => number_format((float) $row->grand_total, 2, '.', ''),
            'Vendor Credit' => number_format((float) $row->vendor_credit_amount, 2, '.', ''),
            'Drilldown' => route('procurement.purchase-returns.index', ['search' => $row->return_no]),
        ])->values();

        return $this->buildDataset('Purchase Returns Report', 'GRN-linked return and supplier credit tracking.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_return' => $rows->sum(fn ($r) => (float) $r['Amount']),
            'total_vendor_credit' => $rows->sum(fn ($r) => (float) $r['Vendor Credit']),
        ]);
    }

    private function cashPurchasesReport(Request $request): array
    {
        $query = CashPurchase::query()->with(['vendor:id,name', 'warehouse:id,name']);
        $this->applyCommonFilters($query, $request, 'purchase_date', 'status');
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }
        if ($request->filled('search')) {
            $query->where('cp_no', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (CashPurchase $row) => [
            'id' => "cp-{$row->id}",
            'Document No' => $row->cp_no,
            'Date' => optional($row->purchase_date)->toDateString(),
            'Vendor' => $row->vendor?->name ?: '-',
            'Warehouse' => $row->warehouse?->name ?: '-',
            'Status' => $row->status,
            'Amount' => number_format((float) $row->grand_total, 2, '.', ''),
            'Drilldown' => route('procurement.cash-purchases.index', ['search' => $row->cp_no]),
        ])->values();

        return $this->buildDataset('Cash Purchases Report', 'Immediate-purchase procurement with payment account trace.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_value' => $rows->sum(fn ($r) => (float) $r['Amount']),
        ]);
    }

    private function deliveryNotesReport(Request $request): array
    {
        $query = InventoryDocument::query()->where('type', 'delivery_note')->with('tenant:id,name');
        $this->applyCommonFilters($query, $request, 'transaction_date', 'status');
        if ($request->filled('search')) {
            $query->where('document_no', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (InventoryDocument $row) => [
            'id' => "dn-{$row->id}",
            'Document No' => $row->document_no,
            'Date' => optional($row->transaction_date)->toDateString(),
            'Restaurant' => $row->tenant?->name ?: '-',
            'Status' => $row->status,
            'Drilldown' => route('procurement.delivery-notes.print', $row),
        ])->values();

        return $this->buildDataset('Delivery Notes Report', 'Dispatch documents from inventory document stream.', $paginated, $rows, [
            'documents' => $paginated->total(),
        ]);
    }

    private function discrepanciesReport(Request $request): array
    {
        $query = DB::table('goods_receipts as gr')
            ->leftJoin('vendor_bills as vb', 'vb.goods_receipt_id', '=', 'gr.id')
            ->leftJoin('vendors as v', 'v.id', '=', 'gr.vendor_id')
            ->selectRaw('gr.id, gr.grn_no as document_no, gr.received_date as report_date, v.name as vendor_name, gr.status, COALESCE(SUM(vb.grand_total),0) as billed_total, COUNT(vb.id) as bill_count')
            ->groupBy('gr.id', 'gr.grn_no', 'gr.received_date', 'v.name', 'gr.status');

        if ($request->filled('vendor_id')) {
            $query->where('gr.vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('gr.received_date', [$request->from, $request->to]);
        }
        if ($request->filled('search')) {
            $query->where('gr.grn_no', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->orderByDesc('gr.id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(function ($row) {
            $type = ((int) $row->bill_count) === 0 ? 'unbilled' : 'review';
            return [
                'id' => "disc-{$row->id}",
                'Document No' => $row->document_no,
                'Date' => $row->report_date,
                'Vendor' => $row->vendor_name ?: '-',
                'Status' => $row->status ?: '-',
                'Type' => $type,
                'Billed Total' => number_format((float) $row->billed_total, 2, '.', ''),
                'Drilldown' => route('procurement.insights.discrepancies', ['search' => $row->document_no]),
            ];
        })->values();

        return $this->buildDataset('3-Way Discrepancies Report', 'GRN vs bill presence/amount mismatch queue.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'unbilled' => $rows->where('Type', 'unbilled')->count(),
        ]);
    }

    private function paymentRunReport(Request $request): array
    {
        $query = VendorBill::query()
            ->with('vendor:id,name')
            ->whereIn('status', ['posted', 'partially_paid'])
            ->whereRaw('(grand_total - paid_amount - advance_applied_amount - COALESCE(return_applied_amount, 0)) > 0.009');

        $this->applyCommonFilters($query, $request, 'bill_date', null);
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', (int) $request->vendor_id);
        }
        if ($request->filled('search')) {
            $query->where('bill_no', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(function (VendorBill $row) {
            $outstanding = max(0, (float) $row->grand_total - (float) $row->paid_amount - (float) $row->advance_applied_amount - (float) $row->return_applied_amount);
            return [
                'id' => "payrun-{$row->id}",
                'Document No' => $row->bill_no,
                'Date' => optional($row->bill_date)->toDateString(),
                'Vendor' => $row->vendor?->name ?: '-',
                'Status' => $row->status,
                'Outstanding' => number_format($outstanding, 2, '.', ''),
                'Drilldown' => route('procurement.payment-run.index', ['search' => $row->bill_no]),
            ];
        })->values();

        return $this->buildDataset('Payment Run Report', 'Open AP bills queue prepared for payment execution.', $paginated, $rows, [
            'documents' => $paginated->total(),
            'total_outstanding' => $rows->sum(fn ($r) => (float) $r['Outstanding']),
        ]);
    }

    private function inventoryDocumentsReport(Request $request): array
    {
        $query = InventoryDocument::query()->with(['tenant:id,name']);
        $this->applyCommonFilters($query, $request, 'transaction_date', 'status');
        if ($request->filled('warehouse_id')) {
            $warehouseId = (int) $request->warehouse_id;
            $query->where(function ($q) use ($warehouseId) {
                $q->where('source_warehouse_id', $warehouseId)->orWhere('destination_warehouse_id', $warehouseId);
            });
        }
        if ($request->filled('search')) {
            $query->where('document_no', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (InventoryDocument $row) => [
            'id' => "idoc-{$row->id}",
            'Document No' => $row->document_no,
            'Date' => optional($row->transaction_date)->toDateString(),
            'Type' => $row->type,
            'Restaurant' => $row->tenant?->name ?: '-',
            'Status' => $row->status,
            'Drilldown' => route('inventory.documents.index', ['search' => $row->document_no]),
        ])->values();

        return $this->buildDataset('Inventory Documents Report', 'All stock-impacting inventory documents in one register.', $paginated, $rows, [
            'documents' => $paginated->total(),
        ]);
    }

    private function inventoryValuationReport(Request $request): array
    {
        $query = InventoryTransaction::query()
            ->with(['warehouse:id,name,code'])
            ->selectRaw('warehouse_id, SUM(qty_in - qty_out) as net_qty, SUM(total_cost) as total_value')
            ->groupBy('warehouse_id');

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }
        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('transaction_date', [$request->from, $request->to]);
        }

        $results = $query->orderBy('warehouse_id')->get();
        $paginated = $this->paginateCollection($results->values(), $request, $this->resolvePerPage($request));
        $rows = collect($paginated->items())->map(function (InventoryTransaction $row) {
            return [
                'id' => "ival-{$row->warehouse_id}",
                'Warehouse' => $row->warehouse ? "{$row->warehouse->code} · {$row->warehouse->name}" : 'N/A',
                'Net Qty' => number_format((float) $row->net_qty, 3, '.', ''),
                'Valuation' => number_format((float) $row->total_value, 2, '.', ''),
                'Drilldown' => route('inventory.valuation.index'),
            ];
        })->values();

        return $this->buildDataset('Warehouse Valuation Report', 'Inventory value by warehouse based on transaction ledger.', $paginated, $rows, [
            'warehouses' => $rows->count(),
            'total_valuation' => $rows->sum(fn ($r) => (float) $r['Valuation']),
        ]);
    }

    private function inventoryOperationsReport(Request $request): array
    {
        $query = InventoryTransaction::query()->with(['inventoryItem:id,name,sku', 'warehouse:id,name']);
        $this->applyCommonFilters($query, $request, 'transaction_date', null);
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }
        if ($request->filled('item_id')) {
            $query->where('inventory_item_id', (int) $request->item_id);
        }
        if ($request->filled('search')) {
            $query->where('reference_id', 'like', '%' . trim((string) $request->search) . '%');
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (InventoryTransaction $row) => [
            'id' => "iot-{$row->id}",
            'Date' => optional($row->transaction_date)->toDateString(),
            'Type' => $row->type,
            'Item' => $row->inventoryItem ? "{$row->inventoryItem->sku} · {$row->inventoryItem->name}" : '-',
            'Warehouse' => $row->warehouse?->name ?: '-',
            'Qty In' => number_format((float) $row->qty_in, 3, '.', ''),
            'Qty Out' => number_format((float) $row->qty_out, 3, '.', ''),
            'Total Value' => number_format((float) $row->total_cost, 2, '.', ''),
            'Drilldown' => route('inventory.operations.index'),
        ])->values();

        return $this->buildDataset('Inventory Operations Report', 'Movement-level stock in/out and valuation impact.', $paginated, $rows, [
            'transactions' => $paginated->total(),
            'qty_in' => $rows->sum(fn ($r) => (float) $r['Qty In']),
            'qty_out' => $rows->sum(fn ($r) => (float) $r['Qty Out']),
        ]);
    }

    private function stockAuditsReport(Request $request): array
    {
        $query = StockAudit::query();
        $this->applyCommonFilters($query, $request, 'audit_date', 'status');
        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', (int) $request->warehouse_id);
        }

        $paginated = $query->latest('id')->paginate($this->resolvePerPage($request))->withQueryString();
        $rows = collect($paginated->items())->map(fn (StockAudit $row) => [
            'id' => "audit-{$row->id}",
            'Document No' => $row->audit_no,
            'Date' => optional($row->audit_date)->toDateString(),
            'Status' => $row->status,
            'Posted At' => optional($row->posted_at)?->toDateTimeString() ?: '-',
            'Drilldown' => route('inventory.audits.index', ['search' => $row->audit_no]),
        ])->values();

        return $this->buildDataset('Stock Audits Report', 'Count variance approvals and posting timeline.', $paginated, $rows, [
            'audits' => $paginated->total(),
            'posted' => $rows->filter(fn ($r) => $r['Posted At'] !== '-')->count(),
        ]);
    }

    private function applyCommonFilters($query, Request $request, ?string $dateColumn = null, ?string $statusColumn = 'status'): void
    {
        if ($dateColumn && $request->filled('from') && $request->filled('to')) {
            $query->whereBetween($dateColumn, [$request->from, $request->to]);
        }
        if ($statusColumn && $request->filled('status')) {
            $query->where($statusColumn, (string) $request->status);
        }
        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', (int) $request->tenant_id);
        }
    }

    private function buildDataset(string $title, string $subtitle, LengthAwarePaginator $paginated, $rows, array $summary): array
    {
        $columns = collect($rows->first() ?? [])->keys()->reject(fn ($key) => in_array($key, ['id'], true))->values()->all();
        $rowsForPage = collect($rows)->map(function (array $row) use ($columns) {
            $result = ['id' => $row['id'] ?? Str::uuid()->toString()];
            foreach ($columns as $column) {
                $result[$column] = $row[$column] ?? '';
            }
            return $result;
        })->values();

        $paginated->setCollection($rowsForPage);

        return [
            'title' => $title,
            'subtitle' => $subtitle,
            'columns' => collect($columns)->map(fn ($col) => ['key' => $col, 'label' => $col])->values()->all(),
            'paginated' => $paginated,
            'rows' => $rowsForPage->all(),
            'summary' => $summary,
            'csv_headers' => $columns,
        ];
    }

    private function normalizeFilters(Request $request): array
    {
        return $request->only([
            'from',
            'to',
            'vendor_id',
            'item_id',
            'warehouse_id',
            'location_id',
            'department_id',
            'tenant_id',
            'request_for',
            'status',
            'search',
            'page',
            'per_page',
        ]);
    }

    private function filterOptions(): array
    {
        return [
            'vendors' => Vendor::query()->orderBy('name')->get(['id', 'name']),
            'items' => InventoryItem::query()->orderBy('name')->limit(500)->get(['id', 'name', 'sku']),
            'warehouses' => DB::table('warehouses')->orderBy('name')->limit(300)->get(['id', 'name']),
            'locations' => DB::table('warehouse_locations')->orderBy('name')->limit(300)->get(['id', 'name']),
            'departments' => Department::query()->orderBy('name')->get(['id', 'name']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'branches' => Branch::query()->orderBy('name')->get(['id', 'name']),
            'requestForOptions' => [
                ['id' => 'restaurant', 'name' => 'Restaurant'],
                ['id' => 'office', 'name' => 'Office'],
                ['id' => 'warehouse', 'name' => 'Warehouse'],
                ['id' => 'other', 'name' => 'Other'],
            ],
            'statuses' => [
                ['id' => 'draft', 'name' => 'Draft'],
                ['id' => 'submitted', 'name' => 'Submitted'],
                ['id' => 'approved', 'name' => 'Approved'],
                ['id' => 'accepted', 'name' => 'Accepted'],
                ['id' => 'posted', 'name' => 'Posted'],
                ['id' => 'rejected', 'name' => 'Rejected'],
                ['id' => 'cancelled', 'name' => 'Cancelled'],
                ['id' => 'partially_paid', 'name' => 'Partially Paid'],
                ['id' => 'paid', 'name' => 'Paid'],
            ],
        ];
    }

    private function allowedReports(): array
    {
        return [
            'procurement' => [
                'purchase-requisitions' => true,
                'purchase-orders' => true,
                'goods-receipts' => true,
                'vendor-bills' => true,
                'vendor-payments' => true,
                'supplier-advances' => true,
                'purchase-returns' => true,
                'cash-purchases' => true,
                'delivery-notes' => true,
                'discrepancies' => true,
                'payment-run' => true,
            ],
            'inventory' => [
                'documents' => true,
                'valuation' => true,
                'operations' => true,
                'stock-audits' => true,
            ],
        ];
    }

    private function resolvePerPage(Request $request, int $default = 25): int
    {
        $value = (int) $request->input('per_page', $default);
        return in_array($value, [10, 25, 50, 100], true) ? $value : $default;
    }

    private function paginateCollection($items, Request $request, int $perPage): LengthAwarePaginator
    {
        $page = max(1, (int) $request->input('page', 1));
        $collection = collect($items);
        $slice = $collection->slice(($page - 1) * $perPage, $perPage)->values();

        return new LengthAwarePaginator(
            $slice,
            $collection->count(),
            $perPage,
            $page,
            [
                'path' => $request->url(),
                'query' => $request->query(),
            ]
        );
    }

    private function buildBrandedPayload(string $title, array $filters = [], array $metrics = [], array $sections = [], ?string $error = null, array $badges = []): array
    {
        return [
            'title' => $title,
            'companyName' => config('app.name', 'AFOHS Club Operations'),
            'generatedAt' => now()->format('Y-m-d H:i:s'),
            'filters' => collect($filters)->filter(fn ($value) => $value !== null && $value !== '')->mapWithKeys(fn ($value, $key) => [Str::headline((string) $key) => is_array($value) ? implode(', ', $value) : (string) $value])->all(),
            'metrics' => $metrics,
            'sections' => $sections,
            'badges' => $badges,
            'error' => $error,
            'logoDataUri' => $this->reportLogoDataUri(),
        ];
    }

    private function reportLogoDataUri(): ?string
    {
        $logoPath = public_path('images/logo.png');
        if (!File::exists($logoPath)) {
            return null;
        }

        try {
            $mime = File::mimeType($logoPath) ?: 'image/png';
            return 'data:' . $mime . ';base64,' . base64_encode(File::get($logoPath));
        } catch (\Throwable) {
            return null;
        }
    }

    private function buildSpreadsheetXml(array $headers, array $rows): string
    {
        $escape = fn (string $value): string => htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
        $headerXml = collect($headers)->map(fn ($header) => '<Cell><Data ss:Type="String">' . $escape((string) $header) . '</Data></Cell>')->implode('');
        $rowsXml = collect($rows)->map(function ($row) use ($headers, $escape) {
            $cells = collect($headers)->map(function ($header) use ($row, $escape) {
                $value = (string) data_get($row, $header, '');
                $type = is_numeric($value) ? 'Number' : 'String';
                return '<Cell><Data ss:Type="' . $type . '">' . $escape($value) . '</Data></Cell>';
            })->implode('');
            return '<Row>' . $cells . '</Row>';
        })->implode('');

        return '<?xml version="1.0"?>'
            . '<?mso-application progid="Excel.Sheet"?>'
            . '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"'
            . ' xmlns:o="urn:schemas-microsoft-com:office:office"'
            . ' xmlns:x="urn:schemas-microsoft-com:office:excel"'
            . ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"'
            . ' xmlns:html="http://www.w3.org/TR/REC-html40">'
            . '<Worksheet ss:Name="Report"><Table>'
            . '<Row>' . $headerXml . '</Row>'
            . $rowsXml
            . '</Table></Worksheet></Workbook>';
    }
}
