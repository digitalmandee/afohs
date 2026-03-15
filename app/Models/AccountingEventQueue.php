<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingEventQueue extends Model
{
    protected $fillable = [
        'event_type',
        'source_type',
        'source_id',
        'restaurant_id',
        'posting_rule_id',
        'journal_entry_id',
        'idempotency_key',
        'status',
        'payload',
        'retry_count',
        'last_attempt_at',
        'processed_at',
        'error_message',
        'created_by',
    ];

    protected $casts = [
        'payload' => 'array',
        'last_attempt_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    public function postingLogs()
    {
        return $this->hasMany(AccountingPostingLog::class, 'queue_id');
    }

    public function restaurant()
    {
        return $this->belongsTo(Tenant::class, 'restaurant_id');
    }

    public function postingRule()
    {
        return $this->belongsTo(AccountingRule::class, 'posting_rule_id');
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }
}
