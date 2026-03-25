<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

class PrinterProfile extends Model
{
    use HasFactory;
    use CentralConnection;

    protected $fillable = [
        'tenant_id',
        'name',
        'printer_ip',
        'printer_port',
        'is_active',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function scopeForRestaurant($query, ?int $restaurantId)
    {
        if (!$restaurantId) {
            return $query;
        }

        return $query->where(function ($inner) use ($restaurantId) {
            $inner->whereNull('tenant_id')
                ->orWhere('tenant_id', $restaurantId);
        });
    }
}
