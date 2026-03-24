<?php

namespace Tests\Feature;

use App\Models\AccountingRule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\BuildsAccountingFixtures;
use Tests\TestCase;

class AccountingRuleBootstrapTest extends TestCase
{
    use BuildsAccountingFixtures;
    use RefreshDatabase;

    public function test_rules_index_exposes_standard_rule_statuses(): void
    {
        $user = $this->createAccountingUser();
        $this->seedBasePostingAccounts($user->id);

        $page = $this->actingAs($user)->get(route('accounting.rules.index'))->viewData('page');
        $props = $page['props'] ?? [];
        $standardRules = collect($props['standardRules'] ?? []);

        $this->assertSame('ready', $standardRules->firstWhere('code', 'membership_invoice')['status'] ?? null);
        $this->assertSame('ready', $standardRules->firstWhere('code', 'pos_receipt')['status'] ?? null);
        $this->assertSame('ready_with_support', $standardRules->firstWhere('code', 'pos_invoice')['status'] ?? null);
        $this->assertSame('ready_with_support', $standardRules->firstWhere('code', 'purchase_receipt')['status'] ?? null);
        $this->assertSame('ready_with_support', $standardRules->firstWhere('code', 'vendor_bill')['status'] ?? null);
    }

    public function test_bootstrap_creates_standard_rules_and_support_accounts(): void
    {
        $user = $this->createAccountingUser();
        $accounts = $this->seedBasePostingAccounts($user->id);
        $this->createPaymentAccount($accounts['bank'], $user);

        $this->actingAs($user)
            ->post(route('accounting.rules.bootstrap'))
            ->assertRedirect(route('accounting.rules.index'))
            ->assertSessionHas('success');

        $this->assertSame(13, AccountingRule::count());
        $this->assertDatabaseHas('accounting_rules', ['code' => 'membership_invoice', 'is_active' => true]);
        $this->assertDatabaseHas('accounting_rules', ['code' => 'pos_invoice', 'is_active' => true]);
        $this->assertDatabaseHas('accounting_rules', ['code' => 'purchase_receipt', 'is_active' => true]);
        $this->assertDatabaseHas('accounting_rules', ['code' => 'vendor_bill', 'is_active' => true]);
        $this->assertDatabaseHas('accounting_rules', ['code' => 'vendor_payment', 'is_active' => true]);

        $this->assertDatabaseHas('coa_accounts', ['full_code' => '81-01-11-00-01', 'name' => 'POS Sales', 'is_postable' => true]);
        $this->assertDatabaseHas('coa_accounts', ['full_code' => '10-04-01-00-01', 'name' => 'Inventory on Hand', 'is_postable' => true]);
        $this->assertDatabaseHas('coa_accounts', ['full_code' => '20-01-02-00-01', 'name' => 'Goods Received Not Invoiced', 'is_postable' => true]);

        $posInvoice = AccountingRule::query()->where('code', 'pos_invoice')->firstOrFail();
        $this->assertSame(2, count((array) $posInvoice->lines));
        $this->assertSame('debit', $posInvoice->lines[0]['side']);
        $this->assertSame('credit', $posInvoice->lines[1]['side']);

        $vendorPayment = AccountingRule::query()->where('code', 'vendor_payment')->firstOrFail();
        $this->assertTrue((bool) $vendorPayment->lines[1]['use_payment_account']);
    }

    private function seedBasePostingAccounts(int $userId): array
    {
        $assets = $this->createCoaAccount(['10'], 'asset', 'Assets', null, false);
        $cashGroup = $this->createCoaAccount(['10', '01'], 'asset', 'Cash & Cash Equivalents', $assets, false);
        $cashHeader = $this->createCoaAccount(['10', '01', '01'], 'asset', 'Cash in Hand', $cashGroup, false);
        $cashGroupL4 = $this->createCoaAccount(['10', '01', '01', '00'], 'asset', 'Cash in Hand Group', $cashHeader, false);
        $cash = $this->createCoaAccount(['10', '01', '01', '00', '01'], 'asset', 'Cash in Hand', $cashGroupL4, true);

        $bankHeader = $this->createCoaAccount(['10', '01', '02'], 'asset', 'Bank Accounts', $cashGroup, false);
        $bankGroupL4 = $this->createCoaAccount(['10', '01', '02', '00'], 'asset', 'Bank Accounts Group', $bankHeader, false);
        $bank = $this->createCoaAccount(['10', '01', '02', '00', '01'], 'asset', 'Bank Accounts', $bankGroupL4, true);

        $receivables = $this->createCoaAccount(['10', '02'], 'asset', 'Receivables', $assets, false);
        $arHeader = $this->createCoaAccount(['10', '02', '01'], 'asset', 'Accounts Receivable', $receivables, false);
        $arGroupL4 = $this->createCoaAccount(['10', '02', '01', '00'], 'asset', 'Accounts Receivable Group', $arHeader, false);
        $accountsReceivable = $this->createCoaAccount(['10', '02', '01', '00', '01'], 'asset', 'Accounts Receivable', $arGroupL4, true);

        $liabilities = $this->createCoaAccount(['20'], 'liability', 'Liabilities', null, false);
        $currentLiabilities = $this->createCoaAccount(['20', '01'], 'liability', 'Current Liabilities', $liabilities, false);
        $apHeader = $this->createCoaAccount(['20', '01', '01'], 'liability', 'Accounts Payable', $currentLiabilities, false);
        $apGroupL4 = $this->createCoaAccount(['20', '01', '01', '00'], 'liability', 'Accounts Payable Group', $apHeader, false);
        $accountsPayable = $this->createCoaAccount(['20', '01', '01', '00', '01'], 'liability', 'Accounts Payable', $apGroupL4, true);

        $income49 = $this->createCoaAccount(['49'], 'income', 'Income Group 49', null, false);
        $income4950 = $this->createCoaAccount(['49', '50'], 'income', 'Income Group 49-50', $income49, false);
        $membershipHeader = $this->createCoaAccount(['49', '50', '00'], 'income', 'Membership Fee', $income4950, false);
        $membershipGroup = $this->createCoaAccount(['49', '50', '00', '00'], 'income', 'Membership Fee Group', $membershipHeader, false);
        $membership = $this->createCoaAccount(['49', '50', '00', '00', '01'], 'income', 'Membership Fee', $membershipGroup, true);

        $income81 = $this->createCoaAccount(['81'], 'income', 'Income Group 81', null, false);
        $income8101 = $this->createCoaAccount(['81', '01'], 'income', 'Income Group 81-01', $income81, false);

        $roomHeader = $this->createCoaAccount(['81', '01', '09'], 'income', 'Room Booking', $income8101, false);
        $roomGroup = $this->createCoaAccount(['81', '01', '09', '00'], 'income', 'Room Booking Group', $roomHeader, false);
        $room = $this->createCoaAccount(['81', '01', '09', '00', '01'], 'income', 'Room Booking', $roomGroup, true);

        $subscriptionHeader = $this->createCoaAccount(['81', '01', '10'], 'income', 'Monthly Maintenance Fee', $income8101, false);
        $subscriptionGroup = $this->createCoaAccount(['81', '01', '10', '00'], 'income', 'Monthly Maintenance Fee Group', $subscriptionHeader, false);
        $subscription = $this->createCoaAccount(['81', '01', '10', '00', '01'], 'income', 'Monthly Maintenance Fee', $subscriptionGroup, true);

        $eventHeader = $this->createCoaAccount(['81', '01', '12'], 'income', 'Events Management', $income8101, false);
        $eventGroup = $this->createCoaAccount(['81', '01', '12', '00'], 'income', 'Events Management Group', $eventHeader, false);
        $event = $this->createCoaAccount(['81', '01', '12', '00', '01'], 'income', 'Events Management', $eventGroup, true);

        foreach ([$cash, $bank, $accountsReceivable, $accountsPayable, $membership, $room, $subscription, $event] as $account) {
            $account->update(['created_by' => $userId, 'updated_by' => $userId]);
        }

        return [
            'cash' => $cash,
            'bank' => $bank,
            'ar' => $accountsReceivable,
            'ap' => $accountsPayable,
            'membership' => $membership,
            'room' => $room,
            'subscription' => $subscription,
            'event' => $event,
        ];
    }
}
