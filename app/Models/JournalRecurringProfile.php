<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JournalRecurringProfile extends Model
{
    protected $fillable = [
        'template_id',
        'frequency',
        'next_run_date',
        'is_active',
        'last_run_at',
        'created_by',
    ];

    protected $casts = [
        'next_run_date' => 'date',
        'last_run_at' => 'datetime',
        'is_active' => 'boolean',
    ];

    public function template()
    {
        return $this->belongsTo(JournalTemplate::class, 'template_id');
    }
}

