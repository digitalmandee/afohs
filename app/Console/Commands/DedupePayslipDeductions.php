<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DedupePayslipDeductions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * Use --apply to perform changes; otherwise the command will only report duplicates.
     *
     * @var string
     */
    protected $signature = 'payslip:dedupe-orderids {--apply : Nullify duplicate order_id values keeping earliest entry}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Report or dedupe duplicate order_id values in payslip_deductions (keep earliest entry)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!DB::getSchemaBuilder()->hasColumn('payslip_deductions', 'order_id')) {
            $this->info('Column payslip_deductions.order_id does not exist. Nothing to do.');
            return 0;
        }

        $duplicates = DB::table('payslip_deductions')
            ->select('order_id', DB::raw('COUNT(*) as cnt'))
            ->whereNotNull('order_id')
            ->groupBy('order_id')
            ->having('cnt', '>', 1)
            ->get();

        if ($duplicates->isEmpty()) {
            $this->info('No duplicate order_id values found.');
            return 0;
        }

        $this->info('Found ' . $duplicates->count() . ' duplicate order_id(s):');
        foreach ($duplicates as $dup) {
            $this->line(" - order_id={$dup->order_id} (count={$dup->cnt})");
        }

        if ($this->option('apply')) {
            $this->comment('Applying de-duplication (keeping earliest row per order_id)...');
            DB::beginTransaction();
            try {
                foreach ($duplicates as $dup) {
                    $orderId = $dup->order_id;
                    $rows = DB::table('payslip_deductions')
                        ->where('order_id', $orderId)
                        ->orderBy('id', 'asc')
                        ->get();

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
                $this->info('Duplicates nullified successfully.');
            } catch (\Exception $e) {
                DB::rollBack();
                $this->error('Error during dedupe: ' . $e->getMessage());
                return 1;
            }
        } else {
            $this->info('Run this command with --apply to nullify duplicates (keep earliest entry).');
        }

        return 0;
    }
}
