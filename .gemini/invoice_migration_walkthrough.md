# Invoice Migration Walkthrough

## Overview

This document explains how to migrate invoices from the old `finance_invoices` table to the new `financial_invoices` table, specifically for **Membership Fees** and **Maintenance Fees**.

---

## Old Table Field: `invoice_type` (or `trans_type`)

In the old database, invoices were categorized by type:

- **Type 3** → Membership Fee Invoice
- **Type 4** → Maintenance Fee Invoice

For now, we will **ONLY migrate Type 3 and Type 4** invoices.

---

## Field Mapping: Old → New

### 1️⃣ **Direct Matches** (Same field names)

| Old Table Column   | New Table Column   | Notes                           |
| ------------------ | ------------------ | ------------------------------- |
| `invoice_no`       | `invoice_no`       | Unique invoice number           |
| `customer_id`      | `customer_id`      | Customer/Guest ID               |
| `member_id`        | `member_id`        | Member ID                       |
| `invoice_type`     | `invoice_type`     | Keep the original type (3 or 4) |
| `discount_details` | `discount_details` | Discount description            |
| `status`           | `status`           | Invoice status                  |
| `created_by`       | `created_by`       | User who created                |
| `updated_by`       | `updated_by`       | User who updated                |
| `deleted_by`       | `deleted_by`       | User who deleted                |
| `created_at`       | `created_at`       | Timestamp                       |
| `updated_at`       | `updated_at`       | Timestamp                       |
| `deleted_at`       | `deleted_at`       | Soft delete timestamp           |

---

### 2️⃣ **Renamed Fields** (Different names, same purpose)

| Old Column        | New Column         | Migration Logic |
| ----------------- | ------------------ | --------------- |
| `invoice_date`    | `issue_date`       | Direct copy     |
| `total`           | `amount`           | Direct copy     |
| `grand_total`     | `total_price`      | Direct copy     |
| `discount_amount` | `discount_value`   | Direct copy     |
| `comments`        | `remarks`          | Direct copy     |
| `extra_charges`   | `customer_charges` | Direct copy     |
| `start_date`      | `valid_from`       | Direct copy     |
| `end_date`        | `valid_to`         | Direct copy     |

---

### 3️⃣ **Customer Information** (Preserved from old table)

These fields store customer details at the time of invoice creation:

| Old Column | New Column  | Purpose                       |
| ---------- | ----------- | ----------------------------- |
| `name`     | `name`      | Customer name at invoice time |
| `mem_no`   | `mem_no`    | Membership number             |
| `address`  | `address`   | Customer address              |
| `contact`  | `contact`   | Contact number                |
| `cnic`     | `cnic`      | CNIC number                   |
| `email`    | `email`     | Email address                 |
| `family`   | `family_id` | Family ID (foreign key)       |

> **Why preserve these?** Even if member/customer is updated later, the invoice should show historical data from when it was created.

---

### 4️⃣ **Financial Calculation Fields**

| Old Column            | New Column            | Purpose                         |
| --------------------- | --------------------- | ------------------------------- |
| `sub_total`           | `sub_total`           | Subtotal before tax/discount    |
| `discount_amount`     | `discount_value`      | Discount amount in rupees       |
| `discount_percentage` | `discount_percentage` | Discount percentage (e.g., 10%) |
| `extra_charges`       | `customer_charges`    | Additional charges              |
| `extra_details`       | `extra_details`       | Details of extra charges        |
| `extra_percentage`    | `extra_percentage`    | Extra charges %                 |
| `tax_charges`         | `tax_amount`          | Tax amount                      |
| `tax_details`         | `tax_details`         | Tax description                 |
| `tax_percentage`      | `tax_percentage`      | Tax percentage                  |
| `ledger_amount`       | `ledger_amount`       | Amount for accounting ledger    |

---

### 5️⃣ **Quantity & Period Calculation**

| Old Column       | New Column       | Purpose          |
| ---------------- | ---------------- | ---------------- |
| `start_date`     | `valid_from`     | Fee period start |
| `end_date`       | `valid_to`       | Fee period end   |
| `days`           | `number_of_days` | Number of days   |
| `qty`            | `quantity`       | Quantity         |
| `per_day_amount` | `per_day_amount` | Daily rate       |
| `charges_type`   | `charges_type`   | Type of charge   |
| `charges_amount` | `charges_amount` | Charge amount    |

---

### 6️⃣ **Metadata & Accounting**

| Old Column          | New Column          | Purpose                |
| ------------------- | ------------------- | ---------------------- |
| `is_auto_generated` | `is_auto_generated` | Auto-generated flag    |
| `coa_code`          | `coa_code`          | Chart of Accounts code |
| `corporate_id`      | `corporate_id`      | Corporate entity ID    |

---

### 7️⃣ **New Fields to Set During Migration**

These fields don't exist in the old table, so we need to set defaults:

| New Column                 | Default Value                      | Logic                                                                                     |
| -------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------- |
| `employee_id`              | `NULL`                             | Not tracked in old system                                                                 |
| `subscription_type`        | `NULL`                             | Not tracked in old system                                                                 |
| `discount_type`            | Calculate                          | If `discount_percentage` > 0 → `'percentage'`, else `'fixed'`                             |
| `advance_payment`          | `0`                                | Not tracked in old system                                                                 |
| `paid_amount`              | `grand_total` if `status = 'paid'` | Based on status                                                                           |
| `due_date`                 | `invoice_date + 30 days`           | Calculate 30 days from issue                                                              |
| `paid_for_month`           | Extract from `period_start`        | Format: `YYYY-MM`                                                                         |
| `payment_method`           | `NULL`                             | Not tracked in old system                                                                 |
| `payment_date`             | `NULL` or `updated_at` if paid     | Check status                                                                              |
| `receipt`                  | `NULL`                             | Not tracked in old system                                                                 |
| `data`                     | Store old fields as JSON           | Preserve extra data                                                                       |
| `fee_type`                 | Based on `invoice_type`            | Type 3 → `'membership'`, Type 4 → `'maintenance'`                                         |
| `payment_frequency`        | Based on period                    | Calculate from dates                                                                      |
| New Column                 | Default Value                      | Logic                                                                                     |
| -------------------------- | ---------------------------------- | -------------------------------------------------------------------------                 |
| `employee_id`              | `NULL`                             | Not tracked in old system                                                                 |
| `subscription_type`        | `NULL`                             | Not tracked in old system                                                                 |
| `discount_type`            | Calculate                          | If `discount_percentage` > 0 → `'percentage'`, else `'fixed'`                             |
| `advance_payment`          | `0`                                | Not tracked in old system                                                                 |
| `paid_amount`              | `grand_total` if `status = 'paid'` | Based on status                                                                           |
| `due_date`                 | `invoice_date + 30 days`           | Calculate 30 days from issue                                                              |
| `paid_for_month`           | Extract from `period_start`        | Format: `YYYY-MM`                                                                         |
| `payment_method`           | `NULL`                             | Not tracked in old system                                                                 |
| `payment_date`             | `NULL` or `updated_at` if paid     | Check status                                                                              |
| `receipt`                  | `NULL`                             | Not tracked in old system                                                                 |
| `data`                     | Store old fields as JSON           | Preserve extra data                                                                       |
| `fee_type`                 | Based on `invoice_type`            | Type 3 → `'membership'`, Type 4 → `'maintenance'`                                         |
| `payment_frequency`        | Based on period                    | Calculate from dates                                                                      |
| `quarter_number`           | Calculate                          | If maintenance, determine quarter                                                         |
| `valid_from`               | Use `start_date`                   | Direct copy from old table                                                                |
| `valid_to`                 | Use `end_date`                     | Direct copy from old table                                                                |
| `credit_card_type`         | `NULL`                             | Not tracked                                                                               |
| `subscription_type_id`     | Lookup                             | Match member's subscription type                                                          |
| `subscription_category_id` | Lookup                             | Match member's category                                                                   |
| `invoiceable_id`           | `NULL`                             | Not used for Membership/Maintenance fees (unless linking to specific subscription record) |
| `invoiceable_type`         | `NULL`                             | Not used for Membership/Maintenance fees                                                  |

> **Note on `member_id` vs `invoiceable`:**
>
> - `member_id` (New) maps directly from `member_id` (Old). This identifies the **Payer**.
> - `invoiceable` is typically used for the **Item** being billed (e.g., Room Booking).
> - For Membership/Maintenance fees, the "Item" is the membership itself, which is already linked via `member_id`, so `invoiceable` can remain `NULL` or be used if you want to link to a specific `Subscription` record in the future. For this migration, we will keep it `NULL` to avoid complexity.

---

## Migration Logic by Invoice Type

### **Type 3: Membership Fee**

```php
// Field mapping for Membership Fee
[
    'fee_type' => 'membership',
    'invoice_type' => 3,
    'paid_for_month' => date('Y-m', strtotime($old->period_start)),
    'subscription_type_id' => getMemberSubscriptionType($old->member_id),
    'subscription_category_id' => getMemberSubscriptionCategory($old->member_id),
    'quarter_number' => null, // Not applicable for membership
]
```

### **Type 4: Maintenance Fee**

```php
// Field mapping for Maintenance Fee
[
    'fee_type' => 'maintenance',
    'invoice_type' => 4,
    'paid_for_month' => date('Y-m', strtotime($old->period_start)),
    'quarter_number' => calculateQuarter($old->period_start), // Q1, Q2, Q3, Q4
    'subscription_type_id' => getMemberSubscriptionType($old->member_id),
    'subscription_category_id' => getMemberSubscriptionCategory($old->member_id),
]
```

---

## Discount Type Calculation

```php
if (!empty($oldInvoice->discount_percentage) && $oldInvoice->discount_percentage > 0) {
    $discountType = 'percentage';
} else {
    $discountType = 'fixed';
}
```

---

## Quarter Number Calculation (for Maintenance)

```php
function calculateQuarter($date) {
    $month = (int) date('m', strtotime($date));

    if ($month >= 1 && $month <= 3) return 1; // Q1: Jan-Mar
    if ($month >= 4 && $month <= 6) return 2; // Q2: Apr-Jun
    if ($month >= 7 && $month <= 9) return 3; // Q3: Jul-Sep
    if ($month >= 10 && $month <= 12) return 4; // Q4: Oct-Dec

    return null;
}
```

---

## Payment Frequency Calculation

```php
function calculatePaymentFrequency($periodStart, $periodEnd) {
    if (empty($periodStart) || empty($periodEnd)) {
        return 'one-time';
    }

    $start = new DateTime($periodStart);
    $end = new DateTime($periodEnd);
    $diff = $start->diff($end);
    $months = ($diff->y * 12) + $diff->m;

    if ($months <= 1) return 'monthly';
    if ($months <= 3) return 'quarterly';
    if ($months <= 6) return 'semi-annual';
    if ($months <= 12) return 'annual';

    return 'one-time';
}
```

---

## Data Preservation (JSON field)

Store old fields that don't have exact matches in the `data` JSON column:

```php
$data = [
    'old_invoice_id' => $oldInvoice->id,
    'migration_date' => now(),
    'original_fields' => [
        'invoice_date' => $oldInvoice->invoice_date,
        'total' => $oldInvoice->total,
        'grand_total' => $oldInvoice->grand_total,
    ]
];
```

---

## Migration Steps

1. ✅ Run database migration to add columns
2. ✅ Implement `migrateInvoices()` method in `DataMigrationController`
3. ✅ Filter old invoices: `WHERE invoice_type IN (3, 4)`
4. ✅ Loop through each invoice and map fields
5. ✅ Calculate derived fields (discount_type, quarter_number, etc.)
6. ✅ Validate and insert into new table
7. ✅ Log success/errors

---

## Sample Migration Code Structure

```php
public function migrateInvoices(Request $request)
{
    try {
        DB::beginTransaction();

        // Get only Type 3 (Membership) and Type 4 (Maintenance) invoices
        $oldInvoices = DB::connection('old_database')
            ->table('finance_invoices')
            ->whereIn('invoice_type', [3, 4]) // Only membership & maintenance
            ->whereNull('deleted_at')
            ->get();

        $migrated = 0;
        $errors = [];

        foreach ($oldInvoices as $old) {
            try {
                $this->migrateSingleInvoice($old);
                $migrated++;
            } catch (\Exception $e) {
                $errors[] = [
                    'invoice_no' => $old->invoice_no,
                    'error' => $e->getMessage()
                ];
            }
        }

        DB::commit();

        return response()->json([
            'success' => true,
            'migrated' => $migrated,
            'errors' => $errors
        ]);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'message' => $e->getMessage()
        ], 500);
    }
}
```

---

## Next Steps

1. Run the migration: `php artisan migrate`
2. Implement the `migrateInvoices()` method
3. Add UI button in Data Migration page
4. Test with a small batch first
5. Review migrated data
6. Run full migration

---

## Important Notes

⚠️ **Before Migration:**

- Backup your database
- Test on staging first
- Verify member_id references exist in new members table

⚠️ **During Migration:**

- Use database transactions
- Log all errors
- Keep old data intact (don't delete)

⚠️ **After Migration:**

- Verify data integrity
- Check financial calculations
- Validate all relationships
