<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_name',
        'start_date',
        'end_date',
        'pay_date',
        'status',
        'description',
        'total_employees',
        'total_gross_amount',
        'total_deductions',
        'total_net_amount',
        'created_by',
        'processed_by',
        'processed_at'
    ];

    protected $casts = [
        'processed_at' => 'datetime',
        'total_gross_amount' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_net_amount' => 'decimal:2'
    ];

    /**
     * Get payslips for this period
     */
    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * Get start date attribute
     */
    public function getStartDateAttribute($value)
    {
        return $this->parseDate($value);
    }

    /**
     * Set start date attribute
     */
    public function setStartDateAttribute($value)
    {
        $this->attributes['start_date'] = $this->formatDateForStorage($value);
    }

    /**
     * Get end date attribute
     */
    public function getEndDateAttribute($value)
    {
        return $this->parseDate($value);
    }

    /**
     * Set end date attribute
     */
    public function setEndDateAttribute($value)
    {
        $this->attributes['end_date'] = $this->formatDateForStorage($value);
    }

    /**
     * Get pay date attribute
     */
    public function getPayDateAttribute($value)
    {
        return $this->parseDate($value);
    }

    /**
     * Set pay date attribute
     */
    public function setPayDateAttribute($value)
    {
        $this->attributes['pay_date'] = $this->formatDateForStorage($value);
    }

    /**
     * Helper to parse date
     */
    protected function parseDate($value)
    {
        if (!$value)
            return null;

        try {
            return Carbon::createFromFormat('Y-m-d', $value)->startOfDay();
        } catch (\Exception $e) {
            try {
                return Carbon::createFromFormat('d/m/Y', $value)->startOfDay();
            } catch (\Exception $e) {
                try {
                    return Carbon::parse($value);
                } catch (\Exception $e) {
                    return null;
                }
            }
        }
    }

    /**
     * Helper to format date for storage
     */
    protected function formatDateForStorage($value)
    {
        if (!$value)
            return null;

        try {
            if ($value instanceof Carbon) {
                return $value->format('Y-m-d');
            }
            return Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            try {
                return Carbon::createFromFormat('d/m/Y', $value)->format('Y-m-d');
            } catch (\Exception $e) {
                return $value;
            }
        }
    }

    /**
     * Get the user who created this period
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who processed this period
     */
    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Scope to get periods by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to get current month period
     */
    public function scopeCurrentMonth($query)
    {
        return $query
            ->whereMonth('start_date', now()->month)
            ->whereYear('start_date', now()->year);
    }

    /**
     * Get formatted period name
     */
    public function getFormattedPeriodNameAttribute()
    {
        return $this->period_name ?: Carbon::parse($this->start_date)->format('M Y') . ' Payroll';
    }

    /**
     * Check if period is editable
     */
    public function isEditable()
    {
        return in_array($this->status, ['draft', 'processing']);
    }

    /**
     * Check if period is processable
     */
    public function isProcessable()
    {
        return $this->status === 'draft';
    }

    /**
     * Generate period name automatically
     */
    public static function generatePeriodName($startDate, $endDate)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);

        if ($start->month === $end->month) {
            return $start->format('F Y') . ' Payroll';
        } else {
            return $start->format('M') . '-' . $end->format('M Y') . ' Payroll';
        }
    }
}
