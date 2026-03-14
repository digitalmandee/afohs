<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BookingEvents extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_name',
        'date_time',
        'max_capacity',
        'pricing_type',
        'price_per_person',
        'status',
        'location',
        'photo_path',
    ];
}
