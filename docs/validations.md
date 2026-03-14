# System Validations

This document outlines the validation rules implemented across the Frontend and Backend to ensure data integrity.

## 1. Frontend Validations (`transaction_validation.js` / Component Logic)

### General Rules

- **Required Fields**: Member, at least one Item.
- **Positive Amounts**: All monetary values must be >= 0.

### Maintenance Fee Logic

- **Sequential Dates**: `valid_to` must be greater than or equal to `valid_from`.
- **Month Boundaries**: Dates are automatically snapped to the 1st and last day of the month for Maintenance Fees.
- **Overlap Prevention**:
    - The system checks the selected date range against the `valid_from` and `valid_to` of all **PAID** transaction items in the history.
    - If an overlap is detected, the user is blocked from adding the item.

### Subscription Logic

- **Category Required**: Must select a Subscription Category (e.g., Gym, Swimming).
- **Type Required**: Must select a valid type (Monthly, Daily).

---

## 2. Backend Validations (`MemberTransactionController.php`)

### Request Validation

The `store` method uses Laravel's `validate()` method:

```php
$request->validate([
    'member_id' => 'required_without:corporate_member_id|...',
    'items' => 'required|array|min:1',
    'items.*.fee_type' => 'required|string',
    'items.*.amount' => 'required|numeric|min:0',
    'payment_method' => 'required_if:action,save_receive',
]);
```

### Business Logic Validations

1.  **Duplicate One-Time Fees**:
    - **Membership Fee**: checks `checkMembershipFeeExists($memberId)`. If a member already has an active Membership Fee invoice, a second one cannot be created unless the previous one is Cancelled.
2.  **Maintenance Fee Continuity** (Soft Validation):

    - The backend ensures the `maintenance_fees` are processed conceptually, but hard overlap checks are primarily driven by the Frontend for UX. The backend relies on the integrity of the data passed.

3.  **Status Transitions**:
    - **Cancellation**: An invoice cannot be cancelled without a `cancellation_reason`.
    - **Voiding**: Cancelling a Paid invoice automatically voids the associated Ledger entries (Debit and Credit) to balance the books.

---

## 3. Database Constraints

- **Foreign Keys**: `member_id`, `invoice_id` are enforced foreign keys.
- **Enums**: `status` (unpaid, paid, partial, cancelled, refunded).
- **Soft Deletes**: All financial records (`FinancialInvoice`, `Transaction`) use Soft Deletes for audit trails.
