<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventBookingOtherCharges extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_booking_id',
        'type',
        'details',
        'amount',
        'is_complementary',
    ];

    protected $casts = [
        'is_complementary' => 'boolean',
    ];

    /**
     * Get the event booking that owns the charge.
     */
    public function eventBooking()
    {
        return $this->belongsTo(EventBooking::class, 'event_booking_id');
    }
}
