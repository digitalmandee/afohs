<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\BuildsAccountingFixtures;
use Tests\TestCase;

class AccountingVerificationCommandTest extends TestCase
{
    use BuildsAccountingFixtures;
    use RefreshDatabase;

    public function test_accounting_verify_module_command_reports_core_sections(): void
    {
        $user = $this->createAccountingUser();
        $cash = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Cash');
        $income = $this->createCoaAccount(['4', '10', '01', '01', '01'], 'income', 'Income');
        $this->createBalancedRule('membership_invoice', $cash, $income);
        $this->createAccountingPeriod();
        $this->createPaymentAccount($cash, $user);

        $this->artisan('accounting:verify-module', ['--limit' => 5])
            ->expectsOutputToContain('Accounting Rules')
            ->expectsOutputToContain('Event Queue')
            ->expectsOutputToContain('Periods and Bank Accounts')
            ->expectsOutputToContain('COA Integrity')
            ->assertExitCode(0);
    }
}
