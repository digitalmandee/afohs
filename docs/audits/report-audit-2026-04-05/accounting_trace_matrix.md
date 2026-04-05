# Accounting Trace Matrix
Date: 2026-04-05

## Method
- Verified financial-impact report paths against:
  - source route/controller
  - journal tables (`journal_entries`, `journal_lines`)
  - accounting queue verification output
- Trace target pattern: `Report -> Source/Voucher -> Journal Entry -> Journal Lines -> GL context`

## Trace Results
| Report / Surface | Source Controller | Trace to Journal | Result | Notes |
|---|---|---|---|---|
| Trial Balance | `AccountingReportController@trialBalance` | Aggregates from `journal_lines` grouped by account | ✅ | Direct ledger-based report |
| General Ledger | `AccountingReportController@generalLedger` | Uses `journal_lines` joined `journal_entries` | ✅ | Includes source resolution labels/links |
| Day Book | `AccountingReportController@dayBook` | Day-sliced `journal_entries` + lines | ✅ | Print/pdf/csv parity path present |
| Cash Book | `AccountingReportController@cashBook` | Account-book report over journal + payment account filters | ✅ | Cash payment method constrained |
| Bank Book | `AccountingReportController@bankBook` | Account-book report over journal + bank methods | ✅ | Bank payment methods constrained |
| AP Aging | `AccountingReportController@payablesAging` | Vendor bill outstanding; indirect accounting tie | ⚠️ | Subledger-based, not pure journal roll-up |
| Receivables Aging | `AccountingReportController@receivablesAging` | Financial invoice outstanding; indirect accounting tie | ⚠️ | Subledger-based, journal trace indirect |
| Accounting Vouchers | `AccountingVoucherController@index/show` | Voucher -> journal via posting adapter | ⚠️ | Feature present, but staging has 0 voucher records |
| Procurement registers (PO/GRN/Bill/Payment/Return) | Procurement controllers | Journal trace depends on posted source docs | ⚠️ | Staging dataset insufficient for full chain proof |

## Command-Based Integrity Evidence
- `php artisan accounting:verify-module --limit=50`
  - Queue posted: `131579`
  - Queue failed: `60`
  - Inventory document posting matrix present and adapter coverage reported.
- `php artisan accounting:verify-opening-balance-postings --limit=200`
  - Opening balance trace reconciliation passed.

## Critical Trace Gaps
1. No staged AP/AR invoice-linked voucher allocations to fully verify `Report -> Voucher -> Journal -> GL` for new intelligent voucher scenarios.
2. Procurement chain trace cannot be certified due near-empty procurement tables in staging.
3. Existing queue failures indicate historical posting exceptions still in dataset.

## Verdict
- Core accounting reports are journal-linked and traceable.
- Full cross-module financial trace is **partially validated**, not fully certified yet on current staging data.
