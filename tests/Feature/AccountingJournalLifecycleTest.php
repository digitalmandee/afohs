<?php

namespace Tests\Feature;

use App\Models\AccountingPeriod;
use App\Models\JournalEntry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\BuildsAccountingFixtures;
use Tests\TestCase;

class AccountingJournalLifecycleTest extends TestCase
{
    use BuildsAccountingFixtures;
    use RefreshDatabase;

    public function test_can_create_balanced_draft_journal(): void
    {
        $user = $this->createAccountingUser();
        $period = $this->createAccountingPeriod();
        $cash = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Cash Drawer');
        $revenue = $this->createCoaAccount(['4', '10', '01', '01', '01'], 'income', 'Food Sales');

        $this->actingAs($user)
            ->post(route('accounting.journals.store'), [
                'entry_date' => now()->toDateString(),
                'description' => 'Manual journal',
                'period_id' => $period->id,
                'lines' => [
                    [
                        'account_id' => $cash->id,
                        'debit' => 1250,
                        'credit' => 0,
                    ],
                    [
                        'account_id' => $revenue->id,
                        'debit' => 0,
                        'credit' => 1250,
                    ],
                ],
            ])
            ->assertRedirect();

        $entry = JournalEntry::query()->with('lines')->latest('id')->first();

        $this->assertNotNull($entry);
        $this->assertSame('draft', $entry->status);
        $this->assertCount(2, $entry->lines);
        $this->assertEquals(1250.0, (float) $entry->lines->sum('debit'));
        $this->assertEquals(1250.0, (float) $entry->lines->sum('credit'));
    }

    public function test_closed_period_blocks_journal_creation(): void
    {
        $user = $this->createAccountingUser();
        $period = AccountingPeriod::create([
            'name' => 'Closed Period',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
            'status' => 'closed',
        ]);

        $cash = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Cash Drawer');
        $revenue = $this->createCoaAccount(['4', '10', '01', '01', '01'], 'income', 'Food Sales');

        $this->actingAs($user)
            ->from(route('accounting.journals.create'))
            ->post(route('accounting.journals.store'), [
                'entry_date' => now()->toDateString(),
                'description' => 'Blocked journal',
                'period_id' => $period->id,
                'lines' => [
                    [
                        'account_id' => $cash->id,
                        'debit' => 500,
                        'credit' => 0,
                    ],
                    [
                        'account_id' => $revenue->id,
                        'debit' => 0,
                        'credit' => 500,
                    ],
                ],
            ])
            ->assertRedirect(route('accounting.journals.create'))
            ->assertSessionHasErrors('period_id');

        $this->assertDatabaseCount('journal_entries', 0);
    }

    public function test_can_reverse_posted_journal_entry(): void
    {
        $user = $this->createAccountingUser();
        $period = $this->createAccountingPeriod();
        $cash = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Cash Drawer');
        $revenue = $this->createCoaAccount(['4', '10', '01', '01', '01'], 'income', 'Food Sales');
        $entry = $this->createPostedJournal($cash, $revenue, 900, $period, $user);

        $this->actingAs($user)
            ->from(route('accounting.journals.show', $entry))
            ->post(route('accounting.journals.reverse', $entry), [
                'reason' => 'Posted in error',
                'entry_date' => now()->toDateString(),
            ])
            ->assertRedirect(route('accounting.journals.show', $entry));

        $entry->refresh();
        $this->assertSame('reversed', $entry->status);

        $reversal = JournalEntry::query()
            ->where('module_type', JournalEntry::class)
            ->where('module_id', $entry->id)
            ->with('lines')
            ->first();

        $this->assertNotNull($reversal);
        $this->assertSame('posted', $reversal->status);
        $this->assertEquals(900.0, (float) $reversal->lines->sum('debit'));
        $this->assertEquals(900.0, (float) $reversal->lines->sum('credit'));
        $this->assertEquals(900.0, (float) $reversal->lines->firstWhere('account_id', $revenue->id)->debit);
        $this->assertEquals(900.0, (float) $reversal->lines->firstWhere('account_id', $cash->id)->credit);
    }
}
