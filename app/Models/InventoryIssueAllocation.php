<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryIssueAllocation extends Model
{
    protected $fillable = [
        'inventory_transaction_id',
        'inventory_batch_id',
        'quantity',
        'unit_cost',
        'total_cost',
    ];

    protected $casts = [
        'quantity' => 'decimal:3',
        'unit_cost' => 'decimal:4',
        'total_cost' => 'decimal:4',
    ];

    public function transaction()
    {
        return $this->belongsTo(InventoryTransaction::class, 'inventory_transaction_id');
    }

    public function batch()
    {
        return $this->belongsTo(InventoryBatch::class, 'inventory_batch_id');
    }
}
