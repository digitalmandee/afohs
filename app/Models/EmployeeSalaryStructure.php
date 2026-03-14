<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EmployeeSalaryStructure extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'basic_salary',
        'effective_from',
        'effective_to',
        'is_active',
        'created_by',
        'updated_by'
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'is_active' => 'boolean'
    ];

    /**
     * Get the employee for this salary structure
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who created this structure
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated this structure
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scope to get active salary structures
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get current salary structures
     */
    public function scopeCurrent($query)
    {
        return $query
            ->where('effective_from', '<=', now())
            ->where(function ($q) {
                $q
                    ->whereNull('effective_to')
                    ->orWhere('effective_to', '>=', now());
            });
    }

    /**
     * Check if this salary structure is current
     */
    public function isCurrent()
    {
        return $this->effective_from <= now() &&
            ($this->effective_to === null || $this->effective_to >= now());
    }

    /**
     * Deactivate this salary structure
     */
    public function deactivate()
    {
        $this->update([
            'is_active' => false,
            'effective_to' => now()->subDay()
        ]);
    }

    /**
     * Get effective from date attribute
     */
    public function getEffectiveFromAttribute($value)
    {
        return $this->parseDate($value);
    }

    /**
     * Set effective from date attribute
     */
    public function setEffectiveFromAttribute($value)
    {
        $this->attributes['effective_from'] = $this->formatDateForStorage($value);
    }

    /**
     * Get effective to date attribute
     */
    public function getEffectiveToAttribute($value)
    {
        return $this->parseDate($value);
    }

    /**
     * Set effective to date attribute
     */
    public function setEffectiveToAttribute($value)
    {
        $this->attributes['effective_to'] = $this->formatDateForStorage($value);
    }

    /**
     * Helper to parse date
     */
    protected function parseDate($value)
    {
        if (!$value)
            return null;

        try {
            return \Carbon\Carbon::createFromFormat('Y-m-d', $value)->startOfDay();
        } catch (\Exception $e) {
            try {
                return \Carbon\Carbon::createFromFormat('d/m/Y', $value)->startOfDay();
            } catch (\Exception $e) {
                try {
                    return \Carbon\Carbon::parse($value);
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
            if ($value instanceof \Carbon\Carbon) {
                return $value->format('Y-m-d');
            }
            return \Carbon\Carbon::parse($value)->format('Y-m-d');
        } catch (\Exception $e) {
            try {
                return \Carbon\Carbon::createFromFormat('d/m/Y', $value)->format('Y-m-d');
            } catch (\Exception $e) {
                return $value;
            }
        }
    }
}
