<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_name',
        'pay_frequency',
        'currency',
        'working_days_per_month',
        'working_hours_per_day',
        'overtime_rate_multiplier',
        'late_deduction_per_minute',
        'absent_deduction_type',
        'absent_deduction_amount',
        'max_allowed_absents',
        'grace_period_minutes',
        'tax_slabs'
    ];

    protected $casts = [
        'working_hours_per_day' => 'decimal:2',
        'overtime_rate_multiplier' => 'decimal:2',
        'late_deduction_per_minute' => 'decimal:2',
        'absent_deduction_amount' => 'decimal:2',
        'working_days_per_month' => 'integer',
        'max_allowed_absents' => 'integer',
        'grace_period_minutes' => 'integer',
        'tax_slabs' => 'array'
    ];

    /**
     * Get the default payroll settings or create if not exists
     */
    public static function getSettings()
    {
        $settings = self::first();

        if (!$settings) {
            $settings = self::create([
                'company_name' => 'Afohs Club',
                'pay_frequency' => 'monthly',
                'currency' => 'PKR',
                'working_days_per_month' => 26,
                'working_hours_per_day' => 8.0,
                'overtime_rate_multiplier' => 1.5,
                'late_deduction_per_minute' => 0.0,
                'absent_deduction_type' => 'full_day',
                'absent_deduction_amount' => 0.0,
                'max_allowed_absents' => 3,
                'grace_period_minutes' => 15,
                'tax_slabs' => []
            ]);
        }

        return $settings;
    }
}
