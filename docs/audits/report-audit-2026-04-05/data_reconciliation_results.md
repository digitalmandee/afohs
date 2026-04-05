# Data Reconciliation Results
Date: 2026-04-05

## Scope Executed
- Row-volume and integrity checks on staging DB (`afohs-club`)
- Trial balance debit/credit tie-out
- Journal duplicate-key scan
- Procurement chain availability check (PR -> PO -> GRN -> Bill -> Payment -> Return)
- Accounting verification commands

## SQL/Command Results
### 1) Trial Balance Core Tie-Out
- Query result:
  - `total_debit = 811,888,958.00`
  - `total_credit = 811,888,958.00`
  - `difference = 0.00`
- Status: ✅ Balanced at aggregate ledger level.

### 2) Journal Duplicate Check
- Duplicate `module_type/module_id` rows (non-null keys): `0`
- Status: ✅ No duplicate posting signatures on non-null source keys.

### 3) Journal Source Distribution
- `maintenance_invoice`: 116,720
- `subscription_invoice`: 14,824
- `membership_invoice`: 33
- `opening_balance`: 1
- `subscription_receipt`: 1
- `NULL`: 3
- Status: ⚠️ Highly skewed dataset; procurement/inventory financial samples are very limited.

### 4) Procurement Chain Record Availability (staging snapshot)
- `purchase_requisitions = 0`
- `purchase_orders = 1`
- `goods_receipts = 0`
- `vendor_bills = 0`
- `vendor_payments = 0`
- `purchase_returns = 0`
- Status: ⚠️ End-to-end procurement report reconciliation could not be fully executed due insufficient staging transactions.

### 5) Opening Balance Posting Reconciliation
- Command: `php artisan accounting:verify-opening-balance-postings --limit=200`
- Result: `Missing journals: 0`, `Amount mismatches: 0`
- Status: ✅ Passed.

### 6) Accounting Module Health
- Command: `php artisan accounting:verify-module --limit=50`
- Result highlights:
  - Rules present: 15
  - Pending queue: 0
  - Failed queue: 60 (historical failures)
  - Voucher mapping defaults: missing payable/receivable fallback
- Status: ⚠️ Warning state (not clean signoff).

## Report-Level Data Accuracy Conclusion
- ✅ Accounting core reports can be reconciled at GL aggregate level.
- ⚠️ Procurement/inventory report accuracy cannot be declared complete with current staging volume.
- ⚠️ Historical failed accounting events require triage/allowlist policy before CFO signoff.

## Required Follow-up Dataset for Full Certification
1. Seed at least 30 transactions each across PR, PO, GRN, vendor bills, vendor payments, purchase returns.
2. Include partial and over-limit attempt cases for reconciliation behavior.
3. Re-run report parity checks by report family with source-level trace IDs.
