<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EventBookingMenu extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_booking_id',
        'event_menu_id',
        'name',
        'amount',
        'items',
    ];

    protected $casts = [
        'items' => 'array',
    ];

    /**
     * Get the event booking that owns the menu.
     */
    public function eventBooking()
    {
        return $this->belongsTo(EventBooking::class, 'event_booking_id');
    }

    /**
     * Get the event menu.
     */
    public function eventMenu()
    {
        return $this->belongsTo(EventMenu::class, 'event_menu_id');
    }
}
