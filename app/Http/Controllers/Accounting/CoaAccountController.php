<?php

namespace App\Http\Controllers\Accounting;

use App\Http\Controllers\Controller;
use App\Models\AccountingRule;
use App\Models\CoaAccount;
use App\Models\JournalLine;
use App\Models\PaymentAccount;
use App\Services\Accounting\Support\AccountingHealth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class CoaAccountController extends Controller
{
    public function index()
    {
        $health = app(AccountingHealth::class);
        $status = $health->status(
            requiredTables: ['coa_accounts'],
            optionalTables: ['journal_lines', 'accounting_rules', 'payment_accounts', 'journal_entries']
        );

        if (!$status['ready']) {
            return Inertia::render('App/Admin/Accounting/Coa/Index', [
                'accounts' => [],
                'error' => $health->setupMessage('Chart of Accounts', $status['missing_required'], $status['missing_optional']),
            ]);
        }

        $accounts = CoaAccount::with('parent:id,full_code,name')->orderBy('full_code')->get();
        $totals = collect();
        if (Schema::hasTable('journal_lines')) {
            $totals = JournalLine::query()
                ->select('account_id', DB::raw('SUM(debit) as total_debit'), DB::raw('SUM(credit) as total_credit'), DB::raw('COUNT(*) as line_count'))
                ->groupBy('account_id')
                ->get()
                ->keyBy('account_id');
        }

        $ruleUsage = [];
        if (Schema::hasTable('accounting_rules')) {
            AccountingRule::query()->where('is_active', true)->get(['id', 'lines'])->each(function ($rule) use (&$ruleUsage) {
                foreach ((array) $rule->lines as $line) {
                    $accountId = $line['account_id'] ?? null;
                    if ($accountId) {
                        $ruleUsage[$accountId] = ($ruleUsage[$accountId] ?? 0) + 1;
                    }
                }
            });
        }

        $paymentUsage = collect();
        if (Schema::hasTable('payment_accounts')) {
            $paymentUsage = PaymentAccount::query()
                ->whereNotNull('coa_account_id')
                ->select('coa_account_id', DB::raw('COUNT(*) as count'))
                ->groupBy('coa_account_id')
                ->pluck('count', 'coa_account_id');
        }

        $ledgerReady = Schema::hasTable('journal_entries') && Schema::hasTable('journal_lines');

        $accounts = $accounts->map(function ($account) use ($totals, $ruleUsage, $paymentUsage, $health, $ledgerReady) {
            $summary = $totals->get($account->id);
            $balance = (float) (($summary->total_debit ?? 0) - ($summary->total_credit ?? 0));

            $account->journal_line_count = (int) ($summary->line_count ?? 0);
            $account->direct_balance = $balance;
            $account->usage = [
                'rules' => (int) ($ruleUsage[$account->id] ?? 0),
                'payment_accounts' => (int) ($paymentUsage[$account->id] ?? 0),
                'journal_lines' => $account->journal_line_count,
            ];
            $account->parent_summary = $account->parent ? [
                'id' => $account->parent->id,
                'full_code' => $account->parent->full_code,
                'name' => $account->parent->name,
            ] : null;
            $account->ledger_url = $ledgerReady
                ? $health->safeRoute('accounting.general-ledger', ['account_id' => $account->id])
                : null;

            return $account;
        });

        return Inertia::render('App/Admin/Accounting/Coa/Index', [
            'accounts' => $accounts,
            'error' => !empty($status['missing_optional'])
                ? $health->setupMessage('Chart of Accounts', [], $status['missing_optional'])
                : null,
        ]);
    }

    public function store(Request $request)
    {
        if (!Schema::hasTable('coa_accounts')) {
            return redirect()->back()->with('error', 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.');
        }

        $data = $request->validate([
            'segment1' => 'required|string|max:4',
            'segment2' => 'nullable|string|max:4',
            'segment3' => 'nullable|string|max:4',
            'segment4' => 'nullable|string|max:4',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,income,expense',
            'parent_id' => 'nullable|exists:coa_accounts,id',
            'is_postable' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $normalized = $this->normalizeSegments($data);
        $segments = $normalized['segments'];
        $data['segment1'] = $normalized['segment1'];
        $data['segment2'] = $normalized['segment2'];
        $data['segment3'] = $normalized['segment3'];
        $data['segment4'] = $normalized['segment4'];

        $this->validateHierarchy($data, null, $segments);
        $data['full_code'] = implode('-', $segments);
        $data['level'] = count($segments);
        $data['is_postable'] = $data['is_postable'] ?? ($data['level'] >= 4);
        $this->validateUniqueCode($data['full_code'], null);
        $data['created_by'] = $request->user()?->id;

        CoaAccount::create($data);

        return redirect()->back()->with('success', 'Account created.');
    }

    public function update(Request $request, CoaAccount $coaAccount)
    {
        if (!Schema::hasTable('coa_accounts')) {
            return redirect()->back()->with('error', 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.');
        }

        $data = $request->validate([
            'segment1' => 'required|string|max:4',
            'segment2' => 'nullable|string|max:4',
            'segment3' => 'nullable|string|max:4',
            'segment4' => 'nullable|string|max:4',
            'name' => 'required|string|max:255',
            'type' => 'required|in:asset,liability,equity,income,expense',
            'parent_id' => 'nullable|exists:coa_accounts,id',
            'is_postable' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $normalized = $this->normalizeSegments($data);
        $segmentsNew = $normalized['segments'];
        $data['segment1'] = $normalized['segment1'];
        $data['segment2'] = $normalized['segment2'];
        $data['segment3'] = $normalized['segment3'];
        $data['segment4'] = $normalized['segment4'];

        $this->validateHierarchy($data, $coaAccount, $segmentsNew);
        $this->validateUniqueCode(implode('-', $segmentsNew), $coaAccount);

        $usage = $this->getUsage($coaAccount);
        $isLocked = $usage['journal_lines'] > 0;

        if ($isLocked) {
            $segmentsCurrent = array_filter([
                $coaAccount->segment1,
                $coaAccount->segment2,
                $coaAccount->segment3,
                $coaAccount->segment4,
            ], fn($seg) => $seg !== null && $seg !== '');

            if (
                implode('-', $segmentsCurrent) !== implode('-', $segmentsNew)
                || $coaAccount->type !== $data['type']
                || (int) $coaAccount->parent_id !== (int) ($data['parent_id'] ?? null)
            ) {
                throw ValidationException::withMessages([
                    'name' => 'This account is used in posted journal lines; code/type/parent cannot be changed.',
                ]);
            }
        }

        if (($data['is_active'] ?? true) === false && ($usage['rules'] > 0 || $usage['payment_accounts'] > 0)) {
            throw ValidationException::withMessages([
                'is_active' => 'This account is linked with posting rules or bank accounts and cannot be deactivated.',
            ]);
        }

        $data['full_code'] = implode('-', $segmentsNew);
        $data['level'] = count($segmentsNew);
        $data['is_postable'] = $data['is_postable'] ?? ($data['level'] >= 4);
        $data['updated_by'] = $request->user()?->id;

        $coaAccount->update($data);

        return redirect()->back()->with('success', 'Account updated.');
    }

    public function destroy(CoaAccount $coaAccount)
    {
        if (!Schema::hasTable('coa_accounts')) {
            return redirect()->back()->with('error', 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.');
        }

        $usage = $this->getUsage($coaAccount);
        $childrenCount = CoaAccount::where('parent_id', $coaAccount->id)->count();

        if ($childrenCount > 0) {
            return redirect()->back()->with('error', 'Cannot delete account with child accounts.');
        }

        if ($usage['journal_lines'] > 0 || $usage['rules'] > 0 || $usage['payment_accounts'] > 0) {
            return redirect()->back()->with('error', 'Cannot delete account already used in journals/rules/bank mappings.');
        }

        $coaAccount->delete();

        return redirect()->back()->with('success', 'Account removed.');
    }

    public function template()
    {
        if (!Schema::hasTable('coa_accounts')) {
            return redirect()->back()->with('error', 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.');
        }

        $headers = ['segment1', 'segment2', 'segment3', 'segment4', 'name', 'type', 'parent_full_code', 'is_postable', 'is_active'];
        $sample = [
            ['1', '', '', '', 'Assets', 'asset', '', '0', '1'],
            ['1', '11', '', '', 'Cash & Bank', 'asset', '1', '0', '1'],
            ['1', '11', '01', '', 'Main Bank Account', 'asset', '1-11', '1', '1'],
        ];

        return Response::streamDownload(function () use ($headers, $sample) {
            $file = fopen('php://output', 'w');
            fputcsv($file, $headers);
            foreach ($sample as $row) {
                fputcsv($file, $row);
            }
            fclose($file);
        }, 'coa_import_template.csv', ['Content-Type' => 'text/csv']);
    }

    public function import(Request $request)
    {
        if (!Schema::hasTable('coa_accounts')) {
            return redirect()->back()->with('error', 'Chart of Accounts is not configured yet. Create or migrate coa_accounts first.');
        }

        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
        ]);

        $created = 0;
        $skipped = 0;
        $errors = [];

        DB::transaction(function () use ($request, &$created, &$skipped, &$errors) {
            $path = $request->file('file')->getRealPath();
            $handle = fopen($path, 'r');
            $header = fgetcsv($handle);
            $expected = ['segment1', 'segment2', 'segment3', 'segment4', 'name', 'type', 'parent_full_code', 'is_postable', 'is_active'];

            if ($header !== $expected) {
                throw ValidationException::withMessages([
                    'file' => 'Invalid CSV header. Please use the provided template.',
                ]);
            }

            $line = 1;
            while (($row = fgetcsv($handle)) !== false) {
                $line++;
                if (count(array_filter($row, fn($v) => trim((string) $v) !== '')) === 0) {
                    continue;
                }

                [$segment1, $segment2, $segment3, $segment4, $name, $type, $parentCode, $isPostable, $isActive] = array_pad($row, 9, null);

                $segments = array_filter([$segment1, $segment2, $segment3, $segment4], fn($seg) => $seg !== null && $seg !== '');
                $fullCode = implode('-', $segments);

                if (CoaAccount::where('full_code', $fullCode)->exists()) {
                    $skipped++;
                    continue;
                }

                $parentId = null;
                if (!empty($parentCode)) {
                    $parent = CoaAccount::where('full_code', trim((string) $parentCode))->first();
                    if (!$parent) {
                        $errors[] = "Line {$line}: Parent code '{$parentCode}' not found.";
                        continue;
                    }
                    $parentId = $parent->id;
                }

                if (!in_array($type, ['asset', 'liability', 'equity', 'income', 'expense'], true)) {
                    $errors[] = "Line {$line}: Invalid type '{$type}'.";
                    continue;
                }

                $rowData = [
                    'segment1' => trim((string) $segment1),
                    'segment2' => trim((string) ($segment2 ?? '')) ?: null,
                    'segment3' => trim((string) ($segment3 ?? '')) ?: null,
                    'segment4' => trim((string) ($segment4 ?? '')) ?: null,
                    'type' => trim((string) $type),
                    'parent_id' => $parentId,
                    'is_postable' => in_array((string) $isPostable, ['1', 'true', 'yes'], true),
                ];

                try {
                    $normalized = $this->normalizeSegments($rowData);
                    $segments = $normalized['segments'];
                    $rowData['segment1'] = $normalized['segment1'];
                    $rowData['segment2'] = $normalized['segment2'];
                    $rowData['segment3'] = $normalized['segment3'];
                    $rowData['segment4'] = $normalized['segment4'];
                    $this->validateHierarchy($rowData, null, $segments);
                    $this->validateUniqueCode(implode('-', $segments), null);
                } catch (ValidationException $exception) {
                    $first = collect($exception->errors())->flatten()->first() ?? 'Hierarchy validation failed.';
                    $errors[] = "Line {$line}: {$first}";
                    continue;
                }

                CoaAccount::create([
                    'segment1' => $rowData['segment1'],
                    'segment2' => $rowData['segment2'],
                    'segment3' => $rowData['segment3'],
                    'segment4' => $rowData['segment4'],
                    'full_code' => implode('-', $segments),
                    'name' => trim((string) $name),
                    'type' => trim((string) $type),
                    'parent_id' => $parentId,
                    'is_postable' => $rowData['is_postable'],
                    'is_active' => !in_array((string) $isActive, ['0', 'false', 'no'], true),
                    'level' => count($segments),
                    'created_by' => $request->user()?->id,
                ]);
                $created++;
            }

            fclose($handle);
        });

        $message = "COA import completed. Created: {$created}, Skipped(existing): {$skipped}.";
        if (!empty($errors)) {
            $message .= ' Issues: ' . implode(' | ', array_slice($errors, 0, 5));
        }

        return redirect()->back()->with('success', $message);
    }

    private function getUsage(CoaAccount $account): array
    {
        $ruleCount = 0;
        if (Schema::hasTable('accounting_rules')) {
            AccountingRule::query()->where('is_active', true)->get(['lines'])->each(function ($rule) use ($account, &$ruleCount) {
                foreach ((array) $rule->lines as $line) {
                    if ((int) ($line['account_id'] ?? 0) === (int) $account->id) {
                        $ruleCount++;
                    }
                }
            });
        }

        return [
            'journal_lines' => Schema::hasTable('journal_lines') ? JournalLine::where('account_id', $account->id)->count() : 0,
            'payment_accounts' => Schema::hasTable('payment_accounts') ? PaymentAccount::where('coa_account_id', $account->id)->count() : 0,
            'rules' => $ruleCount,
        ];
    }

    private function normalizeSegments(array $data): array
    {
        $s1 = trim((string) ($data['segment1'] ?? ''));
        $s2 = trim((string) ($data['segment2'] ?? ''));
        $s3 = trim((string) ($data['segment3'] ?? ''));
        $s4 = trim((string) ($data['segment4'] ?? ''));

        if ($s1 === '') {
            throw ValidationException::withMessages([
                'segment1' => 'Segment 1 is required.',
            ]);
        }
        if ($s2 === '' && ($s3 !== '' || $s4 !== '')) {
            throw ValidationException::withMessages([
                'segment2' => 'Segment 2 is required when Segment 3/4 is provided.',
            ]);
        }
        if ($s3 === '' && $s4 !== '') {
            throw ValidationException::withMessages([
                'segment3' => 'Segment 3 is required when Segment 4 is provided.',
            ]);
        }

        $segments = array_values(array_filter([$s1, $s2, $s3, $s4], fn($seg) => $seg !== ''));

        return [
            'segment1' => $s1,
            'segment2' => $s2 !== '' ? $s2 : null,
            'segment3' => $s3 !== '' ? $s3 : null,
            'segment4' => $s4 !== '' ? $s4 : null,
            'segments' => $segments,
        ];
    }

    private function validateHierarchy(array $data, ?CoaAccount $current = null, ?array $segments = null): void
    {
        $segments = $segments ?? $this->normalizeSegments($data)['segments'];
        $level = count($segments);

        if ($level < 1 || $level > 4) {
            throw ValidationException::withMessages([
                'segment1' => 'COA supports levels 1 to 4 only.',
            ]);
        }

        $parentId = !empty($data['parent_id']) ? (int) $data['parent_id'] : null;
        if (!$parentId) {
            if ($level !== 1) {
                throw ValidationException::withMessages([
                    'parent_id' => 'Level 2/3/4 accounts must have a parent.',
                ]);
            }
            return;
        }

        $parent = CoaAccount::find($parentId);
        if (!$parent) {
            throw ValidationException::withMessages([
                'parent_id' => 'Selected parent account was not found.',
            ]);
        }

        if ($current && (int) $parent->id === (int) $current->id) {
            throw ValidationException::withMessages([
                'parent_id' => 'An account cannot be parent of itself.',
            ]);
        }

        if ($current && $this->isDescendant($current->id, $parent->id)) {
            throw ValidationException::withMessages([
                'parent_id' => 'Cannot assign a descendant as parent account.',
            ]);
        }

        if ($parent->type !== ($data['type'] ?? null)) {
            throw ValidationException::withMessages([
                'type' => 'Account type must match the parent account type.',
            ]);
        }

        if ((int) $parent->level !== ($level - 1)) {
            throw ValidationException::withMessages([
                'parent_id' => 'Parent level must be exactly one level above this account.',
            ]);
        }

        $parentSegments = array_values(array_filter([
            $parent->segment1,
            $parent->segment2,
            $parent->segment3,
            $parent->segment4,
        ], fn($seg) => $seg !== null && $seg !== ''));

        for ($i = 0; $i < count($parentSegments); $i++) {
            if (($segments[$i] ?? null) !== $parentSegments[$i]) {
                throw ValidationException::withMessages([
                    'parent_id' => 'Segments must follow the selected parent code prefix.',
                ]);
            }
        }
    }

    private function validateUniqueCode(string $fullCode, ?CoaAccount $current): void
    {
        $query = CoaAccount::where('full_code', $fullCode);
        if ($current) {
            $query->where('id', '!=', $current->id);
        }
        if ($query->exists()) {
            throw ValidationException::withMessages([
                'segment1' => "Account code {$fullCode} already exists.",
            ]);
        }
    }

    private function isDescendant(int $ancestorId, int $candidateId): bool
    {
        $current = CoaAccount::find($candidateId);
        $maxHops = 10;

        while ($current && $current->parent_id && $maxHops-- > 0) {
            if ((int) $current->parent_id === $ancestorId) {
                return true;
            }
            $current = CoaAccount::find((int) $current->parent_id);
        }

        return false;
    }
}
