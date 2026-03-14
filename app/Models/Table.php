<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use HasFactory;

    // Allow mass assignment for these attributes
    protected $fillable = ['floor_id', 'table_no', 'capacity', 'tenant_id', 'location_id'];

    protected $appends = ['available'];

    // Define the relationship with the Floor model
    public function floor()
    {
        return $this->belongsTo(Floor::class);
    }

    public function getAvailableAttribute()
    {
        $now = Carbon::now();

        // You can pass in date/time via request or make it configurable
        $startDate = request()->input('start_date', $now->toDateString());
        $startTime = request()->input('start_time', $now->toTimeString());

        return !Order::where('table_id', $this->id)
            ->whereDate('start_date', $startDate)
            ->whereTime('start_time', '<=', $startTime)
            ->whereIn('status', ['pending', 'in_progress', 'reserved'])  // Active/reserved status
            ->exists();
    }

    public function reservations()
    {
        return $this->hasMany(Reservation::class, 'table_id', 'id');
    }

    public function orders()
    {
        return $this->hasMany(Order::class, 'table_id', 'id');
    }
}
