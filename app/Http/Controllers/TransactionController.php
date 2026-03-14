<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Helpers\FileHelper;
use App\Models\AllowanceType;
use App\Models\Employee;
use App\Models\EmployeeAllowance;
use App\Models\FinancialInvoice;
use App\Models\Invoices;
use App\Models\Order;
use App\Models\PaymentAccount;
use App\Models\TransactionRelation;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::where('created_by', Auth::id())
            ->whereIn('order_type', ['dineIn', 'delivery', 'takeaway', 'reservation', 'room_service'])
            // ✅ Only show orders with invoices waiting for payment
            ->where('payment_status', 'awaiting')
            ->with(['member:id,full_name,membership_no', 'customer:id,name,customer_no', 'employee:id,employee_id,name', 'table:id,table_no', 'orderItems:id,order_id', 'roomBooking.room:id,name', 'tenant:id,name']);

        // ===============================
        // FILTER: Search by member name or membership_no
        // ===============================
        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->whereHas('member', function ($q) use ($search) {
                $q
                    ->where('full_name', 'like', "%$search%")
                    ->orWhere('membership_no', 'like', "%$search%");
            });
        }

        // ===============================
        // FILTER: Order Type
        // ===============================
        if ($request->has('orderType') && $request->orderType != 'all') {
            $orderTypeMap = [
                'dineIn' => 'dineIn',
                'takeaway' => 'takeaway',
                'delivery' => 'delivery',
                'reservation' => 'reservation',
                'room_service' => 'room_service',
            ];
            if (isset($orderTypeMap[$request->orderType])) {
                $query->where('order_type', $orderTypeMap[$request->orderType]);
            }
        }

        // ===============================
        // FILTER: Order Status
        // ===============================
        if ($request->has('orderStatus') && $request->orderStatus != 'all') {
            $statusMap = [
                'ready' => 'completed',
                'cooking' => 'in_progress',
                'waiting' => 'pending',
                'completed' => 'completed',
                'cancelled' => 'cancelled',
            ];
            if (isset($statusMap[$request->orderStatus])) {
                $query->where('status', $statusMap[$request->orderStatus]);
            }
        }

        // ===============================
        // FILTER: Member Status
        // ===============================
        if ($request->has('memberStatus') && $request->memberStatus != 'all') {
            $query->whereHas('member', function ($q) use ($request) {
                $q->where('status', $request->memberStatus);
            });
        }

        // ===============================
        // SORTING
        // ===============================
        $sort = $request->sort ?? 'desc';
        $query->orderBy('id', $sort);

        // ===============================
        // PAGINATION
        // ===============================
        $perPage = 10;
        $orders = $query->paginate($perPage)->withQueryString();

        // ===============================
        // Attach invoices to orders
        // ===============================
        $orderIds = $orders->pluck('id')->toArray();
        $invoices = FinancialInvoice::select('id', 'data', 'status')
            ->where(function ($q) use ($orderIds) {
                foreach ($orderIds as $id) {
                    $q->orWhereJsonContains('data->order_id', $id);
                }
            })
            ->get();

        $orders->getCollection()->transform(function ($order) use ($invoices) {
            $order->invoice = $invoices->first(function ($invoice) use ($order) {
                $data = $invoice->data;
                return isset($data['order_id']) && $data['order_id'] == $order->id;
            });

            $order->order_items_count = $order->orderItems->count();
            return $order;
        });

        return Inertia::render('App/Transaction/Dashboard', [
            'Invoices' => $orders,
            'filters' => $request->all(),
        ]);
    }

    public function PaymentOrderData($orderId)
    {
        $order = Order::where('id', $orderId)
            ->with([
                'member:id,full_name,membership_no',
                'customer:id,name,customer_no',
                'employee:id,employee_id,name',
                'cashier:id,name',
                'orderItems:id,order_id,order_item,status',
                'table:id,table_no',
                'invoice',
            ])
            ->firstOrFail();

        if (!$order->invoice) {
            $order->setRelation(
                'invoice',
                FinancialInvoice::select('id', 'data', 'status', 'paid_amount', 'payment_method', 'payment_date')
                    ->whereJsonContains('data', ['order_id' => $order->id])
                    ->first()
            );
        }

        $invoiceForDue = FinancialInvoice::whereJsonContains('data', ['order_id' => $order->id])
            ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
            ->orderByDesc('id')
            ->first();
        $invoiceTotal = $invoiceForDue ? (float) ($invoiceForDue->total_price ?? 0) : (float) ($order->total_price ?? 0);
        $invoiceAdvance = $invoiceForDue ? (float) ($invoiceForDue->advance_payment ?? 0) : 0;
        if ($invoiceAdvance <= 0) {
            $invoiceAdvance = (float) ($order->down_payment ?? 0);
        }
        $invoicePaid = $invoiceForDue ? (float) ($invoiceForDue->paid_amount ?? 0) : 0;
        $totalDue = max(0, $invoiceTotal - $invoiceAdvance - $invoicePaid);

        if ($order->employee_id) {
            $preview = $this->calculateEmployeeAutoPayment($order, (float) $totalDue);
            $preview['total_due'] = round((float) $totalDue, 2);
            $order->employee_payment_preview = $preview;
        }

        $order->payment_meta = null;

        $invoiceId = $order->invoice?->id;
        if ($invoiceId) {
            $transactionRelation = TransactionRelation::where('invoice_id', $invoiceId)
                ->with(['receipt.paymentAccount'])
                ->latest('id')
                ->first();

            $receipt = $transactionRelation?->receipt;

            if ($receipt) {
                $paymentDetails = [];
                if (!empty($receipt->payment_details) && is_string($receipt->payment_details)) {
                    $decoded = json_decode($receipt->payment_details, true);
                    if (is_array($decoded)) {
                        $paymentDetails = $decoded;
                    }
                }

                $splitAccountIdsByMethod = [];
                if (isset($paymentDetails['split_payment_accounts']) && is_array($paymentDetails['split_payment_accounts'])) {
                    $splitAccountIdsByMethod = $paymentDetails['split_payment_accounts'];
                }

                $accountIds = array_values(array_filter(array_merge(
                    $receipt->payment_account_id ? [$receipt->payment_account_id] : [],
                    array_values($splitAccountIdsByMethod)
                )));

                $accountsById = count($accountIds)
                    ? PaymentAccount::withTrashed()
                        ->select('id', 'name', 'payment_method')
                        ->whereIn('id', $accountIds)
                        ->get()
                        ->keyBy('id')
                    : collect();

                $paymentAccount = null;
                if ($receipt->payment_account_id) {
                    $account = $accountsById->get($receipt->payment_account_id);
                    $paymentAccount = [
                        'id' => $receipt->payment_account_id,
                        'name' => $account?->name,
                        'payment_method' => $account?->payment_method,
                    ];
                }

                $splitPaymentAccounts = [];
                foreach (['cash', 'credit_card', 'bank'] as $methodKey) {
                    $accountId = $splitAccountIdsByMethod[$methodKey] ?? null;
                    if ($accountId) {
                        $account = $accountsById->get($accountId);
                        $splitPaymentAccounts[$methodKey] = [
                            'id' => $accountId,
                            'name' => $account?->name,
                            'payment_method' => $account?->payment_method,
                        ];
                    }
                }

                $order->payment_meta = [
                    'receipt_id' => $receipt->id,
                    'payment_account' => $paymentAccount,
                    'split_payment_accounts' => $splitPaymentAccounts,
                    'payment_details' => $paymentDetails ?: null,
                ];
            }
        }

        return $order;
    }

    public function OrderPayment(Request $request)
    {
        // Validate base fields + ENT/CTS
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'paid_amount' => 'required|numeric',
            'payment_method' => 'required|string',  // Relaxed validation to allow 'split_payment' etc regardless of ENT
            'payment_account_id' => 'nullable|exists:payment_accounts,id',
            // For credit card
            'credit_card_type' => 'nullable|required_if:payment_method,credit_card|string',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf',
            // Split Payment Accounts
            'split_payment_accounts' => 'nullable|array',
            'split_payment_accounts.cash' => 'nullable|exists:payment_accounts,id',
            'split_payment_accounts.credit_card' => 'nullable|exists:payment_accounts,id',
            'split_payment_accounts.bank' => 'nullable|exists:payment_accounts,id',
            // ENT
            'ent_enabled' => 'nullable|boolean',
            'ent_reason' => 'nullable|string',
            'ent_comment' => 'nullable|string',
            'ent_items' => 'nullable|array',
            'ent_items.*' => 'exists:order_items,id',
            // CTS
            'cts_enabled' => 'nullable|boolean',
            'cts_comment' => 'nullable|string',
            'cts_amount' => 'nullable|numeric',
            // Bank Charges
            'bank_charges_enabled' => 'nullable|boolean',
            'bank_charges_percentage' => 'nullable|numeric',  // Keeping for backward compatibility or if percentage logic persists
            'bank_charges_type' => 'nullable|string|in:percentage,fixed',
            'bank_charges_value' => 'nullable|numeric',
            'bank_charges_amount' => 'nullable|numeric',
        ]);

        $order = Order::findOrFail($request->order_id);
        $invoiceForDue = FinancialInvoice::whereJsonContains('data', ['order_id' => $order->id])
            ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
            ->orderByDesc('id')
            ->first();
        $invoiceTotal = $invoiceForDue ? (float) ($invoiceForDue->total_price ?? 0) : (float) ($order->total_price ?? 0);
        $invoiceAdvance = $invoiceForDue ? (float) ($invoiceForDue->advance_payment ?? 0) : 0;
        if ($invoiceAdvance <= 0) {
            $invoiceAdvance = (float) ($order->down_payment ?? 0);
        }
        $invoicePaid = $invoiceForDue ? (float) ($invoiceForDue->paid_amount ?? 0) : 0;
        $totalDue = max(0, $invoiceTotal - $invoiceAdvance - $invoicePaid);

        $paidAmount = $request->paid_amount;
        $effectivePaymentMethod = (string) $request->payment_method;
        $entAmount = 0;
        $ctsAmount = 0;
        $bankChargesAmount = 0;
        $entDetails = '';
        $employeeAutoPayment = null;
        $employeeRemainingAfterAllowance = 0.0;
        $employeeCtsAllowed = false;
        $employeeMaxCtsAmount = 0.0;

        // Calculate ENT Value if specific items selected OR ENT enabled
        if ($request->boolean('ent_enabled') || $request->has('ent_items')) {
            if ($request->filled('ent_items')) {
                // Calculate from items (empty array = 0).
                $entItems = $order->orderItems()->whereIn('id', $request->ent_items)->get();
                foreach ($entItems as $item) {
                    // Calculate item total (price * quantity)
                    $itemData = $item->order_item;
                    $qty = (float) ($itemData['quantity'] ?? 1);
                    $price = (float) ($itemData['price'] ?? 0);
                    $iTotal = isset($itemData['total_price']) ? (float) $itemData['total_price'] : ($qty * $price);

                    $entAmount += $iTotal;
                    $entDetails .= ($itemData['name'] ?? 'Item') . ' (x' . $qty . '), ';
                }
            } elseif ($request->payment_method === 'ent') {
                // Legacy Flow: No ent_items key -> Assume Full
                $entAmount = $totalDue;
            }
        }

        // CTS Amount
        if ($request->boolean('cts_enabled') || $request->payment_method === 'cts' || $request->filled('cts_amount')) {
            if ($request->filled('cts_amount')) {
                $ctsAmount = $request->cts_amount;
            } elseif ($request->payment_method === 'cts') {
                $ctsAmount = $totalDue;  // Default to full if method is CTS and amount not specified
            }
        }

        // Bank Charges
        if ($request->boolean('bank_charges_enabled')) {
            $bankChargesAmount = round((float) ($request->bank_charges_amount ?? 0), 0);
        }

        if ($order->employee_id) {
            $employeeAutoPayment = $this->calculateEmployeeAutoPayment($order, (float) $totalDue);

            $entAmount = round((float) ($employeeAutoPayment['food_allowance_applied'] ?? 0), 0);
            $employeeRemainingAfterAllowance = max(0, round((float) ($employeeAutoPayment['remaining_after_food_allowance'] ?? 0), 0));
            $employeeCtsAllowed = (bool) ($employeeAutoPayment['cts_allowed'] ?? false);
            $employeeMaxCtsAmount = $employeeCtsAllowed ? $employeeRemainingAfterAllowance : 0;

            $requestedCtsAmount = $request->boolean('cts_enabled') ? round((float) ($request->cts_amount ?? 0), 0) : 0;
            if ($requestedCtsAmount < 0) {
                $requestedCtsAmount = 0;
            }
            $ctsAmount = min($employeeMaxCtsAmount, $requestedCtsAmount);

            $requiredCash = max(0, round(($employeeRemainingAfterAllowance - $ctsAmount) + (float) $bankChargesAmount, 0));
            $providedCash = max(0, round((float) $request->paid_amount, 0));

            if ($providedCash < ($requiredCash - 1.0)) {
                return back()->withErrors([
                    'paid_amount' => 'Employee order requires minimum cash payment of ' . $requiredCash . ' after Food Allowance/CTS adjustment.',
                ]);
            }

            $paidAmount = $requiredCash;

            if ($paidAmount <= 0 && $ctsAmount > 0) {
                $effectivePaymentMethod = 'cts';
            } elseif ($paidAmount <= 0 && $entAmount > 0) {
                $effectivePaymentMethod = 'ent';
            }

            if ($entAmount > 0) {
                $entDetails = 'Food Allowance Auto Applied';
            }
        }

        // Verification
        // Ensure values are floats
        $payVal = round((float) $paidAmount, 0);
        $entVal = round((float) $entAmount, 0);
        $ctsVal = round((float) $ctsAmount, 0);
        $bankVal = round((float) $bankChargesAmount, 0);
        $dueVal = round((float) $totalDue, 0);

        // Allow variance of 1.0 for float rounding
        // Total needed = Due + BankCharges
        // Total paid = Paid + ENT + CTS
        if (($payVal + $entVal + $ctsVal) < ($dueVal + $bankVal - 1.0)) {
            return back()->withErrors([
                'paid_amount' => 'Total payment (Paid + ENT + CTS) is less than Total Due (including Bank Charges). (' . ($payVal + $entVal + $ctsVal) . ' < ' . ($dueVal + $bankVal) . ')'
            ]);
        }

        // 1. Update Order Status
        $order->cashier_id = Auth::id();
        $order->payment_method = $effectivePaymentMethod;  // Primary method
        $order->paid_amount = $paidAmount;  // Only actual money paid
        $order->paid_at = now();

        // Update Comments with Details
        if ($entAmount > 0 || $request->boolean('ent_enabled') || $employeeAutoPayment) {
            $order->ent_reason = $employeeAutoPayment ? 'Food Allowance' : $request->ent_reason;
            $comment = $employeeAutoPayment ? 'Auto applied from salary food allowance' : $request->ent_comment;
            if ($entDetails) {
                $comment .= ' [ENT Items: ' . rtrim($entDetails, ', ') . ' - Value: ' . number_format($entAmount, 2) . ']';
            }
            $order->ent_comment = $comment;
        }

        if ($ctsAmount > 0 || $request->boolean('cts_enabled') || $employeeAutoPayment) {
            $comment = $employeeAutoPayment
                ? ((string) ($request->cts_comment ?: 'Charged to salary (CTS)'))
                : $request->cts_comment;
            if ($ctsAmount > 0 && $ctsAmount < $totalDue) {
                $comment .= ' [Partial CTS Amount: ' . number_format($ctsAmount, 2) . ']';
            }
            $order->cts_comment = $comment;
        }

        $receiptPath = null;
        if ($request->payment_method === 'credit_card') {
            $order->credit_card_type = $request->credit_card_type;
            if ($request->hasFile('receipt')) {
                $receiptPath = FileHelper::saveImage($request->file('receipt'), 'receipts');
                $order->receipt = $receiptPath;
            }
        } elseif ($request->payment_method === 'split_payment') {
            $order->cash_amount = $request->cash;
            $order->credit_card_amount = $request->credit_card;
            $order->bank_amount = $request->bank_transfer;
        }

        $order->payment_status = 'paid';
        $order->save();

        // 2. Update Financial Invoice (lookup by order_id, not just member_id)
        $invoice = FinancialInvoice::whereJsonContains('data', ['order_id' => $order->id])
            ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
            ->orderByDesc('id')
            ->first();

        if ($invoice) {
            // Merge ENT/CTS amounts into usage data since columns don't exist
            $invoiceData = $invoice->data ?? [];
            if ($entAmount > 0)
                $invoiceData['ent_amount'] = round($entAmount, 0);
            if ($ctsAmount > 0)
                $invoiceData['cts_amount'] = round($ctsAmount, 0);

            if ($bankChargesAmount > 0) {
                $invoiceData['bank_charges_enabled'] = true;
                $invoiceData['bank_charges_type'] = $request->bank_charges_type;
                $invoiceData['bank_charges_value'] = $request->bank_charges_value;
                $invoiceData['bank_charges_amount'] = round($bankChargesAmount, 0);
            }

            if ($invoice->member_id) {
                $payerType = \App\Models\Member::class;
                $payerId = $invoice->member_id;
            } elseif ($invoice->customer_id) {
                $payerType = \App\Models\Customer::class;
                $payerId = $invoice->customer_id;
            } elseif ($invoice->employee_id) {
                $payerType = \App\Models\Employee::class;
                $payerId = $invoice->employee_id;
            } else {
                $payerType = \App\Models\Member::class;
                $payerId = null;
            }

            $advanceToPersist = round((float) ($invoice->advance_payment ?? 0), 0);
            if ($advanceToPersist <= 0 && $invoiceAdvance > 0) {
                $advanceToPersist = round((float) $invoiceAdvance, 0);
                $invoiceData['advance_deducted'] = $advanceToPersist;
            }

            $invoice->update([
                'status' => 'paid',
                'payment_date' => now(),
                'payment_method' => $effectivePaymentMethod,
                'advance_payment' => $advanceToPersist,
                'paid_amount' => round((float) $order->paid_amount, 0),
                'ent_reason' => $order->ent_reason,
                'ent_comment' => $order->ent_comment,
                'cts_comment' => $order->cts_comment,
                'ent_amount' => round($entAmount, 0),
                'cts_amount' => round($ctsAmount, 0),
                'invoiceable_id' => $order->id,
                'invoiceable_type' => Order::class,
                'data' => $invoiceData,  // Save updated JSON
            ]);

            if ($employeeAutoPayment) {
                $invoiceData['food_allowance_applied'] = round((float) ($employeeAutoPayment['food_allowance_applied'] ?? 0), 0);
                $invoiceData['food_allowance_entitlement'] = round((float) ($employeeAutoPayment['food_allowance_entitlement'] ?? 0), 0);
                $invoiceData['food_allowance_used'] = round((float) ($employeeAutoPayment['food_allowance_used'] ?? 0), 0);
                $invoiceData['food_allowance_remaining_after'] = round((float) ($employeeAutoPayment['food_allowance_remaining_after'] ?? 0), 0);
                $invoiceData['remaining_after_food_allowance'] = round((float) $employeeRemainingAfterAllowance, 0);
                $invoiceData['employee_cts_allowed'] = (bool) ($employeeAutoPayment['cts_allowed'] ?? false);
                $invoiceData['employee_max_cts_amount'] = round((float) $employeeMaxCtsAmount, 0);
                $invoiceData['employee_cash_required'] = round(max(0, $employeeRemainingAfterAllowance - $ctsAmount), 0);
                $invoiceData['employee_auto_payment'] = true;

                $invoice->update([
                    'data' => $invoiceData,
                ]);
            }

            $invoiceItem = \App\Models\FinancialInvoiceItem::where('invoice_id', $invoice->id)
                ->where('fee_type', '7')  // Food Order
                ->where('description', 'like', "%Order #{$order->id}%")
                ->first();

            if (!$invoiceItem) {
                $invoiceItem = $invoice->items()->first();
            }

            if ($invoiceItem && $advanceToPersist > 0) {
                $reservationAdvanceTx = null;
                if ($order->reservation_id) {
                    $reservationAdvanceTx = \App\Models\Transaction::where('type', 'credit')
                        ->where('reference_type', \App\Models\Reservation::class)
                        ->where('reference_id', $order->reservation_id)
                        ->where('amount', $advanceToPersist)
                        ->latest('id')
                        ->first();
                }

                if ($reservationAdvanceTx) {
                    $advanceReceipt = null;
                    if ($reservationAdvanceTx->receipt_id) {
                        $advanceReceipt = \App\Models\FinancialReceipt::find($reservationAdvanceTx->receipt_id);
                    }

                    if (!$advanceReceipt) {
                        $advanceReceipt = \App\Models\FinancialReceipt::create([
                            'payer_type' => $payerType,
                            'payer_id' => $payerId,
                            'receipt_no' => 'REC-' . time() . '-ADV-' . $order->id,
                            'amount' => $advanceToPersist,
                            'advance_amount' => $advanceToPersist,
                            'receipt_date' => now(),
                            'payment_method' => 'cash',
                            'remarks' => "Advance Payment for Reservation #{$order->reservation_id}",
                            'created_by' => Auth::id(),
                        ]);
                        $reservationAdvanceTx->receipt_id = $advanceReceipt->id;
                    }

                    \App\Models\TransactionRelation::firstOrCreate(
                        [
                            'invoice_id' => $invoice->id,
                            'receipt_id' => $advanceReceipt->id,
                        ],
                        [
                            'amount' => $advanceToPersist,
                        ]
                    );

                    $reservationAdvanceTx->invoice_id = $invoice->id;
                    $reservationAdvanceTx->reference_type = \App\Models\FinancialInvoiceItem::class;
                    $reservationAdvanceTx->reference_id = $invoiceItem->id;
                    $reservationAdvanceTx->description = 'Advance Payment (Rec #' . $advanceReceipt->receipt_no . ') - Order #' . $order->id;
                    $reservationAdvanceTx->payable_type = $payerType;
                    $reservationAdvanceTx->payable_id = $payerId;
                    $reservationAdvanceTx->save();
                } else {
                    $existingAdvanceCredit = \App\Models\Transaction::where('invoice_id', $invoice->id)
                        ->where('type', 'credit')
                        ->where('reference_type', \App\Models\FinancialInvoiceItem::class)
                        ->where('reference_id', $invoiceItem->id)
                        ->where('description', 'like', 'Advance Payment%')
                        ->exists();

                    if (!$existingAdvanceCredit) {
                        $advanceReceipt = \App\Models\FinancialReceipt::create([
                            'payer_type' => $payerType,
                            'payer_id' => $payerId,
                            'receipt_no' => 'REC-' . time() . '-ADV-' . $order->id,
                            'amount' => $advanceToPersist,
                            'advance_amount' => $advanceToPersist,
                            'receipt_date' => now(),
                            'payment_method' => 'cash',
                            'remarks' => "Advance Payment for Order #{$order->id}",
                            'created_by' => Auth::id(),
                        ]);

                        \App\Models\TransactionRelation::create([
                            'invoice_id' => $invoice->id,
                            'receipt_id' => $advanceReceipt->id,
                            'amount' => $advanceToPersist,
                        ]);

                        \App\Models\Transaction::create([
                            'type' => 'credit',
                            'amount' => $advanceToPersist,
                            'date' => now(),
                            'description' => 'Advance Payment (Rec #' . $advanceReceipt->receipt_no . ') - Order #' . $order->id,
                            'payable_type' => $payerType,
                            'payable_id' => $payerId,
                            'reference_type' => \App\Models\FinancialInvoiceItem::class,
                            'reference_id' => $invoiceItem->id,
                            'invoice_id' => $invoice->id,
                            'receipt_id' => $advanceReceipt->id,
                            'created_by' => Auth::id(),
                        ]);
                    }
                }
            }

            // Create Bank Charges Debit Transaction if applicable
            if ($bankChargesAmount > 0) {
                // Check if already exists to avoid duplicates (though OrderPayment implies paying now)
                // We'll create a new item for this payment's charges
                $bcItem = \App\Models\FinancialInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_type' => 8,  // Assuming 8 is Financial Charges or similar constant, using literal for now or fetch constant if available
                    'description' => 'Bank Charges (' . ($request->bank_charges_type == 'percentage' ? $request->bank_charges_value . '%' : 'Fixed') . ')',
                    'qty' => 1,
                    'amount' => round($bankChargesAmount, 0),
                    'sub_total' => round($bankChargesAmount, 0),
                    'total' => round($bankChargesAmount, 0),
                ]);

                \App\Models\Transaction::create([
                    'type' => 'debit',
                    'amount' => $bankChargesAmount,
                    'date' => now(),
                    'description' => 'Bank Charges for Order Payment',
                    'payable_type' => $payerType,
                    'payable_id' => $payerId,
                    'reference_type' => \App\Models\FinancialInvoiceItem::class,
                    'reference_id' => $bcItem->id,
                    'invoice_id' => $invoice->id,
                    'created_by' => Auth::id(),
                ]);
            }

            // 3. Create Financial Receipt & Transaction (Credits)
            // Always create receipt for the PAID portion (if > 0)
            if ($paidAmount > 0 && $invoiceItem) {
                    // Create Receipt
                    $receipt = \App\Models\FinancialReceipt::create([
                        'payer_type' => $payerType,
                        'payer_id' => $payerId,
                        'receipt_no' => 'REC-' . time() . '-PAY-' . $order->id,
                        'amount' => $paidAmount,
                        'receipt_date' => now(),
                        'payment_method' => $effectivePaymentMethod,
                        'payment_account_id' => $effectivePaymentMethod === 'split_payment' ? null : $request->payment_account_id,
                        'payment_details' => json_encode([
                            'credit_card_type' => $request->credit_card_type,
                            'split_payment' => $effectivePaymentMethod === 'split_payment' ? [
                                'cash' => $request->cash,
                                'credit_card' => $request->credit_card,
                                'bank' => $request->bank_transfer
                            ] : null,
                            'split_payment_accounts' => $effectivePaymentMethod === 'split_payment' ? $request->input('split_payment_accounts') : null,
                            'receipt_path' => $receiptPath,
                            'ent_details' => $entDetails ? "ENT Value: $entAmount" : null,
                            'cts_details' => $ctsAmount > 0 ? "CTS Value: $ctsAmount" : null,
                            'employee_auto_payment' => $employeeAutoPayment,
                        ]),
                        'created_by' => Auth::id(),
                    ]);

                    \App\Models\TransactionRelation::create([
                        'invoice_id' => $invoice->id,
                        'receipt_id' => $receipt->id,
                        'amount' => $paidAmount,
                    ]);

                    // Create Credit Transaction
                    \App\Models\Transaction::create([
                        'type' => 'credit',
                        'amount' => $paidAmount,  // Total amount credited
                        'date' => now(),
                        'description' => 'Payment Received (Rec #' . $receipt->receipt_no . ') - Order #' . $order->id,
                        'payable_type' => $payerType,
                        'payable_id' => $payerId,
                        'reference_type' => \App\Models\FinancialInvoiceItem::class,
                        'reference_id' => $invoiceItem->id,
                        'invoice_id' => $invoice->id,
                        'receipt_id' => $receipt->id,
                        'created_by' => Auth::id(),
                    ]);
            }
        }

        return back()->with('success', 'Payment successful');
    }

    private function calculateEmployeeAutoPayment(Order $order, float $totalDue): array
    {
        $employee = Employee::with([
            'salaryStructure:id,employee_id,basic_salary,is_active',
            'allowances' => function ($q) {
                $q->with('allowanceType:id,name,type,is_active');
            },
            'user.userDetail:id,user_id,ntn',
        ])->find($order->employee_id);

        if (!$employee) {
            return [
                'food_allowance_entitlement' => 0,
                'food_allowance_used' => 0,
                'food_allowance_applied' => 0,
                'food_allowance_remaining_after' => 0,
                'cts_allowed' => false,
                'cts_amount' => 0,
                'cash_required' => max(0, $totalDue),
            ];
        }

        $now = Carbon::now();
        $foodAllowance = EmployeeAllowance::with('allowanceType:id,name,type,is_active')
            ->where('employee_id', $employee->id)
            ->where('allowance_type_id', AppConstants::FOOD_ALLOWANCE_TYPE_ID)
            ->where('is_active', true)
            ->whereDate('effective_from', '<=', $now->toDateString())
            ->where(function ($q) use ($now) {
                $q->whereNull('effective_to')->orWhereDate('effective_to', '>=', $now->toDateString());
            })
            ->orderByDesc('effective_from')
            ->first();

        $basicSalary = (float) ($employee->salaryStructure->basic_salary ?? $employee->salary ?? 0);
        $foodAllowanceEntitlement = 0.0;

        if ($foodAllowance && $foodAllowance->allowanceType && $foodAllowance->allowanceType->is_active) {
            if ($foodAllowance->allowanceType->type === 'percentage') {
                $percentage = (float) ($foodAllowance->percentage ?? $foodAllowance->amount ?? 0);
                $foodAllowanceEntitlement = ($basicSalary * $percentage) / 100;
            } else {
                $foodAllowanceEntitlement = (float) ($foodAllowance->amount ?? 0);
            }
        } else {
            $globalFoodType = AllowanceType::where('id', AppConstants::FOOD_ALLOWANCE_TYPE_ID)
                ->where('is_active', true)
                ->where('is_global', true)
                ->first();

            if ($globalFoodType) {
                if ($globalFoodType->type === 'percentage') {
                    $foodAllowanceEntitlement = ($basicSalary * (float) ($globalFoodType->percentage ?? 0)) / 100;
                } else {
                    $foodAllowanceEntitlement = (float) ($globalFoodType->default_amount ?? 0);
                }
            }
        }

        $usedFoodAllowance = FinancialInvoice::where('invoice_type', 'food_order')
            ->where('employee_id', $employee->id)
            ->whereBetween('payment_date', [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()])
            ->get(['data'])
            ->sum(function ($invoice) {
                $data = $invoice->data;
                if (is_string($data)) {
                    $decoded = json_decode($data, true);
                    $data = is_array($decoded) ? $decoded : [];
                }
                if (!is_array($data)) {
                    $data = [];
                }
                return (float) ($data['food_allowance_applied'] ?? 0);
            });

        $availableFoodAllowance = max(0, $foodAllowanceEntitlement - $usedFoodAllowance);
        $foodAllowanceApplied = min($totalDue, $availableFoodAllowance);

        $remainingAfterFoodAllowance = max(0, $totalDue - $foodAllowanceApplied);
        $ctsAllowed = $this->canEmployeeUseCts($employee);
        $ctsAmount = $ctsAllowed ? $remainingAfterFoodAllowance : 0;
        $cashRequired = max(0, $remainingAfterFoodAllowance - $ctsAmount);

        return [
            'food_allowance_entitlement' => round($foodAllowanceEntitlement, 2),
            'food_allowance_used' => round($usedFoodAllowance, 2),
            'food_allowance_applied' => round($foodAllowanceApplied, 2),
            'food_allowance_remaining_after' => round(max(0, $availableFoodAllowance - $foodAllowanceApplied), 2),
            'remaining_after_food_allowance' => round($remainingAfterFoodAllowance, 2),
            'cts_allowed' => $ctsAllowed,
            'max_cts_amount' => round($remainingAfterFoodAllowance, 2),
            'cts_amount' => round($ctsAmount, 2),
            'cash_required' => round($cashRequired, 2),
        ];
    }

    private function canEmployeeUseCts(Employee $employee): bool
    {
        $flags = [
            $employee->getAttribute('allow_cts'),
            $employee->getAttribute('cts_allowed'),
            $employee->getAttribute('is_cts_allowed'),
            $employee->getAttribute('entertainment'),
            $employee->getAttribute('ntn'),
            data_get($employee, 'user.userDetail.ntn'),
        ];

        foreach ($flags as $flag) {
            if ($flag === null || $flag === '') {
                continue;
            }

            if (is_bool($flag)) {
                return $flag;
            }

            if (is_numeric($flag)) {
                $numeric = (int) $flag;
                if ($numeric === 2) {
                    return true;
                }
                if ($numeric === 1 || $numeric === 0) {
                    return false;
                }
            }

            $value = strtolower(trim((string) $flag));
            if (in_array($value, ['cts', 'yes', 'true', 'allowed', 'allow', 'on'], true)) {
                return true;
            }
            if (in_array($value, ['ntn', 'no', 'false', 'not_allowed', 'disabled', 'off'], true)) {
                return false;
            }
        }

        return $employee->salaryStructure()->exists();
    }

    /**
     * Transaction History - Shows all paid transactions
     */
    public function transactionHistory(Request $request)
    {
        $query = Order::where('created_by', Auth::id())
            ->whereIn('order_type', ['dineIn', 'delivery', 'takeaway', 'reservation', 'room_service'])
            ->where('payment_status', 'paid')
            ->with([
                'member:id,full_name,membership_no',
                'customer:id,name,customer_no',
                'employee:id,employee_id,name',
                'table:id,table_no',
                'cashier:id,name',
                'waiter:id,name',
                'tenant:id,name',  // ✅ Load Tenant Name
                'orderItems:id,order_id,order_item,status',
                'invoice',  // Load the invoice relation to get bank charges data
            ])
            ->addSelect([
                'orders.*',
                'invoice_ent_amount' => FinancialInvoice::select('ent_amount')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_cts_amount' => FinancialInvoice::select('cts_amount')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_advance_payment' => FinancialInvoice::select('advance_payment')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_advance_deducted' => FinancialInvoice::selectRaw("CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.advance_deducted')), '0') AS DECIMAL(10,2))")
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_bank_charges_amount' => FinancialInvoice::selectRaw("CAST(COALESCE(JSON_UNQUOTE(JSON_EXTRACT(data, '\\$.bank_charges_amount')), '0') AS DECIMAL(10,2))")
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_ent_reason' => FinancialInvoice::select('ent_reason')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
                'invoice_cts_comment' => FinancialInvoice::select('cts_comment')
                    ->where('invoice_type', 'food_order')
                    ->whereRaw("JSON_UNQUOTE(JSON_EXTRACT(data, '\$.order_id')) = CAST(orders.id AS CHAR)")
                    ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'paid' THEN 1 ELSE 2 END")
                    ->orderByDesc('id')
                    ->limit(1),
            ]);

        // 🔍 Search by Order ID
        if ($request->filled('search_id')) {
            $query->where('id', $request->search_id);
        }

        // 🔍 Search by Client Name
        if ($request->filled('search_name')) {
            $searchName = trim($request->search_name);
            $query->where(function ($q) use ($searchName) {
                $q
                    ->whereHas('member', fn($q) => $q->where('full_name', 'like', "%$searchName%"))
                    ->orWhereHas('customer', fn($q) => $q->where('name', 'like', "%$searchName%"))
                    ->orWhereHas('employee', fn($q) => $q->where('name', 'like', "%$searchName%"));
            });
        }

        // 📅 Date range filter (by paid_at)
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('paid_at', [$request->start_date . ' 00:00:00', $request->end_date . ' 23:59:59']);
        } elseif ($request->filled('start_date')) {
            $query->whereDate('paid_at', '>=', $request->start_date);
        } elseif ($request->filled('end_date')) {
            $query->whereDate('paid_at', '<=', $request->end_date);
        }

        // 💳 Payment method filter
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }

        // 🍽 Order type filter
        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('order_type', $request->type);
        }

        // Clone query for totals before pagination
        $totalsQuery = clone $query;

        $orders = $query->orderBy('paid_at', 'desc')->paginate(10)->withQueryString();

        // Calculate totals for summary (from cloned query)
        $totals = [
            'total_amount' => $totalsQuery->sum('total_price'),
            'total_paid' => $totalsQuery->sum('paid_amount'),
            'count' => $totalsQuery->count(),
        ];

        return Inertia::render('App/Transaction/History/Dashboard', [
            'orders' => $orders,
            'filters' => $request->all(),
            'totals' => $totals,
        ]);
    }
}
