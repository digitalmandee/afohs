<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Media extends BaseModel
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'mediable_type',
        'mediable_id',
        'type',
        'file_name',
        'file_path',
        'mime_type',
        'file_size',
        'disk',
        'custom_properties',
        'description',
        'expires_at',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'custom_properties' => 'array',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /**
     * Get the parent mediable model (Member, Employee, etc.).
     */
    public function mediable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who uploaded the media.
     */
    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the user who last updated the media.
     */
    public function updatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the user who deleted the media.
     */
    public function deletedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /**
     * Check if the media file exists.
     *
     * @return bool
     */
    public function exists(): bool
    {
        $rawPath = (string) $this->getRawOriginal('file_path');
        $absolutePath = public_path(ltrim(str_replace('\\', '/', $rawPath), '/'));
        return file_exists($absolutePath);
    }

    /**
     * Delete the media file from storage.
     *
     * @return bool
     */
    public function deleteFile(): bool
    {
        if ($this->exists()) {
            $rawPath = (string) $this->getRawOriginal('file_path');
            $absolutePath = public_path(ltrim(str_replace('\\', '/', $rawPath), '/'));
            @unlink($absolutePath);
            return true;
        }
        return false;
    }

    /**
     * Normalize DB paths to browser-safe URLs while preserving raw DB value for file operations.
     */
    public function getFilePathAttribute($value): ?string
    {
        if (!$value) {
            return null;
        }

        $normalized = str_replace('\\', '/', (string) $value);
        if (Str::startsWith($normalized, ['http://', 'https://', 'data:', 'blob:'])) {
            return $normalized;
        }

        return Str::startsWith($normalized, '/') ? $normalized : '/' . $normalized;
    }

    /**
     * Check if the document has expired.
     *
     * @return bool
     */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    /**
     * Scope a query to only include media of a given type.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param string $type
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope a query to only include expired media.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeExpired($query)
    {
        return $query->whereNotNull('expires_at')
                     ->where('expires_at', '<', now());
    }

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        // Automatically delete file when model is deleted
        static::deleting(function ($media) {
            if ($media->isForceDeleting()) {
                $media->deleteFile();
            }
        });
    }
}
