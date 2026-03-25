<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderPrintLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'batch_id',
        'order_id',
        'restaurant_id',
        'kitchen_id',
        'printer_profile_id',
        'document_type',
        'status',
        'queue_name',
        'printer_ip',
        'printer_port',
        'attempt',
        'error',
        'printed_at',
        'last_attempt_at',
        'meta',
        'created_by',
    ];

    protected $casts = [
        'printed_at' => 'datetime',
        'last_attempt_at' => 'datetime',
        'meta' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
