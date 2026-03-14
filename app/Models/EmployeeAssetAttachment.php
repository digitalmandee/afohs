<?php

namespace App\Models;

use App\Models\Media;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeAssetAttachment extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['employee_id', 'employee_asset_id', 'attachment_date', 'comments', 'status', 'return_date', 'created_by', 'updated_by', 'deleted_by'];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function asset()
    {
        return $this->belongsTo(EmployeeAsset::class, 'employee_asset_id');
    }

    public function media(): MorphMany
    {
        return $this->morphMany(Media::class, 'mediable');
    }
}
