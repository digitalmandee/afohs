<?php

namespace Tests\Feature;

use App\Models\CoaAccount;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CoaLevelFiveFeatureTest extends TestCase
{
    use RefreshDatabase;

    public function test_coa_accounts_table_supports_segment_five(): void
    {
        $this->assertTrue(Schema::hasColumn('coa_accounts', 'segment5'));
        $this->assertTrue(Schema::hasColumn('coa_accounts', 'normal_balance'));
        $this->assertTrue(Schema::hasColumn('coa_accounts', 'opening_balance'));
        $this->assertTrue(Schema::hasColumn('coa_accounts', 'description'));
    }

    public function test_can_create_level_five_coa_account(): void
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

        $level4 = CoaAccount::create([
            'segment1' => '1',
            'segment2' => '10',
            'segment3' => '01',
            'segment4' => '01',
            'full_code' => '1-10-01-01',
            'name' => 'Operating Bank',
            'type' => 'asset',
            'level' => 4,
            'parent_id' => $level3->id,
            'is_postable' => false,
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->post(route('accounting.coa.store'), [
                'segment1' => '1',
                'segment2' => '10',
                'segment3' => '01',
                'segment4' => '01',
                'segment5' => '01',
                'name' => 'Operating Bank Karachi',
                'type' => 'asset',
                'normal_balance' => 'debit',
                'parent_id' => $level4->id,
                'opening_balance' => 1250.50,
                'description' => 'Primary operating bank for Karachi branch.',
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('coa_accounts', [
            'full_code' => '1-10-01-01-01',
            'level' => 5,
            'parent_id' => $level4->id,
            'segment5' => '01',
            'normal_balance' => 'debit',
            'opening_balance' => '1250.50',
            'description' => 'Primary operating bank for Karachi branch.',
        ]);
    }

    public function test_level_five_account_requires_level_four_parent(): void
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

        $this->actingAs($user)
            ->from(route('accounting.coa.index'))
            ->post(route('accounting.coa.store'), [
                'segment1' => '1',
                'segment2' => '10',
                'segment3' => '01',
                'segment4' => '01',
                'segment5' => '01',
                'name' => 'Invalid Deep Account',
                'type' => 'asset',
                'parent_id' => $level2->id,
                'is_active' => true,
            ])
            ->assertRedirect(route('accounting.coa.index'))
            ->assertSessionHasErrors('parent_id');
    }

    public function test_coa_template_includes_segment_five_column(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('accounting.coa.template'));

        $response->assertOk();
        $this->assertStringContainsString('segment5', $response->streamedContent());
    }

    public function test_coa_template_includes_new_accounting_columns(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('accounting.coa.template'));

        $response->assertOk();
        $contents = $response->streamedContent();
        $this->assertStringContainsString('normal_balance', $contents);
        $this->assertStringContainsString('opening_balance', $contents);
        $this->assertStringContainsString('description', $contents);
    }
}
