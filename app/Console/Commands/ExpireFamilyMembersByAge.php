<?php

namespace App\Console\Commands;

use App\Models\CorporateMember;
use App\Models\Member;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ExpireFamilyMembersByAge extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'members:expire-by-age {--dry-run : Run without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Automatically expire family members (son/daughter) who have reached 25 years of age';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        $expiredCount = 0;

        $this->info('Starting family member age-based expiry process (son/daughter only)...');

        // Get regular family members who should be expired by age
        $membersToExpire = Member::familyMembersToExpire()->get();
        $this->info("Found {$membersToExpire->count()} regular family member(s) to expire.");
        $this->processExpiry($membersToExpire, $isDryRun, $expiredCount);

        // Get corporate family members who should be expired by age
        $corporateMembersToExpire = CorporateMember::familyMembersToExpire()->get();
        $this->info("Found {$corporateMembersToExpire->count()} corporate family member(s) to expire.");
        $this->processExpiry($corporateMembersToExpire, $isDryRun, $expiredCount);

        if ($expiredCount === 0 && $membersToExpire->isEmpty() && $corporateMembersToExpire->isEmpty()) {
            $this->info('No family members found that need to be expired by age.');
            return Command::SUCCESS;
        }

        if ($isDryRun) {
            $this->warn('DRY RUN: No changes were made. Use without --dry-run to actually expire members.');
        } else {
            $this->info("Successfully expired {$expiredCount} family member(s).");

            // Send notification to admins if any members were expired
            if ($expiredCount > 0) {
                $this->notifyAdmins($expiredCount);
            }
        }

        return Command::SUCCESS;
    }

    /**
     * Process member expiry
     */
    private function processExpiry($members, $isDryRun, &$expiredCount)
    {
        foreach ($members as $member) {
            $age = $member->age;
            $type = $member instanceof CorporateMember ? 'Corporate' : 'Regular';
            $memberInfo = "[$type] {$member->full_name} (ID: {$member->id}, Age: {$age})";

            if ($isDryRun) {
                $this->line("Would expire: {$memberInfo}");
            } else {
                try {
                    $member->expireByAge("Automatic expiry - Member reached {$age} years of age");
                    $this->line("✓ Expired: {$memberInfo}");
                    $expiredCount++;
                } catch (\Exception $e) {
                    $this->error("✗ Failed to expire {$memberInfo}: {$e->getMessage()}");
                    Log::error('Failed to expire family member by age', [
                        'member_id' => $member->id,
                        'type' => $type,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
    }

    /**
     * Notify administrators about expired members
     */
    private function notifyAdmins($expiredCount)
    {
        // You can implement email notification, database notification, etc.
        Log::info('Family member expiry notification', [
            'expired_count' => $expiredCount,
            'date' => now()->toDateString(),
            'message' => "{$expiredCount} family member(s) were automatically expired due to reaching 25 years of age."
        ]);

        $this->info("Admin notification logged for {$expiredCount} expired member(s).");
    }
}
