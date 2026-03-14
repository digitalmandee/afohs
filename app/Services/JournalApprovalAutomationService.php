<?php

namespace App\Services;

use App\Models\AccountingApprovalPolicy;
use App\Models\ApprovalAction;
use App\Models\ApprovalWorkflow;
use App\Models\ApprovalWorkflowStep;
use App\Models\JournalEntry;
use App\Models\JournalNotificationDelivery;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Schema;

class JournalApprovalAutomationService
{
    public function remindOverdue(int $limit = 200): array
    {
        if (!Schema::hasTable('approval_actions') || !Schema::hasTable('accounting_approval_policies')) {
            return ['checked' => 0, 'overdue' => 0, 'reminded' => 0, 'sent' => 0];
        }

        $policy = AccountingApprovalPolicy::query()->where('module', 'journal_entry')->first();
        if (!$policy || (int) ($policy->sla_hours ?? 0) <= 0) {
            return ['checked' => 0, 'overdue' => 0, 'reminded' => 0, 'sent' => 0];
        }

        $entries = JournalEntry::query()
            ->with('lines')
            ->where('status', 'draft')
            ->orderBy('id')
            ->limit(max(1, $limit))
            ->get();

        $checked = 0;
        $overdue = 0;
        $reminded = 0;
        $sent = 0;

        foreach ($entries as $entry) {
            $checked++;
            if (!$this->isEntryOverdue($entry, $policy)) {
                continue;
            }
            $overdue++;

            $steps = $this->resolveRequiredSteps($policy, $this->journalAmount($entry));
            $currentStep = $this->nextPendingStep($entry, $steps);
            if (!$currentStep) {
                continue;
            }

            $users = $this->resolveReminderRecipients($entry, $policy, $currentStep);
            if ($users->isEmpty()) {
                continue;
            }

            ApprovalAction::create([
                'document_type' => JournalEntry::class,
                'document_id' => $entry->id,
                'action' => 'submitted',
                'remarks' => 'Scheduled overdue reminder for journal approval.',
                'action_by' => null,
            ]);

            $stepLabel = 'Step ' . $currentStep->step_order . ' · ' . ($currentStep->role_name ?: 'Any');
            $sent += app(JournalApprovalNotificationService::class)->sendToUsers(
                $users,
                $entry,
                'Overdue reminder for journal approval.',
                $stepLabel
            );

            $reminded++;
        }

        return compact('checked', 'overdue', 'reminded', 'sent');
    }

    public function retryFailedDeliveries(int $limit = 100): array
    {
        if (!Schema::hasTable('journal_notification_deliveries')) {
            return ['checked' => 0, 'retried' => 0, 'succeeded' => 0];
        }

        $rows = JournalNotificationDelivery::query()
            ->where('status', 'failed')
            ->whereIn('channel', ['whatsapp', 'sms'])
            ->orderByDesc('id')
            ->limit(max(1, $limit))
            ->get();

        $checked = $rows->count();
        $retried = 0;
        $succeeded = 0;
        $notifier = app(JournalApprovalNotificationService::class);

        foreach ($rows as $row) {
            $retried++;
            if ($notifier->retry($row)) {
                $succeeded++;
            }
        }

        return compact('checked', 'retried', 'succeeded');
    }

    private function journalAmount(JournalEntry $entry): float
    {
        $debit = (float) $entry->lines->sum('debit');
        $credit = (float) $entry->lines->sum('credit');

        return max($debit, $credit);
    }

    private function isEntryOverdue(JournalEntry $entry, AccountingApprovalPolicy $policy): bool
    {
        $meta = $this->submissionMeta($entry, $policy);

        return (bool) ($meta['is_overdue'] ?? false);
    }

    private function submissionMeta(JournalEntry $entry, AccountingApprovalPolicy $policy): array
    {
        $submitted = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'submitted')
            ->latest('id')
            ->first();

        if (!$submitted) {
            return ['is_overdue' => false];
        }

        $latestRejection = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'rejected')
            ->latest('id')
            ->first();

        if ($latestRejection && $latestRejection->id > $submitted->id) {
            return ['is_overdue' => false];
        }

        $submittedAt = Carbon::parse($submitted->created_at);
        $ageHours = $submittedAt->diffInHours(now());
        $sla = (int) ($policy->sla_hours ?? 0);

        return ['is_overdue' => $sla > 0 && $ageHours > $sla];
    }

    private function resolveRequiredSteps(AccountingApprovalPolicy $policy, float $amount)
    {
        if (!Schema::hasTable('approval_workflow_steps') || !Schema::hasTable('approval_workflows')) {
            return collect();
        }

        $workflow = ApprovalWorkflow::updateOrCreate(
            ['code' => 'journal_entry_default'],
            [
                'name' => 'Journal Entry Approval',
                'document_type' => JournalEntry::class,
                'is_active' => true,
                'settings' => ['module' => 'journal_entry'],
                'updated_by' => null,
                'created_by' => null,
            ]
        );

        $roles = $this->resolveRequiredRoleNames($policy, $amount);
        foreach ($roles as $index => $roleName) {
            ApprovalWorkflowStep::updateOrCreate(
                ['workflow_id' => $workflow->id, 'step_order' => $index + 1],
                [
                    'name' => 'Step ' . ($index + 1),
                    'role_name' => $roleName,
                    'min_approvers' => 1,
                ]
            );
        }

        ApprovalWorkflowStep::query()
            ->where('workflow_id', $workflow->id)
            ->where('step_order', '>', count($roles))
            ->delete();

        return $workflow->steps()->orderBy('step_order')->get();
    }

    private function resolveRequiredRoleNames(AccountingApprovalPolicy $policy, float $amount): array
    {
        $roles = [];
        $level1 = trim((string) ($policy->level1_role ?? ''));
        $level2 = trim((string) ($policy->level2_role ?? ''));
        $legacy = trim((string) ($policy->approver_role ?? ''));
        $level1Max = (float) ($policy->level1_max_amount ?? 0);

        if ($level1 !== '') {
            $roles[] = $level1;
        } elseif ($legacy !== '') {
            $roles[] = $legacy;
        }

        if ($level2 !== '' && $level1Max > 0 && $amount > $level1Max) {
            $roles[] = $level2;
        }

        return array_values(array_unique(array_filter($roles)));
    }

    private function nextPendingStep(JournalEntry $entry, $steps)
    {
        if ($steps->isEmpty()) {
            return null;
        }

        $approvedStepIds = ApprovalAction::query()
            ->where('document_type', JournalEntry::class)
            ->where('document_id', $entry->id)
            ->where('action', 'approved')
            ->pluck('workflow_step_id')
            ->filter()
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values();

        foreach ($steps as $step) {
            if (!$approvedStepIds->contains((int) $step->id)) {
                return $step;
            }
        }

        return null;
    }

    private function resolveReminderRecipients(JournalEntry $entry, AccountingApprovalPolicy $policy, $currentStep)
    {
        $roles = [];
        $stepRole = trim((string) ($currentStep?->role_name ?? ''));
        if ($stepRole !== '') {
            $roles[] = $stepRole;
        }

        $escalation = trim((string) ($policy->escalation_role ?? ''));
        if ($escalation !== '' && $this->isEntryOverdue($entry, $policy)) {
            $roles[] = $escalation;
        }

        $roles = array_values(array_unique(array_filter($roles)));
        if (empty($roles)) {
            return collect();
        }

        $users = User::query()
            ->whereNotNull('email')
            ->get()
            ->filter(function ($user) use ($roles) {
                foreach ($roles as $role) {
                    if ($this->hasUserRole($user, $role)) {
                        return true;
                    }
                }

                return false;
            })
            ->values();

        if ($policy->enforce_maker_checker) {
            $users = $users->filter(fn($u) => (int) $u->id !== (int) $entry->created_by)->values();
        }

        return $users;
    }

    private function hasUserRole($user, string $role): bool
    {
        if (!method_exists($user, 'hasRole')) {
            return true;
        }

        return $user->hasRole('super-admin') || $user->hasRole('Super Admin') || $user->hasRole($role);
    }
}

