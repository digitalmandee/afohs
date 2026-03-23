<?php

namespace Tests\Feature;

use App\Models\AccountingEventQueue;
use App\Models\AccountingPeriod;
use App\Models\BankReconciliationSession;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\BuildsAccountingFixtures;
use Tests\TestCase;

class AccountingReconciliationAndCloseTest extends TestCase
{
    use BuildsAccountingFixtures;
    use RefreshDatabase;

    public function test_bank_reconciliation_auto_match_reconciles_matching_statement_lines(): void
    {
        $user = $this->createAccountingUser();
        $bank = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Main Bank');
        $clearing = $this->createCoaAccount(['2', '10', '01', '01', '01'], 'liability', 'Cash Clearing');
        $payable = $this->createCoaAccount(['2', '20', '01', '01', '01'], 'liability', 'Vendor Payable');
        $paymentAccount = $this->createPaymentAccount($bank, $user);
        $vendor = $this->createVendor($payable, $paymentAccount, $user);

        $receipt = $this->createFinancialReceipt(500, $paymentAccount, $user, [
            'receipt_date' => now()->subDay()->toDateString(),
        ]);
        $payment = $this->createVendorPayment($vendor, $paymentAccount, $user);

        $response = $this->actingAs($user)->post(route('accounting.bank-reconciliation.store'), [
            'payment_account_id' => $paymentAccount->id,
            'statement_start_date' => now()->startOfMonth()->toDateString(),
            'statement_end_date' => now()->endOfMonth()->toDateString(),
            'statement_opening_balance' => 0,
            'statement_closing_balance' => 0,
            'lines' => [
                [
                    'txn_date' => $receipt->receipt_date->toDateString(),
                    'reference_no' => $receipt->receipt_no,
                    'description' => 'Receipt line',
                    'direction' => 'inflow',
                    'amount' => 500,
                ],
                [
                    'txn_date' => $payment->payment_date->toDateString(),
                    'reference_no' => $payment->payment_no,
                    'description' => 'Vendor payment line',
                    'direction' => 'outflow',
                    'amount' => 500,
                ],
            ],
        ]);

        $session = BankReconciliationSession::query()->with('lines')->latest('id')->first();

        $response->assertRedirect(route('accounting.bank-reconciliation.index', ['session_id' => $session->id]));
        $this->assertNotNull($session);
        $this->assertSame('draft', $session->status);
        $this->assertCount(2, $session->lines);

        $this->actingAs($user)
            ->post(route('accounting.bank-reconciliation.auto-match', $session))
            ->assertRedirect();

        $session->refresh();
        $this->assertSame('reconciled', $session->status);
        $this->assertEquals(0.0, (float) $session->difference_amount);
        $this->assertDatabaseMissing('bank_reconciliation_lines', [
            'session_id' => $session->id,
            'status' => 'unmatched',
        ]);
    }

    public function test_period_lock_is_blocked_by_draft_journal_and_failed_event(): void
    {
        $user = $this->createAccountingUser();
        $period = AccountingPeriod::create([
            'name' => 'March Period',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
            'status' => 'open',
        ]);

        $cash = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Cash Drawer');
        $sales = $this->createCoaAccount(['4', '10', '01', '01', '01'], 'income', 'Sales');
        $entry = $this->createPostedJournal($cash, $sales, 700, $period, $user);
        $entry->update(['status' => 'draft']);

        AccountingEventQueue::create([
            'event_type' => 'invoice_created',
            'source_type' => 'fixture',
            'source_id' => 1,
            'status' => 'failed',
            'idempotency_key' => 'fixture-failed-event',
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->post(route('accounting.periods.lock', $period))
            ->assertRedirect()
            ->assertSessionHas('error');

        $period->refresh();
        $this->assertSame('open', $period->status);
    }

    public function test_closed_period_can_be_reopened(): void
    {
        $period = AccountingPeriod::create([
            'name' => 'Closed Period',
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
            'status' => 'closed',
            'locked_at' => now(),
        ]);

        $user = $this->createAccountingUser();

        $this->actingAs($user)
            ->post(route('accounting.periods.reopen', $period))
            ->assertRedirect()
            ->assertSessionHas('success');

        $period->refresh();
        $this->assertSame('open', $period->status);
        $this->assertNull($period->locked_at);
    }
}
