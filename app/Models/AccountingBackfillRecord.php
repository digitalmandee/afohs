<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingBackfillRecord extends Model
{
    protected $fillable = [
        'backfill_run_id',
        'source_family',
        'source_kind',
        'source_type',
        'source_id',
        'source_date',
        'source_amount',
        'classification_code',
        'event_type',
        'posting_rule_code',
        'queue_id',
        'journal_entry_id',
        'status',
        'reason_code',
        'reason_text',
        'payload',
        'processed_at',
    ];

    protected $casts = [
        'source_date' => 'date',
        'source_amount' => 'decimal:2',
        'payload' => 'array',
        'processed_at' => 'datetime',
    ];

    public function run()
    {
        return $this->belongsTo(AccountingBackfillRun::class, 'backfill_run_id');
    }

    public function queue()
    {
        return $this->belongsTo(AccountingEventQueue::class, 'queue_id');
    }

    public function journalEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'journal_entry_id');
    }
}
