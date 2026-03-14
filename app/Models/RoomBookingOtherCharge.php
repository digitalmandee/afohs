<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RoomBookingOtherCharge extends Model
{
    use HasFactory;

    protected $fillable = ['room_booking_id', 'type', 'details', 'amount', 'is_complementary'];

    protected $casts = [
        'is_complementary' => 'boolean',
    ];

    public function roomBooking()
    {
        return $this->belongsTo(RoomBooking::class);
    }
}
