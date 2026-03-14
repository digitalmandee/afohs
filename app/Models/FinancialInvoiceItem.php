<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FinancialInvoiceItem extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'invoice_id',
        'fee_type',  // membership_fee, maintenance_fee, subscription_fee, reinstating_fee, custom, etc.
        'financial_charge_type_id',  // For dynamic types if we add them later
        'description',
        'qty',
        'amount',  // Unit price
        'sub_total',  // qty * amount
        'tax_percentage',
        'tax_amount',
        'discount_amount',
        'discount_details',
        'total',
        'start_date',
        'end_date',
        'family_member_id',  // For subscription items
        'subscription_type_id',
        'subscription_category_id',
        'discount_type',
        'discount_value',
        'overdue_percentage',
        'additional_charges',
        'extra_percentage',
        'remarks',
        'data',  // JSON for extra data
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'data' => 'array',
    ];

    public function invoice()
    {
        return $this->belongsTo(FinancialInvoice::class, 'invoice_id');
    }

    public function transactions()
    {
        return $this->morphMany(Transaction::class, 'reference');
    }

    public function familyMember()
    {
        return $this->belongsTo(Member::class, 'family_member_id');
    }

    public function subscriptionType()
    {
        return $this->belongsTo(SubscriptionType::class, 'subscription_type_id');
    }

    public function subscriptionCategory()
    {
        return $this->belongsTo(SubscriptionCategory::class, 'subscription_category_id');
    }
}
