<?php

namespace App\Services\Accounting;

use App\Models\AccountingRule;
use App\Models\CoaAccount;
use App\Models\FinancialInvoice;
use App\Models\PaymentAccount;
use App\Models\TransactionType;
use App\Models\Vendor;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Throwable;

class CoaBackfillService
{
    public function dryRun(string $source = 'auto'): array
    {
        return $this->buildReport($source, true);
    }

    public function backfill(string $source = 'auto'): array
    {
        return DB::transaction(function () use ($source) {
            return $this->buildReport($source, false);
        });
    }

    private function buildReport(string $source, bool $dryRun): array
    {
        $discovery = $this->discoverLegacyAccounts($source);
        $fallbacks = $this->fallbackAccounts();
        $candidates = $this->mergeCandidates($discovery['records'], $fallbacks);
        $hierarchy = $this->buildHierarchy($candidates);

        $report = [
            'source' => $source,
            'dry_run' => $dryRun,
            'discovered_codes' => $discovery['records']->count(),
            'discovery_sources' => $discovery['sources'],
            'fallback_accounts' => count($fallbacks),
            'conflicts' => $discovery['conflicts'],
            'unresolved_codes' => $discovery['unresolved_codes'],
            'accounts_by_level' => $hierarchy['rows']->groupBy('level')->map->count()->sortKeys()->all(),
            'accounts_by_type' => $hierarchy['rows']->groupBy('type')->map->count()->sortKeys()->all(),
            'proposed_accounts' => $hierarchy['rows']->count(),
            'sample_accounts' => $hierarchy['rows']->take(12)->values()->all(),
            'created' => 0,
            'updated' => 0,
            'payment_accounts_linked' => 0,
            'vendors_linked' => 0,
            'rules_linked' => 0,
            'mapped_codes' => [],
        ];

        if ($dryRun) {
            $report['mapped_codes'] = $this->buildLegacyCodeMapPreview($hierarchy['rows']);

            return $report;
        }

        $persisted = $this->persistHierarchy($hierarchy['rows']);
        $report['created'] = $persisted['created'];
        $report['updated'] = $persisted['updated'];
        $report['mapped_codes'] = $persisted['legacy_code_map'];

        $reconcile = $this->reconcileOperationalMappings($persisted['legacy_code_map'], $persisted['defaults']);
        $report['payment_accounts_linked'] = $reconcile['payment_accounts_linked'];
        $report['vendors_linked'] = $reconcile['vendors_linked'];
        $report['rules_linked'] = $reconcile['rules_linked'];
        $report['unresolved_mappings'] = $reconcile['unresolved'];

        return $report;
    }

    private function discoverLegacyAccounts(string $source): array
    {
        $records = collect();
        $sources = [];
        $conflicts = [];
        $unresolved = [];

        $requested = $source === 'auto'
            ? ['legacy', 'current', 'dump']
            : array_filter(array_map('trim', explode(',', $source)));

        foreach ($requested as $mode) {
            if ($mode === 'legacy') {
                try {
                    $legacyRecords = $this->discoverFromDatabase('old_afohs');
                    if ($legacyRecords->isNotEmpty()) {
                        $records = $records->concat($legacyRecords);
                        $sources[] = 'legacy-db';
                    }
                } catch (Throwable $exception) {
                    $conflicts[] = 'Legacy DB unavailable: ' . $exception->getMessage();
                }
            }

            if ($mode === 'current') {
                $currentRecords = $this->discoverFromDatabase(config('database.default', 'mysql'));
                if ($currentRecords->isNotEmpty()) {
                    $records = $records->concat($currentRecords);
                    $sources[] = 'current-db';
                }
            }

            if ($mode === 'dump') {
                $dumpRecords = $this->discoverFromDumpFiles();
                if ($dumpRecords->isNotEmpty()) {
                    $records = $records->concat($dumpRecords);
                    $sources[] = 'sql-dump';
                }
            }
        }

        $records = $records
            ->filter(fn (array $row) => !empty($row['legacy_code']))
            ->map(function (array $row) use (&$unresolved) {
                $parsed = $this->parseCode((string) $row['legacy_code']);
                if ($parsed['status'] !== 'resolved') {
                    $unresolved[] = [
                        'legacy_code' => $row['legacy_code'],
                        'name' => $row['name'],
                        'reason' => $parsed['reason'],
                        'source' => $row['source_table'],
                    ];
                }

                $row['segments'] = $parsed['segments'];
                $row['parse_status'] = $parsed['status'];
                $row['parse_reason'] = $parsed['reason'];

                return $row;
            })
            ->filter(fn (array $row) => $row['parse_status'] === 'resolved');

        return [
            'records' => $records->values(),
            'sources' => array_values(array_unique($sources)),
            'conflicts' => array_values(array_unique($conflicts)),
            'unresolved_codes' => $unresolved,
        ];
    }

    private function discoverFromDatabase(string $connection): Collection
    {
        $rows = collect();

        $transactionTypeRows = DB::connection($connection)
            ->table('transaction_types')
            ->select('id', 'name', 'type', 'account')
            ->whereNotNull('account')
            ->where('account', '!=', '')
            ->get();

        foreach ($transactionTypeRows as $row) {
            $rows->push([
                'legacy_code' => trim((string) $row->account),
                'name' => trim((string) $row->name) ?: 'Legacy Account ' . trim((string) $row->account),
                'type' => $this->inferTypeFromTransactionType($row->name, $row->type),
                'source_table' => $connection . '.transaction_types',
                'source_id' => (int) $row->id,
                'is_postable' => true,
                'explicit_type' => false,
            ]);
        }

        $invoiceRows = DB::connection($connection)
            ->table('financial_invoices')
            ->select('id', 'invoice_type', 'fee_type', 'coa_code')
            ->whereNotNull('coa_code')
            ->where('coa_code', '!=', '')
            ->get();

        foreach ($invoiceRows as $row) {
            $code = trim((string) $row->coa_code);
            if ($code === '') {
                continue;
            }

            $rows->push([
                'legacy_code' => $code,
                'name' => $this->invoiceLabel((string) $row->invoice_type, (string) $row->fee_type),
                'type' => $this->inferTypeFromInvoice($row->invoice_type, $row->fee_type),
                'source_table' => $connection . '.financial_invoices',
                'source_id' => (int) $row->id,
                'is_postable' => true,
                'explicit_type' => false,
            ]);
        }

        return $rows;
    }

    private function discoverFromDumpFiles(): Collection
    {
        $rows = collect();

        $transactionTypePath = base_path('dbdump/afohs-club_transaction_types.sql');
        if (File::exists($transactionTypePath)) {
            $parsed = $this->parseDumpTable($transactionTypePath, 'transaction_types');
            foreach ($parsed as $row) {
                $account = trim((string) ($row['account'] ?? ''));
                if ($account === '') {
                    continue;
                }

                $rows->push([
                    'legacy_code' => $account,
                    'name' => trim((string) ($row['name'] ?? '')) ?: 'Legacy Account ' . $account,
                    'type' => $this->inferTypeFromTransactionType($row['name'] ?? null, $row['type'] ?? null),
                    'source_table' => 'dump.transaction_types',
                    'source_id' => (int) ($row['id'] ?? 0),
                    'is_postable' => true,
                    'explicit_type' => false,
                ]);
            }
        }

        $invoicePath = base_path('dbdump/afohs-club_financial_invoices.sql');
        if (File::exists($invoicePath)) {
            $parsed = $this->parseDumpTable($invoicePath, 'financial_invoices');
            foreach ($parsed as $row) {
                $code = trim((string) ($row['coa_code'] ?? ''));
                if ($code === '') {
                    continue;
                }

                $rows->push([
                    'legacy_code' => $code,
                    'name' => $this->invoiceLabel((string) ($row['invoice_type'] ?? ''), (string) ($row['fee_type'] ?? '')),
                    'type' => $this->inferTypeFromInvoice($row['invoice_type'] ?? null, $row['fee_type'] ?? null),
                    'source_table' => 'dump.financial_invoices',
                    'source_id' => (int) ($row['id'] ?? 0),
                    'is_postable' => true,
                    'explicit_type' => false,
                ]);
            }
        }

        return $rows;
    }

    private function parseDumpTable(string $path, string $table): array
    {
        $sql = File::get($path);

        if (!preg_match('/CREATE TABLE `' . preg_quote($table, '/') . '` \((.*?)\)\s*ENGINE=/s', $sql, $createMatch)) {
            return [];
        }

        preg_match_all('/^\s*`([^`]+)`/m', $createMatch[1], $columnMatches);
        $columns = $columnMatches[1] ?? [];

        if (empty($columns)) {
            return [];
        }

        if (!preg_match('/INSERT INTO `' . preg_quote($table, '/') . '` VALUES\s*(.*?);/s', $sql, $insertMatch)) {
            return [];
        }

        $rows = [];
        foreach ($this->splitSqlTuples($insertMatch[1]) as $tuple) {
            $values = str_getcsv($tuple, ',', "'", '\\');
            if (count($values) !== count($columns)) {
                continue;
            }

            $row = [];
            foreach ($columns as $index => $column) {
                $value = $values[$index] ?? null;
                $row[$column] = strtoupper((string) $value) === 'NULL' ? null : $value;
            }
            $rows[] = $row;
        }

        return $rows;
    }

    private function splitSqlTuples(string $payload): array
    {
        $tuples = [];
        $buffer = '';
        $depth = 0;
        $inString = false;
        $escaped = false;

        foreach (str_split($payload) as $char) {
            if ($char === '\\' && $inString) {
                $escaped = !$escaped;
                $buffer .= $char;
                continue;
            }

            if ($char === "'" && !$escaped) {
                $inString = !$inString;
                $buffer .= $char;
                continue;
            }

            $escaped = false;

            if (!$inString && $char === '(') {
                $depth++;
                if ($depth === 1) {
                    $buffer = '';
                    continue;
                }
            }

            if (!$inString && $char === ')') {
                $depth--;
                if ($depth === 0) {
                    $tuples[] = $buffer;
                    $buffer = '';
                    continue;
                }
            }

            if ($depth >= 1) {
                $buffer .= $char;
            }
        }

        return $tuples;
    }

    private function mergeCandidates(Collection $records, array $fallbacks): Collection
    {
        $grouped = $records->groupBy(fn (array $row) => trim((string) $row['legacy_code']));
        $candidates = collect();

        foreach ($grouped as $legacyCode => $rows) {
            $first = $rows->first();
            $typeVotes = $rows->pluck('type')->filter()->countBy();
            $nameVotes = $rows->pluck('name')->filter()->countBy();

            $candidates->push([
                'legacy_code' => $legacyCode,
                'segments' => $first['segments'],
                'full_code' => implode('-', $first['segments']),
                'name' => (string) ($nameVotes->sortDesc()->keys()->first() ?? ('Legacy Account ' . $legacyCode)),
                'type' => (string) ($typeVotes->sortDesc()->keys()->first() ?? 'income'),
                'is_postable' => true,
                'metadata' => [
                    'legacy_code' => $legacyCode,
                    'source_tables' => $rows->pluck('source_table')->unique()->values()->all(),
                    'source_ids' => $rows->pluck('source_id')->filter()->values()->all(),
                    'classification' => 'inferred',
                    'backfill_origin' => 'legacy',
                ],
            ]);
        }

        foreach ($fallbacks as $fallback) {
            $exists = $candidates->firstWhere('full_code', $fallback['full_code']);
            if (!$exists) {
                $candidates->push($fallback);
            }
        }

        return $candidates->values();
    }

    private function buildHierarchy(Collection $candidates): array
    {
        $rows = collect();

        foreach ($candidates as $candidate) {
            $segments = $candidate['segments'];

            foreach ($segments as $index => $segment) {
                $prefix = array_slice($segments, 0, $index + 1);
                $fullCode = implode('-', $prefix);
                $incoming = [
                    'full_code' => $fullCode,
                    'segments' => $prefix,
                    'level' => count($prefix),
                    'type' => $candidate['type'],
                    'name' => $index === count($segments) - 1
                        ? $candidate['name']
                        : $this->generatedParentName($candidate['type'], $prefix),
                    'is_postable' => $index === count($segments) - 1 ? (bool) $candidate['is_postable'] : false,
                    'is_active' => true,
                    'metadata' => $index === count($segments) - 1
                        ? $candidate['metadata']
                        : [
                            'generated' => true,
                            'generated_from_legacy_code' => $candidate['legacy_code'],
                            'backfill_origin' => 'generated-prefix',
                        ],
                ];

                $existing = $rows->get($fullCode);
                if (!$existing) {
                    $rows->put($fullCode, $incoming);
                    continue;
                }

                $existingGenerated = (bool) ($existing['metadata']['generated'] ?? false);
                $incomingGenerated = (bool) ($incoming['metadata']['generated'] ?? false);

                if ($existingGenerated && !$incomingGenerated) {
                    $rows->put($fullCode, $incoming);
                    continue;
                }

                if (!$existingGenerated && $incomingGenerated) {
                    continue;
                }

                if ($incoming['is_postable'] && !$existing['is_postable']) {
                    $rows->put($fullCode, array_merge($existing, $incoming));
                }
            }
        }

        return [
            'rows' => $rows
                ->sortBy(function (array $row) {
                    return sprintf('%02d-%s', $row['level'], $row['full_code']);
                })
                ->values(),
        ];
    }

    private function persistHierarchy(Collection $rows): array
    {
        $created = 0;
        $updated = 0;
        $idMap = [];
        $legacyCodeMap = [];

        foreach ($rows as $row) {
            $parentCode = $row['level'] > 1
                ? implode('-', array_slice($row['segments'], 0, -1))
                : null;

            $payload = [
                'segment1' => $row['segments'][0] ?? null,
                'segment2' => $row['segments'][1] ?? null,
                'segment3' => $row['segments'][2] ?? null,
                'segment4' => $row['segments'][3] ?? null,
                'name' => $row['name'],
                'type' => $row['type'],
                'level' => $row['level'],
                'parent_id' => $parentCode ? ($idMap[$parentCode] ?? null) : null,
                'is_postable' => $row['is_postable'],
                'is_active' => $row['is_active'],
                'metadata' => $row['metadata'],
            ];

            $account = CoaAccount::withTrashed()->firstWhere('full_code', $row['full_code']);

            if ($account) {
                if ($account->trashed()) {
                    $account->restore();
                }
                $account->fill($payload);
                if ($account->isDirty()) {
                    $account->save();
                    $updated++;
                }
            } else {
                $account = CoaAccount::create($payload + ['full_code' => $row['full_code']]);
                $created++;
            }

            $idMap[$row['full_code']] = $account->id;
            if (!empty($row['metadata']['legacy_code']) && $row['is_postable']) {
                $legacyCodeMap[(string) $row['metadata']['legacy_code']] = $account->id;
            }
        }

        return [
            'created' => $created,
            'updated' => $updated,
            'legacy_code_map' => $legacyCodeMap,
            'defaults' => $this->loadDefaultAccounts(),
        ];
    }

    private function reconcileOperationalMappings(array $legacyCodeMap, array $defaults): array
    {
        $paymentAccountsLinked = 0;
        $vendorsLinked = 0;
        $rulesLinked = 0;
        $unresolved = [];

        PaymentAccount::query()->whereNull('coa_account_id')->get()->each(function (PaymentAccount $account) use (&$paymentAccountsLinked, &$unresolved, $defaults) {
            $targetId = $this->defaultPaymentAccountTarget($account, $defaults);
            if (!$targetId) {
                $unresolved[] = [
                    'entity' => 'payment_account',
                    'id' => $account->id,
                    'name' => $account->name,
                    'reason' => 'No default cash/bank account found.',
                ];
                return;
            }

            $account->forceFill(['coa_account_id' => $targetId])->save();
            $paymentAccountsLinked++;
        });

        Vendor::query()->get()->each(function (Vendor $vendor) use (&$vendorsLinked, &$unresolved, $defaults) {
            $changed = false;

            if (!$vendor->payable_account_id && !empty($defaults['accounts_payable_id'])) {
                $vendor->payable_account_id = $defaults['accounts_payable_id'];
                $changed = true;
            }

            if (!$vendor->advance_account_id && !empty($defaults['vendor_advances_id'])) {
                $vendor->advance_account_id = $defaults['vendor_advances_id'];
                $changed = true;
            }

            if ($changed) {
                $vendor->save();
                $vendorsLinked++;
            } elseif (!$vendor->payable_account_id && !$vendor->advance_account_id) {
                $unresolved[] = [
                    'entity' => 'vendor',
                    'id' => $vendor->id,
                    'name' => $vendor->name,
                    'reason' => 'Vendor default payable/advance accounts unavailable.',
                ];
            }
        });

        AccountingRule::query()->get()->each(function (AccountingRule $rule) use (&$rulesLinked, &$unresolved, $legacyCodeMap) {
            $lines = (array) $rule->lines;
            $changed = false;

            foreach ($lines as $index => $line) {
                if (!empty($line['account_id'])) {
                    continue;
                }

                $code = trim((string) ($line['account_code'] ?? $line['coa_code'] ?? $line['account'] ?? ''));
                if ($code === '') {
                    continue;
                }

                if (!isset($legacyCodeMap[$code])) {
                    $unresolved[] = [
                        'entity' => 'accounting_rule',
                        'id' => $rule->id,
                        'name' => $rule->name,
                        'reason' => "No COA account matched legacy code {$code}.",
                    ];
                    continue;
                }

                $lines[$index]['account_id'] = $legacyCodeMap[$code];
                $changed = true;
            }

            if ($changed) {
                $rule->forceFill(['lines' => $lines])->save();
                $rulesLinked++;
            }
        });

        return [
            'payment_accounts_linked' => $paymentAccountsLinked,
            'vendors_linked' => $vendorsLinked,
            'rules_linked' => $rulesLinked,
            'unresolved' => $unresolved,
        ];
    }

    private function buildLegacyCodeMapPreview(Collection $rows): array
    {
        return $rows
            ->filter(fn (array $row) => !empty($row['metadata']['legacy_code']) && $row['is_postable'])
            ->mapWithKeys(fn (array $row) => [$row['metadata']['legacy_code'] => $row['full_code']])
            ->all();
    }

    private function parseCode(string $code): array
    {
        $clean = trim(preg_replace('/[^A-Za-z0-9\-\.\/]/', '', $code) ?? '');
        if ($clean === '') {
            return ['status' => 'unresolved', 'segments' => [], 'reason' => 'Code is empty after normalization.'];
        }

        if (preg_match('/[-\.\/]/', $clean)) {
            $segments = array_values(array_filter(preg_split('/[-\.\/]+/', $clean) ?: [], fn ($segment) => $segment !== ''));
        } else {
            $segments = $this->chunkCompactCode($clean);
        }

        if (empty($segments) || count($segments) > 4) {
            return ['status' => 'unresolved', 'segments' => [], 'reason' => 'Code could not be split into 1-4 segments.'];
        }

        if (collect($segments)->contains(fn ($segment) => strlen((string) $segment) > 4)) {
            return ['status' => 'unresolved', 'segments' => [], 'reason' => 'At least one generated segment exceeds 4 characters.'];
        }

        return ['status' => 'resolved', 'segments' => $segments, 'reason' => null];
    }

    private function chunkCompactCode(string $code): array
    {
        if (ctype_digit($code)) {
            $length = strlen($code);
            if ($length <= 4) {
                return [$code];
            }

            $remainder = $length % 2;
            $segments = [];
            $offset = 0;

            if ($remainder === 1) {
                $segments[] = substr($code, 0, 1);
                $offset = 1;
            }

            while ($offset < $length) {
                $segments[] = substr($code, $offset, 2);
                $offset += 2;
            }

            return $segments;
        }

        return [strtoupper($code)];
    }

    private function inferTypeFromTransactionType(?string $name, $typeId): string
    {
        $name = strtolower(trim((string) $name));
        $typeId = (int) $typeId;

        if (str_contains($name, 'receivable')) {
            return 'asset';
        }

        if (str_contains($name, 'payable')) {
            return 'liability';
        }

        if ($typeId >= 1 && $typeId <= 8) {
            return 'income';
        }

        return 'income';
    }

    private function inferTypeFromInvoice($invoiceType, $feeType): string
    {
        $value = strtolower(trim((string) ($invoiceType ?: $feeType)));

        if (str_contains($value, 'payable')) {
            return 'liability';
        }

        if (str_contains($value, 'receivable')) {
            return 'asset';
        }

        return 'income';
    }

    private function invoiceLabel(string $invoiceType, string $feeType): string
    {
        $value = trim($invoiceType) !== '' ? $invoiceType : $feeType;
        $value = str_replace(['_', '-'], ' ', strtolower(trim($value)));
        $value = ucwords($value !== '' ? $value : 'Legacy Invoice');

        return $value . ' Account';
    }

    private function generatedParentName(string $type, array $prefix): string
    {
        return ucfirst($type) . ' Group ' . implode('-', $prefix);
    }

    private function fallbackAccounts(): array
    {
        return [
            $this->fallbackAccount(['10'], 'Assets', 'asset', false, 'assets_root'),
            $this->fallbackAccount(['10', '01'], 'Cash & Cash Equivalents', 'asset', false, 'cash_group'),
            $this->fallbackAccount(['10', '01', '01'], 'Cash in Hand', 'asset', true, 'cash_on_hand'),
            $this->fallbackAccount(['10', '01', '02'], 'Bank Accounts', 'asset', true, 'bank_accounts'),
            $this->fallbackAccount(['10', '02'], 'Receivables', 'asset', false, 'receivable_group'),
            $this->fallbackAccount(['10', '02', '01'], 'Accounts Receivable', 'asset', true, 'accounts_receivable'),
            $this->fallbackAccount(['10', '03'], 'Advances', 'asset', false, 'advances_group'),
            $this->fallbackAccount(['10', '03', '01'], 'Vendor Advances', 'asset', true, 'vendor_advances'),
            $this->fallbackAccount(['20'], 'Liabilities', 'liability', false, 'liabilities_root'),
            $this->fallbackAccount(['20', '01'], 'Current Liabilities', 'liability', false, 'current_liabilities'),
            $this->fallbackAccount(['20', '01', '01'], 'Accounts Payable', 'liability', true, 'accounts_payable'),
        ];
    }

    private function fallbackAccount(array $segments, string $name, string $type, bool $postable, string $key): array
    {
        return [
            'legacy_code' => null,
            'segments' => $segments,
            'full_code' => implode('-', $segments),
            'name' => $name,
            'type' => $type,
            'is_postable' => $postable,
            'metadata' => [
                'system_key' => $key,
                'backfill_origin' => 'system-fallback',
                'classification' => 'explicit',
            ],
        ];
    }

    private function loadDefaultAccounts(): array
    {
        $accounts = CoaAccount::query()
            ->whereIn('full_code', ['10-01-01', '10-01-02', '10-03-01', '20-01-01'])
            ->pluck('id', 'full_code');

        return [
            'cash_on_hand_id' => $accounts['10-01-01'] ?? null,
            'bank_accounts_id' => $accounts['10-01-02'] ?? null,
            'vendor_advances_id' => $accounts['10-03-01'] ?? null,
            'accounts_payable_id' => $accounts['20-01-01'] ?? null,
        ];
    }

    private function defaultPaymentAccountTarget(PaymentAccount $account, array $defaults): ?int
    {
        $method = strtolower(trim((string) $account->payment_method));
        $name = strtolower(trim((string) $account->name));

        if ($method === 'cash' || str_contains($name, 'cash')) {
            return $defaults['cash_on_hand_id'] ?? null;
        }

        return $defaults['bank_accounts_id'] ?? null;
    }
}
