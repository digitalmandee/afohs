<?php

namespace Tests\Feature;

use App\Models\AccountingPeriod;
use App\Models\CoaAccount;
use App\Models\PaymentAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\Feature\Concerns\BuildsAccountingFixtures;
use Tests\TestCase;

class AccountingCoaConsistencyTest extends TestCase
{
    use BuildsAccountingFixtures;
    use RefreshDatabase;

    public function test_level_four_account_defaults_to_non_postable_and_level_five_defaults_to_postable(): void
    {
        $user = User::factory()->create();

        $root = CoaAccount::create([
            'segment1' => '1',
            'full_code' => '1',
            'name' => 'Assets',
            'type' => 'asset',
            'level' => 1,
            'is_postable' => false,
            'is_active' => true,
        ]);

        $level2 = CoaAccount::create([
            'segment1' => '1',
            'segment2' => '10',
            'full_code' => '1-10',
            'name' => 'Cash',
            'type' => 'asset',
            'level' => 2,
            'parent_id' => $root->id,
            'is_postable' => false,
            'is_active' => true,
        ]);

        $level3 = CoaAccount::create([
            'segment1' => '1',
            'segment2' => '10',
            'segment3' => '01',
            'full_code' => '1-10-01',
            'name' => 'Bank Control',
            'type' => 'asset',
            'level' => 3,
            'parent_id' => $level2->id,
            'is_postable' => false,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->post(route('accounting.coa.store'), [
                'segment1' => '1',
                'segment2' => '10',
                'segment3' => '01',
                'segment4' => '01',
                'name' => 'Operating Bank',
                'type' => 'asset',
                'parent_id' => $level3->id,
                'is_active' => true,
            ])
            ->assertRedirect();

        $level4 = CoaAccount::query()->where('full_code', '1-10-01-01')->firstOrFail();
        $this->assertFalse((bool) $level4->is_postable);

        $this->actingAs($user)
            ->post(route('accounting.coa.store'), [
                'segment1' => '1',
                'segment2' => '10',
                'segment3' => '01',
                'segment4' => '01',
                'segment5' => '01',
                'name' => 'Operating Bank Karachi',
                'type' => 'asset',
                'parent_id' => $level4->id,
                'is_active' => true,
            ])
            ->assertRedirect();

        $level5 = CoaAccount::query()->where('full_code', '1-10-01-01-01')->firstOrFail();
        $this->assertTrue((bool) $level5->is_postable);
    }

    public function test_postable_parent_is_rejected_for_child_creation(): void
    {
        $user = User::factory()->create();
        $leaf = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Cash Drawer', null, true);

        $this->actingAs($user)
            ->from(route('accounting.coa.index'))
            ->post(route('accounting.coa.store'), [
                'segment1' => '1',
                'segment2' => '10',
                'segment3' => '01',
                'segment4' => '01',
                'segment5' => '02',
                'name' => 'Invalid Child',
                'type' => 'asset',
                'parent_id' => $leaf->id,
                'is_active' => true,
            ])
            ->assertRedirect(route('accounting.coa.index'))
            ->assertSessionHasErrors('parent_id');
    }

    public function test_downstream_accounting_flows_reject_non_postable_accounts(): void
    {
        $user = $this->createAccountingUser();
        $header = $this->createCoaAccount(['1', '10', '01', '01'], 'asset', 'Cash Header', null, false);
        $leaf = $this->createCoaAccount(['4', '10', '01', '01', '01'], 'income', 'Sales Revenue', null, true);
        $period = AccountingPeriod::create([
            'name' => 'Open Period',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
            'status' => 'open',
        ]);

        $this->actingAs($user)
            ->from(route('accounting.rules.index'))
            ->post(route('accounting.rules.store'), [
                'code' => 'test_rule',
                'name' => 'Test Rule',
                'is_active' => true,
                'lines' => [
                    ['account_id' => $header->id, 'side' => 'debit', 'ratio' => 1],
                    ['account_id' => $leaf->id, 'side' => 'credit', 'ratio' => 1],
                ],
            ])
            ->assertRedirect(route('accounting.rules.index'))
            ->assertSessionHasErrors('lines.0.account_id');

        $this->actingAs($user)
            ->from(route('accounting.bank-accounts.index'))
            ->post(route('accounting.bank-accounts.store'), [
                'name' => 'Ops Bank',
                'payment_method' => 'bank_transfer',
                'status' => 'active',
                'coa_account_id' => $header->id,
                'is_default' => false,
            ])
            ->assertRedirect(route('accounting.bank-accounts.index'))
            ->assertSessionHasErrors('coa_account_id');

        $this->actingAs($user)
            ->from(route('accounting.budgets.index'))
            ->post(route('accounting.budgets.store'), [
                'name' => 'April Budget',
                'start_date' => now()->startOfMonth()->toDateString(),
                'end_date' => now()->endOfMonth()->toDateString(),
                'status' => 'draft',
                'lines' => [
                    ['account_id' => $header->id, 'amount' => 1000],
                ],
            ])
            ->assertRedirect(route('accounting.budgets.index'))
            ->assertSessionHasErrors('lines.0.account_id');

        $this->actingAs($user)
            ->from(route('accounting.journals.create'))
            ->post(route('accounting.journals.store'), [
                'entry_date' => now()->toDateString(),
                'description' => 'Invalid journal',
                'period_id' => $period->id,
                'lines' => [
                    ['account_id' => $header->id, 'debit' => 500, 'credit' => 0],
                    ['account_id' => $leaf->id, 'debit' => 0, 'credit' => 500],
                ],
            ])
            ->assertRedirect(route('accounting.journals.create'))
            ->assertSessionHasErrors('lines.0.account_id');
    }

    public function test_downstream_pages_only_expose_postable_accounts(): void
    {
        $user = $this->createAccountingUser();
        $header = $this->createCoaAccount(['1', '10', '01', '01'], 'asset', 'Cash Header', null, false);
        $leaf = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Cash Leaf', null, true);

        foreach ([
            'accounting.rules.index',
            'accounting.bank-accounts.index',
            'accounting.budgets.index',
            'accounting.journals.create',
        ] as $routeName) {
            $page = $this->actingAs($user)->get(route($routeName))->viewData('page');
            $props = $page['props'] ?? [];
            $accounts = $props['coaAccounts'] ?? $props['accounts'] ?? [];
            $accountIds = collect($accounts)->pluck('id')->map(fn ($id) => (int) $id)->all();

            $this->assertContains($leaf->id, $accountIds, "{$routeName} should include the postable account.");
            $this->assertNotContains($header->id, $accountIds, "{$routeName} should not include header accounts.");
        }
    }

    public function test_trial_balance_export_includes_opening_balances(): void
    {
        $user = $this->createAccountingUser();

        CoaAccount::create([
            'segment1' => '1',
            'segment2' => '10',
            'segment3' => '01',
            'segment4' => '01',
            'segment5' => '01',
            'full_code' => '1-10-01-01-01',
            'name' => 'Opening Cash',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'opening_balance' => 1500,
            'level' => 5,
            'is_postable' => true,
            'is_active' => true,
        ]);

        $response = $this->actingAs($user)->get(route('accounting.reports.trial-balance', ['export' => 'csv']));

        $response->assertOk();
        $contents = $response->streamedContent();
        $this->assertStringContainsString('Opening Cash', $contents);
        $this->assertStringContainsString('1500.00', $contents);
    }

    public function test_import_defaults_match_level_based_postable_rules(): void
    {
        $user = $this->createAccountingUser();

        $csv = implode("\n", [
            'segment1,segment2,segment3,segment4,segment5,name,type,parent_full_code,is_postable,is_active,normal_balance,opening_balance,description',
            '1,,,,,Assets,asset,,0,1,debit,0,Root asset header',
            '1,10,,,,Cash,asset,1,0,1,debit,0,Cash header',
            '1,10,01,,,Bank Control,asset,1-10,0,1,debit,0,Level 3 header',
            '1,10,01,01,,Operating Bank,asset,1-10-01,,1,debit,0,Level 4 header',
            '1,10,01,01,01,Operating Bank Karachi,asset,1-10-01-01,,1,debit,250,Level 5 posting account',
        ]);

        $file = UploadedFile::fake()->createWithContent('coa.csv', $csv);

        $this->actingAs($user)
            ->post(route('accounting.coa.import'), ['file' => $file])
            ->assertRedirect();

        $this->assertDatabaseHas('coa_accounts', [
            'full_code' => '1-10-01-01',
            'is_postable' => false,
        ]);

        $this->assertDatabaseHas('coa_accounts', [
            'full_code' => '1-10-01-01-01',
            'is_postable' => true,
            'opening_balance' => '250.00',
        ]);
    }
}
