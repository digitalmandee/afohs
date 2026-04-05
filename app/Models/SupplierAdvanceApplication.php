<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplierAdvanceApplication extends Model
{
    protected $fillable = [
        'supplier_advance_id',
        'vendor_bill_id',
        'source_purchase_order_id',
        'target_purchase_order_id',
        'amount',
        'override_po_lock',
        'override_reason',
        'overridden_by',
        'overridden_at',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'override_po_lock' => 'boolean',
        'overridden_at' => 'datetime',
    ];

    public function supplierAdvance()
    {
        return $this->belongsTo(SupplierAdvance::class);
    }

    public function vendorBill()
    {
        return $this->belongsTo(VendorBill::class);
    }

    public function sourcePurchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'source_purchase_order_id');
    }

    public function targetPurchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class, 'target_purchase_order_id');
    }
}
