<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;

class CoaAccount extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'segment1',
        'segment2',
        'segment3',
        'segment4',
        'segment5',
        'full_code',
        'name',
        'type',
        'normal_balance',
        'level',
        'parent_id',
        'opening_balance',
        'description',
        'is_postable',
        'is_active',
        'metadata',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_postable' => 'boolean',
        'is_active' => 'boolean',
        'opening_balance' => 'decimal:2',
        'metadata' => 'array',
    ];

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopePostable(Builder $query): Builder
    {
        return $query->where('is_postable', true);
    }

    public function scopeOperationalPosting(Builder $query): Builder
    {
        return $query->active()->postable();
    }

    public function parent()
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function journalLines()
    {
        return $this->hasMany(JournalLine::class, 'account_id');
    }
}
