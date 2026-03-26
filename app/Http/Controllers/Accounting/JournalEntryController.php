<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingApprovalPolicy;
use App\Models\ApprovalAction;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowStep;
use App\Models\CoaAccount;
use App\Models\JournalEntry;
use App\Models\JournalNotificationDelivery;
use App\Models\JournalRecurringProfile;
use App\Models\JournalTemplate;
use App\Services\JournalApprovalAutomationService;
use App\Services\JournalApprovalNotificationService;
use App\Services\JournalRecurringRunnerService;
use App\Services\Accounting\Support\AccountingPeriodGate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Services\Accounting\Support\AccountingSourceResolver;

class JournalEntryController extends Controller
{
    public function __construct(
        private readonly AccountingPeriodGate $accountingPeriodGate
    )
    {
    }

    public function create()
    {
        return Inertia::render('App/Admin/Accounting/Journals/Create', $this->baseJournalFormData());
    }

    public function store(Request $request)
    {
        $data = $this->validateJournalPayload($request);
        $this->ensureBalanced($data['lines']);
        $data['period_id'] = $this->assertPeriodOpen($data['entry_date'], $data['period_id'] ?? null);

        $entry = DB::transaction(function () use ($request, $data) {
            $entry = JournalEntry::create([
                'entry_no' => $this->generateEntryNo('JE'),
                'entry_date' => $data['entry_date'],
                'description' => $data['description'] ?? null,
                'status' => 'draft',
                'period_id' => $data['period_id'] ?? null,
                'created_by' => $request->user()?->id,
            ]);

            $this->syncLines($entry, $data['lines']);
            $this->logApprovalAction($entry->id, 'created', 'Draft journal created manually.');

            return $entry;
        });

        return redirect()->route('accounting.journals.show', $entry->id)->with('success', 'Journal draft created.');
    }

    public function edit(JournalEntry $journalEntry)
    {
        $this->guardDraft($journalEntry);
        $journalEntry->load('lines.account');

        return Inertia::render('App/Admin/Accounting/Journals/Edit', array_merge(
            $this->baseJournalFormData(),
            ['entry' => $journalEntry]
        ));
    }

    public function update(Request $request, JournalEntry $journalEntry)
    {
        $this->guardDraft($journalEntry);
        $data = $this->validateJournalPayload($request);
        $this->ensureBalanced($data['lines']);
        $data['period_id'] = $this->assertPeriodOpen($data['entry_date'], $data['period_id'] ?? null);

        DB::transaction(function () use ($journalEntry, $data) {
            $journalEntry->update([
                'entry_date' => $data['entry_date'],
                'description' => $data['description'] ?? null,
                'period_id' => $data['period_id'] ?? null,
            ]);

            $this->syncLines($journalEntry, $data['lines']);
            $this->logApprovalAction($journalEntry->id, 'updated', 'Draft journal updated.');
        });

        return redirect()->route('accounting.journals.show', $journalEntry->id)->with('success', 'Journal draft updated.');
    }

    public function submit(JournalEntry $journalEntry)
    {
        $this->guardDraft($journalEntry);
        $journalEntry->load('lines');
        $resolvedPeriodId = $this->assertPeriodOpen(
            optional($journalEntry->entry_date)->toDateString() ?? now()->toDateString(),
            $journalEntry->period_id
        );
        $this->ensureBalanced($journalEntry->lines->map(fn($line) => [
            'debit' => (float) $line->debit,
            'credit' => (float) $line->credit,
        ])->all());

        $amount = $this->journalAmount($journalEntry);
        $policy = $this->getJournalPolicyModel();
        $autoPostLimit = $policy?->is_active ? (float) ($policy->auto_post_below ?? 0) : 0;

        if ($autoPostLimit > 0 && $amount <= $autoPostLimit) {
            $journalEntry->update([
                'status' => 'posted',
                'period_id' => $resolvedPeriodId,
                'posted_by' => auth()->id(),
                'posted_at' => now(),
            ]);
            $this->logApprovalAction($journalEntry->id, 'auto_posted', "Auto-posted (amount {$amount}) under policy threshold {$autoPostLimit}.");
            return redirect()->back()->with('success', 'Journal auto-posted by policy.');
        }

        $workflow = $this->ensureJournalWorkflow($policy, $amount);
        $firstStep = $this->resolveRequiredSteps($policy, $amount)[0] ?? null;
        $this->recordApprovalAction($journalEntry->id, 'submitted', 'Journal submitted for approval.', $workflow?->id, $firstStep?->id);
        $this->dispatchApprovalReminder($journalEntry, $policy, 'Journal submitted for your approval.');

        return redirect()->back()->with('success', 'Journal submitted for approval.');
    }

    public function approve(JournalEntry $journalEntry, Request $request)
    {
        $this->guardDraft($journalEntry);
        $resolvedPeriodId = $this->assertPeriodOpen(
            optional($journalEntry->entry_date)->toDateString() ?? now()->toDateString(),
            $journalEntry->period_id
        );
        $journalEntry->load('lines');
        $this->ensureBalanced($journalEntry->lines->map(fn($line) => [
            'debit' => (float) $line->debit,
            'credit' => (float) $line->credit,
        ])->all());

        $policy = $this->getJournalPolicyModel();
        $this->enforceApproverRules($journalEntry, $policy, $request);
        $amount = $this->journalAmount($journalEntry);
        $workflow = $this->ensureJournalWorkflow($policy, $amount);
        $steps = $this->resolveRequiredSteps($policy, $amount);
        $currentStep = $this->nextPendingStep($journalEntry, $steps);
        if (!$currentStep) {
            return redirect()->back()->with('error', 'No pending approval step found.');
        }

        $this->ensureUserCanApproveStep($request, $journalEntry, $currentStep, $policy);

        DB::transaction(function () use ($journalEntry, $request, $workflow, $currentStep, $steps, $resolvedPeriodId) {
            $this->recordApprovalAction(
                $journalEntry->id,
                'approved',
                "Step {$currentStep->step_order} approved.",
                $workflow?->id,
                $currentStep->id
            );

            $remaining = $this->nextPendingStep($journalEntry->fresh()->load('lines'), $steps);
            if (!$remaining) {
                $journalEntry->update([
                    'status' => 'posted',
                    'period_id' => $resolvedPeriodId,
                    'posted_by' => $request->user()?->id,
                    'posted_at' => now(),
                ]);
            }
        });

        $journalEntry->refresh();
        if ($journalEntry->status === 'posted') {
            return redirect()->back()->with('success', 'Journal fully approved and posted.');
        }

        return redirect()->back()->with('success', 'Approval recorded for current step.');
    }

    public function reject(JournalEntry $journalEntry, Request $request)
    {
        $this->guardDraft($journalEntry);
        $data = $request->validate([
            'remarks' => 'nullable|string|max:255',
        ]);

        $policy = $this->getJournalPolicyModel();
        $amount = $this->journalAmount($journalEntry->load('lines'));
        $workflow = $this->ensureJournalWorkflow($policy, $amount);
        $steps = $this->resolveRequiredSteps($policy, $amount);
        $currentStep = $this->nextPendingStep($journalEntry, $steps);

        $this->recordApprovalAction(
            $journalEntry->id,
            'rejected',
            $data['remarks'] ?: 'Journal rejected.',
            $workflow?->id,
            $currentStep?->id
        );
        return redirect()->back()->with('success', 'Journal rejection logged.');
    }

    public function remind(JournalEntry $journalEntry, Request $request)
    {
        if ($journalEntry->status !== 'draft') {
            return redirect()->back()->with('error', 'Reminders are only available for draft journals.');
        }

        $policy = $this->getJournalPolicyModel();
        $this->recordApprovalAction(
            $journalEntry->id,
            'submitted',
            'Approval reminder triggered for pending journal.',
            null,
            null
        );
        $sent = $this->dispatchApprovalReminder($journalEntry->load('lines'), $policy, 'Manual reminder for pending journal approval.');

        return redirect()->back()->with('success', "Reminder logged. Notifications sent: {$sent}.");
    }

    public function remindOverdue(Request $request)
    {
        $policy = $this->getJournalPolicyModel();
        if (!$policy || !$policy->sla_hours) {
            return redirect()->back()->with('error', 'Set SLA hours in policy before running overdue reminders.');
        }

        $result = app(JournalApprovalAutomationService::class)->remindOverdue(300);
        return redirect()->back()->with('success', "{$result['reminded']} overdue reminders logged.");
    }

    public function savePolicy(Request $request)
    {
        if (!Schema::hasTable('accounting_approval_policies')) {
            return redirect()->back()->with('error', 'Approval policy table is not migrated yet.');
        }

        $data = $request->validate([
            'is_active' => 'required|boolean',
            'enforce_maker_checker' => 'required|boolean',
            'approver_role' => 'nullable|string|max:80',
            'level1_role' => 'nullable|string|max:80',
            'level1_max_amount' => 'nullable|numeric|min:0',
            'level2_role' => 'nullable|string|max:80',
            'sla_hours' => 'nullable|integer|min:1|max:8760',
            'escalation_role' => 'nullable|string|max:80',
            'auto_post_below' => 'nullable|numeric|min:0',
        ]);

        AccountingApprovalPolicy::updateOrCreate(
            ['module' => 'journal_entry'],
            [
                'is_active' => $data['is_active'],
                'enforce_maker_checker' => $data['enforce_maker_checker'],
                'approver_role' => trim((string) ($data['approver_role'] ?? '')) ?: null,
                'level1_role' => trim((string) ($data['level1_role'] ?? '')) ?: null,
                'level1_max_amount' => $data['level1_max_amount'] ?? null,
                'level2_role' => trim((string) ($data['level2_role'] ?? '')) ?: null,
                'sla_hours' => $data['sla_hours'] ?? null,
                'escalation_role' => trim((string) ($data['escalation_role'] ?? '')) ?: null,
                'auto_post_below' => $data['auto_post_below'] ?? null,
                'updated_by' => $request->user()?->id,
            ]
        );

        return redirect()->back()->with('success', 'Journal approval policy updated.');
    }

    public function index(Request $request)
    {
        $sourceResolver = app(AccountingSourceResolver::class);
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = JournalEntry::with('lines', 'tenant');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('entry_no', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status') && in_array($request->status, ['draft', 'posted', 'reversed'], true)) {
            $query->where('status', $request->status);
        }

        if ($request->filled('from') && $request->filled('to')) {
            $query->whereBetween('entry_date', [$request->from, $request->to]);
        }

        $entries = $query->orderByDesc('entry_date')->orderByDesc('id')->paginate($perPage)->withQueryString();
        $entries->setCollection(
            $entries->getCollection()->map(function ($entry) use ($sourceResolver) {
                $totalDebit = (float) $entry->lines->sum('debit');
                $totalCredit = (float) $entry->lines->sum('credit');
                $source = $sourceResolver->resolveForJournalEntry($entry);
                $entry->total_debit = $totalDebit;
                $entry->total_credit = $totalCredit;
                $entry->amount = max($totalDebit, $totalCredit);
                $entry->source_label = $source['source_label'];
                $entry->restaurant_name = $source['restaurant_name'];
                $entry->document_url = $source['document_url'];
                $entry->source_resolution_status = $source['source_resolution_status'];
                return $entry;
            })
        );

        $summary = [
            'records' => $entries->total(),
            'draft' => JournalEntry::where('status', 'draft')->count(),
            'posted' => JournalEntry::where('status', 'posted')->count(),
            'reversed' => JournalEntry::where('status', 'reversed')->count(),
        ];

        return Inertia::render('App/Admin/Accounting/Journals/Index', [
            'entries' => $entries,
            'filters' => $request->only(['search', 'status', 'from', 'to', 'per_page']),
            'summary' => $summary,
            'templatesEnabled' => Schema::hasTable('journal_templates'),
            'templates' => $this->getTemplatesForIndex(),
            'recurringProfiles' => $this->getRecurringProfilesForIndex(),
            'approvalPolicy' => $this->getJournalPolicy(),
        ]);
    }

    public function approvalsInbox(Request $request)
    {
        $policy = $this->getJournalPolicyModel();
        $query = JournalEntry::query()->with('lines')->where('status', 'draft');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('entry_no', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $allDrafts = $query->orderByDesc('entry_date')->orderByDesc('id')->get();
        $pending = $allDrafts->filter(fn($entry) => $this->canCurrentUserApprove($entry));

        $perPage = 25;
        $page = (int) max(1, (int) $request->input('page', 1));
        $items = $pending->slice(($page - 1) * $perPage, $perPage)->values();
        $paginator = new \Illuminate\Pagination\LengthAwarePaginator(
            $items,
            $pending->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $paginator->setCollection($paginator->getCollection()->map(function ($entry) use ($policy) {
            $entry->amount = $this->journalAmount($entry);
            $entry->next_step = $this->nextPendingStep($entry);
            $meta = $this->submissionMeta($entry, $policy);
            $entry->submitted_at = $meta['submitted_at'];
            $entry->age_hours = $meta['age_hours'];
            $entry->is_overdue = $meta['is_overdue'];
            $entry->reminder_count = $meta['reminder_count'];
            $entry->last_reminder_at = $meta['last_reminder_at'];
            return $entry;
        }));

        return Inertia::render('App/Admin/Accounting/Journals/Approvals', [
            'entries' => $paginator,
            'filters' => $request->only(['search']),
            'approvalPolicy' => $this->getJournalPolicy(),
            'summary' => [
                'pending' => $pending->count(),
                'overdue' => $pending->filter(fn($entry) => $this->isEntryOverdue($entry, $policy))->count(),
            ],
        ]);
    }

    public function deliveries(Request $request)
    {
        if (!Schema::hasTable('journal_notification_deliveries')) {
            return Inertia::render('App/Admin/Accounting/Journals/Deliveries', [
                'deliveries' => new \Illuminate\Pagination\LengthAwarePaginator([], 0, 25, 1, [
                    'path' => $request->url(),
                    'query' => $request->query(),
                ]),
                'filters' => $request->only(['status', 'channel', 'search']),
                'summary' => ['total' => 0, 'sent' => 0, 'failed' => 0],
                'error' => 'Notification delivery table is not migrated yet.',
            ]);
        }

        $query = JournalNotificationDelivery::query()->with(['journalEntry:id,entry_no', 'user:id,name,email']);

        if ($request->filled('status') && in_array($request->status, ['sent', 'failed'], true)) {
            $query->where('status', $request->status);
        }
        if ($request->filled('channel')) {
            $query->where('channel', $request->channel);
        }
        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q->where('recipient', 'like', "%{$search}%")
                    ->orWhere('provider_response', 'like', "%{$search}%");
            });
        }

        $deliveries = $query->orderByDesc('id')->paginate(25)->withQueryString();

        return Inertia::render('App/Admin/Accounting/Journals/Deliveries', [
            'deliveries' => $deliveries,
            'filters' => $request->only(['status', 'channel', 'search']),
            'summary' => [
                'total' => JournalNotificationDelivery::count(),
                'sent' => JournalNotificationDelivery::where('status', 'sent')->count(),
                'failed' => JournalNotificationDelivery::where('status', 'failed')->count(),
            ],
        ]);
    }

    public function retryDelivery(JournalNotificationDelivery $delivery, JournalApprovalNotificationService $notifier)
    {
        $ok = $notifier->retry($delivery);
        return redirect()->back()->with($ok ? 'success' : 'error', $ok ? 'Delivery retried successfully.' : 'Delivery retry failed.');
    }

    public function retryFailedDeliveries()
    {
        if (!Schema::hasTable('journal_notification_deliveries')) {
            return redirect()->back()->with('error', 'Delivery table is not migrated yet.');
        }

        $result = app(JournalApprovalAutomationService::class)->retryFailedDeliveries(100);
        return redirect()->back()->with('success', "{$result['succeeded']} delivery retries succeeded.");
    }

    public function show(JournalEntry $journalEntry)
    {
        $journalEntry->load('lines.account');

        $entrySummary = [
            'total_debit' => (float) $journalEntry->lines->sum('debit'),
            'total_credit' => (float) $journalEntry->lines->sum('credit'),
            'difference' => (float) $journalEntry->lines->sum('debit') - (float) $journalEntry->lines->sum('credit'),
        ];

        $timeline = collect();
        if (Schema::hasTable('approval_actions')) {
            $timeline = ApprovalAction::query()
                ->where('document_type', JournalEntry::class)
                ->where('document_id', $journalEntry->id)
                ->orderByDesc('id')
                ->limit(20)
                ->get(['id', 'action', 'remarks', 'action_by', 'created_at']);
            $actorIds = $timeline->pluck('action_by')->filter()->unique()->values();
            $actors = User::query()->whereIn('id', $actorIds)->pluck('name', 'id');
            $timeline = $timeline->map(function ($item) use ($actors) {
                $item->actor_name = $actors[$item->action_by] ?? null;
                return $item;
            });
        }

        return Inertia::render('App/Admin/Accounting/Journals/Show', [
            'entry' => $journalEntry,
            'entrySummary' => $entrySummary,
            'timeline' => $timeline,
            'templatesEnabled' => Schema::hasTable('journal_templates'),
        ]);
    }

    public function reverse(Request $request, JournalEntry $journalEntry)
    {
        if ($journalEntry->status !== 'posted') {
            throw ValidationException::withMessages([
                'entry' => 'Only posted entries can be reversed.',
            ]);
        }

        $data = $request->validate([
            'reason' => 'required|string|max:255',
            'entry_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($request, $journalEntry, $data) {
            $reversalDate = $data['entry_date'] ?? Carbon::today()->toDateString();
            $reversal = JournalEntry::create([
                'entry_no' => $this->generateEntryNo('RV'),
                'entry_date' => $reversalDate,
                'description' => 'Reversal of ' . $journalEntry->entry_no . ' · ' . $data['reason'],
                'status' => 'posted',
                'module_type' => JournalEntry::class,
                'module_id' => $journalEntry->id,
                'period_id' => $journalEntry->period_id,
                'created_by' => $request->user()?->id,
                'posted_by' => $request->user()?->id,
                'posted_at' => now(),
            ]);

            $reversalLines = $journalEntry->lines->map(function ($line) {
                return [
                    'account_id' => $line->account_id,
                    'description' => 'Reversal',
                    'debit' => $line->credit,
                    'credit' => $line->debit,
                    'vendor_id' => $line->vendor_id,
                    'member_id' => $line->member_id,
                    'employee_id' => $line->employee_id,
                    'product_id' => $line->product_id,
                    'warehouse_id' => $line->warehouse_id,
                    'reference_type' => $line->reference_type,
                    'reference_id' => $line->reference_id,
                ];
            })->values()->all();

            $reversal->lines()->createMany($reversalLines);
            $journalEntry->update(['status' => 'reversed']);

            $this->logApprovalAction($journalEntry->id, 'reversed', 'Entry reversed by journal reverse action.');
            $this->logApprovalAction($reversal->id, 'created', 'Reversal entry created from ' . $journalEntry->entry_no . '.');
        });

        return redirect()->back()->with('success', 'Journal entry reversed successfully.');
    }

    public function storeTemplate(Request $request, JournalEntry $journalEntry)
    {
        if (!Schema::hasTable('journal_templates')) {
            return redirect()->back()->with('error', 'Journal templates table is not migrated yet.');
        }

        $data = $request->validate([
            'name' => 'required|string|max:150',
            'description' => 'nullable|string|max:255',
        ]);

        $journalEntry->load('lines');
        if ($journalEntry->lines->isEmpty()) {
            return redirect()->back()->with('error', 'Cannot create template from an empty journal.');
        }

        JournalTemplate::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'source_journal_entry_id' => $journalEntry->id,
            'lines' => $journalEntry->lines->map(function ($line) {
                return [
                    'account_id' => $line->account_id,
                    'description' => $line->description,
                    'debit' => (float) $line->debit,
                    'credit' => (float) $line->credit,
                    'vendor_id' => $line->vendor_id,
                    'member_id' => $line->member_id,
                    'employee_id' => $line->employee_id,
                    'product_id' => $line->product_id,
                    'warehouse_id' => $line->warehouse_id,
                    'reference_type' => $line->reference_type,
                    'reference_id' => $line->reference_id,
                ];
            })->values()->all(),
            'is_active' => true,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Template created from journal entry.');
    }

    public function applyTemplate(Request $request, int $templateId)
    {
        if (!Schema::hasTable('journal_templates')) {
            return redirect()->back()->with('error', 'Journal templates table is not migrated yet.');
        }

        $template = JournalTemplate::findOrFail($templateId);
        if (!$template->is_active) {
            return redirect()->back()->with('error', 'Selected template is inactive.');
        }

        $data = $request->validate([
            'entry_date' => 'required|date',
            'description' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $template, $data) {
            $entry = JournalEntry::create([
                'entry_no' => $this->generateEntryNo('JE'),
                'entry_date' => $data['entry_date'],
                'description' => $data['description'] ?: ('From template: ' . $template->name),
                'status' => 'draft',
                'module_type' => JournalTemplate::class,
                'module_id' => $template->id,
                'created_by' => $request->user()?->id,
            ]);

            $entry->lines()->createMany(collect($template->lines)
                ->map(fn($line) => [
                    'account_id' => $line['account_id'] ?? null,
                    'description' => $line['description'] ?? null,
                    'debit' => $line['debit'] ?? 0,
                    'credit' => $line['credit'] ?? 0,
                    'vendor_id' => $line['vendor_id'] ?? null,
                    'member_id' => $line['member_id'] ?? null,
                    'employee_id' => $line['employee_id'] ?? null,
                    'product_id' => $line['product_id'] ?? null,
                    'warehouse_id' => $line['warehouse_id'] ?? null,
                    'reference_type' => $line['reference_type'] ?? null,
                    'reference_id' => $line['reference_id'] ?? null,
                ])
                ->filter(fn($line) => !empty($line['account_id']))
                ->values()
                ->all());

            $this->logApprovalAction($entry->id, 'created', 'Draft journal created from template ' . $template->name . '.');
        });

        return redirect()->back()->with('success', 'Journal draft created from template.');
    }

    public function scheduleRecurring(Request $request, int $templateId)
    {
        if (!Schema::hasTable('journal_templates') || !Schema::hasTable('journal_recurring_profiles')) {
            return redirect()->back()->with('error', 'Recurring tables are not migrated yet.');
        }

        JournalTemplate::findOrFail($templateId);
        $data = $request->validate([
            'frequency' => 'required|in:weekly,monthly,quarterly,yearly',
            'next_run_date' => 'required|date',
        ]);

        JournalRecurringProfile::create([
            'template_id' => $templateId,
            'frequency' => $data['frequency'],
            'next_run_date' => $data['next_run_date'],
            'is_active' => true,
            'created_by' => $request->user()?->id,
        ]);

        return redirect()->back()->with('success', 'Recurring schedule created.');
    }

    public function runRecurring(Request $request)
    {
        if (!Schema::hasTable('journal_templates') || !Schema::hasTable('journal_recurring_profiles')) {
            return redirect()->back()->with('error', 'Recurring tables are not migrated yet.');
        }

        $result = app(JournalRecurringRunnerService::class)->runDue(200);
        return redirect()->back()->with('success', "{$result['created']} recurring journals generated.");
    }

    private function getTemplatesForIndex()
    {
        if (!Schema::hasTable('journal_templates')) {
            return [];
        }

        return JournalTemplate::query()
            ->where('is_active', true)
            ->orderByDesc('id')
            ->limit(20)
            ->get(['id', 'name', 'description', 'created_at']);
    }

    private function baseJournalFormData(): array
    {
        return [
            'accounts' => Schema::hasTable('coa_accounts')
                ? CoaAccount::query()
                    ->operationalPosting()
                    ->orderBy('full_code')
                    ->get(['id', 'full_code', 'name', 'type', 'normal_balance', 'level', 'is_postable'])
                : collect(),
            'accounts_error' => !Schema::hasTable('coa_accounts')
                ? 'Chart of Accounts is not configured yet. Journal lines cannot be mapped until coa_accounts is migrated.'
                : null,
        ];
    }

    private function validateJournalPayload(Request $request): array
    {
        if (!Schema::hasTable('coa_accounts')) {
            throw ValidationException::withMessages([
                'lines' => 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.',
            ]);
        }

        return $request->validate([
            'entry_date' => 'required|date',
            'description' => 'nullable|string|max:255',
            'period_id' => 'nullable|integer|exists:accounting_periods,id',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => ['required', 'integer', Rule::exists('coa_accounts', 'id')->where(fn ($query) => $query->where('is_active', true)->where('is_postable', true))],
            'lines.*.description' => 'nullable|string|max:255',
            'lines.*.debit' => 'nullable|numeric|min:0',
            'lines.*.credit' => 'nullable|numeric|min:0',
            'lines.*.vendor_id' => 'nullable|integer|exists:vendors,id',
            'lines.*.member_id' => 'nullable|integer|exists:members,id',
            'lines.*.employee_id' => 'nullable|integer|exists:employees,id',
            'lines.*.product_id' => 'nullable|integer|exists:products,id',
            'lines.*.warehouse_id' => 'nullable|integer|exists:warehouses,id',
            'lines.*.reference_type' => 'nullable|string|max:120',
            'lines.*.reference_id' => 'nullable|integer',
        ]);
    }

    private function ensureBalanced(array $lines): void
    {
        $normalized = collect($lines)->map(function ($line) {
            $debit = (float) ($line['debit'] ?? 0);
            $credit = (float) ($line['credit'] ?? 0);
            return ['debit' => $debit, 'credit' => $credit];
        });

        if ($normalized->contains(fn($l) => $l['debit'] > 0 && $l['credit'] > 0)) {
            throw ValidationException::withMessages([
                'lines' => 'A journal line cannot have both debit and credit.',
            ]);
        }

        if ($normalized->contains(fn($l) => $l['debit'] <= 0 && $l['credit'] <= 0)) {
            throw ValidationException::withMessages([
                'lines' => 'Each journal line must have either debit or credit amount.',
            ]);
        }

        $debit = (float) $normalized->sum('debit');
        $credit = (float) $normalized->sum('credit');
        if (abs($debit - $credit) > 0.005) {
            throw ValidationException::withMessages([
                'lines' => 'Journal is not balanced. Debit and credit totals must match.',
            ]);
        }
    }

    private function syncLines(JournalEntry $entry, array $lines): void
    {
        $entry->lines()->delete();
        $entry->lines()->createMany(
            collect($lines)
                ->map(function ($line) {
                    return [
                        'account_id' => $line['account_id'],
                        'description' => $line['description'] ?? null,
                        'debit' => $line['debit'] ?? 0,
                        'credit' => $line['credit'] ?? 0,
                        'vendor_id' => $line['vendor_id'] ?? null,
                        'member_id' => $line['member_id'] ?? null,
                        'employee_id' => $line['employee_id'] ?? null,
                        'product_id' => $line['product_id'] ?? null,
                        'warehouse_id' => $line['warehouse_id'] ?? null,
                        'reference_type' => $line['reference_type'] ?? null,
                        'reference_id' => $line['reference_id'] ?? null,
                    ];
                })
                ->values()
                ->all()
        );
    }

    private function guardDraft(JournalEntry $entry): void
    {
        if ($entry->status !== 'draft') {
            throw ValidationException::withMessages([
                'entry' => 'This action is allowed only for draft journals.',
            ]);
        }
    }

    private function assertPeriodOpen(string $entryDate, ?int $periodId): int
    {
        return $this->accountingPeriodGate->assertOpenForRequest($entryDate, $periodId);
    }

    private function getRecurringProfilesForIndex()
    {
        if (!Schema::hasTable('journal_recurring_profiles') || !Schema::hasTable('journal_templates')) {
            return [];
        }

        return JournalRecurringProfile::query()
            ->with('template:id,name')
            ->where('is_active', true)
            ->orderBy('next_run_date')
            ->limit(20)
            ->get(['id', 'template_id', 'frequency', 'next_run_date', 'last_run_at']);
    }

    private function logApprovalAction(int $journalEntryId, string $action, string $remarks): void
    {
        if (!Schema::hasTable('approval_actions')) {
            return;
        }

        $allowed = ['submitted', 'approved', 'rejected', 'recalled'];
        $normalized = in_array($action, $allowed, true) ? $action : 'submitted';
        $finalRemarks = $normalized === $action ? $remarks : "[{$action}] {$remarks}";

        ApprovalAction::create([
            'document_type' => JournalEntry::class,
            'document_id' => $journalEntryId,
            'action' => $normalized,
            'remarks' => $finalRemarks,
            'action_by' => auth()->id(),
        ]);
    }

    private function recordApprovalAction(
        int $journalEntryId,
        string $action,
        string $remarks,
        ?int $workflowId = null,
        ?int $workflowStepId = null
    ): void {
        if (!Schema::hasTable('approval_actions')) {
            return;
        }

        $allowed = ['submitted', 'approved', 'rejected', 'recalled'];
        $normalized = in_array($action, $allowed, true) ? $action : 'submitted';
        $finalRemarks = $normalized === $action ? $remarks : "[{$action}] {$remarks}";

        ApprovalAction::create([
            'workflow_id' => $workflowId,
            'workflow_step_id' => $workflowStepId,
            'document_type' => JournalEntry::class,
            'document_id' => $journalEntryId,
            'action' => $normalized,
            'remarks' => $finalRemarks,
            'action_by' => auth()->id(),
        ]);
    }

    private function generateEntryNo(string $prefix): string
    {
        $attempts = 0;
        do {
            $attempts++;
            $candidate = sprintf('%s-%s-%04d', $prefix, now()->format('Ymd'), random_int(1, 9999));
        } while (JournalEntry::where('entry_no', $candidate)->exists() && $attempts < 20);

        return $candidate;
    }

    private function getJournalPolicy(): ?array
    {
        $policy = $this->getJournalPolicyModel();
        if (!$policy) {
            return null;
        }

        return [
            'is_active' => (bool) $policy->is_active,
            'enforce_maker_checker' => (bool) $policy->enforce_maker_checker,
            'approver_role' => $policy->approver_role,
            'level1_role' => $policy->level1_role,
            'level1_max_amount' => $policy->level1_max_amount,
            'level2_role' => $policy->level2_role,
            'sla_hours' => $policy->sla_hours,
            'escalation_role' => $policy->escalation_role,
            'auto_post_below' => $policy->auto_post_below,
        ];
    }

    private function getJournalPolicyModel(): ?AccountingApprovalPolicy
    {
        if (!Schema::hasTable('accounting_approval_policies')) {
            return null;
        }

        return AccountingApprovalPolicy::query()->where('module', 'journal_entry')->first();
    }

    private function journalAmount(JournalEntry $entry): float
    {
        $debit = (float) $entry->lines->sum('debit');
        $credit = (float) $entry->lines->sum('credit');
        return max($debit, $credit);
    }

    private function enforceApproverRules(JournalEntry $entry, ?AccountingApprovalPolicy $policy, Request $request): void
    {
        if (!$policy || !$policy->is_active) {
            return;
        }

        $user = $request->user();
        if (!$user) {
            throw ValidationException::withMessages([
                'entry' => 'User context missing for approval.',
            ]);
        }

        if ($policy->enforce_maker_checker && (int) $entry->created_by === (int) $user->id) {
            throw ValidationException::withMessages([
                'entry' => 'Maker-checker policy blocks self-approval.',
            ]);
        }
    }

    private function ensureJournalWorkflow(?AccountingApprovalPolicy $policy, float $amount): ?ApprovalWorkflow
    {
        if (!Schema::hasTable('approval_workflows') || !Schema::hasTable('approval_workflow_steps')) {
            return null;
        }

        $workflow = ApprovalWorkflow::updateOrCreate(
            ['code' => 'journal_entry_default'],
            [
                'name' => 'Journal Entry Approval',
                'document_type' => JournalEntry::class,
                'is_active' => true,
                'settings' => ['module' => 'journal_entry'],
                'updated_by' => auth()->id(),
                'created_by' => auth()->id(),
            ]
        );

        $steps = $this->resolveRequiredRoleNames($policy, $amount);
        foreach ($steps as $index => $roleName) {
            ApprovalWorkflowStep::updateOrCreate(
                ['workflow_id' => $workflow->id, 'step_order' => $index + 1],
                [
                    'name' => 'Step ' . ($index + 1),
                    'role_name' => $roleName,
                    'min_approvers' => 1,
                ]
            );
        }

        ApprovalWorkflowStep::query()
            ->where('workflow_id', $workflow->id)
            ->where('step_order', '>', count($steps))
            ->delete();

        return $workflow->fresh('steps');
    }

    private function resolveRequiredRoleNames(?AccountingApprovalPolicy $policy, float $amount): array
    {
        $roles = [];
        $level1 = trim((string) ($policy?->level1_role ?? ''));
        $level2 = trim((string) ($policy?->level2_role ?? ''));
        $legacy = trim((string) ($policy?->approver_role ?? ''));
        $level1Max = (float) ($policy?->level1_max_amount ?? 0);

        if ($level1 !== '') {
            $roles[] = $level1;
        } elseif ($legacy !== '') {
            $roles[] = $legacy;
        }

        if ($level2 !== '' && $level1Max > 0 && $amount > $level1Max) {
            $roles[] = $level2;
        }

        return array_values(array_unique(array_filter($roles)));
    }

    private function resolveRequiredSteps(?AccountingApprovalPolicy $policy, float $amount)
    {
        if (!Schema::hasTable('approval_workflow_steps')) {
            return collect();
        }

        $workflow = $this->ensureJournalWorkflow($policy, $amount);
        if (!$workflow) {
            return collect();
        }

        return $workflow->steps()->orderBy('step_order')->get();
    }

    private function nextPendingStep(JournalEntry $entry, $steps = null)
    {
        if ($steps === null) {
            $policy = $this->getJournalPolicyModel();
            $steps = $this->resolveRequiredSteps($policy, $this->journalAmount($entry));
        }
        if ($steps->isEmpty()) {
            return null;
        }

        $approvedStepIds = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'approved')
            ->pluck('workflow_step_id')
            ->filter()
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values();

        foreach ($steps as $step) {
            if (!$approvedStepIds->contains((int) $step->id)) {
                return $step;
            }
        }

        return null;
    }

    private function ensureUserCanApproveStep(Request $request, JournalEntry $entry, $step, ?AccountingApprovalPolicy $policy): void
    {
        $user = $request->user();
        if (!$user) {
            throw ValidationException::withMessages([
                'entry' => 'User context missing for approval.',
            ]);
        }

        $existing = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('workflow_step_id', $step->id)
            ->where('action', 'approved')
            ->where('action_by', $user->id)
            ->exists();
        if ($existing) {
            throw ValidationException::withMessages([
                'entry' => 'You already approved this step.',
            ]);
        }

        $role = trim((string) ($step->role_name ?? ''));
        if ($role !== '' && !$this->hasUserRole($user, $role) && !$this->hasEscalationAccess($entry, $policy, $user)) {
            throw ValidationException::withMessages([
                'entry' => "Current step requires role: {$role}.",
            ]);
        }

        if ($policy?->enforce_maker_checker && (int) $entry->created_by === (int) $user->id) {
            throw ValidationException::withMessages([
                'entry' => 'Maker-checker policy blocks self-approval.',
            ]);
        }
    }

    private function canCurrentUserApprove(JournalEntry $entry): bool
    {
        $policy = $this->getJournalPolicyModel();
        $amount = $this->journalAmount($entry);
        $steps = $this->resolveRequiredSteps($policy, $amount);
        if ($steps->isEmpty()) {
            return false;
        }

        $hasSubmitted = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'submitted')
            ->exists();
        if (!$hasSubmitted) {
            return false;
        }

        $latestRejection = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'rejected')
            ->latest('id')
            ->first();
        $latestSubmission = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'submitted')
            ->latest('id')
            ->first();
        if ($latestRejection && $latestSubmission && $latestRejection->id > $latestSubmission->id) {
            return false;
        }

        $step = $this->nextPendingStep($entry, $steps);
        if (!$step) {
            return false;
        }

        $user = auth()->user();
        if (!$user) {
            return false;
        }
        if ($policy?->enforce_maker_checker && (int) $entry->created_by === (int) $user->id) {
            return false;
        }

        $role = trim((string) ($step->role_name ?? ''));
        return $role === ''
            ? true
            : ($this->hasUserRole($user, $role) || $this->hasEscalationAccess($entry, $policy, $user));
    }

    private function submissionMeta(JournalEntry $entry, ?AccountingApprovalPolicy $policy): array
    {
        if (!Schema::hasTable('approval_actions')) {
            return [
                'submitted_at' => null,
                'age_hours' => null,
                'is_overdue' => false,
                'reminder_count' => 0,
                'last_reminder_at' => null,
            ];
        }

        $submitted = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'submitted')
            ->latest('id')
            ->first();

        if (!$submitted) {
            return [
                'submitted_at' => null,
                'age_hours' => null,
                'is_overdue' => false,
                'reminder_count' => 0,
                'last_reminder_at' => null,
            ];
        }

        $submittedAt = Carbon::parse($submitted->created_at);
        $ageHours = $submittedAt->diffInHours(now());
        $sla = (int) ($policy?->sla_hours ?? 0);
        $reminders = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'submitted')
            ->where('remarks', 'like', '%reminder%')
            ->orderByDesc('id')
            ->get(['id', 'created_at']);

        return [
            'submitted_at' => $submittedAt->toDateTimeString(),
            'age_hours' => $ageHours,
            'is_overdue' => $sla > 0 && $ageHours > $sla,
            'reminder_count' => $reminders->count(),
            'last_reminder_at' => $reminders->first()?->created_at?->toDateTimeString(),
        ];
    }

    private function isEntryOverdue(JournalEntry $entry, ?AccountingApprovalPolicy $policy): bool
    {
        return (bool) ($this->submissionMeta($entry, $policy)['is_overdue'] ?? false);
    }

    private function hasEscalationAccess(JournalEntry $entry, ?AccountingApprovalPolicy $policy, $user): bool
    {
        $escalationRole = trim((string) ($policy?->escalation_role ?? ''));
        if ($escalationRole === '') {
            return false;
        }

        if (!$this->isEntryOverdue($entry, $policy)) {
            return false;
        }

        return $this->hasUserRole($user, $escalationRole);
    }

    private function dispatchApprovalReminder(JournalEntry $entry, ?AccountingApprovalPolicy $policy, string $message): int
    {
        $entry->loadMissing('lines');
        $amount = $this->journalAmount($entry);
        $steps = $this->resolveRequiredSteps($policy, $amount);
        $currentStep = $this->nextPendingStep($entry, $steps);

        $users = $this->resolveReminderRecipients($entry, $policy, $currentStep);
        if ($users->isEmpty()) {
            return 0;
        }

        $stepLabel = $currentStep ? ('Step ' . $currentStep->step_order . ' · ' . ($currentStep->role_name ?: 'Any')) : 'Pending';
        return app(JournalApprovalNotificationService::class)->sendToUsers($users, $entry, $message, $stepLabel);
    }

    private function resolveReminderRecipients(JournalEntry $entry, ?AccountingApprovalPolicy $policy, $currentStep)
    {
        $roles = [];
        $stepRole = trim((string) ($currentStep?->role_name ?? ''));
        if ($stepRole !== '') {
            $roles[] = $stepRole;
        }

        $escalation = trim((string) ($policy?->escalation_role ?? ''));
        if ($escalation !== '' && $this->isEntryOverdue($entry, $policy)) {
            $roles[] = $escalation;
        }

        $roles = array_values(array_unique(array_filter($roles)));
        if (empty($roles)) {
            return collect();
        }

        $users = User::query()
            ->whereNotNull('email')
            ->get()
            ->filter(function ($user) use ($roles) {
                foreach ($roles as $role) {
                    if ($this->hasUserRole($user, $role)) {
                        return true;
                    }
                }
                return false;
            })
            ->values();

        if ($policy?->enforce_maker_checker) {
            $users = $users->filter(fn($u) => (int) $u->id !== (int) $entry->created_by)->values();
        }

        return $users;
    }

    private function hasUserRole($user, string $role): bool
    {
        if (!method_exists($user, 'hasRole')) {
            return true;
        }
        return $user->hasRole('super-admin') || $user->hasRole('Super Admin') || $user->hasRole($role);
    }

    private function nextRunDate(?string $currentDate, string $frequency): string
    {
        $date = $currentDate ? Carbon::parse($currentDate) : Carbon::today();

        return match ($frequency) {
            'weekly' => $date->addWeek()->toDateString(),
            'monthly' => $date->addMonth()->toDateString(),
            'quarterly' => $date->addMonths(3)->toDateString(),
            'yearly' => $date->addYear()->toDateString(),
            default => $date->addMonth()->toDateString(),
        };
    }
}
