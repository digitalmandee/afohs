<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'customer_no',
        'name',
        'address',
        'gender',
        'cnic',
        'contact',
        'email',
        'guest_type_id',
        'member_name',
        'member_no',
        'old_customer_id',
        'account',
        'affiliate',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    public function guestType()
    {
        return $this->belongsTo(GuestType::class);
    }
}
