<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class Member extends BaseModel
{
    use SoftDeletes;

    protected $fillable = [
        'old_family_id',
        'old_member_id',
        'barcode_no',
        'membership_no',
        'member_type_id',
        'member_category_id',
        'kinship',
        'parent_id',
        'family_suffix',
        'first_name',
        'middle_name',
        'last_name',
        'full_name',
        'relation',
        'martial_status',
        'phone_number',
        'start_date',
        'end_date',
        'membership_date',
        'card_status',
        'status',
        'card_issue_date',
        'card_expiry_date',
        'from_date',
        'to_date',
        'picture',
        'member_image',
        'qr_code',
        'invoice_id',
        'is_document_missing',
        'missing_documents',
        'coa_category_id',
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
        'reason',
        'blood_group',
        'tel_number_a',
        'tel_number_b',
        'active_remarks',
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
        'classification_id',
        'expiry_extended_by',
        'expiry_extension_date',
        'expiry_extension_reason',
        'auto_expiry_calculated',
        'created_by',
        'updated_by',
        'deleted_by',
        'business_developer_id',
        'membership_fee',
        'additional_membership_charges',
        'membership_fee_additional_remarks',
        'membership_fee_discount',
        'membership_fee_discount_remarks',
        'total_membership_fee',
        'maintenance_fee',
        'additional_maintenance_charges',
        'maintenance_fee_additional_remarks',
        'maintenance_fee_discount',
        'maintenance_fee_discount_remarks',
        'total_maintenance_fee',
        'per_day_maintenance_fee',
        'comment_box',
    ];

    protected $casts = [
        'category_ids' => 'array',
        'is_document_missing' => 'boolean',
        'date_of_birth' => 'date',
        'card_expiry_date' => 'date',
        'expiry_extension_date' => 'datetime',
        'auto_expiry_calculated' => 'boolean',
    ];

    protected $appends = [
        'membership_duration',
        'membership_start_date'
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($member) {
            if ($member->isForceDeleting()) {
                // Force delete relationships if member is force deleted
                $member->familyMembers()->forceDelete();
                $member->media()->forceDelete();
                $member->professionInfo()->forceDelete();
            } else {
                // Soft delete relationships
                $member->familyMembers()->delete();
                $member->media()->delete();
                $member->professionInfo()->delete();
            }
        });

        static::restored(function ($member) {
            // Restore relationships
            $member->familyMembers()->restore();
            $member->media()->restore();
            $member->professionInfo()->restore();
        });
    }

    public static function generateNextMembershipNumber(): string
    {
        $lastNumber = self::orderBy('id', 'desc')
            ->whereNull('parent_id')
            ->pluck('membership_no')
            ->map(function ($number) {
                $number = trim((string) $number);
                if ($number === '') {
                    return 0;
                }

                if (!preg_match('/(\d+)(?:-\d+)?\s*$/', $number, $matches)) {
                    return 0;
                }

                $digits = $matches[1] ?? '';
                if ($digits === '' || strlen($digits) > 6) {
                    return 0;
                }

                return (int) $digits;
            })
            ->max() ?? 0;

        $next = $lastNumber + 1;

        // Minimum 3 digits, but will grow if needed (e.g., "001", "099", "1000")
        return str_pad((string) $next, 3, '0', STR_PAD_LEFT);
    }

    public static function generateNextApplicationNo()
    {
        $lastMember = self::orderBy('id', 'desc')->first();
        if ($lastMember && preg_match('/APP-(\d+)/', $lastMember->application_number, $matches)) {
            $nextNumber = intval($matches[1]) + 1;
        } else {
            $nextNumber = 1;  // Start from 1 if no members exist or format doesn't match
        }
        return 'APP-' . str_pad($nextNumber, 4, '0', STR_PAD_LEFT);
    }

    public function memberType()
    {
        return $this->belongsTo(MemberType::class);
    }

    public function kinshipMember()
    {
        return $this->belongsTo(Member::class, 'kinship', 'id');
    }

    public function memberCategory()
    {
        return $this->belongsTo(MemberCategory::class);
    }

    public function primaryMember()
    {
        return $this->belongsTo(Member::class, 'primary_member_id');
    }

    public function userDetail()
    {
        return $this->belongsTo(UserDetail::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Member::class, 'parent_id', 'id');
    }

    public function familyMembers()
    {
        return $this->hasMany(Member::class, 'parent_id', 'id');
    }

    public function statusHistories()
    {
        return $this->hasMany(MemberStatusHistory::class, 'member_id', 'id');
    }

    public function membershipInvoice()
    {
        return $this
            ->hasOne(FinancialInvoice::class, 'member_id', 'id')
            ->where(function ($query) {
                $query
                    ->where('fee_type', 'membership_fee')
                    ->orWhere(function ($q) {
                        $q
                            ->where('fee_type', 'mixed')
                            ->whereHas('items', function ($sq) {
                                $sq->where('fee_type', 'membership_fee');
                            });
                    });
            })
            ->orderBy('id', 'desc');
    }

    public function professionInfo()
    {
        return $this->hasOne(MemberProfessionInfo::class);
    }

    /**
     * Get all media for the member (polymorphic relationship)
     */
    public function media()
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    /**
     * Get the profile photo media
     */
    public function profilePhoto()
    {
        return $this
            ->morphOne(Media::class, 'mediable')
            ->where('type', 'profile_photo')
            ->orderBy('id', 'desc');
    }

    /**
     * Get all document media (excluding profile photo)
     */
    public function documents()
    {
        return $this
            ->morphMany(Media::class, 'mediable')
            ->where('type', 'member_docs');
    }

    public function pausedHistories()
    {
        return $this
            ->hasMany(MemberStatusHistory::class, 'member_id', 'id')
            ->where('status', 'pause')
            ->whereNull('used_up_to');
    }

    /**
     * Calculate the current age of the member
     */
    public function getAgeAttribute()
    {
        if (!$this->date_of_birth) {
            return null;
        }

        return $this->date_of_birth->diffInYears(now());
    }

    /**
     * Check if member is a family member (has parent_id)
     */
    public function isFamilyMember()
    {
        return !is_null($this->parent_id);
    }

    /**
     * Check if family member should be expired based on age
     */
    public function shouldExpireByAge()
    {
        $relation = strtolower((string) ($this->relation ?? ''));
        if (!in_array($relation, ['son', 'daughter'], true)) {
            return false;
        }

        return $this->isFamilyMember() &&
            $this->age >= 25 &&
            $this->status !== 'expired' &&
            !$this->hasValidExtension();
    }

    /**
     * Check if member has a valid expiry extension
     */
    public function hasValidExtension()
    {
        if (is_null($this->expiry_extension_date)) {
            return false;
        }

        // Convert to Carbon if it's a string
        $extensionDate = $this->expiry_extension_date instanceof \Carbon\Carbon
            ? $this->expiry_extension_date
            : \Carbon\Carbon::parse($this->expiry_extension_date);

        return $extensionDate->isFuture();
    }

    /**
     * Calculate automatic expiry date based on 25th birthday
     */
    public function calculateAutoExpiryDate()
    {
        if (!$this->date_of_birth) {
            return null;
        }

        return $this->date_of_birth->copy()->addYears(25);
    }

    /**
     * Expire family member due to age
     */
    public function expireByAge($reason = 'Automatic expiry - Member reached 25 years of age')
    {
        $this->update([
            'status' => 'expired',
            'card_status' => 'Expired',
            'updated_by' => Auth::id() ?? 1,  // System user
        ]);

        // Log the status change
        $this->statusHistories()->create([
            'status' => 'expired',
            'reason' => $reason,
            'start_date' => now()->toDateString(),
            'end_date' => null,  // No end date for expired status
            'created_by' => Auth::id() ?? 1,
        ]);
    }

    /**
     * Extend expiry date for family member (Super Admin only)
     */
    public function extendExpiry($extensionDate, $reason, $extendedBy)
    {
        // Convert string date to Carbon object if needed
        $carbonDate = is_string($extensionDate) ? Carbon::parse($extensionDate) : $extensionDate;

        $this->update([
            'expiry_extension_date' => $carbonDate,
            'expiry_extension_reason' => $reason,
            'expiry_extended_by' => $extendedBy,
            'status' => 'active',  // Reactivate if expired
            'updated_by' => $extendedBy,
        ]);

        // Log the extension
        $this->statusHistories()->create([
            'status' => 'extended',
            'reason' => "Expiry extended until {$carbonDate->format('Y-m-d')}: {$reason}",
            'start_date' => now()->toDateString(),
            'end_date' => $carbonDate->toDateString(),
            'created_by' => $extendedBy,
        ]);
    }

    /**
     * Scope to get family members who should be expired by age
     */
    public function scopeFamilyMembersToExpire($query)
    {
        return $query
            ->whereNotNull('parent_id')
            ->whereNotNull('date_of_birth')
            ->whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) >= 25')
            ->where('status', '!=', 'expired')
            ->whereIn('relation', ['Son', 'Daughter'])
            ->where(function ($q) {
                $q
                    ->whereNull('expiry_extension_date')
                    ->orWhere('expiry_extension_date', '<', now());
            });
    }

    /**
     * Relationship to the user who extended the expiry
     */
    public function expiryExtendedBy()
    {
        return $this->belongsTo(User::class, 'expiry_extended_by');
    }

    /**
     * Calculate membership duration from membership start date
     */
    public function getMembershipDurationAttribute()
    {
        // Use membership_date if available, otherwise fall back to created_at
        $startDate = $this->membership_date ? Carbon::parse($this->membership_date) : $this->created_at;

        if (!$startDate) {
            return 'N/A';
        }

        try {
            $now = Carbon::now();

            // Calculate total months first
            $totalMonths = $startDate->diffInMonths($now);

            // Convert to years and remaining months
            $years = intval($totalMonths / 12);
            $months = $totalMonths % 12;

            if ($years > 0) {
                if ($months > 0) {
                    return $years . ' year' . ($years > 1 ? 's' : '') . ', ' . $months . ' month' . ($months > 1 ? 's' : '');
                } else {
                    return $years . ' year' . ($years > 1 ? 's' : '');
                }
            } else {
                if ($months <= 0) {
                    return 'Less than 1 month';
                }
                return $months . ' month' . ($months > 1 ? 's' : '');
            }
        } catch (\Exception $e) {
            return 'Invalid date';
        }
    }

    /**
     * Get membership start date (membership_date or created_at)
     */
    public function getMembershipStartDateAttribute()
    {
        return $this->membership_date ?: $this->created_at;
    }

    public function businessDeveloper()
    {
        return $this->belongsTo(Employee::class, 'business_developer_id');
    }

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class, 'family_member_id');
    }
}
