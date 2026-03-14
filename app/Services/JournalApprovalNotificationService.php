<?php

namespace App\Services;

use App\Models\JournalEntry;
use App\Models\JournalNotificationDelivery;
use App\Notifications\JournalApprovalReminderNotification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class JournalApprovalNotificationService
{
    public function sendToUsers(Collection $users, JournalEntry $entry, string $message, ?string $stepLabel = null): int
    {
        $channels = $this->channels();
        $sent = 0;
        $useLaravelNotification = in_array('database', $channels, true) || in_array('mail', $channels, true);
        $webhookChannels = array_values(array_intersect($channels, ['whatsapp', 'sms']));

        foreach ($users as $user) {
            if ($useLaravelNotification) {
                $ok = $this->sendLaravelNotification($user, $entry, $message, $stepLabel, $channels);
                if ($ok) {
                    $sent += count(array_intersect($channels, ['database', 'mail']));
                }
            }

            foreach ($webhookChannels as $channel) {
                if ($this->sendWebhook($channel, $user, $entry, $message, $stepLabel)) {
                    $sent++;
                }
            }
        }

        return $sent;
    }

    public function retry(JournalNotificationDelivery $delivery): bool
    {
        $channel = $delivery->channel;
        $recipient = $delivery->recipient;
        $context = $delivery->context ?? [];
        $payload = $context['payload'] ?? [];

        try {
            $response = null;
            if ($channel === 'whatsapp') {
                $url = config('services.journal_approval.whatsapp_webhook');
                if (!$url) {
                    throw new \RuntimeException('WhatsApp webhook is not configured.');
                }
                $response = Http::timeout(10)->post($url, $payload);
            } elseif ($channel === 'sms') {
                $url = config('services.journal_approval.sms_webhook');
                if (!$url) {
                    throw new \RuntimeException('SMS webhook is not configured.');
                }
                $response = Http::timeout(10)->post($url, $payload);
            } else {
                throw new \RuntimeException('Retry supported only for webhook channels.');
            }

            if (!$response || !$response->successful()) {
                throw new \RuntimeException('Provider call failed: ' . ($response?->status() ?? 'no-response'));
            }

            $delivery->update([
                'status' => 'sent',
                'provider_response' => substr((string) $response->body(), 0, 2000),
                'attempts' => ((int) $delivery->attempts) + 1,
                'last_attempt_at' => now(),
            ]);
            return true;
        } catch (\Throwable $e) {
            $delivery->update([
                'status' => 'failed',
                'provider_response' => substr($e->getMessage(), 0, 2000),
                'attempts' => ((int) $delivery->attempts) + 1,
                'last_attempt_at' => now(),
            ]);
            Log::warning('Journal notification retry failed', [
                'delivery_id' => $delivery->id,
                'channel' => $channel,
                'recipient' => $recipient,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    private function sendLaravelNotification($user, JournalEntry $entry, string $message, ?string $stepLabel, array $channels): bool
    {
        $recipient = $user->email ?: $user->phone_number;

        try {
            $enabled = array_values(array_intersect($channels, ['database', 'mail']));
            $user->notify(new JournalApprovalReminderNotification($entry, $message, $stepLabel, $enabled));
            foreach ($enabled as $channel) {
                $this->log($entry->id, $user->id, $channel, $recipient, 'sent', 'Delivered via Laravel notification');
            }
            return true;
        } catch (\Throwable $e) {
            foreach (array_values(array_intersect($channels, ['database', 'mail'])) as $channel) {
                $this->log($entry->id, $user->id, $channel, $recipient, 'failed', $e->getMessage());
            }
            Log::warning('Journal reminder channel failed', [
                'journal_entry_id' => $entry->id,
                'channel' => 'laravel_notification',
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }

        return false;
    }

    private function sendWebhook(string $channel, $user, JournalEntry $entry, string $message, ?string $stepLabel): bool
    {
        $url = $channel === 'whatsapp'
            ? config('services.journal_approval.whatsapp_webhook')
            : config('services.journal_approval.sms_webhook');

        if (!$url) {
            $this->log(
                $entry->id,
                $user->id,
                $channel,
                $user->phone_number ?: $user->email,
                'failed',
                strtoupper($channel) . ' webhook not configured',
                [
                    'payload' => $this->payload($channel, $user, $entry, $message, $stepLabel),
                ]
            );
            return false;
        }

        $payload = $this->payload($channel, $user, $entry, $message, $stepLabel);
        $response = Http::timeout(10)->post($url, $payload);

        $ok = $response->successful();
        $this->log(
            $entry->id,
            $user->id,
            $channel,
            $user->phone_number ?: $user->email,
            $ok ? 'sent' : 'failed',
            'HTTP ' . $response->status() . ' ' . substr((string) $response->body(), 0, 500),
            ['payload' => $payload]
        );

        return $ok;
    }

    private function payload(string $channel, $user, JournalEntry $entry, string $message, ?string $stepLabel): array
    {
        return [
            'channel' => $channel,
            'recipient' => $user->phone_number ?: $user->email,
            'email' => $user->email,
            'phone' => $user->phone_number,
            'name' => $user->name,
            'message' => $message,
            'step' => $stepLabel,
            'entry_id' => $entry->id,
            'entry_no' => $entry->entry_no,
            'entry_date' => (string) $entry->entry_date,
        ];
    }

    private function channels(): array
    {
        $configured = config('services.journal_approval.channels');
        if (is_string($configured)) {
            $configured = explode(',', $configured);
        }
        $channels = collect($configured ?: ['database', 'mail'])
            ->map(fn($c) => strtolower(trim((string) $c)))
            ->filter(fn($c) => in_array($c, ['database', 'mail', 'whatsapp', 'sms'], true))
            ->values()
            ->all();

        return empty($channels) ? ['database', 'mail'] : $channels;
    }

    private function log(
        ?int $journalEntryId,
        ?int $userId,
        string $channel,
        ?string $recipient,
        string $status,
        string $response,
        array $context = []
    ): void {
        if (!\Illuminate\Support\Facades\Schema::hasTable('journal_notification_deliveries')) {
            return;
        }

        JournalNotificationDelivery::create([
            'journal_entry_id' => $journalEntryId,
            'user_id' => $userId,
            'channel' => $channel,
            'recipient' => $recipient,
            'status' => $status,
            'provider_response' => substr($response, 0, 2000),
            'attempts' => 1,
            'last_attempt_at' => now(),
            'context' => $context ?: null,
        ]);
    }
}
