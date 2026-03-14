<?php

namespace App\Models;

use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeAsset extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'classification',
        'type',
        'acquisition_date',
        'location',
        'quantity',
        'cost',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'created_at',
        'updated_at',
        'deleted_at'
    ];

    public function attachments()
    {
        return $this->hasMany(EmployeeAssetAttachment::class);
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }
}
