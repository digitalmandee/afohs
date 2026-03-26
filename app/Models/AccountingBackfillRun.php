<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AccountingBackfillRun extends Model
{
    protected $fillable = [
        'mode',
        'families',
        'filters',
        'chunk_size',
        'is_commit',
        'include_deleted_receipts',
        'stop_on_error',
        'status',
        'summary',
        'started_at',
        'completed_at',
        'created_by',
    ];

    protected $casts = [
        'families' => 'array',
        'filters' => 'array',
        'summary' => 'array',
        'is_commit' => 'boolean',
        'include_deleted_receipts' => 'boolean',
        'stop_on_error' => 'boolean',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function records()
    {
        return $this->hasMany(AccountingBackfillRecord::class, 'backfill_run_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
