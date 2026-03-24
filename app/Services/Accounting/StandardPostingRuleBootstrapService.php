<?php

namespace App\Services\Accounting;

use App\Models\AccountingRule;
use App\Models\CoaAccount;
use Illuminate\Support\Facades\DB;

class StandardPostingRuleBootstrapService
{
    public function definitions(): array
    {
        return [
            [
                'code' => 'membership_invoice',
                'label' => 'Membership Invoice',
                'name' => 'Membership Invoice',
                'lines' => [
                    ['resolver' => 'accounts_receivable', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'membership_revenue', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'membership_receipt',
                'label' => 'Membership Receipt',
                'name' => 'Membership Receipt',
                'lines' => [
                    ['resolver' => 'payment_account', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => true],
                    ['resolver' => 'accounts_receivable', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'subscription_invoice',
                'label' => 'Subscription Invoice',
                'name' => 'Subscription Invoice',
                'lines' => [
                    ['resolver' => 'accounts_receivable', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'subscription_revenue', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'subscription_receipt',
                'label' => 'Subscription Receipt',
                'name' => 'Subscription Receipt',
                'lines' => [
                    ['resolver' => 'payment_account', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => true],
                    ['resolver' => 'accounts_receivable', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'pos_invoice',
                'label' => 'POS Invoice',
                'name' => 'POS Invoice',
                'lines' => [
                    ['resolver' => 'accounts_receivable', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'pos_revenue', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'pos_receipt',
                'label' => 'POS Receipt',
                'name' => 'POS Receipt',
                'lines' => [
                    ['resolver' => 'payment_account', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => true],
                    ['resolver' => 'accounts_receivable', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'room_invoice',
                'label' => 'Room Invoice',
                'name' => 'Room Invoice',
                'lines' => [
                    ['resolver' => 'accounts_receivable', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'room_revenue', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'room_receipt',
                'label' => 'Room Receipt',
                'name' => 'Room Receipt',
                'lines' => [
                    ['resolver' => 'payment_account', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => true],
                    ['resolver' => 'accounts_receivable', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'event_invoice',
                'label' => 'Event Invoice',
                'name' => 'Event Invoice',
                'lines' => [
                    ['resolver' => 'accounts_receivable', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'event_revenue', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'event_receipt',
                'label' => 'Event Receipt',
                'name' => 'Event Receipt',
                'lines' => [
                    ['resolver' => 'payment_account', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => true],
                    ['resolver' => 'accounts_receivable', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'purchase_receipt',
                'label' => 'Goods Receipt',
                'name' => 'Goods Receipt',
                'lines' => [
                    ['resolver' => 'inventory_asset', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'grni', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'vendor_bill',
                'label' => 'Vendor Bill',
                'name' => 'Vendor Bill',
                'lines' => [
                    ['resolver' => 'grni', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'accounts_payable', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => false],
                ],
            ],
            [
                'code' => 'vendor_payment',
                'label' => 'Vendor Payment',
                'name' => 'Vendor Payment',
                'lines' => [
                    ['resolver' => 'accounts_payable', 'side' => 'debit', 'ratio' => 1, 'use_payment_account' => false],
                    ['resolver' => 'payment_account', 'side' => 'credit', 'ratio' => 1, 'use_payment_account' => true],
                ],
            ],
        ];
    }

    public function analyze(bool $canProvisionSupportAccounts = true): array
    {
        $accounts = CoaAccount::query()->active()->postable()->get();
        $accountMap = $this->buildAccountMap($accounts);
        $existingCodes = AccountingRule::query()->pluck('code')->all();

        return collect($this->definitions())->map(function (array $definition) use ($accountMap, $existingCodes, $canProvisionSupportAccounts) {
            if (in_array($definition['code'], $existingCodes, true)) {
                return $this->hydrateDefinition($definition, 'mapped', 'Rule already exists.', $accountMap);
            }

            $missingResolvers = $this->missingResolvers($definition, $accountMap);
            if (empty($missingResolvers)) {
                return $this->hydrateDefinition($definition, 'ready', 'All required posting accounts are available.', $accountMap);
            }

            $provisionable = collect($missingResolvers)->every(fn (string $resolver) => in_array($resolver, ['pos_revenue', 'inventory_asset', 'grni'], true));
            if ($canProvisionSupportAccounts && $provisionable) {
                return $this->hydrateDefinition(
                    $definition,
                    'ready_with_support',
                    'Will auto-create the supporting COA accounts needed for this rule.',
                    $accountMap,
                    $missingResolvers
                );
            }

            return $this->hydrateDefinition(
                $definition,
                'blocked',
                'Missing required COA accounts: ' . implode(', ', array_map([$this, 'resolverLabel'], $missingResolvers)),
                $accountMap,
                $missingResolvers
            );
        })->values()->all();
    }

    public function bootstrap(?int $userId = null): array
    {
        return DB::transaction(function () use ($userId) {
            $createdAccounts = $this->ensureSupportAccounts($userId);
            $analysis = $this->analyze(false);
            $createdRules = [];
            $skippedRules = [];
            $blockedRules = [];

            foreach ($analysis as $definition) {
                if ($definition['status'] === 'mapped') {
                    $skippedRules[] = $definition['code'];
                    continue;
                }

                if (!in_array($definition['status'], ['ready'], true)) {
                    $blockedRules[] = [
                        'code' => $definition['code'],
                        'reason' => $definition['detail'],
                    ];
                    continue;
                }

                AccountingRule::create([
                    'code' => $definition['code'],
                    'name' => $definition['name'],
                    'is_active' => true,
                    'created_by' => $userId,
                    'updated_by' => $userId,
                    'lines' => collect($definition['lines'])->map(function (array $line) {
                        return [
                            'account_id' => $line['account_id'],
                            'side' => $line['side'],
                            'ratio' => $line['ratio'],
                            'use_payment_account' => $line['use_payment_account'],
                        ];
                    })->all(),
                ]);

                $createdRules[] = $definition['code'];
            }

            return [
                'created_accounts' => $createdAccounts,
                'created_rules' => $createdRules,
                'skipped_rules' => $skippedRules,
                'blocked_rules' => $blockedRules,
                'analysis' => $this->analyze(false),
            ];
        });
    }

    private function hydrateDefinition(array $definition, string $status, string $detail, array $accountMap, array $missingResolvers = []): array
    {
        return [
            'code' => $definition['code'],
            'label' => $definition['label'],
            'name' => $definition['name'],
            'status' => $status,
            'detail' => $detail,
            'missing_resolvers' => $missingResolvers,
            'lines' => collect($definition['lines'])->map(function (array $line) use ($accountMap) {
                $account = null;
                if (!$line['use_payment_account']) {
                    $account = $accountMap[$line['resolver']] ?? null;
                }

                return [
                    'resolver' => $line['resolver'],
                    'resolver_label' => $this->resolverLabel($line['resolver']),
                    'account_id' => $account?->id,
                    'account_label' => $account ? "{$account->full_code} - {$account->name}" : null,
                    'side' => $line['side'],
                    'ratio' => $line['ratio'],
                    'use_payment_account' => $line['use_payment_account'],
                ];
            })->all(),
        ];
    }

    private function missingResolvers(array $definition, array $accountMap): array
    {
        return collect($definition['lines'])
            ->reject(fn (array $line) => !empty($line['use_payment_account']))
            ->pluck('resolver')
            ->filter(fn (string $resolver) => !isset($accountMap[$resolver]))
            ->unique()
            ->values()
            ->all();
    }

    private function buildAccountMap($accounts): array
    {
        $map = [];
        foreach ($accounts as $account) {
            $code = (string) $account->full_code;
            $name = strtolower(trim((string) $account->name));

            if ($code === '10-02-01-00-01' || $name === 'accounts receivable') {
                $map['accounts_receivable'] = $account;
            }
            if ($code === '20-01-01-00-01' || $name === 'accounts payable') {
                $map['accounts_payable'] = $account;
            }
            if ($code === '49-50-00-00-01' || $name === 'membership fee') {
                $map['membership_revenue'] = $account;
            }
            if ($code === '81-01-10-00-01' || $name === 'monthly maintenance fee') {
                $map['subscription_revenue'] = $account;
            }
            if ($code === '81-01-09-00-01' || $name === 'room booking') {
                $map['room_revenue'] = $account;
            }
            if ($code === '81-01-12-00-01' || $name === 'events management') {
                $map['event_revenue'] = $account;
            }
            if ($code === '81-01-11-00-01' || $name === 'pos sales') {
                $map['pos_revenue'] = $account;
            }
            if ($code === '10-04-01-00-01' || $name === 'inventory on hand') {
                $map['inventory_asset'] = $account;
            }
            if ($code === '20-01-02-00-01' || $name === 'goods received not invoiced') {
                $map['grni'] = $account;
            }
        }

        return $map;
    }

    private function ensureSupportAccounts(?int $userId = null): array
    {
        $created = [];

        foreach ($this->supportAccountChains() as $key => $chain) {
            $before = CoaAccount::query()->where('full_code', $chain[array_key_last($chain)]['full_code'])->exists();
            $this->ensureChain($chain, $userId);
            if (!$before) {
                $created[] = $key;
            }
        }

        return $created;
    }

    private function supportAccountChains(): array
    {
        return [
            'pos_revenue' => [
                ['full_code' => '81', 'segments' => ['81'], 'name' => 'Income Group 81', 'type' => 'income', 'is_postable' => false, 'system_key' => 'income_root_81'],
                ['full_code' => '81-01', 'segments' => ['81', '01'], 'name' => 'Income Group 81-01', 'type' => 'income', 'is_postable' => false, 'system_key' => 'income_root_81_01'],
                ['full_code' => '81-01-11', 'segments' => ['81', '01', '11'], 'name' => 'POS Sales', 'type' => 'income', 'is_postable' => false, 'system_key' => 'pos_sales_header'],
                ['full_code' => '81-01-11-00', 'segments' => ['81', '01', '11', '00'], 'name' => 'POS Sales Group', 'type' => 'income', 'is_postable' => false, 'system_key' => 'pos_sales_group'],
                ['full_code' => '81-01-11-00-01', 'segments' => ['81', '01', '11', '00', '01'], 'name' => 'POS Sales', 'type' => 'income', 'is_postable' => true, 'system_key' => 'pos_revenue'],
            ],
            'inventory_asset' => [
                ['full_code' => '10', 'segments' => ['10'], 'name' => 'Assets', 'type' => 'asset', 'is_postable' => false, 'system_key' => 'assets_root'],
                ['full_code' => '10-04', 'segments' => ['10', '04'], 'name' => 'Inventory Assets', 'type' => 'asset', 'is_postable' => false, 'system_key' => 'inventory_assets_root'],
                ['full_code' => '10-04-01', 'segments' => ['10', '04', '01'], 'name' => 'Inventory on Hand', 'type' => 'asset', 'is_postable' => false, 'system_key' => 'inventory_on_hand_header'],
                ['full_code' => '10-04-01-00', 'segments' => ['10', '04', '01', '00'], 'name' => 'Inventory on Hand Group', 'type' => 'asset', 'is_postable' => false, 'system_key' => 'inventory_on_hand_group'],
                ['full_code' => '10-04-01-00-01', 'segments' => ['10', '04', '01', '00', '01'], 'name' => 'Inventory on Hand', 'type' => 'asset', 'is_postable' => true, 'system_key' => 'inventory_asset'],
            ],
            'grni' => [
                ['full_code' => '20', 'segments' => ['20'], 'name' => 'Liabilities', 'type' => 'liability', 'is_postable' => false, 'system_key' => 'liabilities_root'],
                ['full_code' => '20-01', 'segments' => ['20', '01'], 'name' => 'Current Liabilities', 'type' => 'liability', 'is_postable' => false, 'system_key' => 'current_liabilities'],
                ['full_code' => '20-01-02', 'segments' => ['20', '01', '02'], 'name' => 'Inventory Clearing', 'type' => 'liability', 'is_postable' => false, 'system_key' => 'inventory_clearing_header'],
                ['full_code' => '20-01-02-00', 'segments' => ['20', '01', '02', '00'], 'name' => 'Inventory Clearing Group', 'type' => 'liability', 'is_postable' => false, 'system_key' => 'inventory_clearing_group'],
                ['full_code' => '20-01-02-00-01', 'segments' => ['20', '01', '02', '00', '01'], 'name' => 'Goods Received Not Invoiced', 'type' => 'liability', 'is_postable' => true, 'system_key' => 'grni'],
            ],
        ];
    }

    private function ensureChain(array $chain, ?int $userId = null): void
    {
        $parentId = null;

        foreach ($chain as $node) {
            $account = CoaAccount::query()->firstWhere('full_code', $node['full_code']);

            if (!$account) {
                $segments = array_values($node['segments']);
                $account = CoaAccount::create([
                    'segment1' => $segments[0] ?? null,
                    'segment2' => $segments[1] ?? null,
                    'segment3' => $segments[2] ?? null,
                    'segment4' => $segments[3] ?? null,
                    'segment5' => $segments[4] ?? null,
                    'full_code' => $node['full_code'],
                    'name' => $node['name'],
                    'type' => $node['type'],
                    'normal_balance' => in_array($node['type'], ['liability', 'equity', 'income'], true) ? 'credit' : 'debit',
                    'level' => count($segments),
                    'parent_id' => $parentId,
                    'opening_balance' => 0,
                    'description' => 'System account provisioned for standard posting rules.',
                    'is_postable' => $node['is_postable'],
                    'is_active' => true,
                    'metadata' => [
                        'system_key' => $node['system_key'],
                        'provisioned_by' => 'standard_posting_rules_bootstrap',
                    ],
                        'created_by' => $userId,
                        'updated_by' => $userId,
                ]);
            } elseif ((int) ($account->parent_id ?? 0) !== (int) ($parentId ?? 0)) {
                $account->update([
                    'parent_id' => $parentId,
                    'updated_by' => $userId,
                ]);
            }

            $parentId = $account->id;
        }
    }

    public function resolverLabel(string $resolver): string
    {
        return match ($resolver) {
            'accounts_receivable' => 'Accounts Receivable',
            'accounts_payable' => 'Accounts Payable',
            'membership_revenue' => 'Membership Fee Revenue',
            'subscription_revenue' => 'Subscription Revenue',
            'room_revenue' => 'Room Revenue',
            'event_revenue' => 'Event Revenue',
            'pos_revenue' => 'POS Revenue',
            'inventory_asset' => 'Inventory on Hand',
            'grni' => 'Goods Received Not Invoiced',
            'payment_account' => 'Payment Account Mapping',
            default => ucfirst(str_replace('_', ' ', $resolver)),
        };
    }
}
