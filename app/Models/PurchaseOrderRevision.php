<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PurchaseOrderRevision extends Model
{
    protected $fillable = [
        'purchase_order_id',
        'revision_no',
        'snapshot',
        'change_reason',
        'changed_by',
    ];

    protected $casts = [
        'snapshot' => 'array',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(PurchaseOrder::class);
    }
}
