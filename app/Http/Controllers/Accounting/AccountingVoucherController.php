<?php

namespace App\Http\Controllers\Accounting;

use App\Helpers\FileHelper;
use App\Http\Controllers\Controller;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\AccountingApprovalPolicy;
use App\Models\AccountingEntityAccountMapping;
use App\Models\AccountingExpenseType;
use App\Models\AccountingVoucherAllocation;
use App\Models\AccountingVoucherTemplate;
use App\Models\AccountingVoucher;
use App\Models\ApprovalAction;
use App\Models\CoaAccount;
use App\Models\CorporateMember;
use App\Models\Customer;
use App\Models\Department;
use App\Models\FinancialInvoice;
use App\Models\Media;
use App\Models\Member;
use App\Models\OperationalAuditLog;
use App\Models\PaymentAccount;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Services\Accounting\AccountingEventDispatcher;
use App\Services\Accounting\StrictAccountingSyncService;
use App\Services\Accounting\Support\AccountingPeriodGate;
use App\Services\Accounting\Vouchers\AccountingVoucherMappingResolver;
use App\Support\Branding\StaticDocumentBrandingResolver;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AccountingVoucherController extends Controller
{
    private const CASH_METHODS = ['cash', 'cash_in_hand', 'cash_hand', 'petty_cash'];

    private const BANK_METHODS = ['bank', 'bank_transfer', 'online', 'cheque', 'debit_card', 'credit_card'];

    private const ENTRY_MODES = ['smart', 'manual'];

    private const PARTY_TYPES = ['none', 'vendor', 'customer', 'member', 'corporate_member'];

    public function __construct(
        private readonly AccountingPeriodGate $periodGate,
        private readonly AccountingVoucherMappingResolver $mappingResolver
    ) {
    }

    public function index(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        $perPage = in_array($perPage, [10, 25, 50, 100], true) ? $perPage : 25;

        $query = AccountingVoucher::query()->with(['tenant:id,name', 'department:id,name', 'paymentAccount:id,name']);

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('voucher_no', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%");
            });
        }
        if ($request->filled('voucher_type')) {
            $query->where('voucher_type', $request->string('voucher_type')->toString());
        }
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->integer('tenant_id'));
        }
        if ($request->filled('from')) {
            $query->whereDate('voucher_date', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('voucher_date', '<=', $request->input('to'));
        }

        $vouchers = $query->latest('id')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/Accounting/Vouchers/Index', [
            'vouchers' => $vouchers,
            'summary' => [
                'count' => (int) (clone $query)->count(),
                'draft' => (int) (clone $query)->where('status', 'draft')->count(),
                'submitted' => (int) (clone $query)->where('status', 'submitted')->count(),
                'posted' => (int) (clone $query)->where('status', 'posted')->count(),
            ],
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'voucher_type', 'status', 'tenant_id', 'from', 'to', 'per_page']),
        ]);
    }

    public function create()
    {
        $this->autoAssignVendorDefaultMappings();
        return Inertia::render('App/Admin/Accounting/Vouchers/Create', $this->formPayload(null));
    }

    public function preview(Request $request)
    {
        $data = $this->validatePayload($request);
        $totals = [
            'debit' => (float) collect($data['effective_lines'])->sum(fn (array $line) => (float) ($line['debit'] ?? 0)),
            'credit' => (float) collect($data['effective_lines'])->sum(fn (array $line) => (float) ($line['credit'] ?? 0)),
        ];

        $allocation = null;
        $allocationRows = collect($data['payment_rows'] ?? [])
            ->filter(fn (array $row) => (string) ($row['payment_mode'] ?? 'direct') === 'against_invoice' && !empty($row['invoice_context']))
            ->values()
            ->map(function (array $row) {
                $context = (array) ($row['invoice_context'] ?? []);
                $amount = (float) ($row['amount'] ?? 0);

                return [
                    'invoice_type' => (string) ($context['invoice_type'] ?? 'vendor_bill'),
                    'invoice_id' => (int) ($context['invoice_id'] ?? 0),
                    'invoice_no' => (string) ($context['number'] ?? '-'),
                    'original_outstanding' => (float) ($context['outstanding'] ?? 0),
                    'allocated_now' => $amount,
                    'remaining_after' => max(0, (float) ($context['outstanding'] ?? 0) - $amount),
                ];
            })
            ->all();

        if (!empty($allocationRows)) {
            $allocation = $allocationRows[0];
        } elseif ($data['invoice_context']) {
            $invoiceAmount = (float) ($data['amount'] ?? 0);
            $allocation = [
                'invoice_type' => $data['invoice_context']['invoice_type'],
                'invoice_id' => (int) $data['invoice_context']['invoice_id'],
                'invoice_no' => (string) ($data['invoice_context']['number'] ?? '-'),
                'original_outstanding' => (float) ($data['invoice_context']['outstanding'] ?? 0),
                'allocated_now' => $invoiceAmount,
                'remaining_after' => max(0, (float) ($data['invoice_context']['outstanding'] ?? 0) - $invoiceAmount),
            ];
        }

        return response()->json([
            'data' => [
                'effective_lines' => $data['effective_lines'],
                'totals' => $totals,
                'allocation' => $allocation,
                'allocation_rows' => $allocationRows,
                'system_narration' => $data['system_narration'] ?? null,
                'counterparty_resolution' => $data['counterparty_resolution'] ?? null,
            ],
        ]);
    }

    public function openInvoices(Request $request)
    {
        $data = $request->validate([
            'party_type' => 'required|in:vendor,customer,member,corporate_member',
            'party_id' => 'required|integer|min:1',
        ]);

        $rows = [];
        if ($data['party_type'] === 'vendor') {
            $rows = VendorBill::query()
                ->where('vendor_id', (int) $data['party_id'])
                ->whereIn('status', ['posted', 'partially_paid'])
                ->orderByDesc('id')
                ->limit(300)
                ->get(['id', 'bill_no', 'bill_date', 'grand_total', 'paid_amount', 'advance_applied_amount', 'return_applied_amount'])
                ->map(function (VendorBill $bill) {
                    $outstanding = max(0, (float) $bill->grand_total - (float) $bill->paid_amount - (float) $bill->advance_applied_amount - (float) $bill->return_applied_amount);
                    return [
                        'invoice_type' => 'vendor_bill',
                        'id' => (int) $bill->id,
                        'number' => (string) $bill->bill_no,
                        'date' => optional($bill->bill_date)->toDateString(),
                        'total' => (float) $bill->grand_total,
                        'outstanding' => $outstanding,
                    ];
                })
                ->filter(fn (array $row) => $row['outstanding'] > 0.009)
                ->values()
                ->all();
        } else {
            $query = FinancialInvoice::query()
                ->whereIn('status', ['unpaid', 'overdue', 'upcoming', 'partially_paid'])
                ->orderByDesc('id')
                ->limit(500);

            if ($data['party_type'] === 'customer') {
                $query->where('customer_id', (int) $data['party_id']);
            } elseif ($data['party_type'] === 'member') {
                $query->where('member_id', (int) $data['party_id']);
            } else {
                $query->where('corporate_member_id', (int) $data['party_id']);
            }

            $rows = $query->get(['id', 'invoice_no', 'issue_date', 'total_price', 'paid_amount'])
                ->map(function (FinancialInvoice $invoice) {
                    $outstanding = max(0, (float) ($invoice->total_price ?? 0) - (float) ($invoice->paid_amount ?? 0));
                    return [
                        'invoice_type' => 'financial_invoice',
                        'id' => (int) $invoice->id,
                        'number' => (string) $invoice->invoice_no,
                        'date' => optional($invoice->issue_date)->toDateString(),
                        'total' => (float) ($invoice->total_price ?? 0),
                        'outstanding' => $outstanding,
                    ];
                })
                ->filter(fn (array $row) => $row['outstanding'] > 0.009)
                ->values()
                ->all();
        }

        return response()->json(['data' => $rows]);
    }

    public function templates(Request $request)
    {
        $query = AccountingVoucherTemplate::query()
            ->where('is_active', true)
            ->where(function ($q) use ($request) {
                $q->where('scope', 'global')
                    ->orWhere(function ($userScope) use ($request) {
                        $userScope->where('scope', 'user')
                            ->where('user_id', $request->user()?->id);
                    });
            })
            ->orderBy('scope')
            ->orderBy('name');

        return response()->json([
            'data' => $query->get(['id', 'name', 'scope', 'payload']),
        ]);
    }

    public function templatePayload(AccountingVoucherTemplate $template, Request $request)
    {
        if (!$template->is_active) {
            return response()->json(['message' => 'Template inactive.'], 422);
        }

        $isAllowed = $template->scope === 'global' || (int) $template->user_id === (int) ($request->user()?->id ?? 0);
        if (!$isAllowed) {
            return response()->json(['message' => 'Template not accessible.'], 403);
        }

        return response()->json(['data' => $template->payload ?? []]);
    }

    public function lastDefaults(Request $request)
    {
        $mode = $this->normalizeEntryMode((string) $request->input('entry_mode', 'smart'));
        $type = (string) $request->input('voucher_type', 'JV');

        $voucherQuery = AccountingVoucher::query()
            ->where('created_by', $request->user()?->id)
            ->where('voucher_type', $type);

        if ($mode === 'manual') {
            $voucherQuery->where('entry_mode', 'manual');
        } else {
            $voucherQuery->whereIn('entry_mode', ['smart', 'against_invoice', 'vendor_payment', 'expense_quick_entry']);
        }

        $voucher = $voucherQuery->latest('id')->first();

        if (!$voucher) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'tenant_id' => $voucher->tenant_id,
                'department_id' => $voucher->department_id,
                'party_type' => $voucher->party_type,
                'party_id' => $voucher->party_id,
                'vendor_id' => $voucher->party_type === 'vendor' ? $voucher->party_id : null,
                'payment_for' => in_array((string) $voucher->voucher_type, ['CPV', 'BPV'], true)
                    ? ($voucher->party_type === 'vendor' ? 'vendor_payment' : 'expense')
                    : null,
                'payment_mode' => in_array((string) $voucher->voucher_type, ['CPV', 'BPV'], true)
                    ? ($voucher->invoice_id ? 'against_invoice' : 'direct')
                    : null,
                'payment_account_id' => $voucher->payment_account_id,
                'expense_type_id' => $voucher->expense_type_id,
                'currency_code' => $voucher->currency_code,
                'exchange_rate' => $voucher->exchange_rate,
                'remarks' => $voucher->remarks,
            ],
        ]);
    }

    public function show(AccountingVoucher $voucher)
    {
        $this->autoAssignVendorDefaultMappings();

        $voucher->load(['lines.account', 'paymentAccount', 'tenant', 'expenseType', 'template']);

        $voucher->load([
            'lines.account',
            'lines.department:id,name',
            'paymentAccount',
            'tenant',
            'department:id,name',
            'expenseType:id,code,name',
            'template:id,name,scope',
            'media',
            'createdBy:id,name,email',
            'updatedBy:id,name,email',
            'approvedBy:id,name,email',
            'postedBy:id,name,email',
            'cancelledBy:id,name,email',
            'reversedBy:id,name,email',
            'reversalVoucher:id,voucher_no,status,posted_at',
            'allocations',
        ]);

        $approvalTrail = ApprovalAction::query()
            ->where('document_type', 'accounting_voucher')
            ->where('document_id', $voucher->id)
            ->latest('id')
            ->get();

        $recentOperationalLogs = OperationalAuditLog::query()
            ->with('actor:id,name,email')
            ->where('module', 'accounting')
            ->whereIn('entity_type', ['accounting_voucher', 'voucher', AccountingVoucher::class, class_basename(AccountingVoucher::class)])
            ->where('entity_id', (string) $voucher->id)
            ->latest('id')
            ->limit(20)
            ->get(['id', 'created_at', 'action', 'status', 'severity', 'message', 'correlation_id', 'actor_id', 'context_json']);

        $auditEvents = collect()
            ->concat($approvalTrail->map(function (ApprovalAction $item) {
                return [
                    'id' => 'approval-' . $item->id,
                    'source' => 'workflow',
                    'action' => (string) $item->action,
                    'status' => 'completed',
                    'severity' => 'info',
                    'message' => (string) ($item->remarks ?: ucfirst((string) $item->action)),
                    'created_at' => optional($item->created_at)->toDateTimeString(),
                    'actor' => null,
                    'correlation_id' => null,
                ];
            }))
            ->concat($recentOperationalLogs->map(function (OperationalAuditLog $log) {
                return [
                    'id' => 'ops-' . $log->id,
                    'source' => 'operational',
                    'action' => (string) $log->action,
                    'status' => (string) ($log->status ?: 'completed'),
                    'severity' => (string) ($log->severity ?: 'info'),
                    'message' => (string) ($log->message ?: '-'),
                    'created_at' => optional($log->created_at)->toDateTimeString(),
                    'actor' => $log->actor ? [
                        'name' => $log->actor->name,
                        'email' => $log->actor->email,
                    ] : null,
                    'correlation_id' => (string) ($log->correlation_id ?: ''),
                ];
            }))
            ->sortByDesc('created_at')
            ->values();

        return Inertia::render('App/Admin/Accounting/Vouchers/Show', [
            'voucher' => $voucher,
            'allocations' => $voucher->allocations->map(function (AccountingVoucherAllocation $allocation) {
                return [
                    'id' => (int) $allocation->id,
                    'invoice_type' => (string) $allocation->invoice_type,
                    'invoice_id' => (int) $allocation->invoice_id,
                    'invoice_no' => $this->resolveAllocationDocumentNo((string) $allocation->invoice_type, (int) $allocation->invoice_id),
                    'allocated_amount' => (float) $allocation->allocated_amount,
                    'currency_code' => (string) ($allocation->currency_code ?: 'PKR'),
                    'exchange_rate' => (float) ($allocation->exchange_rate ?: 1),
                    'party_type' => (string) ($allocation->party_type ?: '-'),
                    'party_id' => (int) ($allocation->party_id ?: 0),
                    'remaining_outstanding' => $this->resolveAllocationOutstanding((string) $allocation->invoice_type, (int) $allocation->invoice_id),
                    'allocated_at' => optional($allocation->allocated_at)->toDateTimeString(),
                ];
            })->values(),
            'approvalTrail' => $approvalTrail,
            'recentOperationalLogs' => $recentOperationalLogs,
            'auditEvents' => $auditEvents,
        ]);
    }

    private function resolveAllocationDocumentNo(string $invoiceType, int $invoiceId): string
    {
        if ($invoiceType === 'vendor_bill') {
            return (string) (VendorBill::query()->whereKey($invoiceId)->value('bill_no') ?: ('VendorBill#' . $invoiceId));
        }
        if ($invoiceType === 'financial_invoice') {
            return (string) (FinancialInvoice::query()->whereKey($invoiceId)->value('invoice_no') ?: ('FinancialInvoice#' . $invoiceId));
        }

        return ucfirst(str_replace('_', ' ', $invoiceType)) . '#' . $invoiceId;
    }

    private function resolveAllocationOutstanding(string $invoiceType, int $invoiceId): float
    {
        if ($invoiceType === 'vendor_bill') {
            $bill = VendorBill::query()->find($invoiceId);
            if (!$bill) {
                return 0.0;
            }

            return max(
                0,
                (float) $bill->grand_total
                - (float) $bill->paid_amount
                - (float) $bill->advance_applied_amount
                - (float) $bill->return_applied_amount
            );
        }

        if ($invoiceType === 'financial_invoice') {
            $invoice = FinancialInvoice::query()->find($invoiceId);
            if (!$invoice) {
                return 0.0;
            }

            return max(0, (float) ($invoice->total_price ?? 0) - (float) ($invoice->paid_amount ?? 0));
        }

        return 0.0;
    }

    public function print(AccountingVoucher $voucher)
    {
        $payload = $this->buildPrintPayload($voucher);
        $payload['autoPrint'] = true;

        return response()->view('accounting.vouchers.document', $payload);
    }

    public function pdf(AccountingVoucher $voucher)
    {
        $payload = $this->buildPrintPayload($voucher);

        return Pdf::loadView('accounting.vouchers.document', $payload)
            ->setPaper('a4', 'portrait')
            ->download(sprintf('accounting-voucher-%s.pdf', $voucher->voucher_no));
    }

    public function edit(AccountingVoucher $voucher)
    {
        if ($voucher->status !== 'draft') {
            return redirect()->route('accounting.vouchers.index')->with('error', 'Only draft vouchers can be edited.');
        }

        $this->autoAssignVendorDefaultMappings();
        $voucher->load(['lines.account', 'lines.department', 'media']);

        return Inertia::render('App/Admin/Accounting/Vouchers/Edit', $this->formPayload($voucher));
    }

    public function store(Request $request)
    {
        $data = $this->validatePayload($request);
        $intent = $this->resolveIntent($request);

        $voucher = DB::transaction(function () use ($data, $request, $intent) {
            $this->applySmartDefaultSelectionIfRequested($data, $request->user()?->id);
            $this->applyVendorCounterpartyDefaultIfRequested($data, $request->user()?->id);

            $voucher = AccountingVoucher::query()->create([
                'voucher_no' => $this->nextVoucherNo($data['voucher_type']),
                'voucher_type' => $data['voucher_type'],
                'entry_mode' => $data['entry_mode'],
                'party_type' => $data['party_type'] ?? null,
                'party_id' => $data['party_id'] ?? null,
                'invoice_type' => $data['invoice_type'] ?? null,
                'invoice_id' => $data['invoice_id'] ?? null,
                'expense_type_id' => $data['expense_type_id'] ?? null,
                'template_id' => $data['template_id'] ?? null,
                'amount' => (float) ($data['amount'] ?? 0),
                'payment_rows' => $data['payment_rows'] ?? null,
                'voucher_date' => $data['voucher_date'],
                'posting_date' => $data['posting_date'],
                'tenant_id' => $data['tenant_id'] ?? null,
                'department_id' => $data['department_id'] ?? null,
                'reference_no' => $data['reference_no'] ?? null,
                'external_reference_no' => $data['external_reference_no'] ?? null,
                'currency_code' => $data['currency_code'],
                'exchange_rate' => $data['exchange_rate'],
                'payment_account_id' => $data['payment_account_id'] ?? null,
                'instrument_type' => $data['instrument_type'] ?? null,
                'instrument_no' => $data['instrument_no'] ?? null,
                'instrument_date' => $data['instrument_date'] ?? null,
                'bank_reference' => $data['bank_reference'] ?? null,
                'deposit_reference' => $data['deposit_reference'] ?? null,
                'clearing_date' => $data['clearing_date'] ?? null,
                'period_id' => $this->periodGate->resolveOpenPeriodId($data['posting_date']),
                'status' => 'draft',
                'remarks' => $data['remarks'] ?? null,
                'system_narration' => $data['system_narration'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $this->syncLines($voucher, $data);
            $this->syncAttachments($voucher, $request);
            $this->maybeSaveTemplate($request, $data);
            $this->logAction($voucher->id, 'created', 'Accounting voucher draft created.', $request->user()?->id);
            $this->recordOperationalEvent($voucher->id, 'accounting.voucher.created', 'completed', 'info', 'Accounting voucher draft created.', $request->user()?->id, [
                'voucher_no' => $voucher->voucher_no,
                'voucher_type' => $voucher->voucher_type,
                'entry_mode' => $voucher->entry_mode,
            ]);
            $this->applyIntentState($voucher, $intent, $request->user()?->id);

            return $voucher;
        });

        if ($intent === 'post') {
            $this->postVoucher($request, $voucher);
            return redirect()->route('accounting.vouchers.show', $voucher)->with('success', 'Voucher posted successfully.');
        }

        return redirect()->route('accounting.vouchers.show', $voucher)->with('success', $intent === 'submit' ? 'Voucher created and submitted.' : 'Accounting voucher created.');
    }

    public function update(Request $request, AccountingVoucher $voucher)
    {
        if ($voucher->status !== 'draft') {
            return redirect()->back()->with('error', 'Only draft vouchers can be updated.');
        }

        $data = $this->validatePayload($request);
        $intent = $this->resolveIntent($request);

        DB::transaction(function () use ($voucher, $data, $request, $intent) {
            $this->applySmartDefaultSelectionIfRequested($data, $request->user()?->id);
            $this->applyVendorCounterpartyDefaultIfRequested($data, $request->user()?->id);

            $voucher->update([
                'entry_mode' => $data['entry_mode'],
                'party_type' => $data['party_type'] ?? null,
                'party_id' => $data['party_id'] ?? null,
                'invoice_type' => $data['invoice_type'] ?? null,
                'invoice_id' => $data['invoice_id'] ?? null,
                'expense_type_id' => $data['expense_type_id'] ?? null,
                'template_id' => $data['template_id'] ?? null,
                'amount' => (float) ($data['amount'] ?? 0),
                'payment_rows' => $data['payment_rows'] ?? null,
                'voucher_date' => $data['voucher_date'],
                'posting_date' => $data['posting_date'],
                'tenant_id' => $data['tenant_id'] ?? null,
                'department_id' => $data['department_id'] ?? null,
                'reference_no' => $data['reference_no'] ?? null,
                'external_reference_no' => $data['external_reference_no'] ?? null,
                'currency_code' => $data['currency_code'],
                'exchange_rate' => $data['exchange_rate'],
                'payment_account_id' => $data['payment_account_id'] ?? null,
                'instrument_type' => $data['instrument_type'] ?? null,
                'instrument_no' => $data['instrument_no'] ?? null,
                'instrument_date' => $data['instrument_date'] ?? null,
                'bank_reference' => $data['bank_reference'] ?? null,
                'deposit_reference' => $data['deposit_reference'] ?? null,
                'clearing_date' => $data['clearing_date'] ?? null,
                'period_id' => $this->periodGate->resolveOpenPeriodId($data['posting_date']),
                'remarks' => $data['remarks'] ?? null,
                'system_narration' => $data['system_narration'] ?? null,
                'updated_by' => $request->user()?->id,
            ]);

            $this->syncLines($voucher, $data);
            $this->syncAttachments($voucher, $request);
            $this->maybeSaveTemplate($request, $data);
            $this->applyIntentState($voucher, $intent, $request->user()?->id);
            $this->logAction($voucher->id, 'updated', 'Accounting voucher draft updated.', $request->user()?->id);
            $this->recordOperationalEvent($voucher->id, 'accounting.voucher.updated', 'completed', 'info', 'Accounting voucher draft updated.', $request->user()?->id, [
                'voucher_no' => $voucher->voucher_no,
                'voucher_type' => $voucher->voucher_type,
                'entry_mode' => $voucher->entry_mode,
            ]);
        });

        if ($intent === 'post') {
            $this->postVoucher($request, $voucher->fresh());
            return redirect()->route('accounting.vouchers.show', $voucher)->with('success', 'Voucher posted successfully.');
        }

        return redirect()->route('accounting.vouchers.show', $voucher)->with('success', $intent === 'submit' ? 'Voucher updated and submitted.' : 'Accounting voucher updated.');
    }

    public function submit(Request $request, AccountingVoucher $voucher)
    {
        if ($voucher->status !== 'draft') {
            return redirect()->route('accounting.vouchers.show', $voucher)->with('error', 'Only draft vouchers can be submitted.');
        }

        $this->assertBalanced($voucher->lines()->get(['debit', 'credit'])->map(fn ($line) => [
            'debit' => (float) $line->debit,
            'credit' => (float) $line->credit,
        ])->all());

        $voucher->update([
            'status' => 'submitted',
            'submitted_by' => $request->user()?->id,
            'submitted_at' => now(),
        ]);

        $this->logAction($voucher->id, 'submitted', 'Accounting voucher submitted for approval.', $request->user()?->id);

        return redirect()->route('accounting.vouchers.show', $voucher)->with('success', 'Voucher submitted for approval.');
    }

    public function approve(Request $request, AccountingVoucher $voucher, AccountingEventDispatcher $dispatcher, StrictAccountingSyncService $strictSync)
    {
        if ($voucher->status !== 'submitted' && !($voucher->status === 'draft' && $this->allowDirectPostFromDraft())) {
            return redirect()->route('accounting.vouchers.show', $voucher)->with('error', 'Voucher cannot be approved in current state.');
        }

        $this->postApprovedVoucher($request, $voucher, $dispatcher, $strictSync);

        return redirect()->route('accounting.vouchers.show', $voucher)->with('success', 'Voucher approved and posted.');
    }

    public function reject(Request $request, AccountingVoucher $voucher)
    {
        if ($voucher->status !== 'submitted') {
            return redirect()->route('accounting.vouchers.show', $voucher)->with('error', 'Voucher cannot be rejected in current state.');
        }

        $voucher->update([
            'status' => 'draft',
        ]);

        $this->logAction($voucher->id, 'rejected', 'Accounting voucher sent back to draft.', $request->user()?->id);

        return redirect()->route('accounting.vouchers.show', $voucher)->with('success', 'Voucher moved back to draft.');
    }

    public function cancel(Request $request, AccountingVoucher $voucher)
    {
        if (!in_array($voucher->status, ['draft', 'submitted'], true)) {
            return redirect()->route('accounting.vouchers.show', $voucher)->with('error', 'Only draft or submitted vouchers can be cancelled.');
        }

        $voucher->update([
            'status' => 'cancelled',
            'cancelled_by' => $request->user()?->id,
            'cancelled_at' => now(),
        ]);

        $this->logAction($voucher->id, 'cancelled', 'Accounting voucher cancelled.', $request->user()?->id);

        return redirect()->route('accounting.vouchers.show', $voucher)->with('success', 'Voucher cancelled.');
    }

    public function removeAttachment(Request $request, AccountingVoucher $voucher, Media $media)
    {
        if ($voucher->status !== 'draft') {
            return redirect()->back()->with('error', 'Attachments can only be removed while voucher is draft.');
        }

        if ((int) $media->mediable_id !== (int) $voucher->id || $media->mediable_type !== AccountingVoucher::class) {
            return redirect()->back()->with('error', 'Attachment does not belong to this voucher.');
        }

        if ($media->file_path) {
            Storage::disk($media->disk ?: 'public')->delete($media->file_path);
        }

        $media->delete();
        $this->logAction($voucher->id, 'attachment_removed', 'Voucher attachment removed before posting.', $request->user()?->id);
        $this->recordOperationalEvent($voucher->id, 'accounting.voucher.attachment_removed', 'completed', 'warning', 'Voucher attachment removed before posting.', $request->user()?->id, [
            'voucher_no' => $voucher->voucher_no,
            'media_id' => $media->id,
            'file_name' => $media->file_name,
        ]);

        return redirect()->back()->with('success', 'Attachment removed.');
    }

    public function reverse(Request $request, AccountingVoucher $voucher, AccountingEventDispatcher $dispatcher, StrictAccountingSyncService $strictSync)
    {
        if ($voucher->status !== 'posted') {
            return redirect()->route('accounting.vouchers.show', $voucher)->with('error', 'Only posted vouchers can be reversed.');
        }

        if ($voucher->reversal_voucher_id) {
            return redirect()->route('accounting.vouchers.show', $voucher)->with('error', 'This voucher is already reversed.');
        }

        $data = $request->validate([
            'reversal_date' => 'nullable|date',
            'reason' => 'required|string|max:500',
        ]);

        $userId = $request->user()?->id;
        $reversalDate = $data['reversal_date'] ?? now()->toDateString();

        DB::transaction(function () use ($voucher, $data, $reversalDate, $userId, $dispatcher, $strictSync) {
            $voucher->loadMissing('lines');

            $reversal = AccountingVoucher::query()->create([
                'voucher_no' => $this->nextVoucherNo($voucher->voucher_type),
                'voucher_type' => $voucher->voucher_type,
                'voucher_date' => $reversalDate,
                'posting_date' => $reversalDate,
                'tenant_id' => $voucher->tenant_id,
                'department_id' => $voucher->department_id,
                'reference_no' => $voucher->voucher_no,
                'external_reference_no' => $voucher->external_reference_no,
                'currency_code' => $voucher->currency_code,
                'exchange_rate' => $voucher->exchange_rate,
                'payment_account_id' => $voucher->payment_account_id,
                'instrument_type' => $voucher->instrument_type,
                'instrument_no' => $voucher->instrument_no,
                'instrument_date' => $voucher->instrument_date,
                'bank_reference' => $voucher->bank_reference,
                'deposit_reference' => $voucher->deposit_reference,
                'clearing_date' => $voucher->clearing_date,
                'period_id' => $this->periodGate->resolveOpenPeriodId($reversalDate),
                'status' => 'posted',
                'remarks' => trim("Reversal of {$voucher->voucher_no}. {$data['reason']}"),
                'created_by' => $userId,
                'submitted_by' => $userId,
                'submitted_at' => now(),
                'approved_by' => $userId,
                'approved_at' => now(),
                'posted_by' => $userId,
                'posted_at' => now(),
                'approval_reference' => 'REV-' . now()->format('YmdHis'),
            ]);

            foreach ($voucher->lines as $index => $line) {
                $reversal->lines()->create([
                    'account_id' => $line->account_id,
                    'department_id' => $line->department_id,
                    'debit' => (float) ($line->credit ?? 0),
                    'credit' => (float) ($line->debit ?? 0),
                    'vendor_id' => $line->vendor_id,
                    'member_id' => $line->member_id,
                    'employee_id' => $line->employee_id,
                    'reference_type' => $line->reference_type,
                    'reference_id' => $line->reference_id,
                    'tax_code' => $line->tax_code,
                    'tax_amount' => (float) ($line->tax_amount ?? 0),
                    'dimensions' => $line->dimensions,
                    'is_system_generated' => (bool) ($line->is_system_generated ?? false),
                    'description' => trim('Reversal: ' . ($line->description ?: '')),
                    'line_order' => $index + 1,
                ]);
            }

            $event = $dispatcher->dispatch(
                'accounting_voucher_posted',
                AccountingVoucher::class,
                (int) $reversal->id,
                [
                    'voucher_no' => $reversal->voucher_no,
                    'voucher_type' => $reversal->voucher_type,
                    'voucher_date' => $reversal->voucher_date?->toDateString(),
                    'posting_date' => $reversal->posting_date?->toDateString(),
                    'reversal_of' => $voucher->voucher_no,
                ],
                $userId,
                $reversal->tenant_id
            );

            $strictSync->enforceOrFail($event, "Voucher reversal {$reversal->voucher_no}");

            $this->reverseInvoiceAllocations($voucher, $reversal, $userId);

            $voucher->update([
                'status' => 'reversed',
                'reversed_by' => $userId,
                'reversed_at' => now(),
                'reversal_voucher_id' => $reversal->id,
            ]);

            $this->logAction($voucher->id, 'reversed', "Voucher reversed by {$reversal->voucher_no}. Reason: {$data['reason']}", $userId);
            $this->logAction($reversal->id, 'created', "Reversal voucher created from {$voucher->voucher_no}.", $userId);
            $this->logAction($reversal->id, 'approved', 'Reversal voucher auto-approved and posted.', $userId);
            $this->recordOperationalEvent($voucher->id, 'accounting.voucher.reversed', 'completed', 'warning', "Voucher reversed by {$reversal->voucher_no}.", $userId, [
                'voucher_no' => $voucher->voucher_no,
                'reversal_voucher_no' => $reversal->voucher_no,
                'reason' => $data['reason'],
                'reversal_date' => $reversalDate,
            ]);
            $this->recordOperationalEvent($reversal->id, 'accounting.voucher.reversal_created', 'completed', 'info', "Reversal voucher created from {$voucher->voucher_no}.", $userId, [
                'voucher_no' => $reversal->voucher_no,
                'source_voucher_no' => $voucher->voucher_no,
                'reason' => $data['reason'],
                'reversal_date' => $reversalDate,
            ]);
        });

        return redirect()->back()->with('success', 'Voucher reversed successfully.');
    }

    private function reverseInvoiceAllocations(AccountingVoucher $voucher, AccountingVoucher $reversal, ?int $userId): void
    {
        $voucher->loadMissing('allocations');
        if ($voucher->allocations->isEmpty()) {
            return;
        }

        foreach ($voucher->allocations as $allocation) {
            $amount = (float) $allocation->allocated_amount;
            if ($amount <= 0) {
                continue;
            }

            if ((string) $allocation->invoice_type === 'vendor_bill') {
                $bill = VendorBill::query()->whereKey((int) $allocation->invoice_id)->lockForUpdate()->first();
                if ($bill) {
                    $bill->paid_amount = max(0, (float) $bill->paid_amount - $amount);
                    if ((float) $bill->paid_amount + (float) $bill->advance_applied_amount + (float) $bill->return_applied_amount <= 0.0001) {
                        $bill->status = 'posted';
                    } else {
                        $bill->status = 'partially_paid';
                    }
                    $bill->save();
                }
            } elseif ((string) $allocation->invoice_type === 'financial_invoice') {
                $invoice = FinancialInvoice::query()->whereKey((int) $allocation->invoice_id)->lockForUpdate()->first();
                if ($invoice) {
                    $invoice->paid_amount = max(0, (float) ($invoice->paid_amount ?? 0) - $amount);
                    $invoice->status = (float) $invoice->paid_amount <= 0.0001 ? 'unpaid' : 'partially_paid';
                    $invoice->save();
                }
            }

            AccountingVoucherAllocation::query()->create([
                'voucher_id' => $reversal->id,
                'voucher_line_id' => null,
                'invoice_type' => (string) $allocation->invoice_type,
                'invoice_id' => (int) $allocation->invoice_id,
                'party_type' => (string) ($allocation->party_type ?: $voucher->party_type),
                'party_id' => (int) ($allocation->party_id ?: $voucher->party_id),
                'allocated_amount' => 0 - $amount,
                'currency_code' => (string) ($allocation->currency_code ?: $voucher->currency_code ?: 'PKR'),
                'exchange_rate' => (float) ($allocation->exchange_rate ?: $voucher->exchange_rate ?: 1),
                'allocated_at' => now(),
                'created_by' => $userId,
                'idempotency_key' => sprintf(
                    'voucher-allocation-reversal|%d|%d|%s|%d',
                    $voucher->id,
                    $reversal->id,
                    (string) $allocation->invoice_type,
                    (int) $allocation->invoice_id
                ),
            ]);
        }
    }

    private function formPayload(?AccountingVoucher $voucher): array
    {
        $this->autoAssignVendorDefaultMappings();

        if ($voucher) {
            $voucher->setAttribute('entry_mode', $this->normalizeEntryMode((string) $voucher->entry_mode));
        }

        return [
            'voucher' => $voucher,
            'accounts' => CoaAccount::query()->where('is_active', true)->where('is_postable', true)->orderBy('full_code')->get(['id', 'full_code', 'name', 'type', 'normal_balance']),
            'paymentAccounts' => PaymentAccount::query()
                ->where('status', 'active')
                ->orderBy('name')
                ->get(['id', 'tenant_id', 'name', 'payment_method', 'coa_account_id', 'is_default', 'status']),
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'branch_id']),
            'vendors' => Vendor::query()->where('status', 'active')->orderBy('name')->get(['id', 'name', 'payable_account_id', 'advance_account_id']),
            'customers' => Customer::query()->orderBy('name')->limit(500)->get(['id', 'name']),
            'members' => Member::query()
                ->orderByRaw("COALESCE(NULLIF(full_name, ''), CONCAT_WS(' ', first_name, middle_name, last_name)) asc")
                ->limit(500)
                ->get(['id', 'full_name', 'first_name', 'middle_name', 'last_name'])
                ->map(function (Member $member) {
                    $name = trim((string) ($member->full_name ?: implode(' ', array_filter([
                        $member->first_name,
                        $member->middle_name,
                        $member->last_name,
                    ]))));
                    return ['id' => (int) $member->id, 'name' => $name !== '' ? $name : ('Member #' . $member->id)];
                })
                ->values(),
            'corporateMembers' => CorporateMember::query()
                ->orderByRaw("COALESCE(NULLIF(full_name, ''), CONCAT_WS(' ', first_name, middle_name, last_name)) asc")
                ->limit(500)
                ->get(['id', 'full_name', 'first_name', 'middle_name', 'last_name'])
                ->map(function (CorporateMember $member) {
                    $name = trim((string) ($member->full_name ?: implode(' ', array_filter([
                        $member->first_name,
                        $member->middle_name,
                        $member->last_name,
                    ]))));
                    return ['id' => (int) $member->id, 'name' => $name !== '' ? $name : ('Corporate Member #' . $member->id)];
                })
                ->values(),
            'expenseTypes' => AccountingExpenseType::query()->where('is_active', true)->orderBy('name')->get(['id', 'code', 'name', 'expense_account_id']),
            'expenseAccounts' => CoaAccount::query()
                ->where('is_active', true)
                ->where('is_postable', true)
                ->where('type', 'expense')
                ->orderBy('full_code')
                ->get(['id', 'full_code', 'name', 'type']),
            'entryModes' => self::ENTRY_MODES,
            'partyTypes' => self::PARTY_TYPES,
            'canSetPaymentAccountDefault' => $this->canSetPaymentAccountDefault(auth()->user()),
            'canSetVendorCounterpartyDefault' => $this->canSetVendorCounterpartyDefault(auth()->user()),
            'baseCurrency' => 'PKR',
        ];
    }

    private function validatePayload(Request $request): array
    {
        $data = $request->validate([
            'voucher_type' => 'required|in:CPV,CRV,BPV,BRV,JV',
            'entry_mode' => 'required|in:smart,manual',
            'voucher_date' => 'required|date',
            'posting_date' => 'required|date',
            'tenant_id' => 'required|exists:tenants,id',
            'department_id' => 'nullable|exists:departments,id',
            'party_type' => 'nullable|in:none,vendor,customer,member,corporate_member',
            'party_id' => 'nullable|integer|min:1',
            'invoice_type' => 'nullable|in:vendor_bill,financial_invoice',
            'invoice_id' => 'nullable|integer|min:1',
            'expense_type_id' => 'nullable|exists:accounting_expense_types,id',
            'template_id' => 'nullable|exists:accounting_voucher_templates,id',
            'amount' => 'nullable|numeric|min:0',
            'payment_for' => 'nullable|in:expense,vendor_payment',
            'payment_mode' => 'nullable|in:direct,against_invoice',
            'vendor_id' => 'nullable|exists:vendors,id',
            'set_payment_account_as_default' => 'nullable|boolean',
            'counterparty_account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
            'set_vendor_counterparty_default' => 'nullable|boolean',
            'payment_rows' => 'nullable|array',
            'payment_rows.*.payment_mode' => 'nullable|in:direct,against_invoice',
            'payment_rows.*.invoice_id' => 'nullable|integer|min:1',
            'payment_rows.*.expense_account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true)->where('type', 'expense'))],
            'payment_rows.*.expense_type_id' => 'nullable|exists:accounting_expense_types,id',
            'payment_rows.*.qty' => 'nullable|numeric|min:0',
            'payment_rows.*.rate' => 'nullable|numeric|min:0',
            'payment_rows.*.amount' => 'nullable|numeric|min:0',
            'payment_rows.*.reference_no' => 'nullable|string|max:255',
            'payment_rows.*.remarks' => 'nullable|string|max:500',
            'payment_rows.*.counterparty_account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
            'reference_no' => 'nullable|string|max:255',
            'external_reference_no' => 'nullable|string|max:255',
            'currency_code' => 'required|string|max:12',
            'exchange_rate' => 'nullable|numeric|gt:0',
            'payment_account_id' => 'nullable|exists:payment_accounts,id',
            'instrument_type' => 'nullable|string|max:50',
            'instrument_no' => 'nullable|string|max:255',
            'instrument_date' => 'nullable|date',
            'bank_reference' => 'nullable|string|max:255',
            'deposit_reference' => 'nullable|string|max:255',
            'clearing_date' => 'nullable|date',
            'remarks' => 'nullable|string',
            'intent' => 'nullable|in:draft,submit,post',
            'save_template' => 'nullable|boolean',
            'template_name' => 'nullable|string|max:100',
            'template_scope' => 'nullable|in:user,global',
            'lines' => 'nullable|array',
            'lines.*.account_id' => ['nullable', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
            'lines.*.department_id' => 'nullable|exists:departments,id',
            'lines.*.debit' => 'nullable|numeric|min:0',
            'lines.*.credit' => 'nullable|numeric|min:0',
            'lines.*.vendor_id' => 'nullable|exists:vendors,id',
            'lines.*.member_id' => 'nullable|exists:members,id',
            'lines.*.employee_id' => 'nullable|exists:employees,id',
            'lines.*.party_type' => 'nullable|in:vendor,customer,member,corporate_member',
            'lines.*.party_id' => 'nullable|integer|min:1',
            'lines.*.description' => 'nullable|string|max:255',
            'lines.*.reference_type' => 'nullable|string|max:255',
            'lines.*.reference_id' => 'nullable|numeric|min:1',
            'lines.*.tax_code' => 'nullable|string|max:50',
            'lines.*.tax_amount' => 'nullable|numeric|min:0',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:5120',
        ]);

        $data['party_type'] = (string) ($data['party_type'] ?? 'none');
        $data['entry_mode'] = $this->normalizeEntryMode((string) ($data['entry_mode'] ?? 'smart'));
        $data['payment_mode'] = in_array((string) ($data['payment_mode'] ?? ''), ['direct', 'against_invoice'], true)
            ? (string) $data['payment_mode']
            : 'direct';
        $data['payment_for'] = in_array((string) ($data['payment_for'] ?? ''), ['expense', 'vendor_payment'], true)
            ? (string) $data['payment_for']
            : null;
        $data['vendor_id'] = !empty($data['vendor_id']) ? (int) $data['vendor_id'] : null;
        $data['set_payment_account_as_default'] = (bool) ($data['set_payment_account_as_default'] ?? false);
        $data['counterparty_account_id'] = !empty($data['counterparty_account_id']) ? (int) $data['counterparty_account_id'] : null;
        $data['set_vendor_counterparty_default'] = (bool) ($data['set_vendor_counterparty_default'] ?? false);
        $data['payment_rows'] = array_values(array_filter((array) ($data['payment_rows'] ?? []), function (array $row) {
            return !empty($row['expense_account_id'])
                || !empty($row['expense_type_id'])
                || !empty($row['invoice_id'])
                || (float) ($row['amount'] ?? 0) > 0
                || !empty($row['remarks'])
                || !empty($row['reference_no']);
        }));
        $data['lines'] = array_values(array_filter((array) ($data['lines'] ?? []), function (array $line) {
            return !empty($line['account_id']) || (float) ($line['debit'] ?? 0) > 0 || (float) ($line['credit'] ?? 0) > 0 || !empty($line['description']);
        }));

        if (strtoupper((string) $data['currency_code']) !== 'PKR' && empty($data['exchange_rate'])) {
            throw ValidationException::withMessages([
                'exchange_rate' => 'Exchange rate is required for foreign currency vouchers.',
            ]);
        }

        if ($data['voucher_type'] === 'JV') {
            $data['payment_account_id'] = null;
            if ($data['entry_mode'] !== 'manual') {
                throw ValidationException::withMessages([
                    'entry_mode' => 'Journal vouchers only support manual entry mode.',
                ]);
            }
        } elseif ($data['entry_mode'] !== 'smart') {
            throw ValidationException::withMessages([
                'entry_mode' => 'CPV/CRV/BPV/BRV vouchers only support smart entry mode.',
            ]);
        }

        $isSmartMode = $data['entry_mode'] === 'smart' && $data['voucher_type'] !== 'JV';
        $paymentVoucherTypes = ['CPV', 'BPV'];
        $isSmartPaymentVoucher = $isSmartMode && in_array((string) $data['voucher_type'], $paymentVoucherTypes, true);

        if ($isSmartPaymentVoucher) {
            $data['payment_rows'] = $this->normalizeSmartPaymentRows($data);
            if ((string) ($data['payment_for'] ?? '') === 'vendor_payment') {
                if (empty($data['vendor_id'])) {
                    throw ValidationException::withMessages([
                        'vendor_id' => 'Vendor / Payee is required for vendor payment vouchers.',
                    ]);
                }
                $data['party_type'] = 'vendor';
                $data['party_id'] = (int) $data['vendor_id'];
            } else {
                $data['party_type'] = 'none';
                $data['party_id'] = null;
                $data['vendor_id'] = null;
            }
            $data['invoice_type'] = null;
            $data['invoice_id'] = null;
            $data['expense_type_id'] = null;
            $data['counterparty_account_id'] = null;
            $data['set_vendor_counterparty_default'] = false;
        }

        $defaultSmartPaymentAccount = null;
        if ($isSmartMode) {
            $defaultSmartPaymentAccount = $this->resolveDefaultPaymentAccountForSmart(
                (int) $data['tenant_id'],
                (string) $data['voucher_type']
            );

            if ($defaultSmartPaymentAccount) {
                $data['payment_account_id'] = $defaultSmartPaymentAccount->id;
            } elseif (empty($data['payment_account_id'])) {
                throw ValidationException::withMessages([
                    'payment_account_id' => 'No default payment account is configured. Select an account to continue.',
                ]);
            }

            if ($data['set_payment_account_as_default'] && !$this->canSetPaymentAccountDefault($request->user())) {
                throw ValidationException::withMessages([
                    'set_payment_account_as_default' => 'You do not have permission to set branch default payment accounts from this screen.',
                ]);
            }
        } elseif ($data['voucher_type'] !== 'JV' && empty($data['payment_account_id'])) {
            throw ValidationException::withMessages([
                'payment_account_id' => 'Payment account is required in manual mode.',
            ]);
        }

        if ($isSmartMode && !$isSmartPaymentVoucher && (float) ($data['amount'] ?? 0) <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Amount is required in smart mode.',
            ]);
        }

        if (!empty($data['invoice_type']) xor !empty($data['invoice_id'])) {
            throw ValidationException::withMessages([
                'invoice_id' => 'Invoice type and invoice selection must be provided together.',
            ]);
        }

        if ($isSmartMode) {
            $hasExpenseContext = !empty($data['expense_type_id'])
                || ($isSmartPaymentVoucher && (string) ($data['payment_for'] ?? '') === 'expense');
            $hasPartyContext = !empty($data['party_id']) && ($data['party_type'] ?? 'none') !== 'none';
            $hasInvoiceContext = !empty($data['invoice_type']) && !empty($data['invoice_id'])
                || ($isSmartPaymentVoucher && collect($data['payment_rows'] ?? [])->contains(fn (array $row) => (string) ($row['payment_mode'] ?? 'direct') === 'against_invoice' && !empty($row['invoice_id'])));

            if (!($hasExpenseContext || $hasPartyContext || $hasInvoiceContext)) {
                throw ValidationException::withMessages([
                    'party_id' => 'Smart mode requires business context: party, invoice, or expense type.',
                ]);
            }

            if (in_array($data['voucher_type'], ['CPV', 'BPV'], true)) {
                if (!in_array((string) ($data['party_type'] ?? 'none'), ['none', 'vendor'], true)) {
                    throw ValidationException::withMessages([
                        'party_type' => 'CPV/BPV smart mode supports Vendor party context only.',
                    ]);
                }
                if ($isSmartPaymentVoucher && empty($data['payment_rows'])) {
                    throw ValidationException::withMessages([
                        'payment_rows' => 'Add at least one payment row for CPV/BPV smart mode.',
                    ]);
                }
                if ((string) ($data['payment_for'] ?? '') === 'vendor_payment' && ((string) ($data['party_type'] ?? 'none') !== 'vendor' || empty($data['party_id']))) {
                    throw ValidationException::withMessages([
                        'vendor_id' => 'Select Vendor / Payee for Vendor Payment.',
                    ]);
                }
                if ((string) ($data['payment_for'] ?? '') === 'expense' && !$hasExpenseContext) {
                    throw ValidationException::withMessages([
                        'payment_rows' => 'Add at least one expense row with Expense Account and Amount.',
                    ]);
                }
            }

            if (in_array($data['voucher_type'], ['CRV', 'BRV'], true)) {
                if (!in_array((string) ($data['party_type'] ?? 'none'), ['customer', 'member', 'corporate_member'], true)) {
                    throw ValidationException::withMessages([
                        'party_type' => 'CRV/BRV smart mode requires Customer/Member/Corporate party context.',
                    ]);
                }
                if (empty($data['party_id'])) {
                    throw ValidationException::withMessages([
                        'party_id' => 'Select a party for CRV/BRV smart mode.',
                    ]);
                }
                if (!empty($data['expense_type_id'])) {
                    throw ValidationException::withMessages([
                        'expense_type_id' => 'Expense type is not supported for CRV/BRV smart mode.',
                    ]);
                }
            }
        }

        $paymentAccount = !empty($data['payment_account_id'])
            ? PaymentAccount::query()->find($data['payment_account_id'])
            : null;

        $intent = $this->resolveIntent($request);
        if (Carbon::parse($data['posting_date'])->lt(Carbon::parse($data['voucher_date']))) {
            throw ValidationException::withMessages([
                'posting_date' => 'Posting date cannot be earlier than voucher date.',
            ]);
        }

        if (in_array($intent, ['submit', 'post'], true) && blank(trim((string) ($data['remarks'] ?? '')))) {
            throw ValidationException::withMessages([
                'remarks' => 'Narration is required before submit/post.',
            ]);
        }

        $this->validatePaymentAccountCompatibility($data['voucher_type'], $paymentAccount, $data);
        $invoiceContext = $this->resolveInvoiceContext($data);

        if ($isSmartPaymentVoucher && !empty($data['payment_rows'])) {
            [$effectiveLines, $resolvedRows] = $this->buildEffectiveLinesFromPaymentRows($data, $paymentAccount, $intent);
            $data['payment_rows'] = $resolvedRows;
            $counterpartyResolution = null;
            $invoiceContext = null;
        } else {
            $counterpartyResolution = $this->resolveCounterpartyAccountForVoucher($data, $intent);
            $effectiveLines = $this->buildEffectiveLines(
                $data,
                $paymentAccount,
                $invoiceContext,
                $counterpartyResolution['account_id'] ?? null
            );
        }
        $this->assertBalanced($effectiveLines);

        if ($data['entry_mode'] === 'manual') {
            if (empty($data['lines']) || count($data['lines']) < 2) {
                throw ValidationException::withMessages([
                    'lines' => 'At least two valid lines are required for manual entry.',
                ]);
            }
            $this->validateVoucherTypeLineShape($data['voucher_type'], $data['lines']);
        } else {
            $data['lines'] = [];
        }

        $data['amount'] = (float) ($data['amount'] ?? 0);
        if ($isSmartPaymentVoucher && !empty($data['payment_rows'])) {
            $data['amount'] = (float) collect($data['payment_rows'])->sum(fn (array $row) => (float) ($row['amount'] ?? 0));
        }
        $data['system_narration'] = $this->buildSystemNarration($data, $paymentAccount, $invoiceContext);
        if (($data['amount'] ?? 0) <= 0) {
            $data['amount'] = (float) collect($effectiveLines)->sum(fn (array $line) => (float) ($line['debit'] ?? 0));
        }

        $data['effective_lines'] = $effectiveLines;
        $data['invoice_context'] = $invoiceContext;
        $data['counterparty_resolution'] = $counterpartyResolution;
        $data['should_set_payment_account_default'] = $isSmartMode
            && !$defaultSmartPaymentAccount
            && $data['set_payment_account_as_default']
            && !empty($data['payment_account_id']);
        $data['should_set_vendor_counterparty_default'] = !$isSmartPaymentVoucher && $isSmartMode
            && (string) ($data['voucher_type'] ?? '') === 'CPV'
            && (string) ($data['payment_for'] ?? '') === 'vendor_payment'
            && $data['set_vendor_counterparty_default']
            && (string) ($counterpartyResolution['resolved_via'] ?? '') === 'user_selected'
            && !empty($counterpartyResolution['account_id']);

        if ($data['should_set_vendor_counterparty_default'] && !$this->canSetVendorCounterpartyDefault($request->user())) {
            throw ValidationException::withMessages([
                'set_vendor_counterparty_default' => 'You do not have permission to set vendor account defaults from this screen.',
            ]);
        }

        return $data;
    }

    private function assertBalanced(array $lines): void
    {
        $debit = 0.0;
        $credit = 0.0;

        foreach ($lines as $idx => $line) {
            $d = (float) ($line['debit'] ?? 0);
            $c = (float) ($line['credit'] ?? 0);
            if ($d > 0 && $c > 0) {
                throw ValidationException::withMessages([
                    "lines.{$idx}" => 'A line cannot contain both debit and credit.',
                ]);
            }
            if ($d <= 0 && $c <= 0) {
                throw ValidationException::withMessages([
                    "lines.{$idx}" => 'A line must contain either debit or credit.',
                ]);
            }
            $debit += $d;
            $credit += $c;
        }

        if (abs($debit - $credit) > 0.0001) {
            throw ValidationException::withMessages([
                'lines' => 'Voucher lines must be balanced.',
            ]);
        }
    }

    private function syncLines(AccountingVoucher $voucher, array $data): void
    {
        $voucher->lines()->delete();

        foreach (array_values($data['effective_lines']) as $index => $line) {
            $voucher->lines()->create([
                'account_id' => $line['account_id'],
                'department_id' => $line['department_id'] ?? null,
                'debit' => (float) ($line['debit'] ?? 0),
                'credit' => (float) ($line['credit'] ?? 0),
                'vendor_id' => $line['vendor_id'] ?? null,
                'member_id' => $line['member_id'] ?? null,
                'employee_id' => $line['employee_id'] ?? null,
                'party_type' => $line['party_type'] ?? (($data['party_type'] ?? 'none') !== 'none' ? $data['party_type'] : null),
                'party_id' => $line['party_id'] ?? (($data['party_type'] ?? 'none') !== 'none' ? ($data['party_id'] ?? null) : null),
                'reference_type' => $line['reference_type'] ?? null,
                'reference_id' => $line['reference_id'] ?? null,
                'tax_code' => $line['tax_code'] ?? null,
                'tax_amount' => (float) ($line['tax_amount'] ?? 0),
                'dimensions' => $line['dimensions'] ?? null,
                'is_system_generated' => (bool) ($line['is_system_generated'] ?? false),
                'description' => $line['description'] ?? null,
                'line_order' => $index + 1,
            ]);
        }
    }

    private function nextVoucherNo(string $voucherType): string
    {
        $prefix = "{$voucherType}-" . now()->format('Y');
        $last = AccountingVoucher::query()
            ->where('voucher_no', 'like', "{$prefix}-%")
            ->latest('id')
            ->value('voucher_no');

        if (!$last) {
            return "{$prefix}-00001";
        }

        $serial = (int) substr((string) $last, strrpos((string) $last, '-') + 1);
        return sprintf('%s-%05d', $prefix, $serial + 1);
    }

    private function logAction(int $voucherId, string $action, string $remarks, ?int $userId): void
    {
        $normalized = strtolower(trim($action));
        $approvalAction = match ($normalized) {
            'submitted' => 'submitted',
            'approved' => 'approved',
            'rejected' => 'rejected',
            'cancelled', 'canceled', 'reversed', 'recalled' => 'recalled',
            default => null,
        };

        if (!$approvalAction) {
            return;
        }

        ApprovalAction::query()->create([
            'document_type' => 'accounting_voucher',
            'document_id' => $voucherId,
            'action' => $approvalAction,
            'remarks' => $remarks,
            'action_by' => $userId,
        ]);
    }

    private function recordOperationalEvent(
        int $voucherId,
        string $action,
        string $status,
        string $severity,
        string $message,
        ?int $userId,
        array $context = []
    ): void {
        OperationalAuditLog::query()->create([
            'correlation_id' => (string) (request()?->headers->get('X-Correlation-ID') ?: request()?->attributes->get('correlation_id') ?: ''),
            'module' => 'accounting',
            'entity_type' => 'accounting_voucher',
            'entity_id' => (string) $voucherId,
            'action' => $action,
            'status' => $status,
            'severity' => $severity,
            'message' => $message,
            'context_json' => $context,
            'actor_id' => $userId,
            'request_path' => request()?->path(),
            'ip' => request()?->ip(),
        ]);
    }

    private function buildPrintPayload(AccountingVoucher $voucher): array
    {
        $voucher->loadMissing(['lines.account', 'lines.department', 'tenant', 'department', 'paymentAccount.coaAccount', 'media', 'createdBy', 'approvedBy', 'postedBy', 'cancelledBy', 'reversedBy', 'reversalVoucher', 'allocations']);
        $generatedAt = now()->format('d/m/Y h:i A');
        $paymentForLabel = $this->paymentForLabel($voucher);
        $entryMode = $this->entryModeLabel((string) ($voucher->entry_mode ?: 'smart'));
        $isSmartVoucher = $entryMode === 'Smart';
        $vendorName = ((string) $voucher->party_type === 'vendor' && (int) ($voucher->party_id ?? 0) > 0)
            ? (Vendor::query()->whereKey((int) $voucher->party_id)->value('name') ?: '-')
            : '-';
        $reversalLog = OperationalAuditLog::query()
            ->where('module', 'accounting')
            ->where('entity_type', 'accounting_voucher')
            ->where('entity_id', (string) $voucher->id)
            ->where('action', 'accounting.voucher.reversed')
            ->latest('id')
            ->first();
        $reversalReason = (string) data_get($reversalLog?->context_json, 'reason', '-');
        $reversalDate = (string) data_get($reversalLog?->context_json, 'reversal_date', optional($voucher->reversed_at)->toDateString() ?: '-');

        $totalDebit = (float) $voucher->lines->sum(fn ($line) => (float) ($line->debit ?? 0));
        $totalCredit = (float) $voucher->lines->sum(fn ($line) => (float) ($line->credit ?? 0));
        $difference = abs($totalDebit - $totalCredit);
        $paymentRows = collect((array) ($voucher->payment_rows ?? []))
            ->values()
            ->map(function (array $row, int $index) use ($voucher) {
                $expenseAccount = !empty($row['expense_account_id'])
                    ? CoaAccount::query()->whereKey((int) $row['expense_account_id'])->first(['id', 'full_code', 'name'])
                    : null;
                $invoiceNo = '-';
                $invoiceOutstanding = null;
                if (!empty($row['invoice_id']) && (string) ($row['payment_mode'] ?? 'direct') === 'against_invoice') {
                    $invoiceNo = $this->resolveAllocationDocumentNo('vendor_bill', (int) $row['invoice_id']);
                    $invoiceOutstanding = $this->resolveAllocationOutstanding('vendor_bill', (int) $row['invoice_id']);
                }

                return [
                    'row_no' => $index + 1,
                    'payment_mode' => ucfirst(str_replace('_', ' ', (string) ($row['payment_mode'] ?? 'direct'))),
                    'expense_account' => $expenseAccount
                        ? trim("{$expenseAccount->full_code} - {$expenseAccount->name}")
                        : '-',
                    'invoice_no' => $invoiceNo,
                    'invoice_outstanding' => $invoiceOutstanding,
                    'amount' => number_format((float) ($row['amount'] ?? 0), 2, '.', ','),
                    'reference_no' => (string) ($row['reference_no'] ?? '-'),
                    'remarks' => (string) ($row['remarks'] ?? '-'),
                ];
            })
            ->all();

        $postingLines = $voucher->lines->map(function ($line) {
            return [
                'account' => trim((string) (($line->account?->full_code ?: '-') . ' - ' . ($line->account?->name ?: '-'))),
                'description' => (string) ($line->description ?: '-'),
                'cost_center' => (string) ($line->department?->name ?: '-'),
                'source' => (bool) ($line->is_system_generated ?? false) ? 'Auto' : 'Manual',
                'debit' => number_format((float) ($line->debit ?? 0), 2, '.', ','),
                'credit' => number_format((float) ($line->credit ?? 0), 2, '.', ','),
            ];
        })->values()->all();

        $allocationRows = $voucher->allocations->map(function (AccountingVoucherAllocation $allocation) {
            return [
                'invoice_no' => $this->resolveAllocationDocumentNo((string) $allocation->invoice_type, (int) $allocation->invoice_id),
                'invoice_type' => ucwords(str_replace('_', ' ', (string) $allocation->invoice_type)),
                'party' => (string) ($allocation->party_type ?: '-') . ((int) ($allocation->party_id ?: 0) > 0 ? (' #' . (int) $allocation->party_id) : ''),
                'allocated_amount' => number_format((float) $allocation->allocated_amount, 2, '.', ','),
                'remaining_outstanding' => number_format((float) $this->resolveAllocationOutstanding((string) $allocation->invoice_type, (int) $allocation->invoice_id), 2, '.', ','),
                'allocated_at' => optional($allocation->allocated_at)->format('d/m/Y h:i A') ?: '-',
            ];
        })->values()->all();

        $paymentAccountLabel = trim((string) (($voucher->paymentAccount?->coaAccount?->full_code ?? '') . ' - ' . ($voucher->paymentAccount?->name ?: '-')), ' -');
        $metadata = [
            'voucher_no' => (string) $voucher->voucher_no,
            'voucher_type' => (string) $voucher->voucher_type,
            'entry_mode' => $entryMode,
            'voucher_date' => optional($voucher->voucher_date)->format('d/m/Y') ?: '-',
            'posting_date' => optional($voucher->posting_date)->format('d/m/Y') ?: '-',
            'branch' => (string) ($voucher->tenant?->name ?: '-'),
            'cost_center' => (string) ($voucher->department?->name ?: '-'),
            'payment_for' => $paymentForLabel,
            'vendor_payee' => $vendorName,
            'payment_account' => $paymentAccountLabel !== '' ? $paymentAccountLabel : '-',
            'reference_no' => (string) ($voucher->reference_no ?: '-'),
            'external_reference_no' => (string) ($voucher->external_reference_no ?: '-'),
            'currency' => (string) ($voucher->currency_code ?: 'PKR'),
            'exchange_rate' => number_format((float) ($voucher->exchange_rate ?: 1), 6, '.', ','),
            'status' => (string) ($voucher->status ?: '-'),
            'amount' => number_format((float) ($voucher->amount ?? 0), 2, '.', ','),
            'approval_reference' => (string) ($voucher->approval_reference ?: '-'),
            'reversal_voucher' => (string) ($voucher->reversalVoucher?->voucher_no ?: '-'),
            'reversal_date' => $reversalDate,
            'reversal_reason' => $reversalReason,
        ];

        $audit = [
            'prepared_by' => (string) ($voucher->createdBy?->name ?: 'N/A'),
            'prepared_at' => optional($voucher->created_at)->format('d/m/Y h:i A') ?: 'N/A',
            'approved_by' => (string) ($voucher->approvedBy?->name ?: ($voucher->status === 'submitted' ? 'Pending' : 'N/A')),
            'approved_at' => optional($voucher->approved_at)->format('d/m/Y h:i A') ?: ($voucher->status === 'submitted' ? 'Pending' : 'N/A'),
            'posted_by' => (string) ($voucher->postedBy?->name ?: ($voucher->status === 'posted' ? 'System' : 'Pending')),
            'posted_at' => optional($voucher->posted_at)->format('d/m/Y h:i A') ?: ($voucher->status === 'posted' ? '-' : 'Pending'),
            'cancelled_by' => (string) ($voucher->cancelledBy?->name ?: '-'),
            'reversed_by' => (string) ($voucher->reversedBy?->name ?: '-'),
        ];

        $headerFields = [
            ['label' => 'Voucher No', 'value' => $metadata['voucher_no']],
            ['label' => 'Voucher Type', 'value' => $metadata['voucher_type']],
            ['label' => 'Entry Mode', 'value' => $metadata['entry_mode']],
            ['label' => 'Status', 'value' => $metadata['status']],
            ['label' => 'Voucher Date', 'value' => $metadata['voucher_date']],
            ['label' => 'Posting Date', 'value' => $metadata['posting_date']],
            ['label' => 'Branch / Business Unit', 'value' => $metadata['branch']],
            ['label' => 'Cost Center', 'value' => $metadata['cost_center']],
        ];

        $paymentContextFields = [
            ['label' => 'Payment For', 'value' => $metadata['payment_for']],
            ['label' => 'Vendor / Payee', 'value' => $metadata['vendor_payee']],
            ['label' => 'Payment Account', 'value' => $metadata['payment_account']],
            ['label' => 'Reference No', 'value' => $metadata['reference_no']],
            ['label' => 'Approval Reference', 'value' => $metadata['approval_reference']],
        ];

        if ($metadata['external_reference_no'] !== '-') {
            $paymentContextFields[] = ['label' => 'External Reference', 'value' => $metadata['external_reference_no']];
        }

        $financialContextFields = [
            ['label' => 'Currency', 'value' => $metadata['currency']],
            ['label' => 'Exchange Rate', 'value' => $metadata['exchange_rate']],
            ['label' => 'Voucher Amount', 'value' => $metadata['amount']],
            ['label' => 'Prepared By', 'value' => $audit['prepared_by']],
            ['label' => 'Prepared At', 'value' => $audit['prepared_at']],
        ];

        if ($metadata['reversal_voucher'] !== '-') {
            $financialContextFields[] = ['label' => 'Reversal Voucher', 'value' => $metadata['reversal_voucher']];
            $financialContextFields[] = ['label' => 'Reversal Date', 'value' => $metadata['reversal_date']];
            $financialContextFields[] = ['label' => 'Reversal Reason', 'value' => $metadata['reversal_reason']];
        }

        return [
            'title' => 'Accounting Voucher',
            'companyName' => config('app.name', 'AFOHS Club'),
            'generatedAt' => $generatedAt,
            'logoDataUri' => $this->logoDataUri(),
            'voucher' => $metadata,
            'headerFields' => $headerFields,
            'paymentContextFields' => $paymentContextFields,
            'financialContextFields' => $financialContextFields,
            'paymentRows' => $paymentRows,
            'postingLines' => $postingLines,
            'allocations' => $allocationRows,
            'totals' => [
                'debit_total' => number_format($totalDebit, 2, '.', ','),
                'credit_total' => number_format($totalCredit, 2, '.', ','),
                'difference' => number_format($difference, 2, '.', ','),
                'voucher_total' => number_format((float) ($voucher->amount ?? 0), 2, '.', ','),
            ],
            'audit' => $audit,
            'remarks' => (string) ($voucher->remarks ?: '-'),
            'systemNarration' => (string) ($voucher->system_narration ?: '-'),
            'generatedBy' => auth()->user()?->name ?: 'System',
            'isSmartVoucher' => $isSmartVoucher,
        ];
    }

    private function logoDataUri(): ?string
    {
        return app(StaticDocumentBrandingResolver::class)->resolveLogoDataUri();
    }

    private function resolveIntent(Request $request): string
    {
        return in_array($request->input('intent'), ['draft', 'submit', 'post'], true) ? (string) $request->input('intent') : 'draft';
    }

    private function applyIntentState(AccountingVoucher $voucher, string $intent, ?int $userId): void
    {
        if ($intent === 'submit') {
            $voucher->update([
                'status' => 'submitted',
                'submitted_by' => $userId,
                'submitted_at' => now(),
            ]);
            $this->logAction($voucher->id, 'submitted', 'Accounting voucher submitted from form.', $userId);
        }
    }

    private function validatePaymentAccountCompatibility(string $voucherType, ?PaymentAccount $paymentAccount, array $data): void
    {
        if ($voucherType === 'JV') {
            return;
        }

        if (!$paymentAccount || !$paymentAccount->coa_account_id || $paymentAccount->status !== 'active') {
            throw ValidationException::withMessages([
                'payment_account_id' => 'A valid active payment account with COA mapping is required.',
            ]);
        }

        $method = strtolower((string) $paymentAccount->payment_method);
        if (in_array($voucherType, ['CPV', 'CRV'], true) && !in_array($method, self::CASH_METHODS, true)) {
            throw ValidationException::withMessages([
                'payment_account_id' => 'Cash vouchers require a cash payment account.',
            ]);
        }

        if (in_array($voucherType, ['BPV', 'BRV'], true) && !in_array($method, self::BANK_METHODS, true)) {
            throw ValidationException::withMessages([
                'payment_account_id' => 'Bank vouchers require a bank payment account.',
            ]);
        }

        if ($voucherType === 'BPV' && in_array(($data['instrument_type'] ?? ''), ['cheque', 'Cheque'], true)) {
            if (empty($data['instrument_no']) || empty($data['instrument_date'])) {
                throw ValidationException::withMessages([
                    'instrument_no' => 'Cheque number and cheque date are required for cheque payments.',
                ]);
            }
        }
    }

    private function resolveDefaultPaymentAccountForSmart(int $tenantId, string $voucherType): ?PaymentAccount
    {
        $methods = in_array($voucherType, ['CPV', 'CRV'], true) ? self::CASH_METHODS : self::BANK_METHODS;

        $defaults = PaymentAccount::query()
            ->where(function ($query) use ($tenantId) {
                $query->where('tenant_id', $tenantId)
                    ->orWhereNull('tenant_id');
            })
            ->where('status', 'active')
            ->where('is_default', true)
            ->orderByDesc('id')
            ->get();

        return $defaults->first(function (PaymentAccount $account) use ($methods) {
            return in_array(strtolower((string) $account->payment_method), $methods, true);
        });
    }

    private function validateVoucherTypeLineShape(string $voucherType, array $lines): void
    {
        foreach ($lines as $idx => $line) {
            $debit = (float) ($line['debit'] ?? 0);
            $credit = (float) ($line['credit'] ?? 0);

            if (in_array($voucherType, ['CPV', 'BPV'], true) && $credit > 0) {
                throw ValidationException::withMessages([
                    "lines.{$idx}.credit" => 'Payment vouchers only allow debit counterpart rows. The credit side is auto-generated.',
                ]);
            }

            if (in_array($voucherType, ['CRV', 'BRV'], true) && $debit > 0) {
                throw ValidationException::withMessages([
                    "lines.{$idx}.debit" => 'Receipt vouchers only allow credit counterpart rows. The debit side is auto-generated.',
                ]);
            }
        }
    }

    private function buildEffectiveLines(array $data, ?PaymentAccount $paymentAccount, ?array $invoiceContext = null, ?int $counterpartyAccountId = null): array
    {
        $isManualMode = $data['entry_mode'] === 'manual' || $data['voucher_type'] === 'JV';

        $editableLines = array_values(array_map(function (array $line) use ($data) {
            return [
                'account_id' => $line['account_id'] ?? null,
                'department_id' => $line['department_id'] ?? ($data['department_id'] ?? null),
                'debit' => (float) ($line['debit'] ?? 0),
                'credit' => (float) ($line['credit'] ?? 0),
                'vendor_id' => $line['vendor_id'] ?? null,
                'member_id' => $line['member_id'] ?? null,
                'employee_id' => $line['employee_id'] ?? null,
                'party_type' => $line['party_type'] ?? null,
                'party_id' => $line['party_id'] ?? null,
                'reference_type' => $line['reference_type'] ?? null,
                'reference_id' => $line['reference_id'] ?? null,
                'tax_code' => $line['tax_code'] ?? null,
                'tax_amount' => (float) ($line['tax_amount'] ?? 0),
                'description' => $line['description'] ?? null,
                'dimensions' => null,
                'is_system_generated' => false,
            ];
        }, $data['lines']));

        if ($isManualMode) {
            foreach ($editableLines as &$line) {
                $line['description'] = $line['description'] ?: ($data['system_narration'] ?? null);
                $line['department_id'] = $line['department_id'] ?? ($data['department_id'] ?? null);
            }
            return $editableLines;
        }

        $amount = (float) ($data['amount'] ?? 0);
        if ($amount <= 0 && $invoiceContext) {
            $amount = (float) ($invoiceContext['amount'] ?? 0);
        }
        if ($amount <= 0) {
            $amount = (float) collect($editableLines)->sum(function (array $line) use ($data) {
                return in_array($data['voucher_type'], ['CPV', 'BPV'], true) ? $line['debit'] : $line['credit'];
            });
        }

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                'amount' => 'Voucher amount must be greater than zero.',
            ]);
        }

        if ($invoiceContext && $amount - (float) ($invoiceContext['outstanding'] ?? 0) > 0.009) {
            throw ValidationException::withMessages([
                'amount' => 'Voucher amount cannot exceed selected invoice outstanding.',
            ]);
        }

        if (!$counterpartyAccountId) {
            return [];
        }
        $referenceType = $invoiceContext['reference_type'] ?? $this->partyReferenceType($data['party_type'] ?? 'none');
        $referenceId = $invoiceContext['reference_id'] ?? (($data['party_type'] ?? 'none') === 'none' ? null : (int) ($data['party_id'] ?? 0));

        $isPaymentVoucher = in_array($data['voucher_type'], ['CPV', 'BPV'], true);
        $mainLine = [
            'account_id' => $paymentAccount?->coa_account_id,
            'department_id' => $data['department_id'] ?? null,
            'debit' => $isPaymentVoucher ? 0 : $amount,
            'credit' => $isPaymentVoucher ? $amount : 0,
            'vendor_id' => $data['party_type'] === 'vendor' ? (int) ($data['party_id'] ?? 0) : null,
            'member_id' => $data['party_type'] === 'member' ? (int) ($data['party_id'] ?? 0) : null,
            'employee_id' => null,
            'party_type' => ($data['party_type'] ?? 'none') !== 'none' ? (string) $data['party_type'] : null,
            'party_id' => ($data['party_type'] ?? 'none') !== 'none' ? (int) ($data['party_id'] ?? 0) : null,
            'reference_type' => PaymentAccount::class,
            'reference_id' => $paymentAccount?->id,
            'tax_code' => null,
            'tax_amount' => 0,
            'description' => $data['system_narration'] ?? $this->systemLineDescription($data['voucher_type'], $paymentAccount),
            'dimensions' => null,
            'is_system_generated' => true,
        ];

        $counterpartyLine = [
            'account_id' => $counterpartyAccountId,
            'department_id' => $data['department_id'] ?? null,
            'debit' => $isPaymentVoucher ? $amount : 0,
            'credit' => $isPaymentVoucher ? 0 : $amount,
            'vendor_id' => $data['party_type'] === 'vendor' ? (int) ($data['party_id'] ?? 0) : null,
            'member_id' => $data['party_type'] === 'member' ? (int) ($data['party_id'] ?? 0) : null,
            'employee_id' => null,
            'party_type' => ($data['party_type'] ?? 'none') !== 'none' ? (string) $data['party_type'] : null,
            'party_id' => ($data['party_type'] ?? 'none') !== 'none' ? (int) ($data['party_id'] ?? 0) : null,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'tax_code' => null,
            'tax_amount' => 0,
            'description' => $data['system_narration'] ?? null,
            'dimensions' => null,
            'is_system_generated' => true,
        ];

        return [$counterpartyLine, $mainLine];
    }

    private function normalizeSmartPaymentRows(array $data): array
    {
        $rows = array_values((array) ($data['payment_rows'] ?? []));
        $paymentFor = (string) ($data['payment_for'] ?? 'expense');
        if (empty($rows)) {
            $rows = [[
                'payment_mode' => (string) ($data['payment_mode'] ?? 'direct'),
                'invoice_id' => (int) ($data['invoice_id'] ?? 0),
                'expense_account_id' => (int) ($data['counterparty_account_id'] ?? 0),
                'amount' => (float) ($data['amount'] ?? 0),
                'reference_no' => (string) ($data['reference_no'] ?? ''),
                'remarks' => (string) ($data['remarks'] ?? ''),
                'counterparty_account_id' => (int) ($data['counterparty_account_id'] ?? 0),
            ]];
        }

        $normalized = [];
        foreach ($rows as $index => $row) {
            $paymentMode = (string) ($row['payment_mode'] ?? 'direct');
            if (!in_array($paymentMode, ['direct', 'against_invoice'], true)) {
                $paymentMode = 'direct';
            }
            if ($paymentFor === 'expense') {
                $paymentMode = 'direct';
            }

            $inputAmount = (float) ($row['amount'] ?? 0);
            $legacyQty = (float) ($row['qty'] ?? 0);
            $legacyRate = (float) ($row['rate'] ?? 0);
            $amount = $inputAmount > 0 ? round($inputAmount, 2) : round($legacyQty * $legacyRate, 2);
            if ($amount <= 0) {
                throw ValidationException::withMessages([
                    "payment_rows.{$index}.amount" => 'Row amount must be greater than zero.',
                ]);
            }

            if ($paymentFor === 'expense' && $paymentMode === 'against_invoice') {
                throw ValidationException::withMessages([
                    "payment_rows.{$index}.payment_mode" => 'Expense rows support Direct mode only.',
                ]);
            }

            $normalized[] = [
                'payment_mode' => $paymentMode,
                'invoice_id' => !empty($row['invoice_id']) ? (int) $row['invoice_id'] : null,
                'expense_account_id' => !empty($row['expense_account_id']) ? (int) $row['expense_account_id'] : null,
                'amount' => $amount,
                'reference_no' => trim((string) ($row['reference_no'] ?? '')),
                'remarks' => trim((string) ($row['remarks'] ?? '')),
                'counterparty_account_id' => !empty($row['counterparty_account_id']) ? (int) $row['counterparty_account_id'] : null,
            ];
        }

        return $normalized;
    }

    private function buildEffectiveLinesFromPaymentRows(array $data, ?PaymentAccount $paymentAccount, string $intent): array
    {
        $rows = (array) ($data['payment_rows'] ?? []);
        if (empty($rows)) {
            throw ValidationException::withMessages([
                'payment_rows' => 'At least one payment row is required.',
            ]);
        }

        $debitLines = [];
        $resolvedRows = [];
        $total = 0.0;
        $voucherVendorId = null;
        $seenInvoiceKeys = [];

        foreach ($rows as $index => $row) {
            $amount = (float) ($row['amount'] ?? 0);
            $paymentFor = (string) ($data['payment_for'] ?? 'expense');
            $paymentMode = (string) ($row['payment_mode'] ?? 'direct');

            $line = [
                'account_id' => null,
                'department_id' => $data['department_id'] ?? null,
                'debit' => $amount,
                'credit' => 0.0,
                'vendor_id' => null,
                'member_id' => null,
                'employee_id' => null,
                'party_type' => null,
                'party_id' => null,
                'reference_type' => null,
                'reference_id' => null,
                'tax_code' => null,
                'tax_amount' => 0,
                'description' => null,
                'dimensions' => null,
                'is_system_generated' => true,
            ];

            $resolvedRow = $row;
            $invoiceContext = null;

            if ($paymentFor === 'expense') {
                $expenseAccountId = (int) ($row['expense_account_id'] ?? 0);
                if ($expenseAccountId <= 0) {
                    throw ValidationException::withMessages([
                        "payment_rows.{$index}.expense_account_id" => 'Expense Account is required.',
                    ]);
                }
                $expenseAccount = CoaAccount::query()
                    ->whereKey($expenseAccountId)
                    ->where('is_active', true)
                    ->where('is_postable', true)
                    ->where('type', 'expense')
                    ->first();
                if (!$expenseAccount) {
                    throw ValidationException::withMessages([
                        "payment_rows.{$index}.expense_account_id" => 'Selected expense account is inactive or invalid.',
                    ]);
                }

                $line['account_id'] = (int) $expenseAccount->id;
                $line['description'] = trim((string) ($row['remarks'] ?: ("Expense payment for {$expenseAccount->name}")));
            } else {
                $vendorId = (int) ($data['vendor_id'] ?? 0);
                if ($vendorId <= 0) {
                    throw ValidationException::withMessages([
                        'vendor_id' => 'Vendor / Payee is required for vendor payment rows.',
                    ]);
                }
                $voucherVendorId = $vendorId;

                $line['vendor_id'] = $vendorId;
                $line['party_type'] = 'vendor';
                $line['party_id'] = $vendorId;

                if ($paymentMode === 'against_invoice') {
                    $invoiceId = (int) ($row['invoice_id'] ?? 0);
                    if ($invoiceId <= 0) {
                        throw ValidationException::withMessages([
                            "payment_rows.{$index}.invoice_id" => 'Invoice is required for Against Invoice rows.',
                        ]);
                    }
                    $invoiceKey = "vendor_bill:{$invoiceId}";
                    if (in_array($invoiceKey, $seenInvoiceKeys, true)) {
                        throw ValidationException::withMessages([
                            "payment_rows.{$index}.invoice_id" => 'Duplicate invoice row is not allowed in same voucher.',
                        ]);
                    }
                    $seenInvoiceKeys[] = $invoiceKey;

                    $invoiceContext = $this->resolveInvoiceContext([
                        'voucher_type' => $data['voucher_type'],
                        'invoice_type' => 'vendor_bill',
                        'invoice_id' => $invoiceId,
                        'party_type' => 'vendor',
                        'party_id' => $vendorId,
                    ]);

                    if ($amount - (float) ($invoiceContext['outstanding'] ?? 0) > 0.009) {
                        throw ValidationException::withMessages([
                            "payment_rows.{$index}.amount" => 'Row amount cannot exceed selected invoice outstanding.',
                        ]);
                    }
                }

                $counterpartyResolution = $this->resolveCounterpartyAccountForVoucher([
                    'voucher_type' => $data['voucher_type'],
                    'entry_mode' => 'smart',
                    'payment_for' => 'vendor_payment',
                    'payment_mode' => $paymentMode,
                    'party_type' => 'vendor',
                    'party_id' => $vendorId,
                    'counterparty_account_id' => $row['counterparty_account_id'] ?? null,
                ], $intent);

                $line['account_id'] = (int) ($counterpartyResolution['account_id'] ?? 0);
                $line['reference_type'] = $invoiceContext['reference_type'] ?? Vendor::class;
                $line['reference_id'] = (int) ($invoiceContext['reference_id'] ?? $vendorId);
                $line['description'] = trim((string) ($row['remarks'] ?: ($paymentMode === 'against_invoice'
                    ? "Vendor payment against bill {$invoiceContext['number']}"
                    : "Vendor payment")));
                $resolvedRow['counterparty_resolution'] = $counterpartyResolution;
            }

            if (!(int) $line['account_id']) {
                throw ValidationException::withMessages([
                    "payment_rows.{$index}.amount" => 'Unable to resolve a valid counterparty account for this row.',
                ]);
            }

            $resolvedRow['invoice_context'] = $invoiceContext;
            $debitLines[] = $line;
            $resolvedRows[] = $resolvedRow;
            $total += $amount;
        }

        if ($total <= 0) {
            throw ValidationException::withMessages([
                'payment_rows' => 'Voucher total must be greater than zero.',
            ]);
        }

        $creditLine = [
            'account_id' => (int) ($paymentAccount?->coa_account_id ?? 0),
            'department_id' => $data['department_id'] ?? null,
            'debit' => 0.0,
            'credit' => round($total, 2),
            'vendor_id' => $voucherVendorId,
            'member_id' => null,
            'employee_id' => null,
            'party_type' => $voucherVendorId ? 'vendor' : null,
            'party_id' => $voucherVendorId,
            'reference_type' => PaymentAccount::class,
            'reference_id' => (int) ($paymentAccount?->id ?? 0),
            'tax_code' => null,
            'tax_amount' => 0,
            'description' => $data['system_narration'] ?? $this->systemLineDescription((string) $data['voucher_type'], $paymentAccount),
            'dimensions' => null,
            'is_system_generated' => true,
        ];

        $data['amount'] = round($total, 2);

        return [array_merge($debitLines, [$creditLine]), $resolvedRows];
    }

    private function partyReferenceType(string $partyType): ?string
    {
        return match ($partyType) {
            'vendor' => Vendor::class,
            'customer' => Customer::class,
            'member' => Member::class,
            'corporate_member' => CorporateMember::class,
            default => null,
        };
    }

    private function systemLineDescription(string $voucherType, ?PaymentAccount $paymentAccount): string
    {
        $label = in_array($voucherType, ['CPV', 'CRV'], true) ? 'Cash Account' : 'Bank Account';
        return trim($label . ' auto line' . ($paymentAccount?->name ? ' · ' . $paymentAccount->name : ''));
    }

    private function resolveInvoiceContext(array $data): ?array
    {
        if (empty($data['invoice_type']) || empty($data['invoice_id'])) {
            return null;
        }

        $invoiceType = (string) $data['invoice_type'];
        $invoiceId = (int) $data['invoice_id'];

        if ($invoiceType === 'vendor_bill') {
            $bill = VendorBill::query()->find($invoiceId);
            if (!$bill) {
                throw ValidationException::withMessages([
                    'invoice_id' => 'Selected vendor bill not found.',
                ]);
            }

            if ((int) ($data['party_id'] ?? 0) !== (int) $bill->vendor_id) {
                throw ValidationException::withMessages([
                    'party_id' => 'Selected vendor does not match selected bill.',
                ]);
            }

            if (!in_array((string) ($data['voucher_type'] ?? ''), ['CPV', 'BPV'], true)) {
                throw ValidationException::withMessages([
                    'voucher_type' => 'Vendor bill can only be used with CPV/BPV.',
                ]);
            }

            $outstanding = max(0, (float) $bill->grand_total - (float) $bill->paid_amount - (float) $bill->advance_applied_amount - (float) $bill->return_applied_amount);
            return [
                'invoice_type' => $invoiceType,
                'invoice_id' => $invoiceId,
                'outstanding' => $outstanding,
                'amount' => $outstanding,
                'number' => $bill->bill_no,
                'reference_type' => VendorBill::class,
                'reference_id' => $bill->id,
            ];
        }

        if ($invoiceType === 'financial_invoice') {
            $invoice = FinancialInvoice::query()->find($invoiceId);
            if (!$invoice) {
                throw ValidationException::withMessages([
                    'invoice_id' => 'Selected receivable invoice not found.',
                ]);
            }

            if (!in_array((string) ($data['voucher_type'] ?? ''), ['CRV', 'BRV'], true)) {
                throw ValidationException::withMessages([
                    'voucher_type' => 'Receivable invoice can only be used with CRV/BRV.',
                ]);
            }

            $partyType = (string) ($data['party_type'] ?? 'none');
            $partyId = (int) ($data['party_id'] ?? 0);

            $matchesParty = ($partyType === 'customer' && (int) $invoice->customer_id === $partyId)
                || ($partyType === 'member' && (int) $invoice->member_id === $partyId)
                || ($partyType === 'corporate_member' && (int) $invoice->corporate_member_id === $partyId);
            if (!$matchesParty) {
                throw ValidationException::withMessages([
                    'party_id' => 'Selected party does not match selected receivable invoice.',
                ]);
            }

            $outstanding = max(0, (float) ($invoice->total_price ?? 0) - (float) ($invoice->paid_amount ?? 0));
            return [
                'invoice_type' => $invoiceType,
                'invoice_id' => $invoiceId,
                'outstanding' => $outstanding,
                'amount' => $outstanding,
                'number' => $invoice->invoice_no,
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
            ];
        }

        throw ValidationException::withMessages([
            'invoice_type' => 'Unsupported invoice type.',
        ]);
    }

    private function canManualOverride(Request $request): bool
    {
        $ability = (string) config('accounting.vouchers.manual_override_permission', 'accounting.vouchers.manual_override');
        return (bool) ($request->user()?->can($ability) ?? false);
    }

    private function normalizeEntryMode(?string $entryMode): string
    {
        return strtolower((string) $entryMode) === 'manual' ? 'manual' : 'smart';
    }

    private function entryModeLabel(?string $entryMode): string
    {
        return $this->normalizeEntryMode($entryMode) === 'manual' ? 'Manual' : 'Smart';
    }

    private function paymentForLabel(AccountingVoucher $voucher): string
    {
        if (!in_array((string) $voucher->voucher_type, ['CPV', 'BPV'], true)) {
            return '-';
        }

        return (string) $voucher->party_type === 'vendor' ? 'Vendor Payment' : 'Expense';
    }

    private function buildSystemNarration(array $data, ?PaymentAccount $paymentAccount, ?array $invoiceContext = null): string
    {
        if (in_array((string) ($data['voucher_type'] ?? ''), ['CPV', 'BPV'], true)
            && $this->normalizeEntryMode((string) ($data['entry_mode'] ?? 'smart')) === 'smart'
            && !empty($data['payment_rows'])
        ) {
            $remarks = trim((string) ($data['remarks'] ?? ''));
            $channel = (string) ($data['voucher_type'] ?? '') === 'CPV' ? 'Cash' : 'Bank';
            $accountLabel = trim((string) ($paymentAccount?->name ?: strtolower($channel) . ' account'));
            $rows = collect((array) $data['payment_rows']);
            $total = (float) $rows->sum(fn (array $row) => (float) ($row['amount'] ?? 0));
            $firstInvoiceNo = $rows
                ->pluck('invoice_context')
                ->filter()
                ->map(fn ($ctx) => (string) (($ctx['number'] ?? '')))
                ->filter()
                ->first();
            $paymentFor = (string) ($data['payment_for'] ?? 'expense');

            $sentence = "{$channel} payment voucher of " . number_format($total, 2, '.', ',') . " via {$accountLabel}";
            if ($paymentFor === 'vendor_payment') {
                $vendorName = optional(Vendor::query()->find((int) ($data['vendor_id'] ?? 0)))->name ?: 'vendor';
                $sentence = $firstInvoiceNo
                    ? "{$channel} payment to {$vendorName} against bill {$firstInvoiceNo} via {$accountLabel}"
                    : "{$channel} payment to {$vendorName} via {$accountLabel}";
            } elseif ($paymentFor === 'expense') {
                $sentence = "{$channel} expense payment via {$accountLabel}";
            }

            return $remarks !== '' ? "{$sentence}. {$remarks}" : $sentence;
        }

        $modeLabel = $this->entryModeLabel((string) ($data['entry_mode'] ?? 'smart'));
        $expenseLabel = null;
        if (!empty($data['expense_type_id'])) {
            $expense = AccountingExpenseType::query()->find((int) $data['expense_type_id']);
            $expenseLabel = $expense ? trim(((string) $expense->code) . ' ' . ((string) $expense->name)) : null;
        }

        $entityLabel = match ((string) ($data['party_type'] ?? 'none')) {
            'vendor' => optional(Vendor::query()->find((int) ($data['party_id'] ?? 0)))->name,
            'customer' => optional(Customer::query()->find((int) ($data['party_id'] ?? 0)))->name,
            'member' => optional(Member::query()->find((int) ($data['party_id'] ?? 0)))->name,
            'corporate_member' => optional(CorporateMember::query()->find((int) ($data['party_id'] ?? 0)))->name,
            default => null,
        };

        $parts = array_values(array_filter([
            (string) ($data['voucher_type'] ?? 'Voucher'),
            $modeLabel,
            !empty($data['payment_for']) ? ('Payment For: ' . ucfirst(str_replace('_', ' ', (string) $data['payment_for']))) : null,
            !empty($data['payment_mode']) ? ('Mode: ' . ucfirst(str_replace('_', ' ', (string) $data['payment_mode']))) : null,
            $entityLabel ? "Party: {$entityLabel}" : null,
            $expenseLabel ? "Expense: {$expenseLabel}" : null,
            $invoiceContext ? "Ref: {$invoiceContext['number']}" : null,
            $paymentAccount?->name ? "Via {$paymentAccount->name}" : null,
            trim((string) ($data['remarks'] ?? '')) ?: null,
        ]));

        return implode(' | ', $parts);
    }

    private function syncAttachments(AccountingVoucher $voucher, Request $request): void
    {
        if (!$request->hasFile('attachments')) {
            return;
        }

        foreach ((array) $request->file('attachments') as $file) {
            if (!$file) {
                continue;
            }

            $filePath = FileHelper::saveImage($file, 'accounting_vouchers');
            $voucher->media()->create([
                'type' => 'voucher_attachment',
                'file_name' => $file->getClientOriginalName(),
                'file_path' => $filePath,
                'mime_type' => $file->getMimeType(),
                'file_size' => $file->getSize(),
                'disk' => 'public',
                'description' => 'Accounting voucher attachment',
            ]);
        }
    }

    private function maybeSaveTemplate(Request $request, array $data): void
    {
        if (!($data['save_template'] ?? false)) {
            return;
        }

        $scope = (string) ($data['template_scope'] ?? 'user');
        if ($scope === 'global' && !($request->user()?->can('accounting.vouchers.template.global') ?? false)) {
            throw ValidationException::withMessages([
                'template_scope' => 'You do not have permission to save global templates.',
            ]);
        }

        $name = trim((string) ($data['template_name'] ?? ''));
        if ($name === '') {
            throw ValidationException::withMessages([
                'template_name' => 'Template name is required when saving a template.',
            ]);
        }

        AccountingVoucherTemplate::query()->updateOrCreate(
            [
                'name' => $name,
                'scope' => $scope,
                'user_id' => $scope === 'user' ? $request->user()?->id : null,
            ],
            [
                'is_active' => true,
                'payload' => [
                    'entry_mode' => $data['entry_mode'] ?? 'smart',
                    'voucher_type' => $data['voucher_type'] ?? 'JV',
                    'tenant_id' => $data['tenant_id'] ?? null,
                    'department_id' => $data['department_id'] ?? null,
                    'party_type' => $data['party_type'] ?? 'none',
                    'party_id' => $data['party_id'] ?? null,
                    'vendor_id' => $data['vendor_id'] ?? null,
                    'payment_for' => $data['payment_for'] ?? null,
                    'payment_mode' => $data['payment_mode'] ?? 'direct',
                    'payment_rows' => $data['payment_rows'] ?? null,
                    'payment_account_id' => $data['payment_account_id'] ?? null,
                    'expense_type_id' => $data['expense_type_id'] ?? null,
                    'currency_code' => $data['currency_code'] ?? 'PKR',
                    'exchange_rate' => $data['exchange_rate'] ?? 1,
                    'remarks' => $data['remarks'] ?? null,
                ],
                'updated_by' => $request->user()?->id,
                'created_by' => $request->user()?->id,
            ]
        );
    }

    private function postVoucher(Request $request, AccountingVoucher $voucher): void
    {
        if ($voucher->status !== 'submitted' && !($voucher->status === 'draft' && $this->allowDirectPostFromDraft())) {
            throw ValidationException::withMessages([
                'voucher' => 'Voucher must be submitted before posting.',
            ]);
        }

        $this->postApprovedVoucher(
            $request,
            $voucher,
            app(AccountingEventDispatcher::class),
            app(StrictAccountingSyncService::class)
        );
    }

    private function postApprovedVoucher(
        Request $request,
        AccountingVoucher $voucher,
        AccountingEventDispatcher $dispatcher,
        StrictAccountingSyncService $strictSync
    ): void {
        $user = $request->user();
        if (!$user) {
            throw ValidationException::withMessages([
                'voucher' => 'User context missing for approval.',
            ]);
        }

        $policy = $this->getVoucherApprovalPolicy();
        if ($policy?->is_active && $policy->enforce_maker_checker && (int) $voucher->created_by === (int) $user->id) {
            throw ValidationException::withMessages([
                'voucher' => 'Maker-checker policy blocks self-approval.',
            ]);
        }

        DB::transaction(function () use ($voucher, $user, $dispatcher, $strictSync) {
            $approvalReference = 'APR-' . now()->format('YmdHis');

            $voucher->update([
                'status' => 'posted',
                'approved_by' => $user->id,
                'approved_at' => now(),
                'posted_by' => $user->id,
                'posted_at' => now(),
                'approval_reference' => $approvalReference,
            ]);

            $event = $dispatcher->dispatch(
                'accounting_voucher_posted',
                AccountingVoucher::class,
                (int) $voucher->id,
                [
                    'voucher_no' => $voucher->voucher_no,
                    'voucher_type' => $voucher->voucher_type,
                    'voucher_date' => $voucher->voucher_date?->toDateString(),
                    'posting_date' => $voucher->posting_date?->toDateString(),
                    'approval_reference' => $approvalReference,
                ],
                $user->id,
                $voucher->tenant_id
            );

            $strictSync->enforceOrFail($event, "Voucher {$voucher->voucher_no}");
            $this->logAction($voucher->id, 'approved', 'Accounting voucher approved and posted.', $user->id);
        });
    }

    private function allowDirectPostFromDraft(): bool
    {
        return (bool) config('accounting.vouchers.allow_direct_post_without_submission', false);
    }

    private function getVoucherApprovalPolicy(): ?AccountingApprovalPolicy
    {
        if (!Schema::hasTable('accounting_approval_policies')) {
            return null;
        }

        return AccountingApprovalPolicy::query()
            ->whereIn('module', ['accounting_voucher', 'journal_entry'])
            ->orderByRaw("case when module = 'accounting_voucher' then 0 else 1 end")
            ->first();
    }

    private function canSetPaymentAccountDefault($user): bool
    {
        if (!$user) {
            return false;
        }

        $ability = (string) config(
            'accounting.vouchers.set_default_payment_account_permission',
            'accounting.vouchers.set_default_payment_account'
        );

        return (bool) $user->can($ability);
    }

    private function canSetVendorCounterpartyDefault($user): bool
    {
        return $this->canSetPaymentAccountDefault($user);
    }

    private function applySmartDefaultSelectionIfRequested(array $data, ?int $userId): void
    {
        if (!($data['should_set_payment_account_default'] ?? false)) {
            return;
        }

        $paymentAccount = PaymentAccount::query()
            ->whereKey((int) $data['payment_account_id'])
            ->where('tenant_id', (int) $data['tenant_id'])
            ->where('status', 'active')
            ->lockForUpdate()
            ->first();

        if (!$paymentAccount) {
            return;
        }

        $methods = in_array((string) $data['voucher_type'], ['CPV', 'CRV'], true)
            ? self::CASH_METHODS
            : self::BANK_METHODS;

        $accounts = PaymentAccount::query()
            ->where('tenant_id', (int) $data['tenant_id'])
            ->where('status', 'active')
            ->lockForUpdate()
            ->get();

        foreach ($accounts as $account) {
            if (!in_array(strtolower((string) $account->payment_method), $methods, true)) {
                continue;
            }
            if ((int) $account->id === (int) $paymentAccount->id) {
                continue;
            }
            if ((bool) $account->is_default) {
                $account->update([
                    'is_default' => false,
                    'updated_by' => $userId,
                ]);
            }
        }

        $paymentAccount->update([
            'is_default' => true,
            'updated_by' => $userId,
        ]);
    }

    private function resolveCounterpartyAccountForVoucher(array $data, string $intent): array
    {
        $isPaymentSmartVendor = in_array((string) ($data['voucher_type'] ?? ''), ['CPV', 'BPV'], true)
            && (string) ($data['entry_mode'] ?? '') === 'smart'
            && (string) ($data['payment_for'] ?? '') === 'vendor_payment'
            && (string) ($data['party_type'] ?? '') === 'vendor'
            && (int) ($data['party_id'] ?? 0) > 0;

        if (!$isPaymentSmartVendor) {
            return [
                'account_id' => $this->mappingResolver->resolveCounterpartyAccountId($data),
                'requires_selection' => false,
                'account_role' => 'Counterparty Account',
                'resolved_via' => 'mapping',
                'message' => null,
            ];
        }

        $isAgainstInvoice = (string) ($data['payment_mode'] ?? 'direct') === 'against_invoice';
        $accountRole = $isAgainstInvoice ? 'Payable Account' : 'Advance Account';
        $vendor = Vendor::query()->find((int) $data['party_id']);
        $vendorMappedAccountId = $isAgainstInvoice
            ? (int) ($vendor?->payable_account_id ?? 0)
            : (int) ($vendor?->advance_account_id ?? 0);

        if ($this->isValidPostableAccountId($vendorMappedAccountId)) {
            return [
                'account_id' => $vendorMappedAccountId,
                'requires_selection' => false,
                'account_role' => $accountRole,
                'resolved_via' => 'vendor_default',
                'message' => null,
            ];
        }

        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $fallbackPayableId = (int) ($defaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0));
        $fallbackAdvanceId = (int) ($defaults['default_advance_account_id'] ?? config('accounting.vouchers.default_advance_account_id', 0));

        $preferredFallbackId = $isAgainstInvoice ? $fallbackPayableId : $fallbackAdvanceId;
        if ($this->isValidPostableAccountId($preferredFallbackId)) {
            return [
                'account_id' => $preferredFallbackId,
                'requires_selection' => false,
                'account_role' => $accountRole,
                'resolved_via' => $isAgainstInvoice ? 'default_payable' : 'default_advance',
                'message' => $vendorMappedAccountId > 0
                    ? null
                    : "{$accountRole} mapping missing on vendor. Using system default.",
            ];
        }

        if (!$isAgainstInvoice && $this->isValidPostableAccountId($fallbackPayableId)) {
            return [
                'account_id' => $fallbackPayableId,
                'requires_selection' => false,
                'account_role' => $accountRole,
                'resolved_via' => 'default_payable_fallback',
                'message' => "{$accountRole} default missing. Using payable fallback.",
            ];
        }

        $selectedAccountId = (int) ($data['counterparty_account_id'] ?? 0);
        if ($this->isValidPostableAccountId($selectedAccountId)) {
            return [
                'account_id' => $selectedAccountId,
                'requires_selection' => false,
                'account_role' => $accountRole,
                'resolved_via' => 'user_selected',
                'message' => null,
            ];
        }

        $message = "{$accountRole} mapping is missing. Select {$accountRole} to continue.";
        if (in_array($intent, ['submit', 'post'], true)) {
            throw ValidationException::withMessages([
                'counterparty_account_id' => $message,
            ]);
        }

        return [
            'account_id' => null,
            'requires_selection' => true,
            'account_role' => $accountRole,
            'resolved_via' => 'unresolved',
            'message' => $message,
        ];
    }

    private function autoAssignVendorDefaultMappings(): void
    {
        $defaults = Setting::getGroup('accounting_voucher_defaults');
        $payableId = (int) ($defaults['default_payable_account_id'] ?? config('accounting.vouchers.default_payable_account_id', 0));
        $advanceId = (int) ($defaults['default_advance_account_id'] ?? config('accounting.vouchers.default_advance_account_id', 0));

        $payableValid = $this->isValidPostableAccountId($payableId);
        $advanceValid = $this->isValidPostableAccountId($advanceId);

        if (!$payableValid && !$advanceValid) {
            return;
        }

        Vendor::query()
            ->where('status', 'active')
            ->where(function ($query) use ($payableValid, $advanceValid) {
                if ($payableValid) {
                    $query->whereNull('payable_account_id');
                }
                if ($advanceValid) {
                    $method = $payableValid ? 'orWhereNull' : 'whereNull';
                    $query->{$method}('advance_account_id');
                }
            })
            ->chunkById(100, function ($vendors) use ($payableId, $advanceId, $payableValid, $advanceValid) {
                foreach ($vendors as $vendor) {
                    $updates = [];
                    if ($payableValid && !$vendor->payable_account_id) {
                        $updates['payable_account_id'] = $payableId;
                    }
                    if ($advanceValid && !$vendor->advance_account_id) {
                        $updates['advance_account_id'] = $advanceId;
                    }
                    if (!empty($updates)) {
                        $vendor->update($updates);
                    }
                }
            });
    }

    private function isValidPostableAccountId(int $accountId): bool
    {
        if ($accountId <= 0) {
            return false;
        }

        return CoaAccount::query()
            ->whereKey($accountId)
            ->where('is_active', true)
            ->where('is_postable', true)
            ->exists();
    }

    private function applyVendorCounterpartyDefaultIfRequested(array $data, ?int $userId): void
    {
        if (!($data['should_set_vendor_counterparty_default'] ?? false)) {
            return;
        }

        $vendorId = (int) ($data['party_id'] ?? 0);
        $accountId = (int) (($data['counterparty_resolution']['account_id'] ?? 0) ?: ($data['counterparty_account_id'] ?? 0));
        if ($vendorId <= 0 || !$this->isValidPostableAccountId($accountId)) {
            return;
        }

        $field = (string) ($data['payment_mode'] ?? 'direct') === 'against_invoice'
            ? 'payable_account_id'
            : 'advance_account_id';

        $vendor = Vendor::query()->whereKey($vendorId)->lockForUpdate()->first();
        if (!$vendor) {
            return;
        }

        $vendor->update([
            $field => $accountId,
            'updated_by' => $userId,
        ]);
    }
}
