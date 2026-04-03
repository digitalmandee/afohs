<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockAudit extends Model
{
    protected $fillable = [
        'audit_no',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'audit_date',
        'status',
        'remarks',
        'frozen_at',
        'submitted_at',
        'approved_at',
        'posted_at',
        'created_by',
        'approved_by',
    ];

    protected $casts = [
        'audit_date' => 'date',
        'frozen_at' => 'datetime',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
        'posted_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(StockAuditItem::class);
    }
}
