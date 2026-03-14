<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;

class RoomBooking extends BaseModel
{
    use HasFactory;

    protected $fillable = [
        'booking_no',
        'customer_id',
        'member_id',
        'family_id',
        'corporate_member_id',
        'booking_date',
        'check_in_date',
        'check_in_time',
        'arrival_details',
        'check_out_date',
        'check_out_time',
        'departure_details',
        'guest_first_name',
        'guest_last_name',
        'guest_company',
        'guest_address',
        'guest_country',
        'guest_city',
        'guest_mob',
        'guest_email',
        'guest_cnic',
        'accompanied_guest',
        'acc_relationship',
        'booked_by',
        'booking_type',
        'room_id',
        'persons',
        'category',
        'nights',
        'per_day_charge',
        'room_charge',
        'security_deposit',
        'advance_amount',
        'total_other_charges',
        'total_mini_bar',
        'discount_type',
        'discount_value',
        'grand_total',
        'additional_data',
        'booking_docs',
        'additional_notes',
        'status',
        'cancellation_reason',
        'created_by',
        'updated_by',
    ];

    protected $casts = ['additional_data' => 'array'];

    protected $appends = ['invoice'];

    public function getInvoiceAttribute()
    {
        if ($this->relationLoaded('invoice')) {
            return $this->getRelation('invoice');
        }

        // Try polymorphic relationship first, fallback to JSON data
        $invoice = $this->invoice()->select('id', 'status', 'paid_amount', 'total_price', 'advance_payment')->first();

        return $invoice;
    }

    /**
     * Get the invoice for this room booking (polymorphic).
     */
    public function invoice()
    {
        return $this->morphOne(FinancialInvoice::class, 'invoiceable');
    }

    public function miniBarItems()
    {
        return $this->hasMany(RoomBookingMiniBarItem::class);
    }

    public function otherCharges()
    {
        return $this->hasMany(RoomBookingOtherCharge::class);
    }

    public function category()
    {
        return $this->belongsTo(RoomCategory::class, 'category', 'id');
    }

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class, 'customer_id', 'id');
    }

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'room_booking_id', 'id');
    }

    public function corporateMember()
    {
        return $this->belongsTo(CorporateMember::class, 'corporate_member_id', 'id');
    }

    public function memberFamily()
    {
        return $this->belongsTo(Member::class, 'family_id', 'id');
    }

    public function corporateFamily()
    {
        return $this->belongsTo(CorporateMember::class, 'family_id', 'id');
    }

    public function getFamilyMemberAttribute()
    {
        if ($this->member_id) {
            return $this->memberFamily;
        } elseif ($this->corporate_member_id) {
            return $this->corporateFamily;
        }
        return null;  // Return null if neither is set
    }
}
