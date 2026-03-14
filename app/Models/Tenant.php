<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, SoftDeletes;

    public $incrementing = true;

    protected $keyType = 'int';

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name',
            'branch_id',
            'status',
            'printer_ip',
            'printer_port',
            'expeditor_printer_ip',
            'expeditor_printer_port',
            'created_by',
            'updated_by',
            'deleted_by',
            'deleted_at',
        ];
    }

    protected static function booted()
    {
        static::creating(function ($model) {
            if (auth()->check() && !$model->created_by) {
                $model->created_by = auth()->id();
            }
        });

        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });
    }

    public function setPasswordAttribute($value)
    {
        $this->attributes['password'] = bcrypt($value);
    }
}
