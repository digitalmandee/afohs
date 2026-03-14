<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalTemplate extends Model
{
    protected $fillable = [
        'name',
        'description',
        'source_journal_entry_id',
        'lines',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'lines' => 'array',
        'is_active' => 'boolean',
    ];

    public function sourceEntry()
    {
        return $this->belongsTo(JournalEntry::class, 'source_journal_entry_id');
    }
}

