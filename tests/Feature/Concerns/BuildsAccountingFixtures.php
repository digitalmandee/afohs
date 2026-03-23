<?php

namespace Tests\Feature\Concerns;

use App\Models\AccountingRule;
use App\Models\AccountingPeriod;
use App\Models\FinancialInvoice;
use App\Models\FinancialReceipt;
use App\Models\CoaAccount;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\JournalEntry;
use App\Models\PaymentAccount;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\TransactionRelation;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorBill;
use App\Models\VendorPayment;
use App\Models\Warehouse;
use Illuminate\Support\Str;

trait BuildsAccountingFixtures
{
    protected function createAccountingUser(): User
    {
        return User::factory()->create();
    }

    protected function createAccountingPeriod(?string $status = 'open'): AccountingPeriod
    {
        return AccountingPeriod::create([
            'name' => 'Period ' . now()->format('M Y') . ' ' . Str::upper(Str::random(4)),
            'start_date' => now()->startOfMonth()->toDateString(),
            'end_date' => now()->endOfMonth()->toDateString(),
            'status' => $status,
        ]);
    }

    protected function createCoaAccount(array $segments, string $type, string $name, ?CoaAccount $parent = null, bool $isPostable = true): CoaAccount
    {
        $segments = array_values($segments);

        return CoaAccount::create([
            'segment1' => $segments[0] ?? null,
            'segment2' => $segments[1] ?? null,
            'segment3' => $segments[2] ?? null,
            'segment4' => $segments[3] ?? null,
            'segment5' => $segments[4] ?? null,
            'full_code' => implode('-', array_filter($segments, fn ($segment) => $segment !== null && $segment !== '')),
            'name' => $name,
            'type' => $type,
            'level' => count(array_filter($segments, fn ($segment) => $segment !== null && $segment !== '')),
            'parent_id' => $parent?->id,
            'is_postable' => $isPostable,
            'is_active' => true,
        ]);
    }

    protected function createBalancedRule(string $code, CoaAccount $debitAccount, CoaAccount $creditAccount, bool $debitUsesPaymentAccount = false, bool $creditUsesPaymentAccount = false): AccountingRule
    {
        return AccountingRule::create([
            'code' => $code,
            'name' => Str::headline(str_replace('_', ' ', $code)),
            'is_active' => true,
            'lines' => [
                [
                    'account_id' => $debitUsesPaymentAccount ? null : $debitAccount->id,
                    'side' => 'debit',
                    'ratio' => 1,
                    'use_payment_account' => $debitUsesPaymentAccount,
                ],
                [
                    'account_id' => $creditUsesPaymentAccount ? null : $creditAccount->id,
                    'side' => 'credit',
                    'ratio' => 1,
                    'use_payment_account' => $creditUsesPaymentAccount,
                ],
            ],
        ]);
    }

    protected function createPostedJournal(CoaAccount $debitAccount, CoaAccount $creditAccount, float $amount = 100, ?AccountingPeriod $period = null, ?User $user = null): JournalEntry
    {
        $entry = JournalEntry::create([
            'entry_no' => 'JE-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(4)),
            'entry_date' => now()->toDateString(),
            'description' => 'Fixture journal',
            'status' => 'posted',
            'period_id' => $period?->id,
            'created_by' => $user?->id,
            'posted_by' => $user?->id,
            'posted_at' => now(),
        ]);

        $entry->lines()->createMany([
            [
                'account_id' => $debitAccount->id,
                'debit' => $amount,
                'credit' => 0,
            ],
            [
                'account_id' => $creditAccount->id,
                'debit' => 0,
                'credit' => $amount,
            ],
        ]);

        return $entry->fresh('lines');
    }

    protected function createPaymentAccount(CoaAccount $coaAccount, ?User $user = null): PaymentAccount
    {
        return PaymentAccount::create([
            'name' => 'Main Bank',
            'payment_method' => 'bank',
            'coa_account_id' => $coaAccount->id,
            'status' => 'active',
            'created_by' => $user?->id,
        ]);
    }

    protected function createFinancialInvoice(string $invoiceType, float $amount, ?User $user = null, array $overrides = []): FinancialInvoice
    {
        return FinancialInvoice::create(array_merge([
            'invoice_no' => 'INV-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(4)),
            'invoice_type' => $invoiceType,
            'amount' => $amount,
            'total_price' => $amount,
            'issue_date' => now()->toDateString(),
            'due_date' => now()->addDays(7)->toDateString(),
            'status' => 'unpaid',
            'created_by' => $user?->id,
        ], $overrides));
    }

    protected function createFinancialReceipt(float $amount, PaymentAccount $paymentAccount, ?User $user = null, array $overrides = []): FinancialReceipt
    {
        return FinancialReceipt::create(array_merge([
            'receipt_no' => 'RCPT-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(4)),
            'amount' => $amount,
            'payment_method' => 'bank',
            'payment_account_id' => $paymentAccount->id,
            'receipt_date' => now()->toDateString(),
            'created_by' => $user?->id,
        ], $overrides));
    }

    protected function linkReceiptToInvoice(FinancialReceipt $receipt, FinancialInvoice $invoice, ?float $amount = null, ?User $user = null): TransactionRelation
    {
        return TransactionRelation::create([
            'invoice_id' => $invoice->id,
            'receipt_id' => $receipt->id,
            'amount' => $amount ?? $receipt->amount,
            'created_by' => $user?->id,
        ]);
    }

    protected function createVendor(?CoaAccount $payableAccount = null, ?PaymentAccount $defaultPaymentAccount = null, ?User $user = null): Vendor
    {
        return Vendor::create([
            'code' => 'V-' . Str::upper(Str::random(6)),
            'name' => 'Test Vendor ' . Str::upper(Str::random(4)),
            'currency' => 'PKR',
            'opening_balance' => 0,
            'status' => 'active',
            'payable_account_id' => $payableAccount?->id,
            'default_payment_account_id' => $defaultPaymentAccount?->id,
            'created_by' => $user?->id,
        ]);
    }

    protected function createWarehouse(?User $user = null): Warehouse
    {
        return Warehouse::create([
            'code' => 'WH-' . Str::upper(Str::random(5)),
            'name' => 'Main Warehouse',
            'status' => 'active',
            'is_global' => true,
            'all_restaurants' => true,
            'created_by' => $user?->id,
        ]);
    }

    protected function createProduct(): Product
    {
        return Product::create([
            'name' => 'Test Inventory Item ' . Str::upper(Str::random(4)),
            'base_price' => 100,
            'cost_of_goods_sold' => 60,
            'current_stock' => 0,
            'minimal_stock' => 0,
        ]);
    }

    protected function createPurchaseOrderBundle(Vendor $vendor, Warehouse $warehouse, Product $product, ?User $user = null): array
    {
        $purchaseOrder = PurchaseOrder::create([
            'po_no' => 'PO-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(3)),
            'vendor_id' => $vendor->id,
            'warehouse_id' => $warehouse->id,
            'order_date' => now()->toDateString(),
            'status' => 'approved',
            'currency' => 'PKR',
            'sub_total' => 500,
            'grand_total' => 500,
            'created_by' => $user?->id,
        ]);

        $purchaseOrderItem = PurchaseOrderItem::create([
            'purchase_order_id' => $purchaseOrder->id,
            'product_id' => $product->id,
            'description' => 'PO Line',
            'qty_ordered' => 5,
            'qty_received' => 0,
            'unit_cost' => 100,
            'line_total' => 500,
        ]);

        return [$purchaseOrder, $purchaseOrderItem];
    }

    protected function createGoodsReceiptBundle(Vendor $vendor, Warehouse $warehouse, Product $product, ?User $user = null): array
    {
        [$purchaseOrder, $purchaseOrderItem] = $this->createPurchaseOrderBundle($vendor, $warehouse, $product, $user);

        $goodsReceipt = GoodsReceipt::create([
            'grn_no' => 'GRN-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(3)),
            'purchase_order_id' => $purchaseOrder->id,
            'vendor_id' => $vendor->id,
            'warehouse_id' => $warehouse->id,
            'received_date' => now()->toDateString(),
            'status' => 'received',
            'created_by' => $user?->id,
            'posted_by' => $user?->id,
            'posted_at' => now(),
        ]);

        $goodsReceiptItem = GoodsReceiptItem::create([
            'goods_receipt_id' => $goodsReceipt->id,
            'purchase_order_item_id' => $purchaseOrderItem->id,
            'product_id' => $product->id,
            'qty_received' => 5,
            'unit_cost' => 100,
            'line_total' => 500,
        ]);

        return [$goodsReceipt, $goodsReceiptItem, $purchaseOrder, $purchaseOrderItem];
    }

    protected function createVendorBillForReceipt(Vendor $vendor, GoodsReceipt $goodsReceipt, ?User $user = null): VendorBill
    {
        return VendorBill::create([
            'bill_no' => 'VB-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(3)),
            'vendor_id' => $vendor->id,
            'goods_receipt_id' => $goodsReceipt->id,
            'bill_date' => now()->toDateString(),
            'status' => 'posted',
            'currency' => 'PKR',
            'sub_total' => 500,
            'grand_total' => 500,
            'paid_amount' => 0,
            'created_by' => $user?->id,
            'posted_by' => $user?->id,
            'posted_at' => now(),
        ]);
    }

    protected function createVendorPayment(Vendor $vendor, PaymentAccount $paymentAccount, ?User $user = null): VendorPayment
    {
        return VendorPayment::create([
            'payment_no' => 'VP-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(3)),
            'vendor_id' => $vendor->id,
            'payment_account_id' => $paymentAccount->id,
            'payment_date' => now()->toDateString(),
            'method' => 'bank',
            'amount' => 500,
            'status' => 'posted',
            'created_by' => $user?->id,
            'posted_by' => $user?->id,
            'posted_at' => now(),
        ]);
    }
}
