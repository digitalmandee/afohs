<?php

namespace Tests\Feature;

use App\Models\CoaAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CoaRestructureLevelsCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_restructure_command_previews_level_three_posting_accounts(): void
    {
        [$level3] = $this->seedThreeLevelAssetBranch();

        $this->artisan('accounting:coa:restructure-levels', ['--dry-run' => true])
            ->expectsOutputToContain('Processed level-3 posting accounts: 1')
            ->expectsOutputToContain('Created level-3 headers: 1')
            ->expectsOutputToContain('Created level-4 headers: 1')
            ->expectsOutputToContain('Moved accounts to level 5: 1')
            ->expectsOutputToContain('Repaired existing headers: 0')
            ->assertExitCode(0);

        $this->assertDatabaseHas('coa_accounts', [
            'id' => $level3->id,
            'full_code' => '10-01-01',
            'level' => 3,
        ]);
    }

    public function test_restructure_command_creates_header_and_preserves_posting_account_id(): void
    {
        [$level3] = $this->seedThreeLevelAssetBranch();

        $this->artisan('accounting:coa:restructure-levels')
            ->expectsOutputToContain('Processed level-3 posting accounts: 1')
            ->expectsOutputToContain('Created level-3 headers: 1')
            ->expectsOutputToContain('Created level-4 headers: 1')
            ->expectsOutputToContain('Moved accounts to level 5: 1')
            ->expectsOutputToContain('Repaired existing headers: 0')
            ->assertExitCode(0);

        $this->assertDatabaseHas('coa_accounts', [
            'full_code' => '10-01-01',
            'level' => 3,
            'is_postable' => false,
        ]);

        $this->assertDatabaseHas('coa_accounts', [
            'full_code' => '10-01-01-00',
            'level' => 4,
            'is_postable' => false,
        ]);

        $this->assertDatabaseHas('coa_accounts', [
            'id' => $level3->id,
            'full_code' => '10-01-01-00-01',
            'level' => 5,
            'is_postable' => true,
            'normal_balance' => 'debit',
        ]);
    }

    private function seedThreeLevelAssetBranch(): array
    {
        $root = CoaAccount::create([
            'segment1' => '10',
            'full_code' => '10',
            'name' => 'Assets',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'opening_balance' => 0,
            'level' => 1,
            'is_postable' => false,
            'is_active' => true,
        ]);

        $level2 = CoaAccount::create([
            'segment1' => '10',
            'segment2' => '01',
            'full_code' => '10-01',
            'name' => 'Cash & Cash Equivalents',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'opening_balance' => 0,
            'level' => 2,
            'parent_id' => $root->id,
            'is_postable' => false,
            'is_active' => true,
        ]);

        $level3 = CoaAccount::create([
            'segment1' => '10',
            'segment2' => '01',
            'segment3' => '01',
            'full_code' => '10-01-01',
            'name' => 'Cash in Hand',
            'type' => 'asset',
            'normal_balance' => 'debit',
            'opening_balance' => 250,
            'description' => 'Base cash account',
            'level' => 3,
            'parent_id' => $level2->id,
            'is_postable' => true,
            'is_active' => true,
        ]);

        return [$level3, $level2, $root];
    }
}
