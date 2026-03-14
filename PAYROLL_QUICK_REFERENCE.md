# 🚀 PAYROLL SYSTEM - QUICK REFERENCE GUIDE

## 📋 Quick Start Checklist

### ✅ Initial Setup (One-time)
1. **Run Database Setup**:
   ```bash
   php artisan migrate  # Includes description column for periods
   php artisan db:seed --class=PayrollSeeder
   ```

2. **Configure System Settings**:
   - Go to `/admin/employees/payroll/settings`
   - Set working days: 26, working hours: 8.0
   - Configure grace period: 15 minutes

3. **Verify Default Types**:
   - Check `/admin/employees/payroll/allowance-types` (6 default types)
   - Check `/admin/employees/payroll/deduction-types` (7 default types)

---

## 🔄 Monthly Payroll Process (Step-by-Step)

### Step 1: Create Payroll Period
**Route**: `/admin/employees/payroll/periods/create`
```
✅ Start Date: 1st of month
✅ End Date: Last day of month  
✅ Pay Date: 5th of next month
✅ Status: Active
✅ Auto-generate name: "January 2024"
```

### Step 2: Setup Employee Salaries (If Not Done)
**Route**: `/admin/employees/payroll/salaries`
```
For each employee:
✅ Basic Salary: Rs 50,000
✅ Add Allowances: HRA, Transport, etc.
✅ Add Deductions: Tax, PF, etc.
✅ Verify Net Salary calculation
```

### Step 3: Process Payroll
**Route**: `/admin/employees/payroll/process`
```
✅ Select active period
✅ Choose employees to process
✅ Review payroll preview
✅ Execute batch processing
✅ Monitor progress
```

### Step 4: Review Payslips
**Route**: `/admin/employees/payroll/payslips`
```
✅ Filter by current period
✅ Review individual payslips
✅ Approve payslips
✅ Generate reports
```

### Step 5: Mark as Paid
**Route**: `/admin/employees/payroll/periods`
```
✅ Update period status to "Paid"
✅ Generate final reports
✅ Archive period data
```

---

## 🎯 Key Routes Reference

| Function | Route | Purpose |
|----------|-------|---------|
| **Dashboard** | `/admin/employees/payroll/dashboard` | Overview & statistics |
| **Settings** | `/admin/employees/payroll/settings` | System configuration |
| **Allowances** | `/admin/employees/payroll/allowance-types` | Manage allowance types |
| **Deductions** | `/admin/employees/payroll/deduction-types` | Manage deduction types |
| **Salaries** | `/admin/employees/payroll/salaries` | Employee salary overview |
| **Create Salary** | `/admin/employees/payroll/salaries/create/{id}` | Setup employee salary |
| **Edit Salary** | `/admin/employees/payroll/salaries/edit/{id}` | Modify employee salary |
| **View Salary** | `/admin/employees/payroll/salaries/view/{id}` | View salary details |
| **Periods** | `/admin/employees/payroll/periods` | Payroll periods list |
| **Create Period** | `/admin/employees/payroll/periods/create` | New payroll period |
| **Process** | `/admin/employees/payroll/process` | Run payroll processing |
| **Payslips** | `/admin/employees/payroll/payslips` | Payslip management |
| **Reports** | `/admin/employees/payroll/reports` | Analytics & reports |

---

## 🔧 Common Tasks

### Add New Employee to Payroll
1. Go to `/admin/employees/payroll/salaries`
2. Find employee with "No Structure" status
3. Click "Create" → Fill salary details → Save
4. Verify in next payroll period

### Modify Employee Salary
1. Go to `/admin/employees/payroll/salaries`
2. Click "Edit" for employee
3. Update basic salary, allowances, deductions
4. Set new effective date → Save

### Create Monthly Payroll
1. `/admin/employees/payroll/periods/create`
2. Set dates for current month
3. Status: "Active" → Create Period
4. Go to `/admin/employees/payroll/process`
5. Select period → Process employees

### Generate Reports
1. `/admin/employees/payroll/reports`
2. Select report type (Summary/Detailed)
3. Choose period and filters
4. Generate → Print/Export

---

## ⚠️ Important Notes

### Data Validation
- **Basic Salary**: Must be > 0
- **Dates**: End date > Start date, Pay date >= End date
- **Periods**: No overlapping periods allowed
- **Types**: Allowance/Deduction types must be unique

### System Limits
- **Employees**: Optimized for 8000+ employees
- **Batch Size**: 100 employees per batch
- **Currency**: Pakistani Rupee (PKR) only
- **Decimal Places**: 2 decimal places for amounts

### Business Rules
- **Working Days**: 26 days per month (configurable)
- **Working Hours**: 8 hours per day (configurable)
- **Grace Period**: 15 minutes for late arrivals
- **Overtime Rate**: 1.5x multiplier
- **Max Absents**: 3 per month (configurable)

---

## 🚨 Troubleshooting Quick Fixes

| Issue | Quick Fix |
|-------|-----------|
| **"No salary structure" showing** | Check employee has active salary structure with current effective date |
| **Allowance type shows "null"** | Use `allowance.allowance_type?.type \|\| 'N/A'` in code |
| **Create button shows popup** | Update onClick to `router.visit(route('...'))` |
| **API 404 errors** | Verify route names match API endpoints |
| **Validation 422 errors** | Check all required fields are included in request |
| **Period creation fails** | Ensure no overlapping periods exist |
| **Payroll processing stuck** | Check for employees without salary structures |

---

## 📊 Default System Data

### Default Allowance Types
1. **HRA** - House Rent Allowance (Fixed)
2. **Transport** - Transport Allowance (Fixed)
3. **Medical** - Medical Allowance (Fixed)
4. **Food** - Food Allowance (Fixed)
5. **Performance Bonus** - Performance Bonus (Conditional)
6. **Communication** - Communication Allowance (Fixed)

### Default Deduction Types
1. **Income Tax** - Income Tax (Percentage)
2. **PF** - Provident Fund (Percentage)
3. **EOBI** - Employee Old-Age Benefits (Fixed)
4. **Professional Tax** - Professional Tax (Fixed)
5. **Health Insurance** - Health Insurance (Fixed)
6. **Loan** - Loan Deduction (Fixed)
7. **Advance** - Advance Deduction (Fixed)

---

## 🎯 Success Indicators

### ✅ System is Working Correctly When:
- Dashboard shows current statistics
- All employees have salary structures
- Payroll periods process without errors
- Payslips generate with correct calculations
- Reports show accurate data
- No 404 or validation errors occur

### 📈 Performance Metrics:
- **Page Load**: < 3 seconds
- **Payroll Processing**: < 5 minutes for 100 employees
- **Report Generation**: < 30 seconds
- **Database Queries**: Optimized with proper indexes

---

**Quick Reference Version**: 1.0.0  
**Last Updated**: November 2024  
**For Full Documentation**: See `PAYROLL_SYSTEM_README.md`
