<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'corporate_member_id',
        'customer_id',
        'family_member_id',
        'subscription_category_id',
        'subscription_type_id',
        'valid_from',
        'valid_to',
        'status',
        'invoice_id',
        'qr_code'
    ];

    public function corporateMember()
    {
        return $this->belongsTo(CorporateMember::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    protected $casts = [
        'valid_from' => 'date',
        'valid_to' => 'date',
    ];

    // New Relationship (Single Invoice, Multi-Sub)
    public function financialInvoice()
    {
        return $this->belongsTo(FinancialInvoice::class, 'invoice_id');
    }

    // Legacy Relationship (One-to-One)
    public function legacyInvoice()
    {
        return $this->morphOne(FinancialInvoice::class, 'invoiceable');
    }

    // Helper to resolve invoice transparently
    public function getInvoiceAttribute()
    {
        return $this->financialInvoice ?? $this->legacyInvoice;
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function familyMember()
    {
        return $this->belongsTo(Member::class, 'family_member_id');
    }

    public function subscriptionCategory()
    {
        return $this->belongsTo(SubscriptionCategory::class);
    }

    public function subscriptionType()
    {
        return $this->belongsTo(SubscriptionType::class);
    }

    // Helper method to get the actual subscriber (family member, primary member, corporate, or customer)
    public function getSubscriberAttribute()
    {
        if ($this->family_member_id) {
            return $this->familyMember;
        }
        if ($this->customer_id) {
            return $this->customer;
        }
        if ($this->corporate_member_id) {
            return $this->corporateMember;
        }
        return $this->member;
    }

    // Helper method to get subscriber name
    public function getSubscriberNameAttribute()
    {
        $subscriber = $this->subscriber;
        if (!$subscriber) {
            return 'Unknown';
        }
        // Customer uses 'name', Member/CorporateMember use 'full_name'
        return $subscriber->full_name ?? $subscriber->name ?? 'Unknown';
    }

    // Helper method to get subscriber relation
    public function getSubscriberRelationAttribute()
    {
        if ($this->family_member_id) {
            return $this->familyMember ? $this->familyMember->relation : 'Family Member';
        }
        if ($this->customer_id) {
            return 'Guest';
        }
        if ($this->corporate_member_id) {
            return 'Corporate';
        }
        return 'SELF';
    }
}
