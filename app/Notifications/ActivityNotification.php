<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ActivityNotification extends Notification
{
    use Queueable;

    public $title;
    public $description;
    public $link;
    public $actor;
    public $category;

    /**
     * Create a new notification instance.
     */
    public function __construct($title, $description, $link = null, $actor = null, $category = 'System')
    {
        $this->title = $title;
        $this->description = $description;
        $this->link = $link;
        $this->actor = $actor;
        $this->category = $category;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'link' => $this->link,
            'actor_name' => $this->actor ? $this->actor->name : 'System',
            'category' => $this->category,
            'time' => now()->diffForHumans(),
        ];
    }

    /**
     * Get the broadcastable representation of the notification.
     */
    public function toBroadcast(object $notifiable): \Illuminate\Notifications\Messages\BroadcastMessage
    {
        return new \Illuminate\Notifications\Messages\BroadcastMessage([
            'title' => $this->title,
            'description' => $this->description,
            'link' => $this->link,
            'actor_name' => $this->actor ? $this->actor->name : 'System',
            'category' => $this->category,
            'time' => 'Just now',
        ]);
    }
}
