<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SubscriptionCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['name', 'subscription_type_id', 'description', 'fee', 'subscription_fee', 'status'];

    // Accessor to get the monthly fee (default fee)
    public function getEffectiveFeeAttribute()
    {
        return $this->fee;
    }

    // Calculate day fee on demand
    public function getDayFeeAttribute()
    {
        return $this->fee ? round($this->fee / 30) : 0;
    }

    public function subscriptionType()
    {
        return $this->belongsTo(SubscriptionType::class);
    }
}
