<?php

namespace App\Services\Inventory;

use App\Models\InventoryDocument;
use App\Models\InventoryDocumentTypeConfig;
use App\Models\InventoryDocumentLine;
use App\Models\InventoryIssueAllocation;
use App\Models\InventoryItem;
use App\Models\InventoryBatch;
use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class InventoryMovementService
{
    public function record(array $attributes): InventoryTransaction
    {
        return DB::transaction(function () use ($attributes) {
            $inventoryItemId = $attributes['inventory_item_id'] ?? null;
            $productId = $attributes['product_id'] ?? null;
            if (!$productId && $inventoryItemId) {
                $productId = $this->resolveLedgerProductId((int) $inventoryItemId);
            }

            $warehouseId = (int) $attributes['warehouse_id'];
            $locationId = isset($attributes['warehouse_location_id']) ? (int) $attributes['warehouse_location_id'] : null;
            $qtyIn = (float) ($attributes['qty_in'] ?? 0);
            $qtyOut = (float) ($attributes['qty_out'] ?? 0);
            $unitCost = (float) ($attributes['unit_cost'] ?? 0);
            $totalCost = (float) ($attributes['total_cost'] ?? 0);
            $transactionDate = (string) $attributes['transaction_date'];

            $fifoMeta = null;
            if ($inventoryItemId && $qtyOut > 0.0001) {
                $fifoMeta = $this->allocateOutflowBatches(
                    (int) $inventoryItemId,
                    $warehouseId,
                    $locationId,
                    $qtyOut,
                    $transactionDate,
                    (bool) ($attributes['enforce_expiry'] ?? true)
                );
                $unitCost = $fifoMeta['effective_unit_cost'];
                $totalCost = $fifoMeta['effective_total_cost'];
            }

            $transaction = InventoryTransaction::create([
                'product_id' => $productId,
                'inventory_item_id' => $inventoryItemId,
                'tenant_id' => $attributes['tenant_id'] ?? null,
                'warehouse_id' => $warehouseId,
                'warehouse_location_id' => $locationId,
                'transaction_date' => $transactionDate,
                'type' => $attributes['type'],
                'qty_in' => $qtyIn,
                'qty_out' => $qtyOut,
                'unit_cost' => $unitCost,
                'total_cost' => $totalCost,
                'reference_type' => $attributes['reference_type'] ?? null,
                'reference_id' => $attributes['reference_id'] ?? null,
                'reason' => $attributes['reason'] ?? null,
                'status' => $attributes['status'] ?? 'posted',
                'created_by' => $attributes['created_by'] ?? null,
            ]);

            if ($inventoryItemId && $qtyIn > 0.0001) {
                $this->createInflowBatch(
                    inventoryItemId: (int) $inventoryItemId,
                    tenantId: $attributes['tenant_id'] ?? null,
                    warehouseId: $warehouseId,
                    locationId: $locationId,
                    transactionDate: $transactionDate,
                    quantity: $qtyIn,
                    unitCost: $unitCost,
                    referenceType: $attributes['reference_type'] ?? null,
                    referenceId: $attributes['reference_id'] ?? null,
                    explicitBatchNo: $attributes['batch_no'] ?? null,
                    expiryDate: $attributes['expiry_date'] ?? null,
                );
            }

            if ($fifoMeta && !empty($fifoMeta['allocations'])) {
                foreach ($fifoMeta['allocations'] as $allocation) {
                    InventoryIssueAllocation::query()->create([
                        'inventory_transaction_id' => $transaction->id,
                        'inventory_batch_id' => $allocation['batch_id'],
                        'quantity' => $allocation['quantity'],
                        'unit_cost' => $allocation['unit_cost'],
                        'total_cost' => $allocation['total_cost'],
                    ]);
                }
            }

            $delta = (float) ($transaction->qty_in ?? 0) - (float) ($transaction->qty_out ?? 0);
            if (abs($delta) > 0.0001) {
                if ($inventoryItemId) {
                    InventoryItem::query()->whereKey($inventoryItemId)->increment('current_stock', $delta);
                }

                if ($productId) {
                    Product::query()->whereKey($productId)->increment('current_stock', $delta);
                }
            }

            return $transaction;
        });
    }

    protected function resolveLedgerProductId(int $inventoryItemId): ?int
    {
        $inventoryItem = InventoryItem::query()->find($inventoryItemId);
        if (!$inventoryItem) {
            return null;
        }

        if ($inventoryItem->legacy_product_id) {
            return (int) $inventoryItem->legacy_product_id;
        }

        $bridgeCode = sprintf('INV-BRIDGE-%d', $inventoryItem->id);
        $bridgeProduct = Product::withTrashed()->where('menu_code', $bridgeCode)->first();

        if (!$bridgeProduct) {
            $bridgeProduct = Product::create([
                'name' => $inventoryItem->name . ' [Inventory Bridge]',
                'menu_code' => $bridgeCode,
                'description' => 'Internal compatibility bridge for inventory item ledger posting.',
                'category_id' => null,
                'manufacturer_id' => null,
                'base_price' => (float) ($inventoryItem->default_unit_cost ?? 0),
                'cost_of_goods_sold' => (float) ($inventoryItem->default_unit_cost ?? 0),
                'current_stock' => (int) round((float) ($inventoryItem->current_stock ?? 0)),
                'manage_stock' => false,
                'minimal_stock' => 0,
                'notify_when_out_of_stock' => false,
                'available_order_types' => [],
                'is_salable' => false,
                'is_purchasable' => false,
                'is_returnable' => false,
                'is_taxable' => false,
                'item_type' => 'raw_material',
                'unit_id' => $inventoryItem->unit_id,
                'status' => 'inactive',
                'tenant_id' => $inventoryItem->tenant_id,
                'created_by' => $inventoryItem->created_by,
                'updated_by' => $inventoryItem->updated_by,
            ]);
        } elseif (method_exists($bridgeProduct, 'trashed') && $bridgeProduct->trashed()) {
            $bridgeProduct->restore();
        }

        $inventoryItem->forceFill([
            'legacy_product_id' => $bridgeProduct->id,
        ])->save();

        return (int) $bridgeProduct->id;
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
                'approval_status' => 'approved',
                'remarks' => $payload['remarks'] ?? 'Opening balance',
                'posting_key' => 'opening-balance:' . now()->format('YmdHis') . ':' . ($payload['inventory_item_id'] ?? 'na'),
                'approved_at' => now(),
                'approved_by' => $payload['created_by'] ?? null,
                'posted_at' => now(),
                'created_by' => $payload['created_by'] ?? null,
            ]);

            $lineTotal = (float) $payload['quantity'] * (float) $payload['unit_cost'];
            InventoryDocumentLine::query()->create([
                'inventory_document_id' => $document->id,
                'inventory_item_id' => $payload['inventory_item_id'],
                'quantity' => $payload['quantity'],
                'unit_cost' => $payload['unit_cost'],
                'line_total' => $lineTotal,
            ]);

            $document->update([
                'posting_key' => "opening-balance:{$document->id}",
            ]);

            $this->record([
                'product_id' => $payload['product_id'] ?? null,
                'inventory_item_id' => $payload['inventory_item_id'] ?? null,
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

            app(InventoryDocumentWorkflowService::class)->maybeQueueAccountingEvent($document->fresh());

            return $document;
        });
    }

    public function createAdjustment(array $payload): InventoryDocument
    {
        return DB::transaction(function () use ($payload) {
            $direction = $payload['direction'];
            $quantity = (float) $payload['quantity'];

            if ($direction === 'out') {
                $available = $this->resolveAvailableQuantity(
                    $payload['inventory_item_id'] ?? null,
                    $payload['product_id'] ?? null,
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
                'inventory_item_id' => $payload['inventory_item_id'] ?? null,
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

            $available = $this->resolveAvailableQuantity(
                $payload['inventory_item_id'] ?? null,
                $payload['product_id'] ?? null,
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
                'inventory_item_id' => $payload['inventory_item_id'] ?? null,
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
        $code = match ($type) {
            'transfer' => 'warehouse_transfer',
            'adjustment' => 'stock_adjustment',
            default => $type,
        };

        $config = InventoryDocumentTypeConfig::query()
            ->where('code', $code)
            ->where('is_active', true)
            ->first();

        $prefix = $config?->prefix ?: match ($type) {
            'opening_balance' => 'OB',
            'transfer' => 'TRF',
            'adjustment' => 'ADJ',
            default => 'INV',
        };

        return sprintf('%s-%s-%04d', $prefix, now()->format('Ymd'), random_int(1, 9999));
    }

    protected function resolveAvailableQuantity(?int $inventoryItemId, ?int $productId, int $warehouseId, ?int $locationId = null): float
    {
        $query = InventoryTransaction::query()
            ->where('warehouse_id', $warehouseId)
            ->when($locationId, fn ($builder) => $builder->where('warehouse_location_id', $locationId));

        if ($inventoryItemId) {
            $query->where('inventory_item_id', $inventoryItemId);
        } elseif ($productId) {
            $query->where('product_id', $productId);
        } else {
            return 0.0;
        }

        return (float) $query
            ->selectRaw('COALESCE(SUM(qty_in - qty_out), 0) as balance')
            ->value('balance');
    }

    private function createInflowBatch(
        int $inventoryItemId,
        ?int $tenantId,
        int $warehouseId,
        ?int $locationId,
        string $transactionDate,
        float $quantity,
        float $unitCost,
        ?string $referenceType = null,
        ?int $referenceId = null,
        ?string $explicitBatchNo = null,
        ?string $expiryDate = null
    ): void {
        if ($quantity <= 0) {
            return;
        }

        $batchNo = $explicitBatchNo ?: sprintf(
            'B-%s-%d-%d',
            now()->format('YmdHis'),
            $inventoryItemId,
            random_int(100, 999)
        );

        InventoryBatch::query()->create([
            'inventory_item_id' => $inventoryItemId,
            'tenant_id' => $tenantId,
            'warehouse_id' => $warehouseId,
            'warehouse_location_id' => $locationId,
            'batch_no' => $batchNo,
            'received_date' => $transactionDate,
            'expiry_date' => $expiryDate,
            'unit_cost' => $unitCost,
            'original_qty' => $quantity,
            'remaining_qty' => $quantity,
            'status' => 'open',
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
        ]);
    }

    private function allocateOutflowBatches(
        int $inventoryItemId,
        int $warehouseId,
        ?int $locationId,
        float $requiredQty,
        string $transactionDate,
        bool $enforceExpiry
    ): array {
        $item = InventoryItem::query()->find($inventoryItemId);
        if (!$item) {
            throw new InvalidArgumentException('Inventory item not found for FIFO allocation.');
        }

        $available = $this->availableQuantity($inventoryItemId, $warehouseId, $locationId);
        if ($available + 0.0001 < $requiredQty) {
            throw new InvalidArgumentException('Issue quantity exceeds available stock for the selected warehouse/location.');
        }

        $this->backfillLegacyBatchGap($item, $warehouseId, $locationId, $transactionDate);

        $query = InventoryBatch::query()
            ->where('inventory_item_id', $inventoryItemId)
            ->where('warehouse_id', $warehouseId)
            ->when($locationId, fn ($builder) => $builder->where('warehouse_location_id', $locationId))
            ->where('remaining_qty', '>', 0.0001)
            ->orderBy('received_date')
            ->orderBy('id');

        if ($enforceExpiry && $item->is_expiry_tracked) {
            $query->where(function ($builder) use ($transactionDate) {
                $builder->whereNull('expiry_date')
                    ->orWhereDate('expiry_date', '>=', $transactionDate);
            });
        }

        $batches = $query->lockForUpdate()->get();
        $remaining = $requiredQty;
        $allocations = [];
        $totalCost = 0.0;

        foreach ($batches as $batch) {
            if ($remaining <= 0.0001) {
                break;
            }

            $consumeQty = min($remaining, (float) $batch->remaining_qty);
            if ($consumeQty <= 0.0001) {
                continue;
            }

            $lineCost = $consumeQty * (float) $batch->unit_cost;
            $allocations[] = [
                'batch_id' => (int) $batch->id,
                'quantity' => $consumeQty,
                'unit_cost' => (float) $batch->unit_cost,
                'total_cost' => $lineCost,
            ];

            $batch->remaining_qty = (float) $batch->remaining_qty - $consumeQty;
            $batch->status = $batch->remaining_qty > 0.0001 ? 'open' : 'closed';
            $batch->save();

            $totalCost += $lineCost;
            $remaining -= $consumeQty;
        }

        if ($remaining > 0.0001) {
            throw new InvalidArgumentException('Insufficient FIFO batches available to allocate this stock outflow.');
        }

        return [
            'allocations' => $allocations,
            'effective_total_cost' => $totalCost,
            'effective_unit_cost' => $requiredQty > 0 ? ($totalCost / $requiredQty) : 0,
        ];
    }

    private function backfillLegacyBatchGap(
        InventoryItem $item,
        int $warehouseId,
        ?int $locationId,
        string $transactionDate
    ): void {
        $stockOnHand = $this->availableQuantity($item->id, $warehouseId, $locationId);
        if ($stockOnHand <= 0.0001) {
            return;
        }

        $batchQty = (float) InventoryBatch::query()
            ->where('inventory_item_id', $item->id)
            ->where('warehouse_id', $warehouseId)
            ->when($locationId, fn ($builder) => $builder->where('warehouse_location_id', $locationId))
            ->selectRaw('COALESCE(SUM(remaining_qty), 0) as qty')
            ->value('qty');

        $gap = $stockOnHand - $batchQty;
        if ($gap <= 0.0001) {
            return;
        }

        InventoryBatch::query()->create([
            'inventory_item_id' => $item->id,
            'tenant_id' => $item->tenant_id,
            'warehouse_id' => $warehouseId,
            'warehouse_location_id' => $locationId,
            'batch_no' => sprintf('LEGACY-%d-%d-%s', $item->id, $warehouseId, now()->format('YmdHis')),
            'received_date' => $transactionDate,
            'expiry_date' => null,
            'unit_cost' => (float) ($item->fixed_purchase_price ?? $item->default_unit_cost ?? 0),
            'original_qty' => $gap,
            'remaining_qty' => $gap,
            'status' => 'open',
            'reference_type' => InventoryItem::class,
            'reference_id' => $item->id,
        ]);
    }
}
