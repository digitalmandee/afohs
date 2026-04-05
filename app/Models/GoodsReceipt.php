<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class GoodsReceipt extends Model
{
    protected $fillable = [
        'grn_no',
        'purchase_order_id',
        'vendor_id',
        'tenant_id',
        'warehouse_id',
        'warehouse_location_id',
        'received_date',
        'status',
        'remarks',
        'submitted_at',
        'accepted_at',
        'created_by',
        'verifier_user_id',
        'accepted_by',
        'posted_by',
        'posted_at',
    ];

    protected $casts = [
        'received_date' => 'date',
        'submitted_at' => 'datetime',
        'accepted_at' => 'datetime',
        'posted_at' => 'datetime',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }

    public function vendor()
    {
        return $this->belongsTo(Vendor::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function warehouseLocation()
    {
        return $this->belongsTo(WarehouseLocation::class, 'warehouse_location_id');
    }

    public function items()
    {
        return $this->hasMany(GoodsReceiptItem::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verifier_user_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function acceptedBy()
    {
        return $this->belongsTo(User::class, 'accepted_by');
    }

    public function postedBy()
    {
        return $this->belongsTo(User::class, 'posted_by');
    }
}
