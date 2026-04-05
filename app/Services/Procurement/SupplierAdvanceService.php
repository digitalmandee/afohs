<?php

namespace App\Services\Procurement;

use App\Models\SupplierAdvance;
use App\Models\SupplierAdvanceApplication;
use App\Models\VendorBill;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SupplierAdvanceService
{
    public function applyToBill(
        SupplierAdvance $advance,
        VendorBill $bill,
        float $amount,
        ?int $userId = null,
        bool $overridePoLock = false,
        ?string $overrideReason = null
    ): SupplierAdvanceApplication
    {
        return DB::transaction(function () use ($advance, $bill, $amount, $userId, $overridePoLock, $overrideReason) {
            $advance->refresh();
            $bill->loadMissing('goodsReceipt:id,purchase_order_id');
            $bill->refresh();
            $bill->loadMissing('goodsReceipt:id,purchase_order_id');

            if (!in_array($advance->status, ['posted', 'partially_applied'], true)) {
                throw ValidationException::withMessages([
                    'supplier_advance_id' => 'Only posted supplier advances can be applied to a bill.',
                ]);
            }

            if ((int) $advance->vendor_id !== (int) $bill->vendor_id) {
                throw ValidationException::withMessages([
                    'supplier_advance_id' => 'Supplier advance vendor must match bill vendor.',
                ]);
            }

            $sourcePurchaseOrderId = (int) ($advance->purchase_order_id ?? 0);
            $targetPurchaseOrderId = (int) ($bill->goodsReceipt?->purchase_order_id ?? 0);

            $poLockedMismatch = $sourcePurchaseOrderId > 0 && $sourcePurchaseOrderId !== $targetPurchaseOrderId;
            if ($poLockedMismatch && !$overridePoLock) {
                throw ValidationException::withMessages([
                    'vendor_bill_id' => 'Advance is PO-locked. Bill must belong to the same PO chain.',
                ]);
            }

            if ($poLockedMismatch && $overridePoLock && blank($overrideReason)) {
                throw ValidationException::withMessages([
                    'override_reason' => 'Override reason is required when bypassing PO lock.',
                ]);
            }

            $availableAdvance = max(0, (float) $advance->amount - (float) $advance->applied_amount);
            $billOutstanding = max(0, (float) $bill->grand_total - (float) $bill->paid_amount - (float) $bill->advance_applied_amount - (float) $bill->return_applied_amount);

            if ($amount <= 0.0 || $amount > $availableAdvance + 0.0001 || $amount > $billOutstanding + 0.0001) {
                throw ValidationException::withMessages([
                    'amount' => 'Advance application amount exceeds available advance or bill outstanding.',
                ]);
            }

            $application = SupplierAdvanceApplication::query()
                ->firstOrNew([
                    'supplier_advance_id' => $advance->id,
                    'vendor_bill_id' => $bill->id,
                ]);
            $application->amount = (float) ($application->amount ?? 0) + $amount;
            $application->source_purchase_order_id = $sourcePurchaseOrderId > 0 ? $sourcePurchaseOrderId : null;
            $application->target_purchase_order_id = $targetPurchaseOrderId > 0 ? $targetPurchaseOrderId : null;
            $application->override_po_lock = $poLockedMismatch && $overridePoLock;
            $application->override_reason = $poLockedMismatch && $overridePoLock ? trim((string) $overrideReason) : null;
            $application->overridden_by = $poLockedMismatch && $overridePoLock ? $userId : null;
            $application->overridden_at = $poLockedMismatch && $overridePoLock ? now() : null;
            $application->created_by = $userId;
            $application->save();

            $advance->applied_amount = (float) $advance->applied_amount + $amount;
            $advance->status = $advance->applied_amount + 0.0001 >= (float) $advance->amount ? 'applied' : 'partially_applied';
            $advance->save();

            $bill->advance_applied_amount = (float) $bill->advance_applied_amount + $amount;
            $billOutstandingAfter = max(0, (float) $bill->grand_total - (float) $bill->paid_amount - (float) $bill->advance_applied_amount - (float) $bill->return_applied_amount);
            if ($billOutstandingAfter <= 0.0001) {
                $bill->status = 'paid';
            } elseif ($bill->status === 'posted') {
                $bill->status = 'partially_paid';
            }
            $bill->save();

            return $application->refresh();
        });
    }
}
