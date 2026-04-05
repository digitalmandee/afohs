<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseRequisition extends Model
{
    protected $fillable = [
        'pr_no',
        'request_for',
        'tenant_id',
        'branch_id',
        'warehouse_id',
        'other_location_label',
        'department_id',
        'subdepartment_id',
        'requested_by',
        'request_date',
        'required_date',
        'status',
        'notes',
        'submitted_at',
        'approved_at',
        'approved_by',
    ];

    protected $casts = [
        'request_date' => 'date',
        'required_date' => 'date',
        'submitted_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(PurchaseRequisitionItem::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function warehouse()
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function subdepartment()
    {
        return $this->belongsTo(Subdepartment::class);
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approver()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function purchaseOrders()
    {
        return $this->hasMany(PurchaseOrder::class, 'purchase_requisition_id');
    }

    public function latestPurchaseOrder()
    {
        return $this->hasOne(PurchaseOrder::class, 'purchase_requisition_id')->latestOfMany();
    }
}
