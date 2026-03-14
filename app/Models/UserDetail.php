<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserDetail extends Model
{
    use HasFactory;

    protected $table = 'user_details';

    protected $fillable = [
        'user_id',
        'coa_account',
        'title',
        'state',
        'application_number',
        'name_comments',
        'guardian_name',
        'guardian_membership',
        'nationality',
        'cnic_no',
        'passport_no',
        'gender',
        'ntn',
        'date_of_birth',
        'education',
        'membership_reason',
        'mobile_number_a',
        'mobile_number_b',
        'mobile_number_c',
        'telephone_number',
        'personal_email',
        'critical_email',
        'emergency_name',
        'emergency_relation',
        'emergency_contact',
        'current_address',
        'current_city',
        'current_country',
        'permanent_address',
        'permanent_city',
        'permanent_country',
        'country',
        'documents',
    ];

    protected $casts = [
        'documents' => 'array',
        'education' => 'array',
        'date_of_birth' => 'date',
    ];

    // public function user()
    // {
    //     return $this->belongsTo(User::class, 'user_id', 'user_id');
    // }
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // public function members()
    // {
    //     return $this->hasOne(Member::class, 'user_detail_id');
    // }
    // public function members()
    // {
    //     return $this->hasMany(Member::class, 'user_detail_id');
    // }
}