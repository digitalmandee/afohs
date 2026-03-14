<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayslipAllowance extends Model
{
    use HasFactory;

    protected $fillable = [
        'payslip_id',
        'allowance_type_id',
        'allowance_name',
        'amount',
        'is_taxable'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_taxable' => 'boolean'
    ];

    /**
     * Get the payslip for this allowance
     */
    public function payslip()
    {
        return $this->belongsTo(Payslip::class);
    }

    /**
     * Get the allowance type for this allowance
     */
    public function allowanceType()
    {
        return $this->belongsTo(AllowanceType::class);
    }

    /**
     * Scope to get taxable allowances
     */
    public function scopeTaxable($query)
    {
        return $query->where('is_taxable', true);
    }

    /**
     * Scope to get non-taxable allowances
     */
    public function scopeNonTaxable($query)
    {
        return $query->where('is_taxable', false);
    }
}
