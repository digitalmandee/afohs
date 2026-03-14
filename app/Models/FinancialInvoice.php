<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class FinancialInvoice extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'invoice_no',
        'customer_id',
        'member_id',
        'employee_id',
        'subscription_type',
        'invoice_type',
        'discount_type',
        'discount_value',
        'discount_details',
        'amount',
        'total_price',
        'advance_payment',
        'paid_amount',
        'customer_charges',
        'period_start',
        'period_end',
        'issue_date',
        'due_date',
        'paid_for_month',
        'payment_method',
        'payment_date',
        'receipt',  // Fixed spelling from 'reciept'
        'data',
        'remarks',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
        'deleted_at',
        // New fields for transaction system
        'fee_type',
        'payment_frequency',
        'quarter_number',
        'valid_from',
        'valid_to',
        'valid_to',
        'credit_card_type',
        'overdue_percentage',
        'overdue_amount',
        'additional_charges',
        // Subscription fields
        'subscription_type_id',
        'subscription_category_id',
        // Polymorphic relationship fields
        'invoiceable_id',
        'invoiceable_type',
        // Fields from old finance_invoices table for migration
        'name',
        'mem_no',
        'address',
        'contact',
        'cnic',
        'email',
        'family_id',
        'extra_details',
        'tax_amount',
        'tax_details',
        'discount_percentage',
        'extra_percentage',
        'tax_percentage',
        'charges_type',
        'charges_amount',
        'number_of_days',
        'quantity',
        'sub_total',
        'per_day_amount',
        'ledger_amount',
        'is_auto_generated',
        'coa_code',
        'corporate_member_id',
        // ENT/CTS fields
        'ent_reason',
        'ent_comment',
        'ent_amount',
        'cts_comment',
        'cts_amount',
        'cts_payment_method',
    ];

    protected $casts = [
        'data' => 'array',
        'valid_from' => 'date',
        'valid_to' => 'date',
        'issue_date' => 'date',
        'due_date' => 'date',
        'payment_date' => 'date'
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'id');
    }

    public function corporateMember()
    {
        return $this->belongsTo(CorporateMember::class, 'corporate_member_id', 'id');
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by', 'id');
    }

    public function subscriptionType()
    {
        return $this->belongsTo(SubscriptionType::class, 'subscription_type_id', 'id');
    }

    public function subscriptionCategory()
    {
        return $this->belongsTo(SubscriptionCategory::class, 'subscription_category_id', 'id');
    }

    /**
     * Get the parent invoiceable model (RoomBooking, EventBooking, FoodOrder, etc.).
     */
    public function invoiceable()
    {
        return $this->morphTo();
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'invoice_id');
    }

    public function items()
    {
        return $this->hasMany(FinancialInvoiceItem::class, 'invoice_id');
    }

    public function transactions()
    {
        return $this->hasMany(Transaction::class, 'invoice_id');
    }
}
