<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

class AppliedMember extends Model
{
    use SoftDeletes;

    protected $table = 'applied_member';

    protected $fillable = [
        'member_id',
        'name',
        'email',
        'phone_number',
        'address',
        'amount_paid',
        'cnic',
        'start_date',
        'end_date',
        'is_permanent_member',
    ];

    protected $casts = [
        'amount_paid' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'is_permanent_member' => 'boolean',
    ];

    // Accessor to return start_date in YYYY-MM-DD format
    public function getStartDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y-m-d') : null;
    }

    // Accessor to return end_date in YYYY-MM-DD format
    public function getEndDateAttribute($value)
    {
        return $value ? Carbon::parse($value)->format('Y-m-d') : null;
    }

    public static function generateMembershipNumber(): string
    {
        $lastNumber = self::orderBy('id', 'desc')
            ->pluck('id')
            ->max() ?? 0;

        $next = $lastNumber + 1;
        return $next;
    }

    public function financialInvoice()
    {
        return $this->morphOne(FinancialInvoice::class, 'invoiceable')->latestOfMany();
    }
}
