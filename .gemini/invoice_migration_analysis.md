# Invoice Migration Analysis

## Field Comparison: Old `finance_invoices` → New `financial_invoices`

### ✅ Fields that map directly (same or similar names):

| Old Table Field    | New Model Field    | Notes                                   |
| ------------------ | ------------------ | --------------------------------------- |
| `invoice_no`       | `invoice_no`       | Direct match                            |
| `customer_id`      | `customer_id`      | Direct match                            |
| `member_id`        | `member_id`        | Direct match                            |
| `invoice_type`     | `invoice_type`     | Direct match                            |
| `discount_details` | `discount_details` | Direct match                            |
| `status`           | `status`           | Direct match                            |
| `created_by`       | `created_by`       | Direct match                            |
| `updated_by`       | `updated_by`       | Direct match                            |
| `deleted_by`       | `deleted_by`       | Direct match                            |
| `invoice_date`     | `issue_date`       | Rename during migration                 |
| `total`            | `amount`           | Rename during migration                 |
| `grand_total`      | `total_price`      | Rename during migration                 |
| `discount_amount`  | `discount_value`   | Rename during migration                 |
| `comments`         | `remarks`          | Rename during migration                 |
| `extra_charges`    | `customer_charges` | May need to combine with charges_amount |
| `start_date`       | `period_start`     | Rename during migration                 |
| `end_date`         | `period_end`       | Rename during migration                 |

### ⚠️ Fields MISSING in new model (need to add columns):

| Old Table Field       | Suggested New Column  | Data Type         | Notes                     |
| --------------------- | --------------------- | ----------------- | ------------------------- |
| `booking_id`          | `booking_id`          | `bigint UNSIGNED` | For room/event bookings   |
| `name`                | `customer_name`       | `varchar(191)`    | Customer name             |
| `mem_no`              | `membership_number`   | `varchar(191)`    | Member number             |
| `address`             | `customer_address`    | `text`            | Customer address          |
| `contact`             | `customer_contact`    | `varchar(191)`    | Contact number            |
| `cnic`                | `customer_cnic`       | `varchar(191)`    | CNIC number               |
| `email`               | `customer_email`      | `varchar(191)`    | Email address             |
| `family`              | `family_name`         | `varchar(191)`    | Family name               |
| `extra_details`       | `extra_details`       | `text`            | Details for extra charges |
| `tax_charges`         | `tax_amount`          | `decimal(10,2)`   | Tax amount                |
| `tax_details`         | `tax_details`         | `text`            | Tax details               |
| `is_auto_generated`   | `is_auto_generated`   | `tinyint`         | Auto-generation flag      |
| `amount_in_words`     | `amount_in_words`     | `varchar(191)`    | Amount in words           |
| `ledger_amount`       | `ledger_amount`       | `decimal(10,2)`   | Ledger amount             |
| `discount_percentage` | `discount_percentage` | `decimal(5,2)`    | Discount %                |
| `extra_percentage`    | `extra_percentage`    | `decimal(5,2)`    | Extra charges %           |
| `tax_percentage`      | `tax_percentage`      | `decimal(5,2)`    | Tax %                     |
| `charges_type`        | `charges_type`        | `varchar(191)`    | Type of charges           |
| `charges_amount`      | `charges_amount`      | `decimal(10,2)`   | Additional charges        |
| `days`                | `number_of_days`      | `int`             | Number of days            |
| `qty`                 | `quantity`            | `int`             | Quantity                  |
| `sub_total`           | `sub_total`           | `decimal(10,2)`   | Subtotal before discounts |
| `per_day_amount`      | `per_day_amount`      | `decimal(10,2)`   | Daily rate                |
| `coa_code`            | `coa_code`            | `varchar(191)`    | Chart of Accounts code    |
| `corporate_id`        | `corporate_id`        | `bigint UNSIGNED` | Corporate entity ID       |

### 🆕 New fields (already exist in new model, set defaults during migration):

| New Model Field            | Default Value               | Notes                              |
| -------------------------- | --------------------------- | ---------------------------------- |
| `employee_id`              | `NULL`                      | Not in old table                   |
| `subscription_type`        | `NULL`                      | Not in old table                   |
| `discount_type`            | `'percentage'` or `'fixed'` | Determine from discount_percentage |
| `advance_payment`          | `0`                         | Not in old table                   |
| `paid_amount`              | `0`                         | Not in old table                   |
| `due_date`                 | Calculate from invoice_date | Add 30 days default                |
| `paid_for_month`           | Extract from period         | If available                       |
| `payment_method`           | `NULL`                      | Not in old table                   |
| `payment_date`             | `NULL`                      | Not in old table                   |
| `receipt`                  | `NULL`                      | Not in old table                   |
| `data`                     | Store old fields as JSON    | Preserve extra data                |
| `fee_type`                 | Determine from invoice_type | Map based on type                  |
| `payment_frequency`        | `NULL`                      | Not in old table                   |
| `quarter_number`           | Calculate from dates        | If applicable                      |
| `valid_from`               | Use `start_date`            | If available                       |
| `valid_to`                 | Use `end_date`              | If available                       |
| `credit_card_type`         | `NULL`                      | Not in old table                   |
| `subscription_type_id`     | `NULL`                      | Not in old table                   |
| `subscription_category_id` | `NULL`                      | Not in old table                   |
| `invoiceable_id`           | Use `booking_id`            | If available                       |
| `invoiceable_type`         | Determine from invoice_type | Polymorphic relation               |

## Migration Strategy

### Database Migration File Needed:

```php
// Create migration: add_old_finance_invoice_columns_to_financial_invoices_table.php
Schema::table('financial_invoices', function (Blueprint $table) {
    // Customer information
    $table->string('customer_name')->nullable();
    $table->string('membership_number')->nullable();
    $table->text('customer_address')->nullable();
    $table->string('customer_contact')->nullable();
    $table->string('customer_cnic')->nullable();
    $table->string('customer_email')->nullable();

    // Booking and family
    $table->unsignedBigInteger('booking_id')->nullable();
    $table->string('family_name')->nullable();

    // Charges and tax details
    $table->text('extra_details')->nullable();
    $table->decimal('tax_amount', 10, 2)->nullable();
    $table->text('tax_details')->nullable();
    $table->decimal('discount_percentage', 5, 2)->nullable();
    $table->decimal('extra_percentage', 5, 2)->nullable();
    $table->decimal('tax_percentage', 5, 2)->nullable();

    // Additional charges
    $table->string('charges_type')->nullable();
    $table->decimal('charges_amount', 10, 2)->nullable();

    // Calculation fields
    $table->integer('number_of_days')->nullable();
    $table->integer('quantity')->nullable();
    $table->decimal('sub_total', 10, 2)->nullable();
    $table->decimal('per_day_amount', 10, 2)->nullable();
    $table->decimal('ledger_amount', 10, 2)->nullable();

    // Metadata
    $table->boolean('is_auto_generated')->default(false);
    $table->string('amount_in_words')->nullable();
    $table->string('coa_code')->nullable();
    $table->unsignedBigInteger('corporate_id')->nullable();
});
```

### Invoice Type Mapping:

Based on the old system, you'll need to map `invoice_type` values:

- **1** = Membership Invoice
- **2** = Maintenance Invoice
- **3** = Booking Invoice (if applicable)
- Add more based on your business logic

## Next Steps:

1. ✅ Create database migration to add missing columns
2. ✅ Add migration route to web.php
3. ✅ Create `migrateInvoices()` method in DataMigrationController
4. ✅ Add UI button to trigger migration
5. ✅ Test with sample data
