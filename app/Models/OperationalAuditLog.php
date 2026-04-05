<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OperationalAuditLog extends Model
{
    protected $fillable = [
        'correlation_id',
        'module',
        'entity_type',
        'entity_id',
        'action',
        'status',
        'severity',
        'message',
        'context_json',
        'actor_id',
        'request_path',
        'ip',
        'error_signature',
    ];

    protected $casts = [
        'context_json' => 'array',
    ];

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}

