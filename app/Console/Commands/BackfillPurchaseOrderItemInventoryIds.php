<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class BackfillPurchaseOrderItemInventoryIds extends Command
{
    protected $signature = 'procurement:backfill-po-item-inventory-ids {--apply : Persist changes. Without this flag, command runs in dry-run mode.}';

    protected $description = 'Backfill purchase_order_items.inventory_item_id from product_id for legacy rows.';

    public function handle(): int
    {
        if (!Schema::hasTable('purchase_order_items') || !Schema::hasTable('inventory_items')) {
            $this->error('Required tables are missing (purchase_order_items or inventory_items).');
            return self::FAILURE;
        }

        if (!Schema::hasColumn('purchase_order_items', 'inventory_item_id') || !Schema::hasColumn('purchase_order_items', 'product_id')) {
            $this->error('Required columns are missing on purchase_order_items.');
            return self::FAILURE;
        }

        $mode = $this->option('apply') ? 'APPLY' : 'DRY-RUN';
        $this->info("Mode: {$mode}");

        $legacyRows = DB::table('purchase_order_items')
            ->whereNull('inventory_item_id')
            ->whereNotNull('product_id')
            ->select('id', 'purchase_order_id', 'product_id')
            ->orderBy('id')
            ->get();

        $productIds = $legacyRows->pluck('product_id')->filter()->unique()->values()->all();
        $directInventoryMap = !empty($productIds)
            ? DB::table('inventory_items')
                ->whereIn('id', $productIds)
                ->pluck('id', 'id')
                ->all()
            : [];
        $legacyInventoryMap = !empty($productIds)
            ? DB::table('inventory_items')
                ->whereIn('legacy_product_id', $productIds)
                ->pluck('id', 'legacy_product_id')
                ->all()
            : [];

        $fixableRows = $legacyRows
            ->map(function ($row) use ($directInventoryMap, $legacyInventoryMap) {
                $productId = (int) ($row->product_id ?? 0);
                $resolvedInventoryId = (int) ($directInventoryMap[$productId] ?? $legacyInventoryMap[$productId] ?? 0);

                return (object) [
                    'id' => (int) $row->id,
                    'purchase_order_id' => (int) $row->purchase_order_id,
                    'product_id' => $productId,
                    'resolved_inventory_item_id' => $resolvedInventoryId > 0 ? $resolvedInventoryId : null,
                ];
            })
            ->filter(fn ($row) => $row->resolved_inventory_item_id !== null)
            ->values();

        $fixed = 0;
        if ($this->option('apply') && $fixableRows->isNotEmpty()) {
            foreach ($fixableRows as $row) {
                $updated = DB::table('purchase_order_items')
                    ->where('id', $row->id)
                    ->whereNull('inventory_item_id')
                    ->update(['inventory_item_id' => $row->resolved_inventory_item_id]);
                $fixed += (int) $updated;
            }
        }

        $unresolvedRows = DB::table('purchase_order_items as poi')
            ->leftJoin('inventory_items as ii', 'ii.id', '=', 'poi.inventory_item_id')
            ->where(function ($query) {
                $query->whereNull('poi.inventory_item_id')
                    ->orWhereNull('ii.id');
            })
            ->select('poi.id', 'poi.purchase_order_id', 'poi.inventory_item_id', 'poi.product_id')
            ->orderBy('poi.id')
            ->limit(20)
            ->get();

        $unresolvedCount = DB::table('purchase_order_items as poi')
            ->leftJoin('inventory_items as ii', 'ii.id', '=', 'poi.inventory_item_id')
            ->where(function ($query) {
                $query->whereNull('poi.inventory_item_id')
                    ->orWhereNull('ii.id');
            })
            ->count();

        $this->table(
            ['metric', 'value'],
            [
                ['legacy_fixable_rows', (string) $fixableRows->count()],
                ['rows_updated', (string) $fixed],
                ['unresolved_rows', (string) $unresolvedCount],
            ]
        );

        if ($fixableRows->isNotEmpty()) {
            $this->newLine();
            $this->info('Fixable sample rows');
            $this->table(
                ['id', 'purchase_order_id', 'product_id', 'resolved_inventory_item_id'],
                $fixableRows->take(20)->map(fn ($row) => [
                    (string) $row->id,
                    (string) $row->purchase_order_id,
                    (string) $row->product_id,
                    (string) $row->resolved_inventory_item_id,
                ])->all()
            );
        }

        if ($unresolvedRows->isNotEmpty()) {
            $this->newLine();
            $this->warn('Unresolved sample rows');
            $this->table(
                ['id', 'purchase_order_id', 'inventory_item_id', 'product_id'],
                $unresolvedRows->map(fn ($row) => [
                    (string) $row->id,
                    (string) $row->purchase_order_id,
                    $row->inventory_item_id === null ? 'NULL' : (string) $row->inventory_item_id,
                    $row->product_id === null ? 'NULL' : (string) $row->product_id,
                ])->all()
            );
        }

        if ($unresolvedCount > 0) {
            $this->warn('Backfill completed with unresolved rows. Review sample above.');
            return self::FAILURE;
        }

        $this->info('Backfill completed successfully with zero unresolved rows.');
        return self::SUCCESS;
    }
}
