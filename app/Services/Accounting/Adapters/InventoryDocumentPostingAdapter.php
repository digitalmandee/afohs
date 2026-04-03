<?php

namespace App\Services\Accounting\Adapters;

use App\Models\AccountingEventQueue;
use App\Models\CashPurchase;
use App\Models\InventoryDocument;
use App\Models\InventoryTransaction;
use App\Models\JournalEntry;
use App\Models\PurchaseReturn;
use App\Services\Accounting\Contracts\PostingAdapter;
use App\Services\Accounting\PostingService;
use RuntimeException;

class InventoryDocumentPostingAdapter implements PostingAdapter
{
    public function __construct(
        private readonly PostingService $postingService
    ) {
    }

    public function supports(AccountingEventQueue $event): bool
    {
        return $event->source_type === InventoryDocument::class && $event->event_type === 'document_posted';
    }

    public function post(AccountingEventQueue $event): ?JournalEntry
    {
        $document = InventoryDocument::query()
            ->with(['lines.inventoryItem', 'lines.inventoryItem.inventoryAccount', 'lines.inventoryItem.cogsAccount', 'lines.inventoryItem.purchaseAccount'])
            ->find($event->source_id);

        if (!$document) {
            throw new RuntimeException('Inventory document not found for posting.');
        }

        $existing = JournalEntry::query()
            ->whereIn('module_type', ['inventory_document', $document->type])
            ->where('module_id', $document->id)
            ->first();
        if ($existing) {
            return $existing;
        }

        if ($document->lines->isEmpty()) {
            throw new RuntimeException('Inventory document has no lines to post.');
        }

        $lines = match ($document->type) {
            'cash_purchase' => $this->cashPurchaseLines($document),
            'purchase_return' => $this->purchaseReturnLines($document),
            'opening_balance' => $this->openingBalanceLines($document),
            'stock_adjustment' => $this->stockAdjustmentLines($document),
            default => throw new RuntimeException(
                "No accounting posting mapping exists for inventory document type '{$document->type}'. "
                . 'Disable accounting_enabled for this type or add adapter mapping.'
            ),
        };

        if (empty($lines)) {
            throw new RuntimeException('No accounting lines generated for inventory document.');
        }

        $entry = $this->postingService->post(
            $document->type,
            $document->id,
            optional($document->transaction_date)->toDateString() ?? now()->toDateString(),
            'Inventory Document ' . $document->document_no,
            $lines,
            $document->updated_by ?: $document->created_by,
            $document->tenant_id
        );

        $event->forceFill([
            'journal_entry_id' => $entry->id,
        ])->save();

        return $entry;
    }

    private function cashPurchaseLines(InventoryDocument $document): array
    {
        $cashPurchase = null;
        if ($document->source_document_type === CashPurchase::class && $document->source_document_id) {
            $cashPurchase = CashPurchase::query()->with('paymentAccount.coaAccount')->find($document->source_document_id);
        }

        $paymentAccountId = $cashPurchase?->paymentAccount?->coa_account_id;
        if (!$paymentAccountId) {
            throw new RuntimeException('Cash purchase posting requires a valid payment account mapped to COA.');
        }

        $entries = [];
        $total = 0.0;
        foreach ($document->lines as $line) {
            $amount = (float) $line->line_total;
            if ($amount <= 0) {
                continue;
            }

            $inventoryAccount = $line->inventoryItem?->inventory_account_id;
            if (!$inventoryAccount) {
                throw new RuntimeException("Missing inventory account mapping on item '{$line->inventoryItem?->name}'.");
            }

            $entries[] = [
                'account_id' => $inventoryAccount,
                'debit' => $amount,
                'credit' => 0,
                'product_id' => $line->inventoryItem?->legacy_product_id,
                'warehouse_id' => $document->destination_warehouse_id ?: $document->source_warehouse_id,
                'warehouse_location_id' => $document->destination_warehouse_location_id ?: $document->source_warehouse_location_id,
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
            ];
            $total += $amount;
        }

        $entries[] = [
            'account_id' => $paymentAccountId,
            'debit' => 0,
            'credit' => $total,
            'reference_type' => InventoryDocument::class,
            'reference_id' => $document->id,
        ];

        return $entries;
    }

    private function purchaseReturnLines(InventoryDocument $document): array
    {
        $return = null;
        if ($document->source_document_type === PurchaseReturn::class && $document->source_document_id) {
            $return = PurchaseReturn::query()->with('vendor')->find($document->source_document_id);
        }

        $payableAccountId = $return?->vendor?->payable_account_id;
        if (!$payableAccountId) {
            throw new RuntimeException('Purchase return posting requires vendor payable account mapping.');
        }

        $entries = [];
        $total = 0.0;
        foreach ($document->lines as $line) {
            $amount = (float) $line->line_total;
            if ($amount <= 0) {
                continue;
            }

            $inventoryAccount = $line->inventoryItem?->inventory_account_id;
            if (!$inventoryAccount) {
                throw new RuntimeException("Missing inventory account mapping on item '{$line->inventoryItem?->name}'.");
            }

            $entries[] = [
                'account_id' => $inventoryAccount,
                'debit' => 0,
                'credit' => $amount,
                'vendor_id' => $return?->vendor_id,
                'product_id' => $line->inventoryItem?->legacy_product_id,
                'warehouse_id' => $document->source_warehouse_id ?: $document->destination_warehouse_id,
                'warehouse_location_id' => $document->source_warehouse_location_id ?: $document->destination_warehouse_location_id,
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
            ];
            $total += $amount;
        }

        $entries[] = [
            'account_id' => $payableAccountId,
            'debit' => $total,
            'credit' => 0,
            'vendor_id' => $return?->vendor_id,
            'reference_type' => InventoryDocument::class,
            'reference_id' => $document->id,
        ];

        return $entries;
    }

    private function openingBalanceLines(InventoryDocument $document): array
    {
        $entries = [];
        $total = 0.0;
        $lines = $document->lines;
        if ($lines->isEmpty()) {
            $fallback = InventoryTransaction::query()
                ->where('reference_type', InventoryDocument::class)
                ->where('reference_id', $document->id)
                ->where('type', 'adjustment_in')
                ->with('inventoryItem')
                ->get();

            $lines = $fallback->map(function (InventoryTransaction $transaction) use ($document) {
                return (object) [
                    'line_total' => (float) $transaction->total_cost,
                    'inventoryItem' => $transaction->inventoryItem,
                ];
            });
        }

        foreach ($lines as $line) {
            $amount = (float) $line->line_total;
            if ($amount <= 0) {
                continue;
            }

            $inventoryAccount = $line->inventoryItem?->inventory_account_id;
            $offsetAccount = $line->inventoryItem?->purchase_account_id;
            if (!$inventoryAccount || !$offsetAccount) {
                throw new RuntimeException("Opening balance requires inventory and purchase account mappings for item '{$line->inventoryItem?->name}'.");
            }

            $entries[] = [
                'account_id' => $inventoryAccount,
                'debit' => $amount,
                'credit' => 0,
                'product_id' => $line->inventoryItem?->legacy_product_id,
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
            ];
            $entries[] = [
                'account_id' => $offsetAccount,
                'debit' => 0,
                'credit' => $amount,
                'product_id' => $line->inventoryItem?->legacy_product_id,
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
            ];
            $total += $amount;
        }

        if ($total <= 0) {
            throw new RuntimeException('Opening balance posting amount must be greater than zero.');
        }

        return $entries;
    }

    private function stockAdjustmentLines(InventoryDocument $document): array
    {
        $entries = [];
        foreach ($document->lines as $line) {
            $amount = (float) $line->line_total;
            if ($amount <= 0) {
                continue;
            }

            $inventoryAccount = $line->inventoryItem?->inventory_account_id;
            $expenseAccount = $line->inventoryItem?->cogs_account_id ?: $line->inventoryItem?->purchase_account_id;
            if (!$inventoryAccount || !$expenseAccount) {
                throw new RuntimeException("Stock adjustment requires inventory and COGS/purchase account mappings for item '{$line->inventoryItem?->name}'.");
            }

            $isOut = (bool) $document->source_warehouse_id;
            $entries[] = [
                'account_id' => $isOut ? $expenseAccount : $inventoryAccount,
                'debit' => $amount,
                'credit' => 0,
                'product_id' => $line->inventoryItem?->legacy_product_id,
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
            ];
            $entries[] = [
                'account_id' => $isOut ? $inventoryAccount : $expenseAccount,
                'debit' => 0,
                'credit' => $amount,
                'product_id' => $line->inventoryItem?->legacy_product_id,
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
            ];
        }

        return $entries;
    }
}
