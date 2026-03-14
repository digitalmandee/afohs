<?php

namespace App\Console\Commands;

use App\Models\Member;
use App\Models\MemberStatusHistory;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CheckMembershipStatusExpiry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'members:check-status-expiry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for members with expired suspension or absence and revert them to active status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for expired membership statuses...');
        Log::info('Starting members:check-status-expiry command.');

        // Find members who are currently suspended or absent
        $members = Member::whereIn('status', ['suspended', 'absent', 'in_suspension_process'])->get();

        $count = 0;

        foreach ($members as $member) {
            // Get the latest status history entry to find the end date
            $latestStatus = MemberStatusHistory::where('member_id', $member->id)
                ->where('status', $member->status)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($latestStatus && $latestStatus->end_date) {
                $endDate = Carbon::parse($latestStatus->end_date);

                // If the end date is in the past (expires yesterday or earlier, or just passed today)
                if ($endDate->isPast()) {
                    $this->info("Reverting member #{$member->id} ({$member->full_name}) to active. Expired on {$endDate->toDateString()}.");
                    Log::info("Reverting member #{$member->id} ({$member->full_name}) to active. Status: {$member->status}, Expired: {$endDate->toDateString()}");

                    DB::beginTransaction();
                    try {
                        // Revert status to active
                        $member->update([
                            'status' => 'active',
                            'paused_at' => null,  // Clear paused_at if it was set
                        ]);

                        // Record the status change back to active
                        MemberStatusHistory::create([
                            'member_id' => $member->id,
                            'status' => 'active',
                            'reason' => 'Automatically reverted after suspension/absence duration expired.',
                            'start_date' => now(),
                            'end_date' => null,  // Active indefinite until changed
                        ]);

                        DB::commit();
                        $count++;
                    } catch (\Exception $e) {
                        DB::rollBack();
                        Log::error("Failed to revert member #{$member->id}: " . $e->getMessage());
                        $this->error("Failed to revert member #{$member->id}");
                    }
                }
            }
        }

        $this->info("Processed {$members->count()} regular members. Reverted {$count} members to active status.");
        Log::info("Finished processing regular members. Reverted {$count} members.");

        // --- Process Corporate Members ---
        $this->info('Checking for expired corporate membership statuses...');
        $corporateMembers = \App\Models\CorporateMember::whereIn('status', ['suspended', 'absent', 'in_suspension_process'])->get();
        $corporateCount = 0;

        foreach ($corporateMembers as $member) {
            // Get the latest status history entry to find the end date
            $latestStatus = MemberStatusHistory::where('corporate_member_id', $member->id)
                ->where('status', $member->status)
                ->orderBy('created_at', 'desc')
                ->first();

            if ($latestStatus && $latestStatus->end_date) {
                $endDate = Carbon::parse($latestStatus->end_date);

                // If the end date is in the past
                if ($endDate->isPast()) {
                    $this->info("Reverting corporate member #{$member->id} ({$member->full_name}) to active. Expired on {$endDate->toDateString()}.");
                    Log::info("Reverting corporate member #{$member->id} ({$member->full_name}) to active. Status: {$member->status}, Expired: {$endDate->toDateString()}");

                    DB::beginTransaction();
                    try {
                        // Revert status to active
                        $member->update([
                            'status' => 'active',
                            // 'paused_at' => null, // Corporate members don't have paused_at yet
                        ]);

                        // Record the status change back to active
                        MemberStatusHistory::create([
                            'corporate_member_id' => $member->id,
                            'status' => 'active',
                            'reason' => 'Automatically reverted after suspension/absence duration expired.',
                            'start_date' => now(),
                            'end_date' => null,
                        ]);

                        DB::commit();
                        $corporateCount++;
                    } catch (\Exception $e) {
                        DB::rollBack();
                        Log::error("Failed to revert corporate member #{$member->id}: " . $e->getMessage());
                        $this->error("Failed to revert corporate member #{$member->id}");
                    }
                }
            }
        }

        $this->info("Processed {$corporateMembers->count()} corporate members. Reverted {$corporateCount} members to active status.");
        Log::info("Finished members:check-status-expiry. Reverted {$count} regular and {$corporateCount} corporate members.");
    }
}
