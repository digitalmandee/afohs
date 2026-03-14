<?php

namespace App\Models;

use Illuminate\Database\Eloquent\SoftDeletes;

class Room extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'name',
        'number_of_beds',
        'max_capacity',
        'number_of_bathrooms',
        'photo_path',
        'room_type_id',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    public function roomType()
    {
        return $this->belongsTo(RoomType::class);
    }

    public function categoryCharges()
    {
        return $this->hasMany(RoomCategoryCharge::class, 'room_id');
    }

    public function bookings()
    {
        return $this->hasMany(RoomBooking::class);
    }

    public function currentBooking()
    {
        return $this->hasOne(RoomBooking::class)->where('status', 'checked_in');
    }
}
