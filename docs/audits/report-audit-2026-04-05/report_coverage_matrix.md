# Report Coverage Matrix (CFO Audit)
Date: 2026-04-05  
Environment: Staging DB (`afohs-club`) + local app routes/controllers

## Evidence Baseline
- Route inventory built from `php artisan route:list --json`
- Report hub/source mapping reviewed in [AccountingReportController.php](/Users/sannanmalik/Downloads/Afohs-club-main/app/Http/Controllers/Accounting/AccountingReportController.php:159)
- Accounting report export/branding methods reviewed in [AccountingReportController.php](/Users/sannanmalik/Downloads/Afohs-club-main/app/Http/Controllers/Accounting/AccountingReportController.php:228)
- Procurement insights surface reviewed in [ProcurementInsightsController.php](/Users/sannanmalik/Downloads/Afohs-club-main/app/Http/Controllers/Procurement/ProcurementInsightsController.php:24)
- Deliverable inventory source: [report_catalog.csv](/Users/sannanmalik/Downloads/Afohs-club-main/docs/audits/report-audit-2026-04-05/report_catalog.csv)

## Accounting / Finance
| Required Report | Status | Evidence | Gap |
|---|---|---|---|
| COA List | ✅ | `accounting.coa.index` route | Linked and usable |
| Accounts Activity Report | ⚠️ | `accounting.general-ledger` exists | Detailed activity exists; no separate summarized “activity pack” view |
| Account Balances | ✅ | Trial Balance + Balance Sheet routes | Covered by TB/BS |
| Vouchers List & Details | ✅ | `accounting.vouchers.index/show` | Present with print/pdf endpoints |
| Day Book | ✅ | `accounting.reports.day-book` + print/pdf/csv | Linked |
| Cash Book | ✅ | `accounting.reports.cash-book` + print/pdf/csv | Linked |
| Bank Book | ✅ | `accounting.reports.bank-book` + print/pdf/csv | Linked |
| Bank Reports | ⚠️ | Bank book + reconciliation pages exist | No dedicated multi-report “bank reports pack” |
| General Ledger (Summary + Detailed) | ⚠️ | Detailed GL exists | Summary variant not a dedicated page |
| Trial Balance | ✅ | `accounting.reports.trial-balance` | Linked |
| Income Statement (P&L) | ✅ | `accounting.reports.profit-loss` | Linked |
| Cash Flow Statement | ❌ | No direct accounting cash-flow report route | Missing formal cash-flow statement |
| Balance Sheet | ✅ | `accounting.reports.balance-sheet` | Linked |

## Payables / Procurement
| Required Report | Status | Evidence | Gap |
|---|---|---|---|
| Transit Voucher Accounts List | ❌ | Not found in routes/controllers | Missing |
| Payable List & Details | ⚠️ | `accounting.reports.payables-aging`, vendor bills index | Aging/list available; no dedicated payable details report pack |
| Supplier Pending Payments | ⚠️ | Procurement payment-run/discrepancy views exist | Not standardized as report with export suite |
| Supplier Outstanding Bills (Summary) | ✅ | AP aging + vendor bills | Covered |
| Purchase Requisition (Summary + Detailed) | ⚠️ | PR index exists | Register exists; formal summary/detail reporting page not separated |
| Purchase Invoice Reports (Summary + Supplier-wise) | ⚠️ | Vendor bill listing exists | Missing dedicated supplier-wise analytics report |

## Inventory / Store
| Required Report | Status | Evidence | Gap |
|---|---|---|---|
| Item Purchase Summary (Category-wise) | ❌ | Not found | Missing |
| Item Purchase History | ❌ | Not found | Missing |
| Daily GRN List | ⚠️ | GRN register exists | No dedicated daily report page/export contract |
| Store Issue Notes (Summary + Detail) | ⚠️ | Inventory docs/operations exist | Report layer partial |
| Item Issue (Detailed + Category-wise) | ❌ | Not found as dedicated report | Missing |
| Store Activity Report | ⚠️ | Inventory operations view | Not a formal report hub-backed report |
| Delivery Notes (Summary + Type-wise) | ⚠️ | Delivery note register + print | Missing summary/type-wise analytics report |
| Item Delivery Summary | ❌ | Not found | Missing |
| Monthly Rate Analysis | ❌ | Not found | Missing |

## Returns / Adjustments
| Required Report | Status | Evidence | Gap |
|---|---|---|---|
| Purchase Return Summary & Detail | ⚠️ | Purchase return register exists | Dedicated report package missing |
| Item Purchase Return Reports | ❌ | Not found | Missing |
| Stock Adjustment Summary | ⚠️ | Inventory docs include stock adjustment type | No dedicated summary report view/export |
| Item Adjustment Summary | ❌ | Not found | Missing |

## Operations / Others
| Required Report | Status | Evidence | Gap |
|---|---|---|---|
| Warehouse / Department Activity Report | ⚠️ | Warehouse valuation + operations available | Partial, not single consolidated report |
| Expense List | ✅ | `accounting.expenses` route | Present |
| Daily Cash Report | ⚠️ | Cash book exists | Exists as accounting cash book; dedicated ops “daily cash report” semantics not isolated |

## Duplicate / Access Findings
- ⚠️ Duplicate-intent surfaces exist (same dataset accessible via module register and report hub shortcut).
- ⚠️ Several reports are reachable only from accounting/admin contexts; role-friendly cross-module report entry is inconsistent.
- ⚠️ Report hub is present but catalog is still incomplete against requested CFO list.

## Overall Coverage Verdict
- ✅ Core accounting statutory pack: largely implemented.
- ⚠️ Procurement/inventory operational reporting: fragmented and often register-based (not report-grade).
- ❌ Multiple requested inventory and return analytics reports are missing.
