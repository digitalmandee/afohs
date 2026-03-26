# Accounting Receipt Remediation Report

Date: 2026-03-26

## Summary

This report covers the remaining blocked receipt families:

- `maintenance_receipts` from backfill analyze run `16`
- `membership_receipts` from backfill analyze run `21`

These families remain intentionally blocked. No source receipt data was changed.

## Blocker Summary

| Family | Reason | Count | Amount | Oldest Date | Newest Date |
| --- | --- | ---: | ---: | --- | --- |
| `maintenance_receipts` | `missing_payment_account` | 23,418 | 350,892,021.75 | 2019-12-27 | 2026-02-12 |
| `maintenance_receipts` | `deleted_receipt` | 1 | 1,500.00 | 2026-02-12 | 2026-02-12 |
| `maintenance_receipts` | `mixed_family` | 98 | 2,518,202.00 | 2020-08-08 | 2025-08-15 |
| `membership_receipts` | `missing_payment_account` | 45 | 838,062.00 | 2026-02-11 | 2026-03-05 |

Total blocked amount still outside ledger: `354,249,785.75`

## Action Buckets

### Mapping Remediation List

File: `reports/accounting_receipt_mapping_remediation_2026-03-26.tsv`

Contains all receipts blocked by `missing_payment_account`, sorted by family, date, and source id.

Recommended action:

- Assign a valid `payment_account_id`
- Confirm the linked payment account has an active mapped postable COA
- Rerun the affected receipt family after mapping is fixed

### Policy-Exception List

File: `reports/accounting_receipt_policy_exceptions_2026-03-26.tsv`

Contains deleted receipts that remain blocked pending explicit business approval.

Recommended action:

- Keep blocked unless the business approves a deleted-receipt posting policy

### Unsupported-Source List

File: `reports/accounting_receipt_unsupported_sources_2026-03-26.tsv`

Contains mixed-family receipts that are intentionally unsupported by the current posting logic.

Recommended action:

- Keep unsupported until explicit mixed-family accounting logic exists

## Sample Blockers

### Missing Payment Account

- `maintenance_receipts` `#20` on `2019-12-27` for `50,000.00`
- `maintenance_receipts` `#37` on `2019-12-30` for `10,000.00`
- `membership_receipts` `#11033` on `2026-02-11` for `10,000.00`

### Deleted Receipt

- `maintenance_receipts` `#33418` on `2026-02-12` for `1,500.00`

### Mixed Family

- `maintenance_receipts` `#1914` on `2020-08-08` for `2,200.00`
- `maintenance_receipts` `#2257` on `2020-08-11` for `7,500.00`

## Controlled Rerun Path

After mappings are fixed, rerun in this order:

1. `maintenance_receipts`
2. `membership_receipts`

For each family:

1. Run analyze first
2. Confirm `missing_payment_account` counts have reduced as expected
3. Run commit with the existing chunk size
4. Reconcile by run id
5. Accept only:
   - posted
   - already_posted
   - deleted receipt
   - mixed family

Gate requirements:

- no duplicate journals
- no unexplained variance
- no fallback posting for unmapped receipts

## Current Decision

- `maintenance_receipts`: `NO-GO`
- `membership_receipts`: `NO-GO`

Both remain blocked until payment-account mappings are remediated.
