<?php

namespace App\Services\Accounting\Support;

use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\FinancialReceipt;
use RuntimeException;

class FinancePostingClassifier
{
    public function classifyInvoice(FinancialInvoice $invoice): string
    {
        $family = $this->detectInvoiceFamily($invoice);

        return match ($family) {
            'subscription' => 'subscription_invoice',
            'membership' => 'membership_invoice',
            'maintenance' => 'maintenance_invoice',
            'pos' => 'pos_invoice',
            'room' => 'room_invoice',
            'event' => 'event_invoice',
            default => throw new RuntimeException("Unable to classify financial invoice #{$invoice->id} for accounting posting."),
        };
    }

    public function classifyReceipt(FinancialReceipt $receipt): string
    {
        $receipt->loadMissing(['links.invoice.items']);

        $families = $receipt->links
            ->pluck('invoice')
            ->filter()
            ->map(fn (FinancialInvoice $invoice) => $this->detectInvoiceFamily($invoice))
            ->filter()
            ->unique()
            ->values();

        if ($families->isEmpty()) {
            throw new RuntimeException("Unable to classify financial receipt #{$receipt->id} for accounting posting.");
        }

        if ($families->count() > 1) {
            throw new RuntimeException("Financial receipt #{$receipt->id} references multiple accounting families and cannot be auto-posted safely.");
        }

        return match ($families->first()) {
            'subscription' => 'subscription_receipt',
            'membership' => 'membership_receipt',
            'maintenance' => 'maintenance_receipt',
            'pos' => 'pos_receipt',
            'room' => 'room_receipt',
            'event' => 'event_receipt',
            default => throw new RuntimeException("Unable to classify financial receipt #{$receipt->id} for accounting posting."),
        };
    }

    public function detectInvoiceFamily(FinancialInvoice $invoice): ?string
    {
        $invoice->loadMissing('items');

        $itemFamilies = $invoice->items
            ->map(fn (FinancialInvoiceItem $item) => $this->familyFromFeeType(
                $item->fee_type,
                !empty($item->subscription_type_id) || !empty($item->subscription_category_id)
            ))
            ->filter()
            ->unique()
            ->values();

        if ($itemFamilies->count() > 1) {
            throw new RuntimeException("Financial invoice #{$invoice->id} contains multiple accounting families and cannot be auto-posted safely.");
        }

        if ($itemFamilies->count() === 1) {
            return $itemFamilies->first();
        }

        $family = $this->familyFromFeeType(
            $invoice->fee_type,
            !empty($invoice->subscription_type_id) || !empty($invoice->subscription_category_id)
        );

        if ($family) {
            return $family;
        }

        $type = strtolower(trim((string) ($invoice->invoice_type ?? '')));

        return match ($type) {
            'subscription' => 'subscription',
            'membership' => 'membership',
            'maintenance' => 'maintenance',
            'food_order', 'pos_sale' => 'pos',
            'room_booking' => 'room',
            'event_booking' => 'event',
            default => null,
        };
    }

    private function familyFromFeeType(string|int|null $feeType, bool $hasSubscriptionLink = false): ?string
    {
        $normalized = strtolower(trim((string) $feeType));

        if ($hasSubscriptionLink || in_array($normalized, ['5', 'subscription_fee'], true)) {
            return 'subscription';
        }

        return match ($normalized) {
            '1', 'membership_fee', 'reinstating_fee' => 'membership',
            '4', 'maintenance_fee' => 'maintenance',
            default => null,
        };
    }
}
