<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class VerifyPurchaseOrderItemInventoryIds extends Command
{
    protected $signature = 'procurement:verify-po-item-inventory-ids {--limit=20 : Number of unresolved rows to print}';

    protected $description = 'Verify purchase_order_items have valid inventory_item_id mappings.';

    public function handle(): int
    {
        if (!Schema::hasTable('purchase_order_items') || !Schema::hasTable('inventory_items')) {
            $this->error('Required tables are missing (purchase_order_items or inventory_items).');
            return self::FAILURE;
        }

        $limit = max(1, (int) $this->option('limit'));

        $invalidCount = DB::table('purchase_order_items as poi')
            ->leftJoin('inventory_items as ii', 'ii.id', '=', 'poi.inventory_item_id')
            ->where(function ($query) {
                $query->whereNull('poi.inventory_item_id')
                    ->orWhereNull('ii.id');
            })
            ->count();

        $total = DB::table('purchase_order_items')->count();

        $this->table(
            ['metric', 'value'],
            [
                ['po_item_total', (string) $total],
                ['invalid_mapping_count', (string) $invalidCount],
            ]
        );

        if ($invalidCount > 0) {
            $rows = DB::table('purchase_order_items as poi')
                ->leftJoin('inventory_items as ii', 'ii.id', '=', 'poi.inventory_item_id')
                ->where(function ($query) {
                    $query->whereNull('poi.inventory_item_id')
                        ->orWhereNull('ii.id');
                })
                ->select('poi.id', 'poi.purchase_order_id', 'poi.inventory_item_id', 'poi.product_id')
                ->orderBy('poi.id')
                ->limit($limit)
                ->get();

            $this->warn('Invalid mapping sample rows');
            $this->table(
                ['id', 'purchase_order_id', 'inventory_item_id', 'product_id'],
                $rows->map(fn ($row) => [
                    (string) $row->id,
                    (string) $row->purchase_order_id,
                    $row->inventory_item_id === null ? 'NULL' : (string) $row->inventory_item_id,
                    $row->product_id === null ? 'NULL' : (string) $row->product_id,
                ])->all()
            );

            return self::FAILURE;
        }

        $this->info('PO item inventory mapping verification passed.');
        return self::SUCCESS;
    }
}
