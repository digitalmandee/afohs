<?php

namespace App\Services\Accounting;

use App\Models\AccountingBackfillRecord;
use App\Models\AccountingBackfillRun;
use App\Models\AccountingEventQueue;
use App\Models\AccountingPeriod;
use App\Models\AccountingRule;
use App\Models\FinancialInvoice;
use App\Models\FinancialReceipt;
use App\Models\JournalEntry;
use App\Services\Accounting\Support\AccountingPeriodGate;
use App\Services\Accounting\Support\FinancePostingClassifier;
use App\Services\Accounting\Support\RestaurantContextResolver;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Throwable;

class AccountingHistoricalBackfillService
{
    private const ANALYZED = 'analyzed';
    private const POSTED = 'posted';
    private const ALREADY_POSTED = 'already_posted';
    private const SKIPPED = 'skipped';
    private const FAILED = 'failed';
    private const UNSUPPORTED = 'unsupported';

    private const DEFAULT_CHUNK = 100;
    private const DEFAULT_SAMPLE_LIMIT = 10;

    public function __construct(
        private readonly FinancePostingClassifier $financePostingClassifier,
        private readonly AccountingEventDispatcher $accountingEventDispatcher,
        private readonly AccountingPeriodGate $accountingPeriodGate,
        private readonly RestaurantContextResolver $restaurantContextResolver
    )
    {
    }

    public function analyze(array $options = [], ?callable $progress = null, ?int $createdBy = null): array
    {
        $options = $this->normalizeOptions($options, 'analyze');
        $run = $this->createRun('analyze', $options, $createdBy);

        return $this->executeRun($run, $options, false, $progress);
    }

    public function run(array $options = [], ?callable $progress = null, ?int $createdBy = null): array
    {
        $options = $this->normalizeOptions($options, 'run');
        $resumeRunId = $options['resume_run_id'];

        if ($resumeRunId) {
            $run = AccountingBackfillRun::query()->findOrFail($resumeRunId);
            $storedOptions = array_merge($run->filters ?? [], [
                'family' => implode(',', (array) $run->families),
                'chunk' => $run->chunk_size,
                'include_deleted_receipts' => $run->include_deleted_receipts,
                'stop_on_error' => $run->stop_on_error,
                'commit' => $run->is_commit,
                'sample_limit' => $options['sample_limit'],
            ]);
            $options = $this->normalizeOptions($storedOptions, 'run');
        } else {
            $run = $this->createRun('run', $options, $createdBy);
        }

        return $this->executeRun($run, $options, (bool) $options['commit'], $progress);
    }

    public function reconcile(array $options = [], ?callable $progress = null): array
    {
        $options = $this->normalizeOptions($options, 'reconcile');

        if (!empty($options['run_id'])) {
            return $this->reconcileRun((int) $options['run_id'], $options);
        }

        $summary = $this->buildEmptySummary($options['families'], (int) $options['sample_limit']);

        foreach ($options['families'] as $familyKey) {
            $definition = $this->familyDefinition($familyKey);
            $query = $this->buildSourceQuery($definition, $options);
            $chunkSize = (int) $options['chunk'];

            $query->orderBy('id')->chunkById($chunkSize, function (Collection $models) use (&$summary, $definition, $options, $progress) {
                $chunkStats = [
                    'family' => $definition['key'],
                    'scanned' => 0,
                    'posted' => 0,
                    'already_posted' => 0,
                    'skipped' => 0,
                    'failed' => 0,
                    'unsupported' => 0,
                ];

                foreach ($models as $model) {
                    $result = $this->evaluateRecord($definition, $model, $options, false);
                    $this->accumulateFamilySummary($summary[$definition['key']], $result, (int) $options['sample_limit']);
                    $chunkStats['scanned']++;
                    $this->incrementChunkStatus($chunkStats, $result['status']);
                }

                if ($progress) {
                    $progress($chunkStats, $summary[$definition['key']]);
                }
            }, 'id');
        }

        return [
            'summary' => $this->finalizeReconciliationSummary($summary),
            'anomalies' => $this->buildReconciliationAnomalies($options['families'], $options),
        ];
    }

    private function executeRun(AccountingBackfillRun $run, array $options, bool $commit, ?callable $progress = null): array
    {
        $run->update([
            'status' => 'running',
            'started_at' => $run->started_at ?? now(),
        ]);

        try {
            $this->ensureRequiredRules($options['families']);

            if ($commit) {
                $this->ensurePeriodsForScope($options['families'], $options);
            }

            $summary = $this->buildEmptySummary($options['families'], (int) $options['sample_limit']);

            foreach ($options['families'] as $familyKey) {
                $definition = $this->familyDefinition($familyKey);
                $query = $this->buildSourceQuery($definition, $options);
                $chunkSize = (int) $options['chunk'];

                $query->orderBy('id')->chunkById($chunkSize, function (Collection $models) use ($run, $definition, $options, $commit, &$summary, $progress) {
                    $chunkStats = [
                        'family' => $definition['key'],
                        'scanned' => 0,
                        'posted' => 0,
                        'already_posted' => 0,
                        'skipped' => 0,
                        'failed' => 0,
                        'unsupported' => 0,
                    ];

                    foreach ($models as $model) {
                        if ($this->recordExistsForRun($run->id, $definition['source_type'], (int) $model->id)) {
                            continue;
                        }

                        $result = $this->evaluateRecord($definition, $model, $options, $commit);
                        $this->persistRecord($run->id, $definition, $result);
                        $this->accumulateFamilySummary($summary[$definition['key']], $result, (int) $options['sample_limit']);
                        $chunkStats['scanned']++;
                        $this->incrementChunkStatus($chunkStats, $result['status']);

                        if (!empty($options['stop_on_error']) && $result['status'] === self::FAILED) {
                            throw new RuntimeException("Stopped on error after {$definition['key']} #{$result['source_id']}: {$result['reason_text']}");
                        }
                    }

                    if ($progress) {
                        $progress($chunkStats, $summary[$definition['key']]);
                    }
                }, 'id');
            }

            $run->update([
                'status' => 'completed',
                'completed_at' => now(),
                'summary' => $summary,
            ]);

            return [
                'run' => $run->fresh(),
                'summary' => $summary,
            ];
        } catch (Throwable $exception) {
            $run->update([
                'status' => 'failed',
                'completed_at' => now(),
                'summary' => $run->summary,
            ]);

            throw $exception;
        }
    }

    private function normalizeOptions(array $options, string $mode): array
    {
        $get = function (string $snake, mixed $default = null) use ($options) {
            $kebab = str_replace('_', '-', $snake);

            return $options[$snake] ?? $options[$kebab] ?? $default;
        };

        $familyOption = (string) ($get('family', 'all'));
        $families = $this->parseFamilies($familyOption);
        $chunk = max(1, (int) ($get('chunk', self::DEFAULT_CHUNK)));
        $sampleLimit = max(1, (int) ($get('sample_limit', self::DEFAULT_SAMPLE_LIMIT)));

        return [
            'mode' => $mode,
            'families' => $families,
            'from' => !empty($get('from')) ? Carbon::parse((string) $get('from'))->toDateString() : null,
            'to' => !empty($get('to')) ? Carbon::parse((string) $get('to'))->toDateString() : null,
            'start_id' => !empty($get('start_id')) ? (int) $get('start_id') : null,
            'end_id' => !empty($get('end_id')) ? (int) $get('end_id') : null,
            'chunk' => $chunk,
            'sample_limit' => $sampleLimit,
            'include_deleted_receipts' => !empty($get('include_deleted_receipts')),
            'stop_on_error' => !empty($get('stop_on_error')),
            'commit' => !empty($get('commit')),
            'resume_run_id' => !empty($get('resume_run_id')) ? (int) $get('resume_run_id') : null,
            'run_id' => !empty($get('run_id')) ? (int) $get('run_id') : null,
            'include_details' => !empty($get('include_details')),
        ];
    }

    private function parseFamilies(string $familyOption): array
    {
        $available = array_keys($this->familyDefinitions());

        if ($familyOption === '' || strtolower($familyOption) === 'all') {
            return $available;
        }

        $families = collect(explode(',', $familyOption))
            ->map(fn (string $family) => trim($family))
            ->filter()
            ->values()
            ->all();

        $invalid = array_values(array_diff($families, $available));
        if (!empty($invalid)) {
            throw new RuntimeException('Unsupported backfill families: ' . implode(', ', $invalid));
        }

        return $families;
    }

    private function familyDefinitions(): array
    {
        return [
            'subscription_invoices' => [
                'key' => 'subscription_invoices',
                'kind' => 'invoice',
                'family' => 'subscription',
                'source_type' => FinancialInvoice::class,
                'event_type' => 'invoice_created',
                'rule_code' => 'subscription_invoice',
                'module_type' => 'subscription_invoice',
                'date_field' => 'issue_date',
                'amount_field' => 'total_price',
            ],
            'subscription_receipts' => [
                'key' => 'subscription_receipts',
                'kind' => 'receipt',
                'family' => 'subscription',
                'source_type' => FinancialReceipt::class,
                'event_type' => 'receipt_created',
                'rule_code' => 'subscription_receipt',
                'module_type' => 'subscription_receipt',
                'date_field' => 'receipt_date',
                'amount_field' => 'amount',
            ],
            'maintenance_invoices' => [
                'key' => 'maintenance_invoices',
                'kind' => 'invoice',
                'family' => 'maintenance',
                'source_type' => FinancialInvoice::class,
                'event_type' => 'invoice_created',
                'rule_code' => 'maintenance_invoice',
                'module_type' => 'maintenance_invoice',
                'date_field' => 'issue_date',
                'amount_field' => 'total_price',
            ],
            'maintenance_receipts' => [
                'key' => 'maintenance_receipts',
                'kind' => 'receipt',
                'family' => 'maintenance',
                'source_type' => FinancialReceipt::class,
                'event_type' => 'receipt_created',
                'rule_code' => 'maintenance_receipt',
                'module_type' => 'maintenance_receipt',
                'date_field' => 'receipt_date',
                'amount_field' => 'amount',
            ],
            'membership_invoices' => [
                'key' => 'membership_invoices',
                'kind' => 'invoice',
                'family' => 'membership',
                'source_type' => FinancialInvoice::class,
                'event_type' => 'invoice_created',
                'rule_code' => 'membership_invoice',
                'module_type' => 'membership_invoice',
                'date_field' => 'issue_date',
                'amount_field' => 'total_price',
            ],
            'membership_receipts' => [
                'key' => 'membership_receipts',
                'kind' => 'receipt',
                'family' => 'membership',
                'source_type' => FinancialReceipt::class,
                'event_type' => 'receipt_created',
                'rule_code' => 'membership_receipt',
                'module_type' => 'membership_receipt',
                'date_field' => 'receipt_date',
                'amount_field' => 'amount',
            ],
        ];
    }

    private function familyDefinition(string $familyKey): array
    {
        return $this->familyDefinitions()[$familyKey]
            ?? throw new RuntimeException("Unsupported backfill family '{$familyKey}'.");
    }

    private function createRun(string $mode, array $options, ?int $createdBy): AccountingBackfillRun
    {
        return AccountingBackfillRun::query()->create([
            'mode' => $mode,
            'families' => $options['families'],
            'filters' => [
                'from' => $options['from'],
                'to' => $options['to'],
                'start_id' => $options['start_id'],
                'end_id' => $options['end_id'],
            ],
            'chunk_size' => $options['chunk'],
            'is_commit' => (bool) $options['commit'],
            'include_deleted_receipts' => (bool) $options['include_deleted_receipts'],
            'stop_on_error' => (bool) $options['stop_on_error'],
            'status' => 'pending',
            'started_at' => now(),
            'created_by' => $createdBy,
        ]);
    }

    private function buildSourceQuery(array $definition, array $options): Builder
    {
        if ($definition['kind'] === 'invoice') {
            $query = FinancialInvoice::query()
                ->with(['items:id,invoice_id,fee_type,subscription_type_id,subscription_category_id'])
                ->where(function (Builder $builder) use ($definition) {
                    $this->applyInvoiceCandidateFilter($builder, $definition['family']);
                });

            return $this->applyCommonFilters($query, $definition['date_field'], $options);
        }

        $query = FinancialReceipt::query()
            ->withTrashed()
            ->with([
                'links.invoice.items:id,invoice_id,fee_type,subscription_type_id,subscription_category_id',
                'paymentAccount.coaAccount',
            ])
            ->whereExists(function ($builder) use ($definition) {
                $builder->selectRaw('1')
                    ->from('transaction_relations as tr')
                    ->leftJoin('financial_invoices as fi', 'fi.id', '=', 'tr.invoice_id')
                    ->leftJoin('financial_invoice_items as fii', function ($join) {
                        $join->on('fii.invoice_id', '=', 'fi.id')
                            ->whereNull('fii.deleted_at');
                    })
                    ->whereNull('tr.deleted_at')
                    ->whereColumn('tr.receipt_id', 'financial_receipts.id');

                $this->applyReceiptFamilySubqueryFilter($builder, $definition['family']);
            });

        return $this->applyCommonFilters($query, $definition['date_field'], $options);
    }

    private function applyCommonFilters(Builder $query, string $dateField, array $options): Builder
    {
        if (!empty($options['from'])) {
            $query->whereDate($dateField, '>=', $options['from']);
        }

        if (!empty($options['to'])) {
            $query->whereDate($dateField, '<=', $options['to']);
        }

        if (!empty($options['start_id'])) {
            $query->where('id', '>=', (int) $options['start_id']);
        }

        if (!empty($options['end_id'])) {
            $query->where('id', '<=', (int) $options['end_id']);
        }

        return $query;
    }

    private function applyInvoiceCandidateFilter(Builder $builder, string $family): void
    {
        $builder->where(function (Builder $query) use ($family) {
            if ($family === 'subscription') {
                $query->whereHas('items', function (Builder $items) {
                    $items->where(function (Builder $itemQuery) {
                        $itemQuery
                            ->whereNotNull('subscription_type_id')
                            ->orWhereNotNull('subscription_category_id')
                            ->orWhereIn('fee_type', ['5', 'subscription_fee']);
                    });
                })->orWhere(function (Builder $header) {
                    $header
                        ->whereNotNull('subscription_type_id')
                        ->orWhereNotNull('subscription_category_id')
                        ->orWhereIn('fee_type', ['5', 'subscription_fee'])
                        ->orWhere('invoice_type', 'subscription');
                });

                return;
            }

            if ($family === 'maintenance') {
                $query->whereHas('items', function (Builder $items) {
                    $items->whereIn('fee_type', ['4', 'maintenance_fee']);
                })->orWhere(function (Builder $header) {
                    $header
                        ->whereIn('fee_type', ['4', 'maintenance_fee'])
                        ->orWhere('invoice_type', 'maintenance');
                });

                return;
            }

            $query->whereHas('items', function (Builder $items) {
                $items->whereIn('fee_type', ['1', 'membership_fee', 'reinstating_fee']);
            })->orWhere(function (Builder $header) {
                $header
                    ->whereIn('fee_type', ['1', 'membership_fee', 'reinstating_fee'])
                    ->orWhere('invoice_type', 'membership');
            });
        });
    }

    private function applyReceiptFamilySubqueryFilter($builder, string $family): void
    {
        $builder->where(function ($query) use ($family) {
            if ($family === 'subscription') {
                $query
                    ->whereNotNull('fii.subscription_type_id')
                    ->orWhereNotNull('fii.subscription_category_id')
                    ->orWhereIn('fii.fee_type', ['5', 'subscription_fee'])
                    ->orWhereNotNull('fi.subscription_type_id')
                    ->orWhereNotNull('fi.subscription_category_id')
                    ->orWhereIn('fi.fee_type', ['5', 'subscription_fee'])
                    ->orWhere('fi.invoice_type', 'subscription');

                return;
            }

            if ($family === 'maintenance') {
                $query
                    ->whereIn('fii.fee_type', ['4', 'maintenance_fee'])
                    ->orWhereIn('fi.fee_type', ['4', 'maintenance_fee'])
                    ->orWhere('fi.invoice_type', 'maintenance');

                return;
            }

            $query
                ->whereIn('fii.fee_type', ['1', 'membership_fee', 'reinstating_fee'])
                ->orWhereIn('fi.fee_type', ['1', 'membership_fee', 'reinstating_fee'])
                ->orWhere('fi.invoice_type', 'membership');
        });
    }

    private function evaluateRecord(array $definition, object $model, array $options, bool $commit): array
    {
        $sourceDate = optional($model->{$definition['date_field']})->toDateString();
        $sourceAmount = (float) ($model->{$definition['amount_field']} ?? 0);

        $result = [
            'source_family' => $definition['key'],
            'source_kind' => $definition['kind'],
            'source_type' => $definition['source_type'],
            'source_id' => (int) $model->id,
            'source_date' => $sourceDate,
            'source_amount' => round($sourceAmount, 2),
            'classification_code' => null,
            'event_type' => $definition['event_type'],
            'posting_rule_code' => $definition['rule_code'],
            'queue_id' => null,
            'journal_entry_id' => null,
            'status' => self::ANALYZED,
            'reason_code' => null,
            'reason_text' => null,
            'payload' => [],
            'processed_at' => now(),
        ];

        if ($definition['kind'] === 'receipt') {
            if ($model->trashed() && empty($options['include_deleted_receipts'])) {
                return $this->finalizeResult($result, self::SKIPPED, 'deleted_receipt', 'Receipt is soft deleted and include-deleted mode is disabled.');
            }

            if ($model->links->isEmpty()) {
                return $this->finalizeResult($result, self::FAILED, 'missing_linked_invoice', 'Receipt has no invoice linkage.');
            }

            if ($model->links->pluck('invoice')->filter()->isEmpty()) {
                return $this->finalizeResult($result, self::FAILED, 'orphaned_receipt', 'Receipt links are present but linked invoices could not be resolved.');
            }
        }

        try {
            $classificationCode = $definition['kind'] === 'invoice'
                ? $this->financePostingClassifier->classifyInvoice($model)
                : $this->financePostingClassifier->classifyReceipt($model);
        } catch (RuntimeException $exception) {
            $reasonCode = str_contains(strtolower($exception->getMessage()), 'multiple accounting families')
                ? 'mixed_family'
                : 'unknown_family';
            $status = $reasonCode === 'mixed_family' ? self::UNSUPPORTED : self::FAILED;

            return $this->finalizeResult($result, $status, $reasonCode, $exception->getMessage());
        }

        $result['classification_code'] = $classificationCode;

        if ($classificationCode !== $definition['rule_code']) {
            return $this->finalizeResult(
                $result,
                self::UNSUPPORTED,
                'unsupported_family',
                "Record classified as {$classificationCode} which does not match {$definition['key']}."
            );
        }

        $rule = AccountingRule::query()
            ->where('code', $classificationCode)
            ->where('is_active', true)
            ->first();

        if (!$rule) {
            return $this->finalizeResult($result, self::FAILED, 'missing_rule', "Accounting rule '{$classificationCode}' is missing or inactive.");
        }

        try {
            $this->accountingPeriodGate->resolveOpenPeriodId($sourceDate ?: now()->toDateString());
        } catch (RuntimeException $exception) {
            return $this->finalizeResult($result, self::FAILED, 'missing_period', $exception->getMessage());
        }

        if ($definition['kind'] === 'receipt') {
            $paymentValidation = $this->validateReceiptPaymentAccount($model);
            if ($paymentValidation['status'] !== 'valid') {
                return $this->finalizeResult(
                    $result,
                    self::FAILED,
                    $paymentValidation['reason_code'],
                    $paymentValidation['reason_text']
                );
            }
        }

        $existingJournal = JournalEntry::query()
            ->where('module_type', $definition['module_type'])
            ->where('module_id', $model->id)
            ->orderBy('id')
            ->get();

        if ($existingJournal->count() > 1) {
            return $this->finalizeResult(
                $result,
                self::FAILED,
                'duplicate_journals_detected',
                'Multiple journals already exist for this source.'
            );
        }

        if ($existingJournal->count() === 1) {
            $result['journal_entry_id'] = (int) $existingJournal->first()->id;
            return $this->finalizeResult($result, self::ALREADY_POSTED, 'already_posted', 'Journal already exists for this source.');
        }

        $existingEvent = AccountingEventQueue::query()
            ->where('event_type', $definition['event_type'])
            ->where('source_type', $definition['source_type'])
            ->where('source_id', $model->id)
            ->latest('id')
            ->first();

        if ($existingEvent?->status === 'posted') {
            $result['queue_id'] = (int) $existingEvent->id;
            $result['journal_entry_id'] = $existingEvent->journal_entry_id ? (int) $existingEvent->journal_entry_id : null;
            return $this->finalizeResult($result, self::ALREADY_POSTED, 'already_posted', 'Accounting event already posted for this source.');
        }

        if ($existingEvent && in_array($existingEvent->status, ['pending', 'processing'], true)) {
            $result['queue_id'] = (int) $existingEvent->id;
            return $this->finalizeResult($result, self::SKIPPED, 'event_in_progress', 'Accounting event is already pending or processing.');
        }

        if (!$commit) {
            if ($existingEvent?->status === 'failed') {
                $result['queue_id'] = (int) $existingEvent->id;
                return $this->finalizeResult(
                    $result,
                    self::FAILED,
                    'existing_failed_event',
                    $existingEvent->error_message ?: 'Source has a previously failed accounting event.'
                );
            }

            return $this->finalizeResult($result, self::ANALYZED, null, 'Eligible for backfill posting.');
        }

        $event = $this->dispatchHistoricalEvent($definition, $model, $classificationCode);
        $result['queue_id'] = (int) $event->id;
        $result['journal_entry_id'] = $event->journal_entry_id ? (int) $event->journal_entry_id : null;

        if ($event->status === 'posted') {
            return $this->finalizeResult($result, self::POSTED, null, 'Posted successfully.');
        }

        return $this->finalizeResult(
            $result,
            self::FAILED,
            $this->mapDispatcherFailureReason($event->error_message),
            $event->error_message ?: 'Posting failed.'
        );
    }

    private function dispatchHistoricalEvent(array $definition, object $model, string $classificationCode): AccountingEventQueue
    {
        $restaurantId = $definition['kind'] === 'invoice'
            ? $this->restaurantContextResolver->forInvoice($model)
            : $this->restaurantContextResolver->forReceipt($model);

        return $this->accountingEventDispatcher->dispatch(
            $definition['event_type'],
            $definition['source_type'],
            (int) $model->id,
            [
                'backfill' => true,
                'source_family' => $definition['key'],
                'classification_code' => $classificationCode,
            ],
            $model->created_by ?? null,
            $restaurantId
        );
    }

    private function validateReceiptPaymentAccount(FinancialReceipt $receipt): array
    {
        if (empty($receipt->payment_account_id)) {
            return [
                'status' => 'invalid',
                'reason_code' => 'missing_payment_account',
                'reason_text' => "Financial receipt #{$receipt->id} is missing a payment account mapping.",
            ];
        }

        $paymentAccount = $receipt->paymentAccount;
        if (!$paymentAccount || $paymentAccount->trashed()) {
            return [
                'status' => 'invalid',
                'reason_code' => 'invalid_payment_account',
                'reason_text' => "Financial receipt #{$receipt->id} references an invalid or deleted payment account.",
            ];
        }

        $status = strtolower(trim((string) ($paymentAccount->status ?? 'active')));
        if ($status !== '' && $status !== 'active') {
            return [
                'status' => 'invalid',
                'reason_code' => 'invalid_payment_account',
                'reason_text' => "Payment account '{$paymentAccount->name}' is not active for accounting posting.",
            ];
        }

        $coaAccount = $paymentAccount->coaAccount;
        if (!$coaAccount || !$coaAccount->is_active || !$coaAccount->is_postable) {
            return [
                'status' => 'invalid',
                'reason_code' => 'invalid_payment_account',
                'reason_text' => "Payment account '{$paymentAccount->name}' is missing a valid postable chart of account.",
            ];
        }

        return ['status' => 'valid'];
    }

    private function mapDispatcherFailureReason(?string $message): string
    {
        $normalized = strtolower(trim((string) $message));

        return match (true) {
            str_contains($normalized, 'amount is negative') => 'negative_amount',
            str_contains($normalized, 'missing a payment account') => 'missing_payment_account',
            str_contains($normalized, 'invalid or deleted payment account') => 'invalid_payment_account',
            str_contains($normalized, 'inactive or non-postable') => 'invalid_payment_account',
            str_contains($normalized, 'missing or inactive') => 'missing_rule',
            str_contains($normalized, 'soft deleted') => 'deleted_receipt',
            str_contains($normalized, 'not found') => 'orphaned_receipt',
            str_contains($normalized, 'open accounting period') => 'missing_period',
            default => 'posting_failed',
        };
    }

    private function finalizeResult(array $result, string $status, ?string $reasonCode, ?string $reasonText): array
    {
        $result['status'] = $status;
        $result['reason_code'] = $reasonCode;
        $result['reason_text'] = $reasonText;
        $result['payload'] = array_filter([
            'status' => $status,
            'reason_code' => $reasonCode,
            'reason_text' => $reasonText,
        ], fn ($value) => $value !== null);

        return $result;
    }

    private function persistRecord(int $runId, array $definition, array $result): void
    {
        AccountingBackfillRecord::query()->updateOrCreate(
            [
                'backfill_run_id' => $runId,
                'source_type' => $definition['source_type'],
                'source_id' => $result['source_id'],
            ],
            $result + ['backfill_run_id' => $runId]
        );
    }

    private function recordExistsForRun(int $runId, string $sourceType, int $sourceId): bool
    {
        return AccountingBackfillRecord::query()
            ->where('backfill_run_id', $runId)
            ->where('source_type', $sourceType)
            ->where('source_id', $sourceId)
            ->exists();
    }

    private function buildEmptySummary(array $families, int $sampleLimit): array
    {
        $summary = [];

        foreach ($families as $familyKey) {
            $summary[$familyKey] = [
                'family' => $familyKey,
                'total_source_count' => 0,
                'total_amount' => 0.0,
                'eligible_count' => 0,
                'posted_count' => 0,
                'already_posted_count' => 0,
                'skipped_count' => 0,
                'failed_count' => 0,
                'unsupported_count' => 0,
                'missing_mapping_count' => 0,
                'deleted_orphaned_count' => 0,
                'date_range' => ['from' => null, 'to' => null],
                'journal_entry_ids' => [],
                'failures_by_reason' => [],
                'samples' => [],
                'sample_limit' => $sampleLimit,
            ];
        }

        return $summary;
    }

    private function accumulateFamilySummary(array &$summary, array $result, int $sampleLimit): void
    {
        $summary['total_source_count']++;
        $summary['total_amount'] = round($summary['total_amount'] + (float) $result['source_amount'], 2);

        if ($result['source_date']) {
            if (!$summary['date_range']['from'] || $result['source_date'] < $summary['date_range']['from']) {
                $summary['date_range']['from'] = $result['source_date'];
            }

            if (!$summary['date_range']['to'] || $result['source_date'] > $summary['date_range']['to']) {
                $summary['date_range']['to'] = $result['source_date'];
            }
        }

        match ($result['status']) {
            self::ANALYZED => $summary['eligible_count']++,
            self::POSTED => $summary['posted_count']++,
            self::ALREADY_POSTED => $summary['already_posted_count']++,
            self::SKIPPED => $summary['skipped_count']++,
            self::FAILED => $summary['failed_count']++,
            self::UNSUPPORTED => $summary['unsupported_count']++,
            default => null,
        };

        if (in_array($result['reason_code'], ['missing_payment_account', 'invalid_payment_account', 'missing_rule'], true)) {
            $summary['missing_mapping_count']++;
        }

        if (in_array($result['reason_code'], ['deleted_receipt', 'orphaned_receipt', 'missing_linked_invoice'], true)) {
            $summary['deleted_orphaned_count']++;
        }

        if (in_array($result['status'], [self::FAILED, self::SKIPPED, self::UNSUPPORTED], true)) {
            $reasonKey = $result['reason_code'] ?: 'none';
            $summary['failures_by_reason'][$reasonKey] = ($summary['failures_by_reason'][$reasonKey] ?? 0) + 1;
        }

        if (!empty($result['journal_entry_id']) && in_array($result['status'], [self::POSTED, self::ALREADY_POSTED], true)) {
            $summary['journal_entry_ids'][(int) $result['journal_entry_id']] = true;
        }

        if ($result['reason_code']) {
            $summary['samples'][$result['reason_code']] = $summary['samples'][$result['reason_code']] ?? [];

            if (count($summary['samples'][$result['reason_code']]) < $sampleLimit) {
                $summary['samples'][$result['reason_code']][] = $result['source_id'];
            }
        }
    }

    private function incrementChunkStatus(array &$chunkStats, string $status): void
    {
        if ($status === self::ANALYZED) {
            return;
        }

        $map = [
            self::POSTED => 'posted',
            self::ALREADY_POSTED => 'already_posted',
            self::SKIPPED => 'skipped',
            self::FAILED => 'failed',
            self::UNSUPPORTED => 'unsupported',
        ];

        $key = $map[$status] ?? null;
        if ($key) {
            $chunkStats[$key]++;
        }
    }

    private function ensureRequiredRules(array $families): void
    {
        $requiredRules = collect($families)
            ->map(fn (string $familyKey) => $this->familyDefinition($familyKey)['rule_code'])
            ->unique()
            ->values();

        $configuredRules = AccountingRule::query()
            ->whereIn('code', $requiredRules)
            ->where('is_active', true)
            ->pluck('code');

        $missing = $requiredRules->diff($configuredRules)->values();
        if ($missing->isNotEmpty()) {
            throw new RuntimeException('Missing required active accounting rules: ' . $missing->implode(', '));
        }
    }

    private function ensurePeriodsForScope(array $families, array $options): void
    {
        $years = collect();

        foreach ($families as $familyKey) {
            $definition = $this->familyDefinition($familyKey);
            $query = $this->buildSourceQuery($definition, $options);
            $minDate = (clone $query)->min($definition['date_field']);
            $maxDate = (clone $query)->max($definition['date_field']);

            if (!$minDate || !$maxDate) {
                continue;
            }

            $startYear = Carbon::parse($minDate)->year;
            $endYear = Carbon::parse($maxDate)->year;

            for ($year = $startYear; $year <= $endYear; $year++) {
                $years->push($year);
            }
        }

        $years->unique()->sort()->each(function (int $year) {
            $start = Carbon::create($year, 1, 1)->toDateString();
            $end = Carbon::create($year, 12, 31)->toDateString();

            $period = AccountingPeriod::query()
                ->whereDate('start_date', $start)
                ->whereDate('end_date', $end)
                ->first();

            if (!$period) {
                AccountingPeriod::query()->create([
                    'name' => "{$year} Fiscal Period",
                    'start_date' => $start,
                    'end_date' => $end,
                    'status' => 'open',
                ]);
            }
        });
    }

    private function reconcileRun(int $runId, array $options): array
    {
        $run = AccountingBackfillRun::query()->with('records')->findOrFail($runId);
        $summary = [];

        foreach ($run->records->groupBy('source_family') as $family => $records) {
            $postedJournalIds = $records
                ->whereIn('status', [self::POSTED, self::ALREADY_POSTED])
                ->pluck('journal_entry_id')
                ->filter()
                ->unique()
                ->values();

            $postedJournalAmount = $this->journalAmounts($postedJournalIds->all());
            $summary[$family] = [
                'source_population_count' => $records->count(),
                'source_total_amount' => round((float) $records->sum('source_amount'), 2),
                'eligible_count' => $records->where('status', self::ANALYZED)->count(),
                'posted_count' => $records->where('status', self::POSTED)->count(),
                'already_posted_count' => $records->where('status', self::ALREADY_POSTED)->count(),
                'skipped_count' => $records->where('status', self::SKIPPED)->count(),
                'failed_count' => $records->where('status', self::FAILED)->count(),
                'unsupported_count' => $records->where('status', self::UNSUPPORTED)->count(),
                'total_posted_journal_amount' => $postedJournalAmount,
                'difference_vs_source_amount' => round((float) $records->sum('source_amount') - $postedJournalAmount, 2),
                'failures_by_reason' => $records
                    ->whereIn('status', [self::FAILED, self::SKIPPED, self::UNSUPPORTED])
                    ->groupBy('reason_code')
                    ->map->count()
                    ->all(),
            ];
        }

        return [
            'run' => $run,
            'summary' => $summary,
            'anomalies' => $this->buildReconciliationAnomalies($run->families ?? [], array_merge($options, $run->filters ?? [])),
        ];
    }

    private function journalAmounts(array $journalEntryIds): float
    {
        if (empty($journalEntryIds)) {
            return 0.0;
        }

        return round((float) DB::table('journal_lines')
            ->select('journal_entry_id', DB::raw('SUM(debit) as total_debit'))
            ->whereIn('journal_entry_id', $journalEntryIds)
            ->groupBy('journal_entry_id')
            ->get()
            ->sum('total_debit'), 2);
    }

    private function buildReconciliationAnomalies(array $families, array $options): array
    {
        $moduleTypes = collect($families)
            ->map(fn (string $familyKey) => $this->familyDefinition($familyKey)['module_type'])
            ->unique()
            ->values()
            ->all();

        $duplicateJournals = JournalEntry::query()
            ->select('module_type', 'module_id', DB::raw('COUNT(*) as duplicates'))
            ->whereIn('module_type', $moduleTypes)
            ->groupBy('module_type', 'module_id')
            ->having('duplicates', '>', 1)
            ->get();

        $journalsWithoutSource = JournalEntry::query()
            ->whereIn('module_type', $moduleTypes)
            ->get()
            ->filter(function (JournalEntry $entry) {
                return match ($entry->module_type) {
                    'subscription_invoice', 'maintenance_invoice', 'membership_invoice' => !FinancialInvoice::query()->whereKey($entry->module_id)->exists(),
                    'subscription_receipt', 'maintenance_receipt', 'membership_receipt' => !FinancialReceipt::withTrashed()->whereKey($entry->module_id)->exists(),
                    default => false,
                };
            })
            ->map(fn (JournalEntry $entry) => [
                'journal_entry_id' => $entry->id,
                'module_type' => $entry->module_type,
                'module_id' => $entry->module_id,
            ])
            ->values()
            ->all();

        return [
            'duplicate_journals' => $duplicateJournals->map(fn ($row) => [
                'module_type' => $row->module_type,
                'module_id' => $row->module_id,
                'duplicates' => (int) $row->duplicates,
            ])->all(),
            'journals_without_valid_source' => $journalsWithoutSource,
        ];
    }

    private function finalizeReconciliationSummary(array $summary): array
    {
        foreach ($summary as $family => &$row) {
            $journalIds = array_keys($row['journal_entry_ids'] ?? []);
            $postedJournalAmount = $this->journalAmounts($journalIds);

            $row = [
                'source_population_count' => $row['total_source_count'],
                'source_total_amount' => round((float) $row['total_amount'], 2),
                'eligible_count' => $row['eligible_count'],
                'posted_count' => $row['posted_count'],
                'already_posted_count' => $row['already_posted_count'],
                'skipped_count' => $row['skipped_count'],
                'failed_count' => $row['failed_count'],
                'unsupported_count' => $row['unsupported_count'],
                'total_posted_journal_amount' => $postedJournalAmount,
                'difference_vs_source_amount' => round((float) $row['total_amount'] - $postedJournalAmount, 2),
                'failures_by_reason' => $row['failures_by_reason'],
            ];
        }

        return $summary;
    }
}
