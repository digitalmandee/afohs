<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_id',
        'user_id',
        'booking_type',
        'booking_For',
        'type_id',
        'persons',
        'total_rooms',
        'checkin',
        'checkout',
        'event_name',
        'start_time',
        'end_time',
        'total_payment',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function typeable(): MorphTo
    {
        return $this->morphTo(__FUNCTION__, 'booking_type', 'type_id');
    }
}
