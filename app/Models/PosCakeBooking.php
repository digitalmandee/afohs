<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class PosCakeBooking extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'pos_cake_bookings';

    protected $fillable = [
        'booking_number',
        'branch_id',
        'tenant_id',
        'member_id',
        'corporate_id',
        'customer_id',
        'employee_id',
        'customer_type',
        'customer_name',
        'customer_phone',
        'family_member_id',
        'booking_date',
        'delivery_date',
        'pickup_time',
        'cake_type_id',
        'weight',
        'flavor',
        'topping',
        'filling',
        'icing',
        'color',
        'message',
        'special_instructions',
        'special_display',
        'attachment_path',
        'has_attachment',
        'total_price',
        'tax_amount',
        'discount_amount',
        'advance_amount',
        'balance_amount',
        'payment_mode',
        'status',
        'receiver_name',
        'receiver_address',
        'delivery_note',
        'created_by',
        'order_id'
    ];

    protected $casts = [
        'booking_date' => 'date',
        'delivery_date' => 'date',
        'has_attachment' => 'boolean',
        'weight' => 'decimal:2',
        'total_price' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'advance_amount' => 'decimal:2',
        'balance_amount' => 'decimal:2',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function corporateMember()
    {
        return $this->belongsTo(CorporateMember::class, 'corporate_id');
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function familyMember()
    {
        return $this->belongsTo(Member::class, 'family_member_id');
    }

    public function cakeType()
    {
        return $this->belongsTo(Product::class, 'cake_type_id');
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    // Optional: Local scope for tenant or branch if not using Global Scopes
    public function scopeTenant($query)
    {
        if (session()->has('active_restaurant_id')) {
            return $query->where('tenant_id', session('active_restaurant_id'));
        }
        return $query;
    }
}
