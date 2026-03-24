<?php

namespace App\Services\Inventory;

use App\Models\InventoryDocument;
use App\Models\InventoryItem;
use App\Models\InventoryTransaction;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryMovementService
{
    public function record(array $attributes): InventoryTransaction
    {
        $transaction = InventoryTransaction::create([
            'product_id' => $attributes['product_id'] ?? null,
            'inventory_item_id' => $attributes['inventory_item_id'],
            'tenant_id' => $attributes['tenant_id'] ?? null,
            'warehouse_id' => $attributes['warehouse_id'],
            'warehouse_location_id' => $attributes['warehouse_location_id'] ?? null,
            'transaction_date' => $attributes['transaction_date'],
            'type' => $attributes['type'],
            'qty_in' => $attributes['qty_in'] ?? 0,
            'qty_out' => $attributes['qty_out'] ?? 0,
            'unit_cost' => $attributes['unit_cost'] ?? 0,
            'total_cost' => $attributes['total_cost'] ?? 0,
            'reference_type' => $attributes['reference_type'] ?? null,
            'reference_id' => $attributes['reference_id'] ?? null,
            'reason' => $attributes['reason'] ?? null,
            'status' => $attributes['status'] ?? 'posted',
            'created_by' => $attributes['created_by'] ?? null,
        ]);

        $delta = (float) ($transaction->qty_in ?? 0) - (float) ($transaction->qty_out ?? 0);
        if (abs($delta) > 0.0001) {
            InventoryItem::query()->whereKey($transaction->inventory_item_id)->increment('current_stock', $delta);
        }

        return $transaction;
    }

    public function availableQuantity(int $inventoryItemId, int $warehouseId, ?int $locationId = null): float
    {
        return (float) InventoryTransaction::query()
            ->where('inventory_item_id', $inventoryItemId)
            ->where('warehouse_id', $warehouseId)
            ->when($locationId, fn ($query) => $query->where('warehouse_location_id', $locationId))
            ->selectRaw('COALESCE(SUM(qty_in - qty_out), 0) as balance')
            ->value('balance');
    }

    public function createOpeningBalance(array $payload): InventoryDocument
    {
        return DB::transaction(function () use ($payload) {
            $document = $this->createDocument([
                'tenant_id' => $payload['tenant_id'] ?? null,
                'type' => 'opening_balance',
                'destination_warehouse_id' => $payload['warehouse_id'],
                'destination_warehouse_location_id' => $payload['warehouse_location_id'] ?? null,
                'transaction_date' => $payload['transaction_date'],
                'status' => 'posted',
                'remarks' => $payload['remarks'] ?? 'Opening balance',
                'created_by' => $payload['created_by'] ?? null,
            ]);

            $this->record([
                'product_id' => $payload['product_id'] ?? null,
                'inventory_item_id' => $payload['inventory_item_id'],
                'tenant_id' => $payload['tenant_id'] ?? null,
                'warehouse_id' => $payload['warehouse_id'],
                'warehouse_location_id' => $payload['warehouse_location_id'] ?? null,
                'transaction_date' => $payload['transaction_date'],
                'type' => 'adjustment_in',
                'qty_in' => $payload['quantity'],
                'qty_out' => 0,
                'unit_cost' => $payload['unit_cost'],
                'total_cost' => (float) $payload['quantity'] * (float) $payload['unit_cost'],
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
                'reason' => $payload['remarks'] ?? 'Opening balance',
                'status' => 'posted',
                'created_by' => $payload['created_by'] ?? null,
            ]);

            return $document;
        });
    }

    public function createAdjustment(array $payload): InventoryDocument
    {
        return DB::transaction(function () use ($payload) {
            $direction = $payload['direction'];
            $quantity = (float) $payload['quantity'];

            if ($direction === 'out') {
                $available = $this->availableQuantity(
                    (int) $payload['inventory_item_id'],
                    (int) $payload['warehouse_id'],
                    $payload['warehouse_location_id'] ?? null,
                );

                if ($available + 0.0001 < $quantity) {
                    throw new InvalidArgumentException('Adjustment quantity exceeds available stock for the selected warehouse/location.');
                }
            }

            $document = $this->createDocument([
                'tenant_id' => $payload['tenant_id'] ?? null,
                'type' => 'adjustment',
                'source_warehouse_id' => $payload['warehouse_id'],
                'source_warehouse_location_id' => $payload['warehouse_location_id'] ?? null,
                'destination_warehouse_id' => $direction === 'in' ? $payload['warehouse_id'] : null,
                'destination_warehouse_location_id' => $direction === 'in' ? ($payload['warehouse_location_id'] ?? null) : null,
                'transaction_date' => $payload['transaction_date'],
                'status' => 'posted',
                'remarks' => $payload['remarks'] ?? 'Stock adjustment',
                'created_by' => $payload['created_by'] ?? null,
            ]);

            $this->record([
                'product_id' => $payload['product_id'] ?? null,
                'inventory_item_id' => $payload['inventory_item_id'],
                'tenant_id' => $payload['tenant_id'] ?? null,
                'warehouse_id' => $payload['warehouse_id'],
                'warehouse_location_id' => $payload['warehouse_location_id'] ?? null,
                'transaction_date' => $payload['transaction_date'],
                'type' => $direction === 'in' ? 'adjustment_in' : 'adjustment_out',
                'qty_in' => $direction === 'in' ? $quantity : 0,
                'qty_out' => $direction === 'out' ? $quantity : 0,
                'unit_cost' => $payload['unit_cost'] ?? 0,
                'total_cost' => $quantity * (float) ($payload['unit_cost'] ?? 0),
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
                'reason' => $payload['remarks'] ?? 'Stock adjustment',
                'status' => 'posted',
                'created_by' => $payload['created_by'] ?? null,
            ]);

            return $document;
        });
    }

    public function createIssue(array $payload): InventoryDocument
    {
        return $this->createAdjustment([
            ...$payload,
            'direction' => 'out',
            'remarks' => $payload['remarks'] ?? 'Manual stock issue',
        ]);
    }

    public function createTransfer(array $payload): InventoryDocument
    {
        return DB::transaction(function () use ($payload) {
            $quantity = (float) $payload['quantity'];

            $available = $this->availableQuantity(
                (int) $payload['inventory_item_id'],
                (int) $payload['source_warehouse_id'],
                $payload['source_warehouse_location_id'] ?? null,
            );

            if ($available + 0.0001 < $quantity) {
                throw new InvalidArgumentException('Transfer quantity exceeds available stock for the selected source warehouse/location.');
            }

            $document = $this->createDocument([
                'tenant_id' => $payload['tenant_id'] ?? null,
                'type' => 'transfer',
                'source_warehouse_id' => $payload['source_warehouse_id'],
                'source_warehouse_location_id' => $payload['source_warehouse_location_id'] ?? null,
                'destination_warehouse_id' => $payload['destination_warehouse_id'],
                'destination_warehouse_location_id' => $payload['destination_warehouse_location_id'] ?? null,
                'transaction_date' => $payload['transaction_date'],
                'status' => 'posted',
                'remarks' => $payload['remarks'] ?? 'Stock transfer',
                'created_by' => $payload['created_by'] ?? null,
            ]);

            $base = [
                'product_id' => $payload['product_id'] ?? null,
                'inventory_item_id' => $payload['inventory_item_id'],
                'tenant_id' => $payload['tenant_id'] ?? null,
                'transaction_date' => $payload['transaction_date'],
                'unit_cost' => $payload['unit_cost'] ?? 0,
                'total_cost' => $quantity * (float) ($payload['unit_cost'] ?? 0),
                'reference_type' => InventoryDocument::class,
                'reference_id' => $document->id,
                'reason' => $payload['remarks'] ?? 'Stock transfer',
                'status' => 'posted',
                'created_by' => $payload['created_by'] ?? null,
            ];

            $this->record([
                ...$base,
                'warehouse_id' => $payload['source_warehouse_id'],
                'warehouse_location_id' => $payload['source_warehouse_location_id'] ?? null,
                'type' => 'transfer_out',
                'qty_in' => 0,
                'qty_out' => $quantity,
            ]);

            $this->record([
                ...$base,
                'warehouse_id' => $payload['destination_warehouse_id'],
                'warehouse_location_id' => $payload['destination_warehouse_location_id'] ?? null,
                'type' => 'transfer_in',
                'qty_in' => $quantity,
                'qty_out' => 0,
            ]);

            return $document;
        });
    }

    protected function createDocument(array $attributes): InventoryDocument
    {
        return InventoryDocument::create([
            ...$attributes,
            'document_no' => $this->generateDocumentNo($attributes['type']),
            'updated_by' => $attributes['created_by'] ?? null,
        ]);
    }

    protected function generateDocumentNo(string $type): string
    {
        $prefix = match ($type) {
            'opening_balance' => 'OB',
            'transfer' => 'TRF',
            'adjustment' => 'ADJ',
            default => 'INV',
        };

        return sprintf('%s-%s-%04d', $prefix, now()->format('Ymd'), random_int(1, 9999));
    }
}
