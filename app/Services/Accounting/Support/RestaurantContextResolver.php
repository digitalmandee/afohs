<?php

namespace App\Services\Accounting\Support;

use App\Models\FinancialInvoice;
use App\Models\FinancialReceipt;
use App\Models\GoodsReceipt;
use App\Models\VendorBill;
use App\Models\VendorPayment;

class RestaurantContextResolver
{
    public function forInvoice(FinancialInvoice $invoice): ?int
    {
        return $this->normalize(
            data_get($invoice, 'data.restaurant_id')
            ?? data_get($invoice, 'data.tenant_id')
            ?? data_get($invoice, 'invoiceable.tenant_id')
            ?? data_get($invoice, 'invoiceable.restaurant_id')
            ?? $invoice->tenant_id
            ?? null
        );
    }

    public function forReceipt(FinancialReceipt $receipt): ?int
    {
        $linkedInvoiceRestaurant = $receipt->links
            ->pluck('invoice')
            ->filter()
            ->map(fn ($invoice) => $this->forInvoice($invoice))
            ->first(fn ($value) => !empty($value));

        return $this->normalize(
            $linkedInvoiceRestaurant
            ?? $receipt->paymentAccount?->tenant_id
            ?? data_get($receipt, 'payer.tenant_id')
            ?? data_get($receipt, 'payer.restaurant_id')
            ?? null
        );
    }

    public function forVendorBill(VendorBill $bill): ?int
    {
        return $this->normalize(
            $bill->tenant_id
            ?? $bill->goodsReceipt?->tenant_id
            ?? $bill->goodsReceipt?->purchaseOrder?->tenant_id
            ?? $bill->vendor?->tenant_id
            ?? null
        );
    }

    public function forVendorPayment(VendorPayment $payment): ?int
    {
        return $this->normalize(
            $payment->tenant_id
            ?? $payment->vendor?->tenant_id
            ?? $payment->paymentAccount?->tenant_id
            ?? null
        );
    }

    public function forGoodsReceipt(GoodsReceipt $receipt): ?int
    {
        return $this->normalize(
            $receipt->tenant_id
            ?? $receipt->purchaseOrder?->tenant_id
            ?? $receipt->warehouse?->tenant_id
            ?? null
        );
    }

    private function normalize($value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        return (int) $value;
    }
}
