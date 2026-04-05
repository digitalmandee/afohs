# Complete QA Testing Flows

## Manual Testing Flow (End-to-End ERP Closure)

### Summary
This is a business-user manual QA script to validate the full finance/procurement/inventory closure on staging or production after deploy. It is ordered so blockers surface early.

### Manual Test Steps
1. **Sanity + Access**
   - Login as:
     - finance approver
     - procurement user
     - admin (override role)
   - Open screens load without errors:
     - Journals
     - Purchase Requisitions / Orders / GRN / Vendor Bills / Vendor Payments
     - Purchase Returns
     - Inventory Document Flows
     - Supplier Advances
     - Delivery Notes

2. **Manual Journal Workflow**
   - Create balanced manual journal in open period.
   - Click `Submit for Approval`.
   - Approve/Post from approver user.
   - Expected:
     - status visibly changes through workflow
     - final status `posted`
     - one journal only, balanced debit=credit

3. **PR -> PO -> GRN Chain**
   - Create PR with 2 lines, submit, approve.
   - Convert PR to PO with partial quantities.
   - Create GRN against PO partial receive, then complete receive.
   - Expected:
     - PR status moves `approved -> partially_converted -> converted_to_po`
     - GRN cannot exceed PO remaining qty
     - PO reflects partial/completed receive correctly

4. **Vendor Bill Controls**
   - Create bill from GRN lines.
   - Try billing quantity above GRN remaining on one line.
   - Expected: hard validation error on that line.
   - Create valid bill and approve/post.
   - Expected:
     - bill posts once
     - AP and inventory/GRNI postings are created per policy

5. **Supplier Advance + Adjustment**
   - Create supplier advance, submit, approve/post.
   - Apply advance to an open vendor bill.
   - Expected:
     - advance status/remaining updates correctly
     - bill outstanding reduces by applied amount
     - no duplicate AP liability

6. **Vendor Payment (Invoice-wise + Ledger-wise)**
   - Create invoice-wise payment linked to bill (partial amount).
   - Create second payment to settle remaining.
   - Create ledger-wise payment for vendor.
   - Expected:
     - partial and final settlement update outstanding correctly
     - overpayment blocked (or policy-handled explicitly)
     - accounting posts `Dr AP/Supplier, Cr Bank/Cash`

7. **Purchase Return**
   - Create return against received/billed quantity within limit.
   - Attempt second return that exceeds remaining eligible qty.
   - Expected:
     - first succeeds and posts inventory/AP reversal
     - second fails with line-level over-return message

8. **Inventory Doc Approve/Post Error Handling**
   - Create inventory document with valid context -> submit -> approve/post.
   - Create one with invalid stock/context and approve/post.
   - Expected:
     - valid posts
     - invalid shows clear error, remains non-posted, no partial movement

9. **Opening Balance Closure Check**
   - Verify opening balance document list includes legacy case.
   - Confirm journal link exists for previously failing document.
   - Expected:
     - no missing opening-balance journals
     - journal amount equals opening amount

10. **PO Amendment (Admin Prospective)**
    - Try amend posted PO as non-admin.
    - Expected: blocked.
    - Amend as admin with reason.
    - Expected:
      - revision history record exists
      - changes are prospective only (existing GRN/bill integrity preserved)

11. **Traceability + Visibility**
    - From vendor bill/payment/return/opening document, open linked journal.
    - From journal, verify source document context is visible.
    - Expected:
      - bidirectional trace works
      - no orphan posted document without source/journal context

12. **Amount Formatting Regression**
    - Spot-check comma formatting on:
      - journal cards/lines
      - procurement totals
      - payment and bill totals
    - Expected display style: `1,234.00` consistently.

### Pass/Fail Criteria
- Pass if:
  - all above flows complete without blocking errors
  - no duplicate posting
  - quantities/caps enforced
  - journal entries balanced and traceable
- Fail if:
  - any posted document lacks expected journal
  - over-billing/over-return is allowed
  - role restrictions bypassed
  - workflow actions appear successful but state does not change

### Assumptions
- Accounting periods are open for test dates.
- Payment accounts and COA mappings are active/postable.
- Queue worker is running if posting is asynchronous.

## Purpose
This runbook validates all major delivered changes end-to-end:
- manual journal workflow fixes
- accounting posting hardening
- procurement and warehouse document flows
- item master upgrades (COA, vendor mappings, pricing policy)
- FIFO, batch, and expiry behavior
- opening balance posting and reconciliation
- amount formatting consistency

## Test Environment Defaults
- Database should include:
  - at least 1 active warehouse and 1 warehouse location
  - at least 1 expiry-tracked item and 1 non-expiry item
  - active, postable COA accounts
  - payment accounts mapped to COA
- Run queue worker while testing posting events:
```bash
php artisan queue:work --queue=default --tries=1
```
- Run health checks before and after test run:
```bash
php artisan inventory:verify-document-types
php artisan accounting:verify-module --limit=20
php artisan accounting:verify-opening-balance-postings --limit=50
```

## Evidence Capture Standard
Capture these artifacts per test case:
- UI screenshot (before and after action)
- source document number
- journal entry number (if posting expected)
- SQL verification output
- queue/log message for failures (if negative case)

Suggested evidence SQL (replace placeholders):
```sql
-- Journal for source document
SELECT id, entry_no, status, module_type, module_id, posted_at
FROM journal_entries
WHERE module_type = '<module_type>' AND module_id = <module_id>
ORDER BY id DESC;

-- Journal balance check
SELECT je.entry_no, SUM(jl.debit) AS debit_total, SUM(jl.credit) AS credit_total
FROM journal_entries je
JOIN journal_lines jl ON jl.journal_entry_id = je.id
WHERE je.id = <journal_id>
GROUP BY je.entry_no;

-- Inventory document + workflow state
SELECT id, document_no, type, status, approval_status, posting_key, submitted_at, approved_at, posted_at
FROM inventory_documents
WHERE document_no = '<document_no>';

-- Accounting queue by source
SELECT id, source_type, source_id, event_type, status, idempotency_key, retry_count, error_message, created_at
FROM accounting_event_queues
WHERE source_id = <source_id>
ORDER BY id DESC;
```

## End-to-End Flows

### 1) Manual Journal Submit and Approve/Post
1. Create a balanced draft manual journal in an open period.
2. Case A: with no active workflow steps, click `Approve/Post`.
3. Case B: with active workflow steps, click `Submit for Approval`, then approve from inbox.
4. Case C: maker-checker enabled and same user tries approve.
5. Case D: unbalanced or closed period journal tries submit/approve.

Expected:
- Case A posts directly.
- Case B shows submitted state and posts only after required approvals.
- Case C blocks with clear message.
- Case D blocks with clear validation errors.

### 2) Inventory Document Approve/Post Error Handling
1. Create inventory document with valid stock and warehouse/location context.
2. Submit and approve/post.
3. Create invalid document scenario:
   - outflow quantity above available stock, or
   - location not in selected warehouse.
4. Submit and approve/post invalid document.

Expected:
- Valid case posts successfully.
- Invalid case shows user-facing error, document is not partially posted, no duplicate movements.

### 3) Finance Receipt Posting Enforcement
Repeat for membership, subscription, maintenance, room, event, POS:
1. Create invoice and verify invoice journal.
2. Create receipt with valid payment account mapped to active postable COA.
3. Create receipt with missing/inactive/non-postable mapping.

Expected:
- valid receipt posts journal
- invalid mapping is blocked or clearly fails with actionable reason

### 4) Accounting Period Coverage and Backfill
1. Post a transaction on historical migrated date within configured open period.
2. Attempt posting in a closed period.

Expected:
- historical in-open-period post succeeds
- closed-period posting is blocked

### 5) Procurement Baseline Regression
1. Create PO.
2. Create GRN against PO.
3. Create Vendor Bill against GRN.
4. Create Vendor Payment.
5. Retry post action/event where possible.

Expected:
- PO does not create journal
- GRN, Vendor Bill, Vendor Payment create journals
- retry does not create duplicates

### 6) Purchase Requisition to PO Conversion
1. Create PR with multiple lines.
2. Submit and approve PR.
3. Convert partial quantities to PO.
4. Convert remaining quantities.
5. Attempt conversion above remaining quantity.

Expected:
- status transitions: `approved -> partially_converted -> converted_to_po`
- over-conversion is blocked

### 7) Cash Purchase Flow
1. Create cash purchase with warehouse and payment account.
2. Submit and approve/post.
3. Verify stock-in movement and accounting event/journal (if enabled in config).

Expected:
- stock movement exists
- accounting follows matrix setting
- no duplicate journal on re-approval attempts

### 8) Purchase Return Quantity Caps
1. Create return against GRN/Bill within remaining quantity.
2. Post it.
3. Create second return exceeding remaining quantity.
4. Attempt post-time over-return in concurrent path if possible.

Expected:
- within-limit return succeeds
- over-return blocked with line-specific error
- recheck at post time prevents race-condition over-return

### 9) Delivery Note Print
1. Create delivery note.
2. Open print action from list/detail.

Expected print output includes:
- document number and date
- source and destination
- reference and remarks
- line items
- generated-by metadata

### 10) Warehouse Document Runtime Config
1. Pick a type with `approval_required=1`.
2. Create, submit, approve/post.
3. Pick a type with `approval_required=0` and `auto_post=1`.
4. Create and verify direct post on create.
5. Retry post action.

Expected:
- behavior follows config matrix
- repeated actions do not duplicate posting

### 11) Location and Department Tracking
1. Issue from specific warehouse/location.
2. Validate deduction from that location only.
3. Post department transfer note.
4. Attempt department adjustment decrease greater than department stock.

Expected:
- location-specific stock accuracy
- warehouse-to-department movement is consistent
- over-decrease is blocked

### 12) FIFO, Batch, Expiry
1. Receive two inbound batches with different dates/costs.
2. Issue quantity spanning both batches.
3. Validate oldest batch consumed first and allocations split correctly.
4. For expiry-tracked item, attempt issue where only expired batch is available.

Expected:
- FIFO allocation order enforced
- `inventory_issue_allocations` reflects partial consumption
- expiry policy enforced for tracked items

### 13) Opening Balance Posting
1. Create opening balance (qty, unit cost, date in open period).
2. Verify document line, stock movement, queue event (if enabled), journal creation.
3. Retry same posting event.
4. Run reconciliation command.

Expected:
- one posted journal only (idempotent)
- reconciliation aligns opening valuation and opening journals

### 14) Item Master COA, Vendor Mapping, Price Policy
1. Create/update item with inventory, purchase, and COGS accounts.
2. Add multiple vendor mappings with one preferred vendor.
3. Submit invalid payload with two preferred vendors.
4. Test fixed purchase price override behavior in PO/GRN/Cash Purchase.

Expected:
- active/postable account validation enforced
- one preferred vendor rule enforced atomically
- override policies enforced by validation

### 15) Accounting Enablement Matrix and Diagnostics
1. Toggle `accounting_enabled` for:
   - `cash_purchase`
   - `purchase_return`
   - `opening_balance`
   - `stock_adjustment`
2. Post sample docs per type.
3. Run diagnostic commands.

Expected:
- enabled types queue/post journals
- disabled types remain operational and non-posting
- diagnostics show matrix and adapter coverage clearly

### 16) Journal Traceability and Failure Visibility
1. Open journals from finance, procurement, and inventory sources.
2. Validate source context:
   - party name/code
   - document number
   - source link
3. Validate pending/failed state visibility and failure reason near source.

Expected:
- clear source traceability and actionable failure context

### 17) Global Amount Formatting Regression
Spot-check:
- journal cards/register/lines
- approvals inbox
- procurement totals
- voucher/finance/payroll surfaces touched by formatter

Expected:
- grouped comma format with two decimals (for currency-style values)
- no parsing regressions in inputs and submit flows

## Completion Criteria
Release candidate is considered verified when:
- all mandatory positive cases pass
- all mandatory negative controls fail safely with clear errors
- all expected posting docs produce exactly one balanced journal (where enabled)
- no critical regressions in PO->GRN->Bill->Payment and existing inventory operations
