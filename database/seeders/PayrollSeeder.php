<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PayrollSetting;
use App\Models\AllowanceType;
use App\Models\DeductionType;

class PayrollSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default payroll settings
        PayrollSetting::create([
            'company_name' => 'Afohs Club',
            'pay_frequency' => 'monthly',
            'currency' => 'PKR',
            'working_days_per_month' => 26,
            'working_hours_per_day' => 8.00,
            'overtime_rate_multiplier' => 1.5,
            'late_deduction_per_minute' => 5.00,
            'absent_deduction_type' => 'full_day',
            'absent_deduction_amount' => 0.00,
            'max_allowed_absents' => 3,
            'grace_period_minutes' => 15
        ]);

        // Create default allowance types
        $allowanceTypes = [
            [
                'name' => 'House Rent Allowance (HRA)',
                'type' => 'percentage',
                'is_taxable' => true,
                'is_active' => true,
                'description' => 'Housing allowance for employees'
            ],
            [
                'name' => 'Transport Allowance',
                'type' => 'fixed',
                'is_taxable' => true,
                'is_active' => true,
                'description' => 'Transportation allowance for daily commute'
            ],
            [
                'name' => 'Medical Allowance',
                'type' => 'fixed',
                'is_taxable' => false,
                'is_active' => true,
                'description' => 'Medical and healthcare allowance'
            ],
            [
                'name' => 'Food Allowance',
                'type' => 'fixed',
                'is_taxable' => true,
                'is_active' => true,
                'description' => 'Daily meal allowance'
            ],
            [
                'name' => 'Performance Bonus',
                'type' => 'fixed',
                'is_taxable' => true,
                'is_active' => true,
                'description' => 'Monthly performance-based bonus'
            ],
            [
                'name' => 'Communication Allowance',
                'type' => 'fixed',
                'is_taxable' => true,
                'is_active' => true,
                'description' => 'Mobile and internet allowance'
            ]
        ];

        foreach ($allowanceTypes as $allowanceType) {
            AllowanceType::create($allowanceType);
        }

        // Create default deduction types
        $deductionTypes = [
            [
                'name' => 'Income Tax',
                'type' => 'percentage',
                'is_mandatory' => true,
                'calculation_base' => 'gross_salary',
                'is_active' => true,
                'description' => 'Government income tax deduction'
            ],
            [
                'name' => 'Provident Fund (PF)',
                'type' => 'percentage',
                'is_mandatory' => true,
                'calculation_base' => 'basic_salary',
                'is_active' => true,
                'description' => 'Employee provident fund contribution'
            ],
            [
                'name' => 'Social Security (EOBI)',
                'type' => 'percentage',
                'is_mandatory' => true,
                'calculation_base' => 'basic_salary',
                'is_active' => true,
                'description' => 'Employees Old-Age Benefits Institution'
            ],
            [
                'name' => 'Professional Tax',
                'type' => 'fixed',
                'is_mandatory' => true,
                'calculation_base' => 'basic_salary',
                'is_active' => true,
                'description' => 'Professional tax deduction'
            ],
            [
                'name' => 'Health Insurance',
                'type' => 'fixed',
                'is_mandatory' => false,
                'calculation_base' => 'basic_salary',
                'is_active' => true,
                'description' => 'Employee health insurance premium'
            ],
            [
                'name' => 'Loan Deduction',
                'type' => 'fixed',
                'is_mandatory' => false,
                'calculation_base' => 'basic_salary',
                'is_active' => true,
                'description' => 'Employee loan installment deduction'
            ],
            [
                'name' => 'Advance Salary',
                'type' => 'fixed',
                'is_mandatory' => false,
                'calculation_base' => 'basic_salary',
                'is_active' => true,
                'description' => 'Advance salary deduction'
            ]
        ];

        foreach ($deductionTypes as $deductionType) {
            DeductionType::create($deductionType);
        }
    }
}
