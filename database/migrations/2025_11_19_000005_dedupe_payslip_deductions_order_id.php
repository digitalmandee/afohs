<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * This migration attempts to safely de-duplicate existing non-null `order_id`
     * values on `payslip_deductions` by keeping the earliest row (lowest id)
     * per `order_id` and nullifying the `order_id` on the remaining duplicates.
     *
     * WARNING: This mutation is irreversible in the down() method beyond removing
     * the changes made here. Review and backup your DB before running.
     */
    public function up()
    {
        // Only run if column exists
        if (!Schema::hasColumn('payslip_deductions', 'order_id')) {
            return;
        }

        DB::beginTransaction();
        try {
            // Find duplicate order_ids
            $duplicates = DB::table('payslip_deductions')
                ->select('order_id', DB::raw('COUNT(*) as cnt'))
                ->whereNotNull('order_id')
                ->groupBy('order_id')
                ->having('cnt', '>', 1)
                ->get();

            foreach ($duplicates as $dup) {
                $orderId = $dup->order_id;

                // Get all rows for this order_id ordered by id (keep earliest)
                $rows = DB::table('payslip_deductions')
                    ->where('order_id', $orderId)
                    ->orderBy('id', 'asc')
                    ->get();

                // Keep the first row, nullify order_id for the rest
                $keep = true;
                foreach ($rows as $row) {
                    if ($keep) {
                        $keep = false;
                        continue;
                    }

                    DB::table('payslip_deductions')
                        ->where('id', $row->id)
                        ->update(['order_id' => null]);
                }
            }

            DB::commit();
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reverse the migrations.
     *
     * Note: We cannot restore previous values for nullified order_id values.
     */
    public function down()
    {
        // Nothing to reverse safely
    }
};
