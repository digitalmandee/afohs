<?php

namespace App\Notifications;

use App\Models\JournalEntry;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class JournalApprovalReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public JournalEntry $entry,
        public string $message,
        public ?string $stepLabel = null,
        public array $enabledChannels = ['database', 'mail']
    ) {
    }

    public function via(object $notifiable): array
    {
        $channels = collect($this->enabledChannels)
            ->map(fn($channel) => strtolower(trim((string) $channel)))
            ->filter(fn($channel) => in_array($channel, ['database', 'mail'], true))
            ->values()
            ->all();

        return empty($channels) ? ['database'] : $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Journal Approval Reminder: ' . $this->entry->entry_no)
            ->line($this->message)
            ->line('Journal: ' . $this->entry->entry_no)
            ->line('Date: ' . ($this->entry->entry_date ?? '-'))
            ->line('Description: ' . ($this->entry->description ?? '-'))
            ->line('Approval Step: ' . ($this->stepLabel ?? 'Pending'))
            ->action('Open Journal', url('/admin/accounting/journals/' . $this->entry->id));
    }

    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Journal Approval Reminder',
            'description' => $this->message . ' (' . $this->entry->entry_no . ')',
            'category' => 'Accounting',
            'link' => route('accounting.journals.show', $this->entry->id),
            'entry_id' => $this->entry->id,
            'entry_no' => $this->entry->entry_no,
            'step' => $this->stepLabel,
            'time' => now()->diffForHumans(),
        ];
    }
}
