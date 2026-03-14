<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Carbon\Carbon;

class Voucher extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'voucher_code',
        'voucher_name',
        'description',
        'amount',
        'voucher_type',
        'member_id',
        'employee_id',
        'valid_from',
        'valid_to',
        'status',
        'is_used',
        'used_at',
        'created_by',
        'updated_by',
        'deleted_by'
    ];

    protected $casts = [
        'valid_from' => 'date',
        'valid_to' => 'date',
        'used_at' => 'datetime',
        'amount' => 'decimal:2',
        'is_used' => 'boolean'
    ];

    // Relationships
    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updatedBy()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    // Accessors & Mutators
    public function getRecipientAttribute()
    {
        if ($this->voucher_type === 'member' && $this->member) {
            return $this->member->full_name;
        } elseif ($this->voucher_type === 'employee' && $this->employee) {
            return $this->employee->name;
        }
        return 'Unknown';
    }

    public function getRecipientDetailsAttribute()
    {
        if ($this->voucher_type === 'member' && $this->member) {
            return [
                'id' => $this->member->id,
                'name' => $this->member->full_name,
                'membership_no' => $this->member->membership_no ?? 'N/A',
                'type' => 'Member'
            ];
        } elseif ($this->voucher_type === 'employee' && $this->employee) {
            return [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
                'employee_id' => $this->employee->employee_id ?? 'N/A',
                'type' => 'Employee'
            ];
        }
        return null;
    }

    public function getIsExpiredAttribute()
    {
        return Carbon::now()->gt($this->valid_to);
    }

    public function getIsValidAttribute()
    {
        $now = Carbon::now();
        return $now->gte($this->valid_from) && $now->lte($this->valid_to) && !$this->is_used;
    }

    public function getDaysRemainingAttribute()
    {
        if ($this->is_expired) {
            return 0;
        }
        return Carbon::now()->diffInDays($this->valid_to, false);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeValid($query)
    {
        return $query->where('valid_from', '<=', Carbon::now())
                    ->where('valid_to', '>=', Carbon::now())
                    ->where('is_used', false);
    }

    public function scopeExpired($query)
    {
        return $query->where('valid_to', '<', Carbon::now());
    }

    public function scopeForMembers($query)
    {
        return $query->where('voucher_type', 'member');
    }

    public function scopeForEmployees($query)
    {
        return $query->where('voucher_type', 'employee');
    }

    // Methods
    public function markAsUsed()
    {
        $this->update([
            'is_used' => true,
            'used_at' => Carbon::now(),
            'status' => 'used'
        ]);
    }

    public function updateStatus()
    {
        if ($this->is_used) {
            $this->status = 'used';
        } elseif ($this->is_expired) {
            $this->status = 'expired';
        } elseif ($this->is_valid) {
            $this->status = 'active';
        } else {
            $this->status = 'inactive';
        }
        $this->save();
    }

    // Boot method to generate voucher code
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($voucher) {
            if (!$voucher->voucher_code) {
                $voucher->voucher_code = $voucher->generateVoucherCode();
            }
        });
    }

    private function generateVoucherCode()
    {
        $prefix = strtoupper($this->voucher_type[0]); // M for Member, E for Employee
        $timestamp = Carbon::now()->format('ymd');
        $random = strtoupper(substr(md5(uniqid()), 0, 4));
        
        return "{$prefix}V{$timestamp}{$random}";
    }
}
