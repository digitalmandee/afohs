# Finance Module Architecture

## Overview

This document outlines the architecture of the **Finance Module**, specifically the refactored **Item-Level Transaction Logic** and the dedicated **Payment Flow**. The system has moved from a single-transaction-per-invoice model to a more granular model where transactions are linked to specific invoice items (`financial_invoice_items`).

## Core Concepts

### 1. Item-Level Transactions

- **Previous Model**: Revenue was calculated based on the invoice total.
- **New Model**: Revenue and payments are tracked at the **Item Level**.
- **Data Structure**:
    - `financial_invoices`: The parent record (Header).
    - `financial_invoice_items`: The line items (e.g., Membership Fee, Maintenance Fee).
    - `transactions`: now linked to `financial_invoice_items` (polymorphic relationship) for specific debits (charges) and credits (payments).

### 2. Transaction Types (Numeric IDs)

The system now uses numeric IDs for `fee_type` in `financial_invoice_items` and `transaction_types` table, replacing older string enums for better scalability.

- **3**: Membership Fee
- **4**: Maintenance Fee
- **5**: Subscription Fee
- **6**: Financial Charge (etc.)

---

## Data Flow & Logic Mapping

### Invoice Creation Flow

**Frontend**: `Create.jsx` -> **Backend**: `MemberTransactionController@store`

| Step           | Frontend Action            | Backend Variable                      | Database Action / Column                                                                                                                                                                                                     |
| :------------- | :------------------------- | :------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Header**  | User selects Member/Type   | `$request->member_id`, `$bookingType` | **Table**: `financial_invoices` <br> `invoice_no` (Generated) <br> `member_id` (FK) <br> `invoiceable_type/id` (Polymorphic) <br> `status` = 'unpaid'                                                                        |
| **2. Items**   | User Adds Fee/Subscription | `$request->items[]`                   | **Table**: `financial_invoice_items` <br> `invoice_id` (Link to Header) <br> `fee_type` (Transaction Type ID) <br> `amount` (Unit Price) <br> `total` (Line Total)                                                           |
| **3. Ledger**  | Automatic on Save          | Loop Item `$invoiceItem`              | **Table**: `transactions` (Debit) <br> `type` = 'debit' <br> `amount` = `$invoiceItem->total` <br> `reference_type` = `FinancialInvoiceItem` <br> `reference_id` = `$invoiceItem->id` <br> `invoice_id` = `$invoice->id`     |
| **4. Payment** | (Optional) Pay Now         | `$request->action = 'save_receive'`   | **Table**: `transactions` (Credit) <br> `type` = 'credit' <br> `amount` = `$invoiceItem->total` <br> `reference_type` = `FinancialInvoiceItem` <br> `reference_id` = `$invoiceItem->id` <br> `receipt_id` = (New Receipt ID) |

### Payment Flow

**Frontend**: `PayInvoice.jsx` -> **Backend**: `MemberTransactionController@updateStatus`

1.  **Selection**: User selects specific items to pay on the frontend.
2.  **Request**: Sends `items` array with paid amounts.
3.  **Receipt**: System creates a `financial_receipts` record.
4.  **Ledger Update**:
    - System creates a **Credit Transaction** for _each_ paid item.
    - Linked via `reference_id` to the specific `FinancialInvoiceItem`.
    - Linked via `receipt_id` to the `financial_receipts` record.
5.  **Status**: Invoice status updates to 'paid' if fully paid, or 'partial'.

---

## Detailed Database Schema

### 1. `financial_invoices` (Header Table)

Stores the high-level invoice details.

| Column                | Type        | Description                              |
| :-------------------- | :---------- | :--------------------------------------- |
| `id`                  | BigInt (PK) | Unique Identifier                        |
| `invoice_no`          | String      | Unique Invoice Number (e.g., INV-1001)   |
| `member_id`           | BigInt (FK) | Link to Member (Nullable for guests)     |
| `corporate_member_id` | BigInt      | Link to Corporate Member                 |
| `customer_id`         | BigInt      | Link to Customer (Guest)                 |
| `invoiceable_id`      | BigInt      | Polymorphic ID (User/Member/Guest)       |
| `invoiceable_type`    | String      | Polymorphic Model Class                  |
| `total_price`         | BigInt      | Total Amount to be paid                  |
| `paid_amount`         | BigInt      | Amount currently paid                    |
| `status`              | Enum        | 'paid', 'unpaid', 'cancelled', 'overdue' |
| `issue_date`          | Date        | Date of issue                            |
| `due_date`            | Date        | Date payment is due                      |
| `created_by`          | BigInt      | User ID of creator                       |
| `deleted_at`          | Timestamp   | Soft Delete timestamp                    |

### 2. `financial_invoice_items` (Line Items Table)

Stores individual line items. This is the **Source of Truth** for charges.

| Column                 | Type        | Description                                                                                                                                                                  |
| :--------------------- | :---------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                   | BigInt (PK) | Unique Identifier                                                                                                                                                            |
| `invoice_id`           | BigInt (FK) | Link to `financial_invoices`                                                                                                                                                 |
| `fee_type`             | String      | Logic ID (e.g., '1' for Room Booking, '2' for Event Booking, '3' for Membership, '4' for Maintenance, '5' for subscription, '6' for Charges, '7' for Food Order Fee) or Name |
| `description`          | String      | Item Description                                                                                                                                                             |
| `qty`                  | Decimal     | Quantity                                                                                                                                                                     |
| `amount`               | BigInt      | Unit Price                                                                                                                                                                   |
| `sub_total`            | Decimal     | qty \* amount                                                                                                                                                                |
| `tax_amount`           | Decimal     | Tax value                                                                                                                                                                    |
| `discount_amount`      | Decimal     | Discount value                                                                                                                                                               |
| `total`                | Decimal     | Final Line Total                                                                                                                                                             |
| `start_date`           | Date        | Coverage Start (e.g., Jan 1)                                                                                                                                                 |
| `end_date`             | Date        | Coverage End (e.g., Jan 31)                                                                                                                                                  |
| `subscription_type_id` | BigInt      | Link to `subscription_types` (if applicable)                                                                                                                                 |

### 3. `transactions` (Ledger Table)

Stores the financial history (Debits and Credits).

| Column           | Type        | Description                                |
| :--------------- | :---------- | :----------------------------------------- |
| `id`             | BigInt (PK) | Unique Identifier                          |
| `type`           | Enum        | 'debit' (Charge) or 'credit' (Payment)     |
| `amount`         | Decimal     | Transaction Value                          |
| `payable_id`     | BigInt      | Who owes/paid (Member ID etc.)             |
| `payable_type`   | String      | Model Class of Payer                       |
| `reference_id`   | BigInt      | ID of the Item (`FinancialInvoiceItem`)    |
| `reference_type` | String      | Class of the Item (`FinancialInvoiceItem`) |
| `invoice_id`     | BigInt      | Direct link to `financial_invoices`        |
| `receipt_id`     | BigInt      | Link to `financial_receipts` (if credit)   |

### 4. `transaction_types` (Lookup Table)

Defines the types of fees available in the system.

| Column   | Type        | Description                                  |
| :------- | :---------- | :------------------------------------------- |
| `id`     | BigInt (PK) | Unique Identifier                            |
| `name`   | String      | Human readable name (e.g., "Membership Fee") |
| `type`   | BigInt      | **Numeric ID used in logic** (3, 4, 5, etc.) |
| `status` | Enum        | 'active' / 'inactive'                        |

### 5. `financial_charge_types` (Lookup Table)

Defines dynamic/custom charges (e.g., "Gym Fee", "Locker Fee").

| Column           | Type        | Description               |
| :--------------- | :---------- | :------------------------ |
| `id`             | BigInt (PK) | Unique Identifier         |
| `name`           | String      | Charge Name               |
| `default_amount` | Decimal     | Default cost              |
| `is_fixed`       | Boolean     | If amount is non-editable |

---

### 6. `financial_receipts` (Payment Record)

Stores the proof of payment.

| Column            | Type        | Description                             |
| :---------------- | :---------- | :-------------------------------------- |
| `id`              | BigInt (PK) | Unique Identifier                       |
| `receipt_no`      | String      | Unique Receipt Number (e.g., REC-12345) |
| `payer_id`        | BigInt      | Who made the payment                    |
| `payer_type`      | String      | Class of Payer (Member, Guest)          |
| `amount`          | Decimal     | Total Amount Received                   |
| `payment_method`  | String      | 'cash', 'credit_card', 'cheque', etc.   |
| `payment_details` | Text        | Bank Ref, Auth Code, etc.               |
| `receipt_date`    | Date        | Date of payment                         |
| `remarks`         | Text        | Notes                                   |
| `created_by`      | BigInt      | Creator ID                              |

### 7. `transaction_relations` (Allocation Table)

Links Receipts to Invoices. Useful for tracking which receipt paid off which invoice, especially for partial payments or bulk settlements.

| Column       | Type        | Description                                      |
| :----------- | :---------- | :----------------------------------------------- |
| `id`         | BigInt (PK) | Unique Identifier                                |
| `invoice_id` | BigInt (FK) | Link to `financial_invoices`                     |
| `receipt_id` | BigInt (FK) | Link to `financial_receipts`                     |
| `amount`     | Decimal     | Amount of this receipt allocated to this invoice |

---

## Routes & Controllers

The finance routes are defined in `routes/web.php` under the `admin/finance` prefix.

### Dashboard & Manage

- **`GET admin/finance/dashboard`** (`finance.dashboard`)

    - **Controller**: `FinancialController@index`
    - **View**: `Dashboard.jsx` (Displays revenue stats and recent transactions).

- **`GET admin/finance/manage`** (`finance.transaction`)
    - **Controller**: `FinancialController@getAllTransactions`
    - **Logic**: Lists invoices. `paid_amount` calculated by summing item credits.
    - **View**: `Transaction.jsx` (Grid view of all invoices).

### Transaction Operations

- **`GET admin/finance/create`** (`finance.transaction.create`)

    - **Controller**: `MemberTransactionController@create`
    - **Purpose**: UI to create new transactions/invoices.

- **`POST admin/finance/store`** (`finance.transaction.store`)
    - **Controller**: `MemberTransactionController@store`
    - **Purpose**: Stores the new invoice and its items (as detailed above).

### Payment Flow (Dedicated Page)

- **`GET admin/finance/invoice/{id}/pay`** (`finance.invoice.pay`)

    - **Controller**: `MemberTransactionController@payInvoiceView`
    - **Purpose**: Displays the "Pay Invoice" page.

- **`POST admin/finance/transaction/update-status/{id}`** (`finance.transaction.update-status`)
    - **Controller**: `MemberTransactionController@updateStatus`
    - **Purpose**: Processes the payment. Creates `credit` transactions.
