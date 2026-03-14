<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class PartnerAffiliate extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $table = 'partners_affiliates';

    protected $fillable = [
        'type',
        'organization_name',
        'facilitation_details',
        'address',
        'telephone',
        'mobile_a',
        'mobile_b',
        'email',
        'website',
        'focal_person_name',
        'focal_mobile_a',
        'focal_mobile_b',
        'focal_telephone',
        'focal_email',
        'agreement_date',
        'agreement_end_date',
        'status',
        'comments',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected $casts = [
        'agreement_date' => 'date',
        'agreement_end_date' => 'date',
    ];

    /**
     * Get the media files (Agreement Documents) for the partner/affiliate.
     */
    public function media()
    {
        return $this->morphMany(Media::class, 'mediable');
    }
}
