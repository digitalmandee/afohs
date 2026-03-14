<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class EventBooking extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'booking_no',
        'customer_id',
        'member_id',
        'corporate_member_id',
        'event_venue_id',
        'family_id',
        'booking_date',
        'booking_type',
        'name',
        'address',
        'cnic',
        'mobile',
        'email',
        'ledger_amount',
        'booked_by',
        'nature_of_event',
        'event_date',
        'event_time_from',
        'event_time_to',
        'menu_charges',
        'addons_charges',
        'total_per_person_charges',
        'no_of_guests',
        'guest_charges',
        'extra_guests',
        'extra_guest_charges',
        'total_food_charges',
        'total_other_charges',
        'total_charges',
        'surcharge_type',
        'surcharge_amount',
        'surcharge_note',
        'reduction_type',
        'reduction_amount',
        'reduction_note',
        'total_price',
        'security_deposit',
        'advance_amount',
        'paid_amount',
        'booking_docs',
        'additional_notes',
        'additional_data',
        'status',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = ['additional_data' => 'array'];

    /**
     * Get the menu for the booking.
     */
    public function menu()
    {
        return $this->hasOne(EventBookingMenu::class, 'event_booking_id');
    }

    /**
     * Get the menu add-ons for the booking.
     */
    public function menuAddOns()
    {
        return $this->hasMany(EventBookingMenuAddOn::class, 'event_booking_id');
    }

    /**
     * Get the other charges for the booking.
     */
    public function otherCharges()
    {
        return $this->hasMany(EventBookingOtherCharges::class, 'event_booking_id');
    }

    /**
     * Get the event venue.
     */
    public function eventVenue()
    {
        return $this->belongsTo(EventVenue::class, 'event_venue_id', 'id');
    }

    /**
     * Get the customer (member).
     */
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

    /**
     * Get the family member.
     */
    public function familyMember()
    {
        return $this->belongsTo(Member::class, 'family_id', 'id');
    }

    /**
     * Get the invoice for this event booking (polymorphic).
     */
    public function invoice()
    {
        return $this->morphOne(FinancialInvoice::class, 'invoiceable');
    }

    /**
     * Get invoice attribute (alternative approach using accessor)
     */
    public function getInvoiceAttribute()
    {
        return $this->invoice()->select('id', 'status', 'total_price', 'paid_amount')->first();
    }
}
