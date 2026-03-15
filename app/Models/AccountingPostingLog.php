<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingPostingLog extends Model
{
    protected $fillable = [
        'queue_id',
        'event_type',
        'source_type',
        'source_id',
        'restaurant_id',
        'posting_rule_id',
        'status',
        'journal_entry_id',
        'message',
        'payload',
    ];

    protected $casts = [
        'payload' => 'array',
    ];

    public function queue()
    {
        return $this->belongsTo(AccountingEventQueue::class, 'queue_id');
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
