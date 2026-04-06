<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();

        $accounts = [
            [
                'segment1' => '60',
                'segment2' => null,
                'segment3' => null,
                'segment4' => null,
                'segment5' => null,
                'full_code' => '60',
                'name' => 'Expenses',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 1,
                'parent_code' => null,
                'is_postable' => false,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Top-level expense root for operational expense postings.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => null,
                'segment4' => null,
                'segment5' => null,
                'full_code' => '60-01',
                'name' => 'Operating Expenses',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 2,
                'parent_code' => '60',
                'is_postable' => false,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Operating expense grouping for intelligent voucher defaults.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => null,
                'segment5' => null,
                'full_code' => '60-01-01',
                'name' => 'Restaurant Operating Expenses',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 3,
                'parent_code' => '60-01',
                'is_postable' => false,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Restaurant operating expense bucket.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => '00',
                'segment5' => null,
                'full_code' => '60-01-01-00',
                'name' => 'Restaurant Operating Expenses Group',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 4,
                'parent_code' => '60-01-01',
                'is_postable' => false,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Posting group for day-to-day restaurant expense ledgers.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => '00',
                'segment5' => '01',
                'full_code' => '60-01-01-00-01',
                'name' => 'Kitchen Supplies Expense',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 5,
                'parent_code' => '60-01-01-00',
                'is_postable' => true,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Consumables and kitchen operating supplies.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => '00',
                'segment5' => '02',
                'full_code' => '60-01-01-00-02',
                'name' => 'Cleaning & Housekeeping Expense',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 5,
                'parent_code' => '60-01-01-00',
                'is_postable' => true,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Cleaning materials and housekeeping costs.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => '00',
                'segment5' => '03',
                'full_code' => '60-01-01-00-03',
                'name' => 'Utilities Expense',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 5,
                'parent_code' => '60-01-01-00',
                'is_postable' => true,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Electricity, gas, water, and other utility costs.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => '00',
                'segment5' => '04',
                'full_code' => '60-01-01-00-04',
                'name' => 'Repairs & Maintenance Expense',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 5,
                'parent_code' => '60-01-01-00',
                'is_postable' => true,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Routine repair and maintenance payments.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => '00',
                'segment5' => '05',
                'full_code' => '60-01-01-00-05',
                'name' => 'Office & Admin Expense',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 5,
                'parent_code' => '60-01-01-00',
                'is_postable' => true,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'General admin and office operating expenses.',
            ],
            [
                'segment1' => '60',
                'segment2' => '01',
                'segment3' => '01',
                'segment4' => '00',
                'segment5' => '06',
                'full_code' => '60-01-01-00-06',
                'name' => 'Miscellaneous Expense',
                'type' => 'expense',
                'normal_balance' => 'debit',
                'level' => 5,
                'parent_code' => '60-01-01-00',
                'is_postable' => true,
                'is_active' => true,
                'opening_balance' => 0,
                'description' => 'Fallback operating expense for exceptional direct payments.',
            ],
        ];

        DB::transaction(function () use ($accounts, $now) {
            $idByCode = DB::table('coa_accounts')->pluck('id', 'full_code')->all();

            foreach ($accounts as $account) {
                $parentId = $account['parent_code'] ? ($idByCode[$account['parent_code']] ?? null) : null;

                $payload = [
                    'segment1' => $account['segment1'],
                    'segment2' => $account['segment2'],
                    'segment3' => $account['segment3'],
                    'segment4' => $account['segment4'],
                    'segment5' => $account['segment5'],
                    'name' => $account['name'],
                    'type' => $account['type'],
                    'normal_balance' => $account['normal_balance'],
                    'level' => $account['level'],
                    'parent_id' => $parentId,
                    'opening_balance' => $account['opening_balance'],
                    'description' => $account['description'],
                    'is_postable' => $account['is_postable'],
                    'is_active' => $account['is_active'],
                    'updated_at' => $now,
                ];

                $existing = DB::table('coa_accounts')->where('full_code', $account['full_code'])->first();

                if ($existing) {
                    DB::table('coa_accounts')
                        ->where('id', $existing->id)
                        ->update($payload);

                    $idByCode[$account['full_code']] = $existing->id;
                    continue;
                }

                $id = DB::table('coa_accounts')->insertGetId(array_merge($payload, [
                    'full_code' => $account['full_code'],
                    'created_at' => $now,
                ]));

                $idByCode[$account['full_code']] = $id;
            }

            $defaultExpenseId = $idByCode['60-01-01-00-05'] ?? null;
            if (!$defaultExpenseId) {
                return;
            }

            $settingsRow = DB::table('settings')->where('type', 'accounting_voucher_defaults')->first();
            $defaults = [];

            if ($settingsRow && !empty($settingsRow->value)) {
                $decoded = json_decode((string) $settingsRow->value, true);
                if (is_array($decoded)) {
                    $defaults = $decoded;
                }
            }

            $defaults['default_expense_account_id'] = $defaultExpenseId;

            if ($settingsRow) {
                DB::table('settings')
                    ->where('id', $settingsRow->id)
                    ->update([
                        'value' => json_encode($defaults),
                        'updated_at' => $now,
                    ]);
            } else {
                DB::table('settings')->insert([
                    'type' => 'accounting_voucher_defaults',
                    'value' => json_encode($defaults),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        });
    }

    public function down(): void
    {
        DB::transaction(function () {
            $codes = [
                '60-01-01-00-06',
                '60-01-01-00-05',
                '60-01-01-00-04',
                '60-01-01-00-03',
                '60-01-01-00-02',
                '60-01-01-00-01',
                '60-01-01-00',
                '60-01-01',
                '60-01',
                '60',
            ];

            DB::table('coa_accounts')->whereIn('full_code', $codes)->delete();

            $settingsRow = DB::table('settings')->where('type', 'accounting_voucher_defaults')->first();
            if (!$settingsRow) {
                return;
            }

            $defaults = json_decode((string) $settingsRow->value, true);
            if (!is_array($defaults)) {
                return;
            }

            if (($defaults['default_expense_account_id'] ?? null) !== null) {
                unset($defaults['default_expense_account_id']);
                DB::table('settings')
                    ->where('id', $settingsRow->id)
                    ->update([
                        'value' => json_encode($defaults),
                        'updated_at' => now(),
                    ]);
            }
        });
    }
};
