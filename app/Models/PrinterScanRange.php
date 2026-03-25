<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class PrinterScanRange extends BaseModel
{
    use CentralConnection;
    use HasFactory;

    protected $fillable = [
        'tenant_id',
        'label',
        'range_value',
        'range_type',
        'port',
        'is_active',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'port' => 'integer',
        'is_active' => 'boolean',
    ];

    public function scopeForRestaurant(Builder $query, ?int $restaurantId): Builder
    {
        return $query->where(function (Builder $builder) use ($restaurantId) {
            $builder->whereNull('tenant_id');

            if ($restaurantId) {
                $builder->orWhere('tenant_id', $restaurantId);
            }
        });
    }
}
