# Accounting, Procurement, and Cross-Module Improvement Master Plan

## 1) Current-State Assessment (Your System Today)

### What is already in place
- New Accounting module routes/pages: dashboard, COA, journals, general ledger, receivables, outstanding, payables, expenses, bank accounts, budgets, reports.
- New Procurement module routes/pages: vendors, purchase orders, goods receipts, vendor bills, vendor payments.
- Core accounting data model exists: `coa_accounts`, `journal_entries`, `journal_lines`, `accounting_rules`, `budgets`.
- Procurement posting hooks exist through `PostingService` + `AccountingRule` for:
  - GRN (`purchase_receipt`)
  - Vendor bill (`vendor_bill`)
  - Vendor payment (`vendor_payment`)
- Warehouse foundation exists via `warehouses` + `inventory_transactions`.

### Critical gaps found
- Cross-module posting is incomplete:
  - Membership/subscription invoices and receipts still run mostly through legacy `transactions` flows, not unified journal posting.
  - POS sales are not yet fully posted to the new GL with COGS/inventory/bank split logic.
- Procurement create forms are still basic (manual IDs in places, no 3-way match workflow, no approval lifecycle screens).
- COA UX improved but still missing full enterprise tree capabilities:
  - roll-up balances by parent/type
  - account usage indicators
  - stronger governance on edits/moves/disable actions
- Banking lacks bank statement import and reconciliation workflow.
- Automation/workflow is limited (approvals, recurring entries, scheduled closes, exception queues).
- Reporting is basic financial statements only; management reporting pack is missing.

## 2) Benchmark Comparison (Best-in-Class ERP Patterns)

Reference pattern used: SAP Business One / Oracle NetSuite / Microsoft Dynamics 365 / Odoo Enterprise style controls.

### Capability comparison
- COA governance: **Partial**
  - Best systems: strict account classes, blocked invalid parent-child combinations, bulk import templates, edit locks after posting.
  - Your status: type locking and basic hierarchy; needs controls + rollups + templates.
- Procure-to-Pay: **Basic**
  - Best systems: PR -> PO -> GRN -> Bill -> Payment with approvals and 2/3-way match tolerances.
  - Your status: PO/GRN/Bill/Payment exists, but no full match/tolerance/approval engine.
- Order-to-Cash integration: **Limited**
  - Best systems: invoice/receipt posting auto-journaled by product/service rules.
  - Your status: new GL not yet primary source for membership/subscription/POS/rooms/events.
- Banking & reconciliation: **Basic**
  - Best systems: statement import, auto-match rules, exception queue.
  - Your status: bank account master only.
- Reporting & close: **Basic**
  - Best systems: close checklist, aging packs, cash flow, variance analytics, drilldown.
  - Your status: trial balance, balance sheet, P&L, GL.
- Auditability & controls: **Partial**
  - Best systems: immutable posted docs, reversal policy, approval logs, maker-checker.
  - Your status: request-level logging started; needs document workflow/audit layers.

## 3) Target Architecture (Unified Finance Core)

### Principle
Move to a single financial truth:
- Operational modules (membership, subscription, POS, room/event booking, procurement, inventory, payroll) create business documents.
- Accounting posting engine converts documents into balanced `journal_entries`/`journal_lines`.
- Legacy `transactions` become either:
  - transitional source mirrored to journals, or
  - reporting-only legacy tables during migration period.

### Posting design
- Create a posting map per module event:
  - membership invoice issued
  - subscription invoice issued
  - receipt collected (cash/bank/online)
  - POS day close / shift close
  - GRN received
  - vendor bill posted
  - vendor payment posted
  - stock adjustments/transfers
  - payroll post
- Enforce balanced journal validation before commit.
- Add idempotency key per source document to prevent double posting.

## 4) Database Enhancements (Tables to Add)

### Governance & automation
- `accounting_event_queue`
  - queued posting events from all modules with status/retry/error.
- `accounting_posting_logs`
  - per-event posting trace, payload hash, journal links, error stack.
- `document_sequences`
  - central sequence control for PO/GRN/BILL/PAY/JE by tenant/year.
- `approval_workflows`, `approval_steps`, `approval_actions`
  - maker-checker for PO, bill, payment, journal, budget.

### Accounting depth
- `recurring_journals`
- `journal_attachments`
- `cost_centers`, `projects`, `departments`
- `tax_codes`, `tax_groups`
- `fiscal_calendars`, `period_close_checklists`
- `account_balances_monthly` (materialized balance snapshots)

### Procurement depth
- `purchase_requisitions`, `purchase_requisition_items`
- `purchase_order_approvals`
- `vendor_price_lists`
- `vendor_contracts`
- `goods_receipt_discrepancies`
- `bill_matching_results`

### Inventory/warehouse depth
- `warehouse_bins`
- `stock_balances` (fast on-hand by product/warehouse/bin)
- `stock_transfers`, `stock_transfer_items`
- `stock_adjustments`, `stock_adjustment_items`
- `inventory_valuation_layers` (FIFO/Weighted Average support)

### Banking
- `bank_statements`
- `bank_statement_lines`
- `bank_reconciliations`
- `bank_match_rules`

## 5) Feature Plan by Module

### A) Chart of Accounts
- Add account class headers and locked hierarchy templates.
- Add roll-up balances on each parent node.
- Add usage badges:
  - in posting rules
  - used in journals
  - used in bank/payment mapping.
- Add import/export with validation preview.
- Add “cannot deactivate if active links exist” checks.

### B) Journals & GL
- Manual journal creation with line-level dimensions.
- Reversing journal flow and recurring journals.
- Journal approval states: draft -> reviewed -> posted -> reversed.
- GL drill-down from statements to journal to source document.

### C) Receivables (Membership/Subscription/POS/Booking)
- Replace loose receivables with unified AR ledger by source module.
- Aging bucket dashboards by module and member type.
- Auto-reminders + dunning workflow.
- Receipt allocation UI (single receipt, multi-invoice allocation).

### D) Payables & Procurement
- Full 3-way match (PO vs GRN vs Bill) with tolerance thresholds.
- Vendor aging, due scheduling, payment run wizard.
- Partial/advance payment allocation and withholding tax support.
- Duplicate bill detection (vendor + bill no + amount/date fingerprint).

### E) Banking
- Statement import (CSV/MT940 style adapter).
- Rule-based auto-matching and exception queue.
- Daily cash/bank position dashboard.
- Reconciliation sign-off with audit trail.

### F) Budgets & Control
- Multi-level budgets (department/project/account).
- Commitment control (PO commitments against budget).
- Variance tracking actual vs budget vs commitment.

### G) Warehouse/Inventory + COGS
- Multi-warehouse transfers and approval.
- Real-time stock card and valuation report.
- COGS posting from POS/consumption with closing adjustments.
- Negative stock prevention with override approval.

## 6) UI/UX Premium Standards (Accounting + Procurement)

### Design system direction
- Keep existing brand colors (primary `#063455`) as anchor.
- Introduce consistent premium patterns:
  - sticky filter bars with saved views
  - card metrics + trend chips
  - dense but readable data tables with column personalization
  - inline status chips with semantic colors
  - slide-over quick views (document + linked postings)
  - keyboard-friendly forms and hotkeys
- Use modal/drawer create flows with progressive sections, not long open forms.

### Per-page upgrades
- All list pages: quick filters, advanced filters, export, pagination, saved filter presets.
- All create/edit pages: validation summary, totals sidebar, auto-calc, attachment support.
- Dashboard: add transaction feed, exception widgets, pending approvals, reconciliation alerts.

## 7) Integration Plan (Must Connect to Whole System)

### Membership & subscriptions
- Event: invoice create/update/cancel -> AR + revenue/deferred revenue journals.
- Event: receipt create/refund -> cash/bank + AR settlement journals.

### POS
- Shift/day close posting:
  - sales, tax, discounts
  - payment method split (cash/card/online)
  - COGS and inventory movement.

### Rooms/events/other billing modules
- Standard posting adapter interface:
  - `source_module`
  - `source_doc_type`
  - `source_doc_id`
  - `posting_payload`.

### Procurement
- Keep existing hooks, then add:
  - approval-dependent posting
  - matching exceptions blocking posting
  - payment run integration.

## 8) Automation Roadmap

### Immediate automations
- Auto-post on document status change (with queue + retry).
- Scheduled overdue aging snapshots.
- Month-end close reminders/checklist notifications.
- Auto reversal for accrual templates.

### Next-level automations
- Suggested account mapping via historical patterns.
- Vendor risk alerts (price variance / delay / mismatch rates).
- Smart reconciliation matching confidence scores.

## 9) Phased Delivery Plan

### Phase 0 (1-2 weeks): Stabilize & Foundation
- Freeze naming and coding standards for documents/accounts.
- Add event queue + posting logs + idempotency.
- Add integration test harness for posting correctness.

### Phase 1 (2-4 weeks): Core Accounting Hardening
- COA advanced tree + rollups + governance.
- Manual journals, reversals, recurring journals.
- Dashboard transaction feed + exception widgets.

### Phase 2 (3-5 weeks): Procure-to-Pay Maturity
- PR/PO/GRN/Bill/Payment workflow + approvals.
- 3-way match and discrepancy queue.
- Vendor aging and payment run.

### Phase 3 (3-5 weeks): Order-to-Cash Integration
- Membership/subscription invoice + receipt posting adapters.
- POS day-close posting adapter with COGS.
- Unified receivables aging by source module.

### Phase 4 (2-4 weeks): Banking + Close + Reporting
- Bank statements and reconciliation.
- Close checklist and period locks.
- Management reporting pack (cash flow, AP/AR analytics, budget variance, inventory valuation).

## 10) Success Metrics

- 100% of financial-impact documents generate balanced journals.
- Duplicate posting rate < 0.1%.
- Month-end close cycle reduced by at least 40%.
- Reconciliation auto-match rate > 70% in first release.
- AR/AP aging report generation under 3 seconds for typical data volume.

## 11) Immediate Build Backlog (First Execution Sprint)

1. Unify posting adapter contract and implement for membership/subscription invoices.
2. Add COA roll-up balances and account usage indicators.
3. Upgrade procurement create forms to full selectable entities (no manual IDs).
4. Add approval skeleton tables + backend workflow for PO and bills.
5. Add exception center on Accounting Dashboard (posting failures, mismatch, overdue).

