<?php

namespace App\Services\Accounting\Support;

use App\Models\AccountingEventQueue;
use App\Models\FinancialInvoice;
use App\Models\FinancialReceipt;
use App\Models\GoodsReceipt;
use App\Models\JournalEntry;
use App\Models\Order;
use App\Models\Tenant;
use App\Models\VendorBill;
use App\Models\VendorPayment;
use Illuminate\Support\Facades\Route;

class AccountingSourceResolver
{
    private array $restaurantNameCache = [];

    public function resolveForFinancialInvoice(FinancialInvoice $invoice, ?AccountingEventQueue $event = null, ?JournalEntry $journal = null): array
    {
        $module = $this->detectInvoiceModule($invoice);
        $restaurantId = $this->resolveInvoiceRestaurantId($invoice, $event);
        $restaurantName = $event?->restaurant?->name
            ?? data_get($invoice, 'invoiceable.tenant.name')
            ?? $this->restaurantName($restaurantId);

        $sourceId = (int) $invoice->id;
        $documentUrl = $this->safeRoute('finance.invoice.pay', $invoice->id);
        $resolutionStatus = 'resolved';

        if ($module === 'pos') {
            $sourceId = (int) (data_get($invoice, 'data.order_id')
                ?? ($invoice->invoiceable_type === Order::class ? $invoice->invoiceable_id : $invoice->id));
            $documentUrl = null;
            $resolutionStatus = 'unresolved';
        }

        if ($module === 'room') {
            $bookingId = (int) (data_get($invoice, 'data.booking_id')
                ?? ($invoice->invoiceable_type === \App\Models\RoomBooking::class ? $invoice->invoiceable_id : 0));
            if ($bookingId > 0) {
                $sourceId = $bookingId;
                $documentUrl = $this->safeRoute('rooms.invoice', $bookingId);
            }
        }

        if ($module === 'event') {
            $bookingId = (int) (data_get($invoice, 'data.booking_id')
                ?? ($invoice->invoiceable_type === \App\Models\EventBooking::class ? $invoice->invoiceable_id : 0));
            if ($bookingId > 0) {
                $sourceId = $bookingId;
                $documentUrl = $this->safeRoute('events.booking.invoice', $bookingId);
            }
        }

        if (!$documentUrl) {
            $resolutionStatus = 'unresolved';
        }

        return [
            'source_module' => $module,
            'source_label' => $this->moduleLabel($module),
            'source_type' => (string) ($invoice->invoice_type ?: 'financial_invoice'),
            'source_id' => $sourceId,
            'document_no' => (string) ($invoice->invoice_no ?: 'Invoice #' . $invoice->id),
            'document_url' => $documentUrl,
            'restaurant_id' => $restaurantId,
            'restaurant_name' => $restaurantName,
            'posting_status' => $event?->status ?? ($journal ? 'posted' : 'not_configured'),
            'journal_entry_id' => $event?->journal_entry_id ?? $journal?->id,
            'failure_reason' => $event?->error_message,
            'source_resolution_status' => $resolutionStatus,
        ];
    }

    public function resolveForFinancialReceipt(FinancialReceipt $receipt, ?AccountingEventQueue $event = null, ?JournalEntry $journal = null): array
    {
        $receipt->loadMissing(['links.invoice', 'payer']);
        $linkedInvoice = $receipt->links->sortByDesc('id')->first()?->invoice;
        $restaurantId = $event?->restaurant_id;
        $restaurantName = $event?->restaurant?->name ?? $this->restaurantName($restaurantId);

        return [
            'source_module' => 'finance',
            'source_label' => 'Financial Receipt',
            'source_type' => 'financial_receipt',
            'source_id' => (int) $receipt->id,
            'document_no' => (string) ($receipt->receipt_no ?: 'Receipt #' . $receipt->id),
            'document_url' => $linkedInvoice ? $this->safeRoute('finance.invoice.pay', $linkedInvoice->id) : null,
            'restaurant_id' => $restaurantId,
            'restaurant_name' => $restaurantName,
            'posting_status' => $event?->status ?? ($journal ? 'posted' : 'not_configured'),
            'journal_entry_id' => $event?->journal_entry_id ?? $journal?->id,
            'failure_reason' => $event?->error_message,
            'source_resolution_status' => $linkedInvoice && $this->safeRoute('finance.invoice.pay', $linkedInvoice->id) ? 'resolved' : 'unresolved',
        ];
    }

    public function resolveForVendorBill(VendorBill $bill, ?AccountingEventQueue $event = null, ?JournalEntry $journal = null): array
    {
        $bill->loadMissing('tenant');

        return [
            'source_module' => 'procurement',
            'source_label' => 'Vendor Bill',
            'source_type' => 'vendor_bill',
            'source_id' => (int) $bill->id,
            'document_no' => (string) ($bill->bill_no ?: 'Bill #' . $bill->id),
            'document_url' => $this->safeRoute('procurement.vendor-bills.edit', $bill->id),
            'restaurant_id' => $event?->restaurant_id ?? $bill->tenant_id,
            'restaurant_name' => $event?->restaurant?->name ?? $bill->tenant?->name ?? $this->restaurantName($bill->tenant_id),
            'posting_status' => $event?->status ?? ($journal ? 'posted' : 'not_configured'),
            'journal_entry_id' => $event?->journal_entry_id ?? $journal?->id,
            'failure_reason' => $event?->error_message,
            'source_resolution_status' => $this->safeRoute('procurement.vendor-bills.edit', $bill->id) ? 'resolved' : 'unresolved',
        ];
    }

    public function resolveForVendorPayment(VendorPayment $payment, ?AccountingEventQueue $event = null, ?JournalEntry $journal = null): array
    {
        $payment->loadMissing('tenant');

        return [
            'source_module' => 'procurement',
            'source_label' => 'Vendor Payment',
            'source_type' => 'vendor_payment',
            'source_id' => (int) $payment->id,
            'document_no' => (string) ($payment->payment_no ?: 'Payment #' . $payment->id),
            'document_url' => $this->safeRoute('procurement.vendor-payments.edit', $payment->id),
            'restaurant_id' => $event?->restaurant_id ?? $payment->tenant_id,
            'restaurant_name' => $event?->restaurant?->name ?? $payment->tenant?->name ?? $this->restaurantName($payment->tenant_id),
            'posting_status' => $event?->status ?? ($journal ? 'posted' : 'not_configured'),
            'journal_entry_id' => $event?->journal_entry_id ?? $journal?->id,
            'failure_reason' => $event?->error_message,
            'source_resolution_status' => $this->safeRoute('procurement.vendor-payments.edit', $payment->id) ? 'resolved' : 'unresolved',
        ];
    }

    public function resolveForGoodsReceipt(GoodsReceipt $receipt, ?AccountingEventQueue $event = null, ?JournalEntry $journal = null): array
    {
        $receipt->loadMissing('tenant');

        return [
            'source_module' => 'procurement',
            'source_label' => 'Goods Receipt',
            'source_type' => 'goods_receipt',
            'source_id' => (int) $receipt->id,
            'document_no' => (string) ($receipt->grn_no ?: 'GRN #' . $receipt->id),
            'document_url' => $this->safeRoute('procurement.goods-receipts.index', ['search' => $receipt->grn_no]),
            'restaurant_id' => $event?->restaurant_id ?? $receipt->tenant_id,
            'restaurant_name' => $event?->restaurant?->name ?? $receipt->tenant?->name ?? $this->restaurantName($receipt->tenant_id),
            'posting_status' => $event?->status ?? ($journal ? 'posted' : 'not_configured'),
            'journal_entry_id' => $event?->journal_entry_id ?? $journal?->id,
            'failure_reason' => $event?->error_message,
            'source_resolution_status' => $this->safeRoute('procurement.goods-receipts.index', ['search' => $receipt->grn_no]) ? 'resolved' : 'unresolved',
        ];
    }

    public function resolveForJournalEntry(JournalEntry $entry): array
    {
        $entry->loadMissing('tenant');
        $moduleType = (string) ($entry->module_type ?? '');

        if (in_array($moduleType, ['financial_invoice', 'membership_invoice', 'subscription_invoice', 'pos_invoice', 'room_invoice', 'event_invoice'], true)) {
            $invoice = FinancialInvoice::query()
                ->with(['invoiceable', 'member:id,full_name,membership_no', 'corporateMember:id,full_name,membership_no', 'customer:id,name,customer_no'])
                ->find($entry->module_id);

            if ($invoice) {
                return $this->resolveForFinancialInvoice($invoice, null, $entry);
            }
        }

        if ($moduleType === 'financial_receipt') {
            $receipt = FinancialReceipt::query()->with('links.invoice')->find($entry->module_id);
            if ($receipt) {
                return $this->resolveForFinancialReceipt($receipt, null, $entry);
            }
        }

        if ($moduleType === 'vendor_bill') {
            $bill = VendorBill::query()->with('tenant')->find($entry->module_id);
            if ($bill) {
                return $this->resolveForVendorBill($bill, null, $entry);
            }
        }

        if ($moduleType === 'vendor_payment') {
            $payment = VendorPayment::query()->with('tenant')->find($entry->module_id);
            if ($payment) {
                return $this->resolveForVendorPayment($payment, null, $entry);
            }
        }

        if (in_array($moduleType, ['goods_receipt', 'purchase_receipt'], true)) {
            $receipt = GoodsReceipt::query()->with('tenant')->find($entry->module_id);
            if ($receipt) {
                return $this->resolveForGoodsReceipt($receipt, null, $entry);
            }
        }

        return [
            'source_module' => $this->moduleFromCode($moduleType),
            'source_label' => $this->moduleTypeLabel($moduleType),
            'source_type' => $moduleType ?: 'journal_entry',
            'source_id' => (int) ($entry->module_id ?? $entry->id),
            'document_no' => (string) ($entry->entry_no ?: 'Journal #' . $entry->id),
            'document_url' => null,
            'restaurant_id' => $entry->tenant_id,
            'restaurant_name' => $entry->tenant?->name ?? $this->restaurantName($entry->tenant_id),
            'posting_status' => $entry->status ?: 'posted',
            'journal_entry_id' => (int) $entry->id,
            'failure_reason' => null,
            'source_resolution_status' => 'unresolved',
        ];
    }

    public function resolveForEvent(AccountingEventQueue $event): array
    {
        $event->loadMissing('restaurant');

        if ($event->source_type === FinancialInvoice::class) {
            $invoice = FinancialInvoice::query()
                ->with(['invoiceable', 'member:id,full_name,membership_no', 'corporateMember:id,full_name,membership_no', 'customer:id,name,customer_no'])
                ->find($event->source_id);

            if ($invoice) {
                return $this->resolveForFinancialInvoice($invoice, $event, $event->journalEntry);
            }
        }

        if ($event->source_type === FinancialReceipt::class) {
            $receipt = FinancialReceipt::query()->with('links.invoice')->find($event->source_id);
            if ($receipt) {
                return $this->resolveForFinancialReceipt($receipt, $event, $event->journalEntry);
            }
        }

        if ($event->source_type === VendorBill::class) {
            $bill = VendorBill::query()->with('tenant')->find($event->source_id);
            if ($bill) {
                return $this->resolveForVendorBill($bill, $event, $event->journalEntry);
            }
        }

        if ($event->source_type === VendorPayment::class) {
            $payment = VendorPayment::query()->with('tenant')->find($event->source_id);
            if ($payment) {
                return $this->resolveForVendorPayment($payment, $event, $event->journalEntry);
            }
        }

        if ($event->source_type === GoodsReceipt::class) {
            $receipt = GoodsReceipt::query()->with('tenant')->find($event->source_id);
            if ($receipt) {
                return $this->resolveForGoodsReceipt($receipt, $event, $event->journalEntry);
            }
        }

        return [
            'source_module' => 'finance',
            'source_label' => class_basename((string) $event->source_type),
            'source_type' => (string) $event->source_type,
            'source_id' => (int) $event->source_id,
            'document_no' => (string) (data_get($event->payload, 'invoice_no')
                ?? data_get($event->payload, 'receipt_no')
                ?? data_get($event->payload, 'bill_no')
                ?? data_get($event->payload, 'payment_no')
                ?? data_get($event->payload, 'grn_no')
                ?? ('Source #' . $event->source_id)),
            'document_url' => null,
            'restaurant_id' => $event->restaurant_id,
            'restaurant_name' => $event->restaurant?->name ?? $this->restaurantName($event->restaurant_id),
            'posting_status' => $event->status,
            'journal_entry_id' => $event->journal_entry_id,
            'failure_reason' => $event->error_message,
            'source_resolution_status' => 'unresolved',
        ];
    }

    public function moduleTypeLabel(?string $moduleType): string
    {
        $moduleType = (string) $moduleType;

        return match ($moduleType) {
            'membership_invoice' => 'Membership Invoice',
            'subscription_invoice' => 'Subscription Invoice',
            'pos_invoice' => 'POS Sale',
            'room_invoice' => 'Room Booking Invoice',
            'event_invoice' => 'Event Booking Invoice',
            'financial_invoice' => 'Finance Invoice',
            'financial_receipt' => 'Financial Receipt',
            'vendor_bill' => 'Vendor Bill',
            'vendor_payment' => 'Vendor Payment',
            'goods_receipt', 'purchase_receipt' => 'Goods Receipt',
            default => ucwords(str_replace('_', ' ', $moduleType ?: 'general')),
        };
    }

    public function moduleFromCode(?string $moduleType): string
    {
        return match ((string) $moduleType) {
            'membership_invoice' => 'membership',
            'subscription_invoice' => 'subscription',
            'pos_invoice' => 'pos',
            'room_invoice' => 'room',
            'event_invoice' => 'event',
            'vendor_bill', 'vendor_payment', 'goods_receipt', 'purchase_receipt' => 'procurement',
            default => 'finance',
        };
    }

    private function detectInvoiceModule(FinancialInvoice $invoice): string
    {
        $type = strtolower((string) ($invoice->invoice_type ?? ''));
        $feeType = strtolower((string) ($invoice->fee_type ?? ''));

        if (!empty($invoice->subscription_type_id) || !empty($invoice->subscription_category_id) || $type === 'subscription' || $feeType === 'subscription_fee') {
            return 'subscription';
        }
        if (in_array($type, ['membership', 'maintenance', 'reinstating'], true) || in_array($feeType, ['membership_fee', 'maintenance_fee', 'reinstating_fee'], true)) {
            return 'membership';
        }
        if (in_array($type, ['food_order', 'pos_sale'], true)) {
            return 'pos';
        }
        if ($type === 'room_booking') {
            return 'room';
        }
        if ($type === 'event_booking') {
            return 'event';
        }

        return 'finance';
    }

    private function moduleLabel(string $module): string
    {
        return match ($module) {
            'membership' => 'Membership Invoice',
            'subscription' => 'Subscription Invoice',
            'pos' => 'POS Sale',
            'room' => 'Room Booking Invoice',
            'event' => 'Event Booking Invoice',
            'procurement' => 'Procurement Document',
            default => 'Finance Document',
        };
    }

    private function resolveInvoiceRestaurantId(FinancialInvoice $invoice, ?AccountingEventQueue $event = null): ?int
    {
        return $event?->restaurant_id
            ?? data_get($invoice, 'data.restaurant_id')
            ?? data_get($invoice, 'invoiceable.restaurant_id')
            ?? data_get($invoice, 'invoiceable.tenant_id');
    }

    private function restaurantName(?int $restaurantId): ?string
    {
        if (!$restaurantId) {
            return null;
        }

        if (!array_key_exists($restaurantId, $this->restaurantNameCache)) {
            $this->restaurantNameCache[$restaurantId] = Tenant::query()->whereKey($restaurantId)->value('name');
        }

        return $this->restaurantNameCache[$restaurantId];
    }

    private function safeRoute(string $name, mixed $parameters = []): ?string
    {
        if (!Route::has($name)) {
            return null;
        }

        try {
            return route($name, $parameters);
        } catch (\Throwable $e) {
            return null;
        }
    }
}
