<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalNotificationDelivery extends Model
{
    protected $fillable = [
        'journal_entry_id',
        'user_id',
        'channel',
        'recipient',
        'status',
        'provider_response',
        'attempts',
        'last_attempt_at',
        'context',
    ];

    protected $casts = [
        'last_attempt_at' => 'datetime',
        'context' => 'array',
    ];

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}

