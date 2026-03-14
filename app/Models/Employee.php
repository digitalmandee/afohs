<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends BaseModel
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'department_id',
        'subdepartment_id',
        'designation_id',
        'shift_id',
        'branch_id',
        'employee_id',
        'name',
        'email',
        'designation',
        'phone_no',
        'employment_type',
        'address',
        'emergency_no',
        'gender',
        'marital_status',
        'national_id',
        'account_no',
        'salary',
        'joining_date',
        'created_by',
        'updated_by',
        'deleted_by',
        // Additional fields from old HR system
        'father_name',
        'age',
        'date_of_birth',
        'mob_b',
        'tel_a',
        'tel_b',
        'cur_city',
        'cur_country',
        'per_address',
        'per_city',
        'per_country',
        'license',
        'license_no',
        'vehicle_details',
        'bank_details',
        'learn_of_org',
        'anyone_in_org',
        'company',
        'crime',
        'crime_details',
        'remarks',
        'barcode',
        'picture',
        'old_employee_id',
        'total_addon_charges',
        'total_salary',
        'days',
        'hours',
        'total_deduction_charges',
        'nationality',
        'status',
        'payment_method',
        'contract_start_date',
        'contract_end_date',
        'academic_qualification',
        'academic_institution',
        'academic_year',
        'work_experience_years',
        'previous_employer',
        'previous_position',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function subdepartment()
    {
        return $this->belongsTo(Subdepartment::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    public function media()
    {
        return $this->morphMany(Media::class, 'mediable');
    }

    public function photo()
    {
        return $this->morphOne(Media::class, 'mediable')->where('type', 'employee_photo');
    }

    public function documents()
    {
        return $this->morphMany(Media::class, 'mediable')->where('type', 'employee_document');
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function leaveApplications()
    {
        return $this->hasMany(LeaveApplication::class, 'employee_id', 'id');
    }

    /**
     * Get the current salary structure for this employee
     */
    public function salaryStructure()
    {
        return $this->hasOne(EmployeeSalaryStructure::class)->where('is_active', true)->latest();
    }

    /**
     * Get all salary structures for this employee
     */
    public function salaryStructures()
    {
        return $this->hasMany(EmployeeSalaryStructure::class);
    }

    /**
     * Get active allowances for this employee
     */
    public function allowances()
    {
        return $this->hasMany(EmployeeAllowance::class)->where('is_active', true);
    }

    /**
     * Get active deductions for this employee
     */
    public function deductions()
    {
        return $this->hasMany(EmployeeDeduction::class)->where('is_active', true);
    }

    /**
     * Get all payslips for this employee
     */
    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * Get the latest payslip for this employee
     */
    public function latestPayslip()
    {
        return $this->hasOne(Payslip::class)->latest();
    }

    public function loans()
    {
        return $this->hasMany(EmployeeLoan::class);
    }

    public function activeLoans()
    {
        return $this->loans()->active();
    }

    public function advances()
    {
        return $this->hasMany(EmployeeAdvance::class);
    }

    public function activeAdvances()
    {
        return $this->advances()->active();
    }

    /**
     * Check if employee has active salary structure
     */
    public function hasActiveSalaryStructure()
    {
        return $this->salaryStructure()->exists();
    }

    /**
     * Get current basic salary
     */
    public function getCurrentBasicSalary()
    {
        $salaryStructure = $this->salaryStructure;
        return $salaryStructure ? $salaryStructure->basic_salary : 0;
    }

    /**
     * Designation Relation
     */
    public function designationRef()
    {
        return $this->belongsTo(Designation::class, 'designation_id');
    }

    /**
     * Accessor for 'designation' attribute to maintain backward compatibility.
     * Returns the name from the relation if exists, otherwise the legacy string column.
     *
     * @param string|null $value
     * @return string|null
     */
    public function getDesignationAttribute($value)
    {
        if ($this->designation_id && $this->relationLoaded('designationRef')) {
            return $this->designationRef->name;
        }

        // If relation not loaded but ID exists, we might want to lazy load or just return legacy if it matches?
        // To avoid N+1, we rely on eager loading 'designationRef' in controllers.
        // However, if we strictly need the name and legacy column is still there (migrated data), the legacy column HAS the name.
        // But for NEW records, legacy column might be null.
        // So:
        // 1. If designation_id is set:
        //    a. If relation loaded, return name.
        //    b. If not loaded, we can try to return $value (legacy char) IF it's populated.
        //       If $value is null (new record), we force load or return null?
        // Let's safe-guard:

        if ($this->designation_id && !$value && $this->getAttribute('designation_id')) {
            // New record, legacy column null. Try to get from relation (might trigger query)
            return $this->designationRef ? $this->designationRef->name : null;
        }

        return $value;
    }
}
