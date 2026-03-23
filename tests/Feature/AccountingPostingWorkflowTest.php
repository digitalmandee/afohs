<?php

namespace Tests\Feature;

use App\Models\AccountingEventQueue;
use App\Models\AccountingPostingLog;
use App\Models\FinancialInvoice;
use App\Models\FinancialReceipt;
use App\Models\GoodsReceipt;
use App\Models\JournalEntry;
use App\Models\VendorBill;
use App\Models\VendorPayment;
use App\Services\Accounting\AccountingEventDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\BuildsAccountingFixtures;
use Tests\TestCase;

class AccountingPostingWorkflowTest extends TestCase
{
    use BuildsAccountingFixtures;
    use RefreshDatabase;

    public function test_membership_invoice_event_posts_balanced_journal(): void
    {
        $user = $this->createAccountingUser();
        $receivable = $this->createCoaAccount(['1', '11', '01', '01', '01'], 'asset', 'Membership Receivable');
        $revenue = $this->createCoaAccount(['4', '11', '01', '01', '01'], 'income', 'Membership Revenue');
        $this->createBalancedRule('membership_invoice', $receivable, $revenue);
        $invoice = $this->createFinancialInvoice('membership', 2400, $user);

        $event = app(AccountingEventDispatcher::class)->dispatch(
            'invoice_created',
            FinancialInvoice::class,
            $invoice->id,
            null,
            $user->id
        );

        $entry = JournalEntry::find($event->journal_entry_id);

        $this->assertSame('posted', $event->status, (string) $event->error_message);
        $this->assertNotNull($entry);
        $this->assertSame('membership_invoice', $entry->module_type);
        $this->assertEquals(2400.0, (float) $entry->lines()->sum('debit'));
        $this->assertEquals(2400.0, (float) $entry->lines()->sum('credit'));
        $this->assertDatabaseHas('accounting_posting_logs', [
            'queue_id' => $event->id,
            'status' => 'posted',
            'source_type' => FinancialInvoice::class,
            'source_id' => $invoice->id,
        ]);
    }

    public function test_pos_receipt_event_uses_payment_account_mapping(): void
    {
        $user = $this->createAccountingUser();
        $bank = $this->createCoaAccount(['1', '10', '01', '01', '01'], 'asset', 'Bank');
        $sales = $this->createCoaAccount(['4', '10', '01', '01', '01'], 'income', 'POS Sales');
        $clearing = $this->createCoaAccount(['2', '10', '01', '01', '01'], 'liability', 'POS Clearing');
        $paymentAccount = $this->createPaymentAccount($bank, $user);
        $this->createBalancedRule('pos_invoice', $bank, $sales);
        $this->createBalancedRule('pos_receipt', $bank, $clearing, true, false);

        $invoice = $this->createFinancialInvoice('food_order', 1500, $user);
        $receipt = $this->createFinancialReceipt(1500, $paymentAccount, $user);
        $this->linkReceiptToInvoice($receipt, $invoice, 1500, $user);

        $event = app(AccountingEventDispatcher::class)->dispatch(
            'receipt_created',
            FinancialReceipt::class,
            $receipt->id,
            null,
            $user->id
        );

        $entry = JournalEntry::find($event->journal_entry_id);

        $this->assertSame('posted', $event->status, (string) $event->error_message);
        $this->assertNotNull($entry);
        $this->assertSame('pos_receipt', $entry->module_type);
        $this->assertTrue($entry->lines()->where('account_id', $bank->id)->exists());
        $this->assertTrue($entry->lines()->where('account_id', $clearing->id)->exists());
        $this->assertEquals(1500.0, (float) $entry->lines()->sum('debit'));
        $this->assertEquals(1500.0, (float) $entry->lines()->sum('credit'));
    }

    public function test_procurement_posting_chain_posts_goods_receipt_vendor_bill_and_payment(): void
    {
        $user = $this->createAccountingUser();
        $inventory = $this->createCoaAccount(['1', '20', '01', '01', '01'], 'asset', 'Inventory');
        $grni = $this->createCoaAccount(['2', '20', '01', '01', '01'], 'liability', 'GRNI');
        $payable = $this->createCoaAccount(['2', '21', '01', '01', '01'], 'liability', 'Trade Payables');
        $bank = $this->createCoaAccount(['1', '10', '02', '01', '01'], 'asset', 'Operations Bank');
        $paymentAccount = $this->createPaymentAccount($bank, $user);

        $this->createBalancedRule('purchase_receipt', $inventory, $grni);
        $this->createBalancedRule('vendor_bill', $grni, $payable);
        $this->createBalancedRule('vendor_payment', $payable, $bank, false, true);

        $vendor = $this->createVendor($payable, $paymentAccount, $user);
        $warehouse = $this->createWarehouse($user);
        $product = $this->createProduct();
        [$goodsReceipt] = $this->createGoodsReceiptBundle($vendor, $warehouse, $product, $user);
        $vendorBill = $this->createVendorBillForReceipt($vendor, $goodsReceipt, $user);
        $vendorPayment = $this->createVendorPayment($vendor, $paymentAccount, $user);

        $dispatcher = app(AccountingEventDispatcher::class);
        $receiptEvent = $dispatcher->dispatch('goods_receipt_posted', GoodsReceipt::class, $goodsReceipt->id, null, $user->id);
        $billEvent = $dispatcher->dispatch('vendor_bill_posted', VendorBill::class, $vendorBill->id, null, $user->id);
        $paymentEvent = $dispatcher->dispatch('vendor_payment_posted', VendorPayment::class, $vendorPayment->id, null, $user->id);

        foreach ([$receiptEvent, $billEvent, $paymentEvent] as $event) {
            $this->assertSame('posted', $event->status, (string) $event->error_message);
            $this->assertNotNull($event->journal_entry_id);
            $entry = JournalEntry::find($event->journal_entry_id);
            $this->assertNotNull($entry);
            $this->assertEquals((float) $entry->lines()->sum('debit'), (float) $entry->lines()->sum('credit'));
        }

        $this->assertDatabaseHas('accounting_posting_logs', [
            'queue_id' => $paymentEvent->id,
            'status' => 'posted',
        ]);
    }

    public function test_missing_posting_rule_marks_event_failed_with_traceable_log(): void
    {
        $user = $this->createAccountingUser();
        $invoice = $this->createFinancialInvoice('membership', 900, $user);

        $event = app(AccountingEventDispatcher::class)->dispatch(
            'invoice_created',
            FinancialInvoice::class,
            $invoice->id,
            null,
            $user->id
        );

        $this->assertSame('failed', $event->status);
        $this->assertNull($event->journal_entry_id);

        $log = AccountingPostingLog::query()->where('queue_id', $event->id)->latest('id')->first();
        $this->assertNotNull($log);
        $this->assertSame('failed', $log->status);
        $this->assertStringContainsString('membership_invoice', $log->message);
    }
}
