<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingEventQueue extends Model
{
    protected $fillable = [
        'event_type',
        'source_type',
        'source_id',
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
}
