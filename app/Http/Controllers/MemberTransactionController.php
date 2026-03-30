<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Helpers\FileHelper;
use App\Models\AccountingEventQueue;
use App\Models\CorporateMember;
use App\Models\FinancialChargeType;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\JournalEntry;
use App\Models\Member;
use App\Models\Subscription;
use App\Models\SubscriptionCategory;
use App\Models\SubscriptionType;
use App\Models\Tenant;
use App\Models\TransactionType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Services\Accounting\Support\AccountingSourceResolver;
use App\Services\Accounting\Support\PaymentAccountPostingGuard;

class MemberTransactionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:financial.create')->only('create', 'store');
        $this->middleware('permission:financial.view')->only('searchMembers', 'getMemberTransactions', 'getAllTransactions');
    }

    public function index(Request $request)
    {
        $perPage = $this->resolvePerPage($request, 10);
        // Get transaction statistics
        $totalTransactions = FinancialInvoice::whereIn('fee_type', ['membership_fee', 'maintenance_fee', 'subscription_fee', 'reinstating_fee'])->count();
        $totalRevenue = FinancialInvoice::whereIn('fee_type', ['membership_fee', 'maintenance_fee', 'subscription_fee', 'reinstating_fee'])
            ->where('status', 'paid')
            ->sum('total_price');

        $membershipFeeRevenue = FinancialInvoice::where('fee_type', 'membership_fee')
            ->where('status', 'paid')
            ->sum('total_price');

        $maintenanceFeeRevenue = FinancialInvoice::where('fee_type', 'maintenance_fee')
            ->where('status', 'paid')
            ->sum('total_price');

        $subscriptionFeeRevenue = FinancialInvoice::where('fee_type', 'subscription_fee')
            ->where('status', 'paid')
            ->sum('total_price');

        $reinstatingFeeRevenue = FinancialInvoice::where('fee_type', 'reinstating_fee')
            ->where('status', 'paid')
            ->sum('total_price');

        // Recent transactions
        $recentTransactions = FinancialInvoice::whereIn('fee_type', ['membership_fee', 'maintenance_fee', 'subscription_fee', 'reinstating_fee'])
            ->with('member:id,full_name,membership_no')
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();
        $recentTransactions->setCollection($this->decorateMembershipInvoices($recentTransactions->getCollection()));

        return Inertia::render('App/Admin/Membership/Transactions/Dashboard', [
            'statistics' => [
                'total_transactions' => $totalTransactions,
                'total_revenue' => $totalRevenue,
                'membership_fee_revenue' => $membershipFeeRevenue,
                'maintenance_fee_revenue' => $maintenanceFeeRevenue,
                'subscription_fee_revenue' => $subscriptionFeeRevenue,
                'reinstating_fee_revenue' => $reinstatingFeeRevenue,
                'failed_postings' => AccountingEventQueue::query()->where('source_type', FinancialInvoice::class)->where('status', 'failed')->count(),
                'pending_postings' => AccountingEventQueue::query()->where('source_type', FinancialInvoice::class)->where('status', 'pending')->count(),
            ],
            'recent_transactions' => $recentTransactions,
            'filters' => $request->only(['per_page']),
        ]);
    }

    public function create()
    {
        // Get subscription types and categories for subscription fees
        $subscriptionTypes = SubscriptionType::all(['id', 'name']);
        $subscriptionCategories = SubscriptionCategory::where('status', 'active')
            ->with('subscriptionType:id,name')
            ->get(['id', 'name', 'subscription_type_id', 'fee', 'description']);

        // Fetch Transaction Types based on constants mapping
        $membershipCharges = TransactionType::where('type', AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP)->get();
        $maintenanceCharges = TransactionType::where('type', AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE)->get();
        $subscriptionCharges = TransactionType::where('type', AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION)->get();
        $otherCharges = TransactionType::where('type', AppConstants::TRANSACTION_TYPE_ID_FINANCIAL_CHARGE)->get();

        // Fetch Financial Charge Types for the additional dropdown
        $financialChargeTypes = FinancialChargeType::where('status', 'active')->get();

        return Inertia::render('App/Admin/Membership/Transactions/Create', [
            'subscriptionTypes' => $subscriptionTypes,
            'subscriptionCategories' => $subscriptionCategories,
            'membershipCharges' => $membershipCharges,
            'maintenanceCharges' => $maintenanceCharges,
            'subscriptionCharges' => $subscriptionCharges,
            'otherCharges' => $otherCharges,
            'financialChargeTypes' => $financialChargeTypes,
        ]);
    }

    public function searchMembers(Request $request)
    {
        $query = $request->input('query');
        $type = $request->input('type', 'member');

        if ($type === 'corporate') {
            $members = CorporateMember::where('full_name', 'like', "%{$query}%")
                ->orWhere('membership_no', 'like', "%{$query}%")
                ->orWhere('cnic_no', 'like', "%{$query}%")
                ->orWhere('mobile_number_a', 'like', "%{$query}%")
                ->select('id', 'full_name', 'membership_no', 'cnic_no', 'mobile_number_a', 'current_address as address', 'total_membership_fee', 'membership_fee', 'total_maintenance_fee', 'maintenance_fee')
                ->limit(50)
                ->get();
        } elseif ($type === 'guest') {
            $members = \App\Models\Customer::where('name', 'like', "%{$query}%")
                ->orWhere('customer_no', 'like', "%{$query}%")
                ->orWhere('cnic', 'like', "%{$query}%")
                ->orWhere('contact', 'like', "%{$query}%")
                ->select('id', 'name as full_name', 'customer_no as membership_no', 'cnic as cnic_no', 'contact as mobile_number_a', 'address')
                ->limit(50)
                ->get();
        } elseif (str_starts_with($type, 'guest-')) {
            $guestTypeId = str_replace('guest-', '', $type);
            $members = \App\Models\Customer::where('guest_type_id', $guestTypeId)
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('customer_no', 'like', "%{$query}%")
                        ->orWhere('cnic', 'like', "%{$query}%")
                        ->orWhere('contact', 'like', "%{$query}%");
                })
                ->select('id', 'name as full_name', 'customer_no as membership_no', 'cnic as cnic_no', 'contact as mobile_number_a', 'address')
                ->limit(50)
                ->get();
        } else {
            $members = Member::whereNull('parent_id')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('full_name', 'like', "%{$query}%")
                        ->orWhere('membership_no', 'like', "%{$query}%")
                        ->orWhere('cnic_no', 'like', "%{$query}%")
                        ->orWhere('mobile_number_a', 'like', "%{$query}%");
                })
                ->with(['memberCategory:id,name,fee,subscription_fee'])
                ->select('id', 'full_name', 'membership_no', 'cnic_no', 'mobile_number_a', 'membership_date', 'member_category_id', 'status', 'total_membership_fee', 'membership_fee', 'total_maintenance_fee', 'maintenance_fee')
                ->limit(50)
                ->get();
        }

        return response()->json(['members' => $members]);
    }

    public function getMemberTransactions(Request $request, $memberId)
    {
        $type = $request->input('type', '0');  // '0' for member, '2' for corporate

        if ($type === '2') {
            $member = CorporateMember::where('id', $memberId)
                ->with([
                    'memberCategory:id,name,fee,subscription_fee',
                    'familyMembers:id,parent_id,full_name,relation,membership_no,status'
                ])
                ->first();

            if (!$member) {
                return response()->json(['error' => 'Corporate Member not found'], 404);
            }

            $transactions = FinancialInvoice::where('corporate_member_id', $memberId)
                ->with(['items.transactions'])
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            $member = Member::where('id', $memberId)
                ->with([
                    'memberCategory:id,name,fee,subscription_fee',
                    'familyMembers:id,parent_id,full_name,relation,membership_no,status'
                ])
                ->first();

            if (!$member) {
                return response()->json(['error' => 'Member not found'], 404);
            }

            $transactions = FinancialInvoice::where('member_id', $memberId)
                ->with(['items.transactions'])
                ->orderBy('created_at', 'desc')
                ->get();
        }

        // Calculate Paid Amount for each item
        $transactions->each(function ($invoice) {
            $invoice->items->each(function ($item) {
                $item->paid_amount = $item
                    ->transactions
                    ->where('type', 'credit')
                    ->sum('amount');
            });
        });

        $membershipFeePaid = $transactions
            ->where('fee_type', 'membership_fee')
            ->where('status', 'paid')
            ->isNotEmpty();

        // Calculate Ledger Balance
        // Assuming Transaction model exists and tracks debits/credits via polymorphic relation
        // Balance = Total Debits (Invoices) - Total Credits (Payments)
        // Adjust logic if 'opening balance' or other factors exist

        $debits = \App\Models\Transaction::where('payable_type', get_class($member))
            ->where('payable_id', $memberId)
            ->where('type', 'debit')
            ->sum('amount');

        $credits = \App\Models\Transaction::where('payable_type', get_class($member))
            ->where('payable_id', $memberId)
            ->where('type', 'credit')
            ->sum('amount');

        $ledgerBalance = $debits - $credits;

        return response()->json([
            'member' => $member,
            'transactions' => $transactions,
            'membership_fee_paid' => $membershipFeePaid,
            'ledger_balance' => $ledgerBalance,
        ]);
    }

    public function store(Request $request)
    {
        try {
            // 1. Validation
            $bookingType = $request->booking_type;
            // Loosen validation for guest types (guest-1, etc)
            $validBookingType = in_array($bookingType, ['member', 'corporate', 'guest']) || str_starts_with($bookingType, 'guest-');

            if (!$validBookingType) {
                return response()->json(['errors' => ['booking_type' => ['The selected booking type is invalid.']]], 422);
            }

            $rules = [
                // 'booking_type' => 'required|in:member,corporate,guest', // Removed strict in check
                'action' => 'required|in:save,save_print,save_receive,pay_existing_invoice',
                'items' => 'required|array|min:1',
                'items.*.fee_type' => 'required|string',
                'items.*.financial_charge_type_id' => 'nullable|integer|exists:financial_charge_types,id',
                'items.*.amount' => 'required|numeric|min:0',
                'items.*.extra_percentage' => 'nullable|numeric|min:0',
                'payment_method' => 'required_if:action,save_receive,pay_existing_invoice|in:cash,cheque,online,credit_card,debit_card,bank_transfer',
                'payment_account_id' => 'required_if:action,save_receive,pay_existing_invoice|exists:payment_accounts,id',
            ];

            if ($bookingType === 'corporate') {
                $rules['corporate_member_id'] = 'required|exists:corporate_members,id';
            } elseif (str_starts_with($bookingType, 'guest')) {
                // For generic 'guest', customer_id is needed. For 'guest-X', checking existence might be complex due to dynamic IDs?
                // Actually the frontend sends customer_id for all guest types now.
                // Let's validate customer_id exists in customers table.
                $rules['customer_id'] = 'required|exists:customers,id';
            } else {
                $rules['member_id'] = 'required|exists:members,id';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            // Handle Existing Invoice Payment
            if ($request->action === 'pay_existing_invoice' && $request->has('invoice_id')) {
                return $this->payExistingInvoice($request);
            }

            // 2. Resolve Member / Payer
            if ($request->booking_type === 'corporate') {
                $member = CorporateMember::find($request->corporate_member_id);
                $memberId = null;
                $corporateId = $request->corporate_member_id;
                $customerId = null;
                $memberName = $member->full_name;
                $payerType = CorporateMember::class;
                $payerId = $member->id;
                $invoiceableId = $member->id;
                $invoiceableType = CorporateMember::class;
            } elseif (str_starts_with($request->booking_type, 'guest')) {
                $member = \App\Models\Customer::find($request->customer_id);
                $memberId = null;
                $corporateId = null;
                $customerId = $request->customer_id;
                $memberName = $member->name;
                $payerType = \App\Models\Customer::class;
                $payerId = $member->id;
                $invoiceableId = null;  // Guests usually don't have a polymorphic invoiceable user link in the same way, or use Customer?
                $invoiceableType = null;
            } else {
                $member = Member::where('id', $request->member_id)->first();
                $memberId = $request->member_id;
                $corporateId = null;
                $customerId = null;
                $memberName = $member->full_name;
                $payerType = Member::class;
                $payerId = $member->id;
                $invoiceableId = $member->id;
                $invoiceableType = Member::class;
            }

            // 3. One-Time Membership Fee Validation
            // 3b. Maintenance/Subscription Date Conflict Validation
            foreach ($request->items as $index => $item) {
                $feeTypeInput = $item['fee_type'] ?? '';
                $transactionType = is_numeric($feeTypeInput) ? \App\Models\TransactionType::find(intval($feeTypeInput)) : null;
                $feeCategory = $transactionType ? intval($transactionType->type) : (is_numeric($feeTypeInput) ? intval($feeTypeInput) : $feeTypeInput);

                $validFrom = $item['valid_from'] ?? $item['start_date'] ?? null;
                $validTo = $item['valid_to'] ?? $item['end_date'] ?? null;

                $isMaintenance = ($feeTypeInput === 'maintenance_fee') || ($feeCategory === AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE);
                $isSubscription = ($feeTypeInput === 'subscription_fee') || ($feeCategory === AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION);

                if (!($isMaintenance || $isSubscription)) {
                    continue;
                }

                if (!$validFrom || !$validTo) {
                    continue;
                }

                $scopeMember = function ($q) use ($memberId, $corporateId, $customerId) {
                    if ($memberId)
                        $q->where('member_id', $memberId);
                    elseif ($corporateId)
                        $q->where('corporate_member_id', $corporateId);
                    elseif ($customerId)
                        $q->where('customer_id', $customerId);
                };

                if ($isMaintenance) {
                    $legacyConflict = FinancialInvoice::query()
                        ->where($scopeMember)
                        ->where('status', '!=', 'cancelled')
                        ->whereIn('fee_type', ['maintenance_fee', AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE])
                        ->where(function ($q) use ($validFrom, $validTo) {
                            $q
                                ->where('valid_from', '<=', $validTo)
                                ->where('valid_to', '>=', $validFrom);
                        })
                        ->exists();

                    $itemConflict = \App\Models\FinancialInvoiceItem::whereHas('invoice', function ($q) use ($scopeMember) {
                        $q->where('status', '!=', 'cancelled')->where($scopeMember);
                    })
                        ->whereIn('fee_type', ['maintenance_fee', AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE])
                        ->where(function ($q) use ($validFrom, $validTo) {
                            $q
                                ->where('start_date', '<=', $validTo)
                                ->where('end_date', '>=', $validFrom);
                        })
                        ->exists();

                    if ($legacyConflict || $itemConflict) {
                        return response()->json(['errors' => ["items.$index.fee_type" => ["Maintenance Fee overlaps with an existing period ($validFrom to $validTo)."]]], 422);
                    }
                }

                if ($isSubscription) {
                    $subTypeId = $item['subscription_type_id'] ?? null;
                    if (!$subTypeId)
                        continue;

                    $itemConflict = \App\Models\FinancialInvoiceItem::whereHas('invoice', function ($q) use ($scopeMember) {
                        $q->where('status', '!=', 'cancelled')->where($scopeMember);
                    })
                        ->whereIn('fee_type', ['subscription_fee', AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION])
                        ->where('subscription_type_id', $subTypeId)
                        ->where(function ($q) use ($validFrom, $validTo) {
                            $q
                                ->where('start_date', '<=', $validTo)
                                ->where('end_date', '>=', $validFrom);
                        })
                        ->exists();

                    if ($itemConflict) {
                        return response()->json(['errors' => ["items.$index.fee_type" => ['Subscription for this type overlaps with an existing period.']]], 422);
                    }
                }
            }

            $isMembershipFee = collect($request->items)->contains(function ($item) {
                $feeTypeInput = $item['fee_type'] ?? '';
                $transactionType = is_numeric($feeTypeInput) ? \App\Models\TransactionType::find(intval($feeTypeInput)) : null;
                $feeCategory = $transactionType ? intval($transactionType->type) : (is_numeric($feeTypeInput) ? intval($feeTypeInput) : $feeTypeInput);
                return ($feeTypeInput === 'membership_fee') || ($feeCategory === AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP);
            });
            if ($isMembershipFee) {
                $exists = FinancialInvoice::query()
                    ->where(function ($q) use ($memberId, $corporateId, $customerId) {
                        if ($memberId)
                            $q->where('member_id', $memberId);
                        elseif ($corporateId)
                            $q->where('corporate_member_id', $corporateId);
                        elseif ($customerId)
                            $q->where('customer_id', $customerId);
                    })
                    ->where('status', '!=', 'cancelled')  // Ignore cancelled invoices
                    ->where(function ($q) {
                        $q
                            ->where('fee_type', 'membership_fee')
                            ->orWhereHas('items', function ($sub) {
                                $sub->whereIn('fee_type', ['membership_fee', AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP]);
                            });
                    })
                    ->exists();

                if ($exists) {
                    return response()->json(['errors' => ['items' => ['Membership Fee has already been charged for this member/customer functionality.']]], 422);
                }
            }

            // 3. Prepare Header Data
            $invoiceNo = $this->generateInvoiceNumber();
            $totalAmount = collect($request->items)->sum(function ($item) {
                return $item['amount'] * ($item['qty'] ?? 1);
            });

            // Calculate Global Invoice Totals (Sum of items)
            // Note: The UI might send global discount, or per-item.
            // For now, assuming standard flow: Sum of (SubTotal + Tax - Discount)
            $finalTotal = 0;
            $totalTax = 0;
            $totalDiscount = 0;

            // 4. Create Invoice Header (Unpaid initially)
            // 4. Create Invoice Header (Unpaid initially)
            $invoice = FinancialInvoice::create([
                'invoice_no' => $invoiceNo,
                'member_id' => $memberId,
                'corporate_member_id' => $corporateId,
                'customer_id' => $customerId,
                'invoiceable_id' => $invoiceableId,
                'invoiceable_type' => $invoiceableType,
                'fee_type' => 'mixed',
                'invoice_type' => 'invoice',
                'amount' => 0,  // Will update after processing items
                'total_price' => 0,
                'status' => 'unpaid',
                'issue_date' => now(),
                'due_date' => now()->addDays(30),
                'remarks' => $request->remarks,
                'created_by' => Auth::id(),
                'data' => [
                    'member_name' => $memberName,
                    'action' => $request->action
                ]
            ]);

            // 5. Process Items
            $createdItems = [];  // Track created items for payment processing

            foreach ($request->items as $itemData) {
                $qty = $itemData['qty'] ?? 1;
                $rate = $itemData['amount'];
                $baseSubTotal = $rate * $qty;

                $taxPct = $itemData['tax_percentage'] ?? 0;
                $discAmtInput = $itemData['discount_amount'] ?? 0;
                $extraPct = $itemData['extra_percentage'] ?? 0;
                $addChargesFixed = $itemData['additional_charges'] ?? 0;
                $addChargesAmt = $extraPct > 0 ? round(($baseSubTotal * $extraPct) / 100, 0) : round($addChargesFixed, 0);
                $subTotal = $baseSubTotal + $addChargesAmt;
                $taxAmt = ($subTotal * $taxPct) / 100;

                $discAmt = $discAmtInput;

                $lineTotal = $subTotal + $taxAmt - $discAmt;

                $finalTotal += $lineTotal;
                $totalTax += $taxAmt;
                $totalDiscount += $discAmt;

                // Resolve Fee Type from ID if possible
                $transactionType = \App\Models\TransactionType::find($itemData['fee_type']);

                // Use the Generic Type ID (e.g. 4 for Maintenance) if found, otherwise use input
                $feeTypeIdToStore = $transactionType ? $transactionType->type : $itemData['fee_type'];

                // Determine if it is a subscription fee based on the TransactionType 'type' column
                $isSubscription = $transactionType && $transactionType->type == AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION;

                $subscriptionCategoryId = $itemData['subscription_category_id'] ?? null;
                $subscriptionTypeId = $itemData['subscription_type_id'] ?? null;
                if ($isSubscription && !$subscriptionTypeId && $subscriptionCategoryId) {
                    $category = SubscriptionCategory::find($subscriptionCategoryId);
                    if ($category) {
                        $subscriptionTypeId = $category->subscription_type_id;
                    }
                }

                $invoiceItem = new \App\Models\FinancialInvoiceItem([
                    'invoice_id' => $invoice->id,
                    'fee_type' => $feeTypeIdToStore,  // Storing the Category ID (3, 4, 5, 6)
                    'description' => $itemData['description'] ?? ($transactionType ? $transactionType->name : ($itemData['fee_type_name'] ?? $itemData['fee_type'])),
                    'qty' => $qty,
                    'amount' => $rate,
                    'additional_charges' => $addChargesAmt,
                    'extra_percentage' => $extraPct,
                    'sub_total' => $subTotal,
                    'tax_percentage' => $taxPct,
                    'tax_amount' => $taxAmt,
                    'overdue_percentage' => $itemData['overdue_percentage'] ?? 0,
                    'discount_type' => $itemData['discount_type'] ?? null,
                    'discount_value' => $itemData['discount_value'] ?? 0,
                    'discount_amount' => $discAmt,
                    'discount_details' => $itemData['discount_details'] ?? null,
                    'remarks' => $itemData['remarks'] ?? null,
                    'total' => round($lineTotal, 0),
                    'start_date' => $itemData['valid_from'] ?? null,
                    'end_date' => $itemData['valid_to'] ?? null,
                    // Linking
                    'subscription_type_id' => $subscriptionTypeId,
                    'subscription_category_id' => $subscriptionCategoryId,
                    'family_member_id' => $itemData['family_member_id'] ?? null,
                    'financial_charge_type_id' => $itemData['financial_charge_type_id'] ?? null,
                ]);
                $invoiceItem->save();
                $createdItems[] = $invoiceItem;

                // 6. Ledger: Debit the Member (Charge Created) - PER ITEM
                \App\Models\Transaction::create([
                    'payable_type' => $payerType,
                    'payable_id' => $payerId,
                    'type' => 'debit',
                    'amount' => $lineTotal,
                    'reference_type' => \App\Models\FinancialInvoiceItem::class,
                    'reference_id' => $invoiceItem->id,
                    'invoice_id' => $invoice->id,
                    'description' => "Invoice #{$invoiceNo} - " . ($invoiceItem->description ?? 'Item Charge'),
                    'date' => now(),
                ]);

                // Side Effects (Subscription/Maintenance creation) logic here...
                if ($isSubscription) {
                    $this->createSubscriptionRecord([
                        ...$itemData,
                        'subscription_type_id' => $subscriptionTypeId,
                        'subscription_category_id' => $subscriptionCategoryId,
                    ], $invoice, $member, $request->booking_type);
                }
            }

            // Update Invoice Totals
            $invoice->amount = $finalTotal - $totalTax + $totalDiscount;  // Net amount before tax/disc roughly
            $invoice->tax_amount = $totalTax;
            $invoice->discount_amount = $totalDiscount;
            $invoice->total_price = $finalTotal;
            $invoice->save();

            // 7. Handle Payment (Save & Receive)
            if ($request->action === 'save_receive') {
                $paidAmount = $finalTotal;  // Assuming full payment for now. Partial logic can be added later.
                $paymentAccount = $this->validatedPostingPaymentAccount(
                    $request->payment_account_id,
                    $request->payment_method,
                );

                // A. Create Receipt
                $receipt = \App\Models\FinancialReceipt::create([
                    'receipt_no' => 'REC-' . time(),  // dynamic generator needed
                    'payer_type' => $payerType,
                    'payer_id' => $payerId,
                    'amount' => $paidAmount,
                    'payment_method' => $request->payment_method,
                    'payment_account_id' => $paymentAccount->id,
                    'payment_details' => $request->payment_mode_details,  // Map cheque no/trans ID
                    'receipt_date' => now(),
                    'remarks' => $request->remarks ?? ('Payment for Invoice #' . $invoiceNo),
                    'created_by' => Auth::id(),
                ]);

                // B. Ledger: Credit the Member (Payment Received) - PER ITEM
                // In "Deep Migration" logic, payments track specific items.
                // Since this is a full payment, we credit against EACH item.
                foreach ($createdItems as $item) {
                    \App\Models\Transaction::create([
                        'payable_type' => $payerType,
                        'payable_id' => $payerId,
                        'type' => 'credit',
                        'amount' => $item->total,  // Full amount of the item
                        'reference_type' => \App\Models\FinancialInvoiceItem::class,
                        'reference_id' => $item->id,
                        'invoice_id' => $invoice->id,
                        'receipt_id' => $receipt->id,
                        'description' => "Payment Received (Rec #{$receipt->receipt_no})",
                        'date' => now(),
                    ]);
                }

                // C. Relation: Link Receipt to Invoice (Keeping this for Invoice-Level Lookup)
                \App\Models\TransactionRelation::create([
                    'invoice_id' => $invoice->id,
                    'receipt_id' => $receipt->id,
                    'amount' => $paidAmount,
                ]);

                // D. Update Invoice Status
                $invoice->status = 'paid';
                $invoice->paid_amount = $paidAmount;
                $invoice->customer_charges = 0;
                $invoice->payment_method = $request->payment_method;
                $invoice->payment_date = now();

                $data = $invoice->data ?? [];
                if ($request->payment_mode_details) {
                    $data['payment_details'] = $request->payment_mode_details;
                    $invoice->data = $data;
                }

                $invoice->save();
            }

            DB::commit();

            // Reload relationships ensuring corporate/member data is available for frontend
            $invoice->load(['member', 'corporateMember', 'customer']);

            return response()->json([
                'success' => true,
                'message' => 'Transaction saved successfully.',
                'invoice' => $invoice,
                'item_count' => count($request->items)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Transaction creation failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed: ' . $e->getMessage()], 500);
        }
    }

    // Helper to create Subscription Record
    private function createSubscriptionRecord($data, $invoice, $member, $bookingType)
    {
        $validFrom = $data['valid_from'] ?? $data['start_date'] ?? now()->toDateString();
        $validTo = $data['valid_to'] ?? $data['end_date'] ?? now()->addMonth()->toDateString();

        $subscriptionCategoryId = $data['subscription_category_id'] ?? null;
        $subscriptionTypeId = $data['subscription_type_id'] ?? null;
        if (!$subscriptionTypeId && $subscriptionCategoryId) {
            $category = SubscriptionCategory::find($subscriptionCategoryId);
            if ($category) {
                $subscriptionTypeId = $category->subscription_type_id;
            }
        }
        if (!$subscriptionTypeId || !$subscriptionCategoryId) {
            return;
        }

        $sub = new Subscription([
            'invoice_id' => $invoice->id,
            'subscription_type_id' => $subscriptionTypeId,
            'subscription_category_id' => $subscriptionCategoryId,
            'family_member_id' => $data['family_member_id'] ?? null,
            'valid_from' => $validFrom,
            'valid_to' => $validTo,
            'status' => 'active',
        ]);

        if ($bookingType === 'corporate') {
            $sub->corporate_member_id = $member->id;
        } elseif (str_starts_with($bookingType, 'guest')) {
            // Guest booking - use customer_id
            $sub->customer_id = $member->id;
        } else {
            $sub->member_id = $member->id;
        }
        $sub->save();

        // Placeholder: Generate QR Code or Card Number if not present
        if (!$member->card_number && !$member->qr_code) {
            // Logic to generate card number can be added here or via Observer
        }
    }

    private function checkMaintenanceExists($memberId, $from, $to)
    {
        return FinancialInvoice::where('member_id', $memberId)
            ->where('fee_type', 'maintenance_fee')
            ->where('valid_from', $from)
            ->where('valid_to', $to)
            ->where('status', '!=', 'cancelled')
            ->exists();
    }

    private function checkMembershipFeeExists($memberId)
    {
        return FinancialInvoice::where('member_id', $memberId)
            ->where('fee_type', 'membership_fee')
            ->where('status', '!=', 'cancelled')
            ->exists();
    }

    private function prepareInvoiceData($request, $member)
    {
        $amount = round($request->amount);
        $discountAmount = 0;

        // Calculate discount
        if ($request->discount_type && $request->discount_value) {
            if ($request->discount_type === 'percent') {
                $discountAmount = ($amount * $request->discount_value) / 100;
            } else {
                $discountAmount = $request->discount_value;
            }
        }

        $baseAmount = $amount - $discountAmount;
        $taxAmount = 0;
        $overdueAmount = 0;

        // Calculate tax
        if ($request->tax_percentage) {
            $taxAmount = ($baseAmount * $request->tax_percentage) / 100;
        }

        // Calculate overdue
        if ($request->overdue_percentage) {
            $overdueAmount = ($baseAmount * $request->overdue_percentage) / 100;
        }

        $additionalCharges = 0;
        if ($request->additional_charges) {
            $additionalCharges = $request->additional_charges;
        }

        $totalPrice = round($baseAmount + $taxAmount + $overdueAmount + $additionalCharges);
        $data = [
            'booking_type' => $request->booking_type ?? 'member',
            'fee_type' => $request->fee_type,
            'payment_frequency' => $request->payment_frequency,
            'starting_quarter' => $request->starting_quarter,
            'remarks' => $request->remarks,
            'member_name' => $member->full_name ?? $member->name,
            'membership_no' => $member->membership_no ?? $member->customer_no,
        ];

        if ($request->booking_type === 'corporate') {
            $data['corporate_member_id'] = $member->id;
            $data['member_id'] = null;
        } elseif (str_starts_with($request->booking_type, 'guest')) {
            $data['customer_id'] = $member->id;
            $data['member_id'] = null;
        } else {
            $data['member_id'] = $member->id;
        }

        // Add subscription specific data
        if ($request->fee_type === 'subscription_fee') {
            $subscriptionType = SubscriptionType::find($request->subscription_type_id);
            $subscriptionCategory = SubscriptionCategory::find($request->subscription_category_id);

            $data['subscription_type_id'] = $request->subscription_type_id;
            $data['subscription_category_id'] = $request->subscription_category_id;
            $data['subscription_type_name'] = $subscriptionType ? $subscriptionType->name : null;
            $data['subscription_category_name'] = $subscriptionCategory ? $subscriptionCategory->name : null;

            // Handle family member selection
            if ($request->family_member_id) {
                if ($request->booking_type === 'corporate') {
                    $familyMember = CorporateMember::find($request->family_member_id);
                } else {
                    $familyMember = Member::find($request->family_member_id);
                }

                $data['family_member_id'] = $request->family_member_id;
                $data['family_member_name'] = $familyMember ? $familyMember->full_name : null;
                $data['family_member_relation'] = $familyMember ? $familyMember->relation : null;
            } else {
                $data['family_member_id'] = null;
                $data['family_member_name'] = $member->full_name;
                $data['family_member_relation'] = 'SELF';
            }
        }

        // Handle credit card specific data
        if ($request->payment_method === 'credit_card') {
            // $data['credit_card_type'] = $request->credit_card_type;

            // Handle file upload
            if ($request->hasFile('receipt_file')) {
                $filePath = FileHelper::saveImage($request->file('receipt_file'), 'receipts');
                $data['receipt_path'] = $filePath;
            }
        }

        $invoiceData = [
            'invoice_no' => $this->generateInvoiceNumber(),
            'fee_type' => $request->fee_type,
            'invoice_type' => $request->fee_type === 'membership_fee' ? 'membership' : ($request->fee_type === 'subscription_fee' ? 'subscription' : ($request->fee_type === 'reinstating_fee' ? 'reinstating' : 'maintenance')),
            'amount' => $amount,
            'discount_type' => $request->discount_type,
            'discount_value' => $request->discount_value,
            'tax_percentage' => $request->tax_percentage,
            'tax_amount' => $taxAmount,
            'overdue_percentage' => $request->overdue_percentage,
            'overdue_amount' => $overdueAmount,
            'additional_charges' => $additionalCharges,
            'remarks' => $request->remarks,
            'total_price' => $totalPrice,
            'paid_amount' => $totalPrice,
            'payment_method' => $request->payment_method,
            'payment_date' => now(),
            'issue_date' => now(),
            'due_date' => now()->addDays(30),
            'status' => $request->status ?? 'paid',
            'data' => $data,
            'created_by' => Auth::id(),
        ];

        if ($request->booking_type === 'corporate') {
            $invoiceData['corporate_member_id'] = $member->id;
            $invoiceData['member_id'] = null;
        } elseif (str_starts_with($request->booking_type, 'guest')) {
            $invoiceData['customer_id'] = $member->id;
            $invoiceData['member_id'] = null;
        } else {
            $invoiceData['member_id'] = $member->id;
        }

        // Add subscription foreign keys if subscription fee
        if ($request->fee_type === 'subscription_fee') {
            $invoiceData['subscription_type_id'] = $request->subscription_type_id;
            $invoiceData['subscription_category_id'] = $request->subscription_category_id;
        }

        // Handle dates based on fee type
        if ($request->fee_type === 'membership_fee') {
            // Membership fee is lifetime - set to member's joining date and far future
            $memberJoinDate = Carbon::parse($member->membership_date);
            $invoiceData['valid_from'] = $memberJoinDate->format('Y-m-d');
            $invoiceData['valid_to'] = null;  // Lifetime validity
        } elseif ($request->fee_type === 'subscription_fee') {
            // Use manual validity dates from request for subscription fees
            $invoiceData['valid_from'] = $request->valid_from;
            $invoiceData['valid_to'] = $request->valid_to;  // Can be null for unlimited
        } elseif ($request->fee_type === 'reinstating_fee') {
            // Reinstating fee is a one-time payment with no validity period
            $invoiceData['valid_from'] = now()->format('Y-m-d');
            $invoiceData['valid_to'] = null;  // No expiration for reinstating fee
        } else {
            // Use manual validity dates from request for maintenance fees
            $invoiceData['valid_from'] = $request->valid_from;
            $invoiceData['valid_to'] = $request->valid_to;
        }

        // Handle maintenance fee specific data
        if ($request->fee_type === 'maintenance_fee') {
            $invoiceData['payment_frequency'] = $request->payment_frequency;

            // Use starting quarter from request or calculate based on member's joining date
            if ($request->starting_quarter) {
                $invoiceData['quarter_number'] = $request->starting_quarter;
            } else {
                // Fallback calculation
                $membershipDate = Carbon::parse($member->membership_date);
                $validFrom = Carbon::parse($request->valid_from);
                $monthsSinceMembership = $membershipDate->diffInMonths($validFrom);
                $quarterNumber = floor($monthsSinceMembership / 3) + 1;
                $invoiceData['quarter_number'] = $quarterNumber;
            }
        }

        return $invoiceData;
    }

    private function calculateQuarterData($member, $paymentFrequency)
    {
        $membershipDate = Carbon::parse($member->membership_date);
        $now = now();

        // Calculate which quarter we're in based on membership date
        $monthsSinceMembership = $membershipDate->diffInMonths($now);
        $quartersSinceMembership = floor($monthsSinceMembership / 3);

        // Calculate current quarter start based on membership date
        $currentQuarterStart = $membershipDate->copy()->addMonths($quartersSinceMembership * 3);

        $quartersToAdd = 1;  // Default for quarterly
        if ($paymentFrequency === 'half_yearly') {
            $quartersToAdd = 2;
        } elseif ($paymentFrequency === 'three_quarters') {
            $quartersToAdd = 3;
        } elseif ($paymentFrequency === 'annually') {
            $quartersToAdd = 4;
        }

        $quarterEnd = $currentQuarterStart->copy()->addMonths($quartersToAdd * 3)->subDay();

        return [
            'quarter_number' => $quartersSinceMembership + 1,
            'start_date' => $currentQuarterStart,
            'end_date' => $quarterEnd,
        ];
    }

    private function generateInvoiceNumber()
    {
        // Get the highest invoice_no from all financial_invoices (not just transaction types)
        $lastInvoice = FinancialInvoice::withTrashed()
            ->orderBy('invoice_no', 'desc')
            ->whereNotNull('invoice_no')
            ->first();

        $nextNumber = 1;
        if ($lastInvoice && $lastInvoice->invoice_no) {
            $nextNumber = $lastInvoice->invoice_no + 1;
        }

        // Double-check that this number doesn't exist (safety check)
        while (FinancialInvoice::withTrashed()->where('invoice_no', $nextNumber)->exists()) {
            $nextNumber++;
        }

        return $nextNumber;
    }

    public function show($id)
    {
        $transaction = FinancialInvoice::with('member:id,full_name,membership_no')
            ->findOrFail($id);

        return Inertia::render('App/Admin/Membership/Transactions/Show', [
            'transaction' => $transaction
        ]);
    }

    public function getAllTransactions(Request $request)
    {
        $perPage = $this->resolvePerPage($request, 25);
        $query = FinancialInvoice::whereIn('fee_type', ['membership_fee', 'maintenance_fee'])
            ->with('member:id,full_name,membership_no');

        // Filter by member name or membership number
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('member', function ($q) use ($search) {
                $q
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('membership_no', 'like', "%{$search}%");
            });
        }

        // Filter by fee type
        if ($request->filled('fee_type') && $request->fee_type !== 'all') {
            $query->where('fee_type', $request->fee_type);
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $transactions = $query
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $transactions->setCollection($this->decorateMembershipInvoices($transactions->getCollection()));
        $summary = [
            'count' => $transactions->total(),
            'total_amount' => (float) $transactions->getCollection()->sum(fn ($invoice) => (float) ($invoice->total_price ?? 0)),
            'paid_amount' => (float) $transactions->getCollection()->sum(fn ($invoice) => (float) ($invoice->paid_amount ?? 0)),
            'balance' => (float) $transactions->getCollection()->sum(fn ($invoice) => (float) ($invoice->balance ?? 0)),
            'failed_postings' => (int) $transactions->getCollection()->where('posting_status', 'failed')->count(),
            'pending_postings' => (int) $transactions->getCollection()->where('posting_status', 'pending')->count(),
        ];

        return Inertia::render('App/Admin/Membership/Transactions/Index', [
            'transactions' => $transactions,
            'summary' => $summary,
            'tenants' => Tenant::query()->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'fee_type', 'status', 'date_from', 'date_to', 'per_page'])
        ]);
    }

    private function decorateMembershipInvoices($invoices)
    {
        $sourceResolver = app(AccountingSourceResolver::class);
        $collection = collect($invoices);

        if ($collection->isEmpty()) {
            return $collection;
        }

        $invoiceIds = $collection->pluck('id')->all();
        $events = AccountingEventQueue::query()
            ->with('restaurant:id,name')
            ->where('source_type', FinancialInvoice::class)
            ->whereIn('source_id', $invoiceIds)
            ->latest('updated_at')
            ->get()
            ->groupBy('source_id');
        $journals = JournalEntry::query()
            ->whereIn('module_type', ['financial_invoice', 'membership_invoice', 'maintenance_invoice', 'subscription_invoice'])
            ->whereIn('module_id', $invoiceIds)
            ->get()
            ->groupBy('module_id');

        return $collection->map(function ($invoice) use ($events, $journals, $sourceResolver) {
            $event = $events->get($invoice->id)?->first();
            $journal = $journals->get($invoice->id)?->first();
            $paid = (float) ($invoice->paid_amount ?? 0);
            $source = $sourceResolver->resolveForFinancialInvoice($invoice, $event, $journal);
            $invoice->balance = max(0, (float) ($invoice->total_price ?? 0) - $paid);
            $invoice->posting_status = $source['posting_status'];
            $invoice->journal_entry_id = $source['journal_entry_id'];
            $invoice->restaurant_id = $source['restaurant_id'];
            $invoice->restaurant_name = $source['restaurant_name'];
            $invoice->document_no = $source['document_no'];
            $invoice->document_url = $source['document_url'];
            $invoice->source_module = $source['source_module'];
            $invoice->source_label = $source['source_label'];
            $invoice->source_type = $source['source_type'];
            $invoice->source_id = $source['source_id'];
            $invoice->failure_reason = $source['failure_reason'];
            $invoice->source_resolution_status = $source['source_resolution_status'];

            return $invoice;
        });
    }

    private function resolvePerPage(Request $request, int $default = 25): int
    {
        $perPage = (int) $request->input('per_page', $default);

        return in_array($perPage, [10, 25, 50, 100], true) ? $perPage : $default;
    }

    /**
     * Show bulk migration form for importing old system data
     */
    public function bulkMigration()
    {
        return Inertia::render('App/Admin/Membership/Transactions/BulkMigration');
    }

    /**
     * Store multiple transactions at once (for data migration)
     */
    public function bulkStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'member_id' => 'required|exists:members,id',
            'payments' => 'required|array|min:1',
            'payments.*.fee_type' => 'required|in:membership_fee,maintenance_fee',
            'payments.*.amount' => 'required|numeric|min:0',
            'payments.*.valid_from' => 'required_if:payments.*.fee_type,maintenance_fee|date',
            'payments.*.valid_to' => 'required_if:payments.*.fee_type,maintenance_fee|date|after_or_equal:payments.*.valid_from',
            'payments.*.invoice_no' => 'required|string|unique:financial_invoices,invoice_no',
            'payments.*.payment_date' => 'required|date',
            'payments.*.payment_method' => 'sometimes|in:cash,credit_card',
            'payments.*.credit_card_type' => 'required_if:payments.*.payment_method,credit_card|in:mastercard,visa',
            'payments.*.receipt_file' => 'sometimes|file|mimes:jpeg,png,jpg,gif,pdf|max:2048',
            'payments.*.discount_type' => 'sometimes|in:percent,fixed',
            'payments.*.discount_value' => 'sometimes|numeric|min:0',
            'payments.*.payment_frequency' => 'required_if:payments.*.fee_type,maintenance_fee|in:monthly,quarterly,half_yearly,three_quarters,annually',
            'payments.*.quarter_number' => 'required_if:payments.*.fee_type,maintenance_fee|integer|between:1,4',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Load member data for date calculations
            $member = Member::where('id', $request->member_id)->first();
            $createdTransactions = [];

            foreach ($request->payments as $index => $paymentData) {
                // Calculate total amount with discount
                $amount = round(floatval($paymentData['amount']));
                $discountValue = floatval($paymentData['discount_value'] ?? 0);
                $discountType = $paymentData['discount_type'] ?? '';

                $totalPrice = $amount;
                if ($discountType && $discountValue > 0) {
                    if ($discountType === 'percent') {
                        $totalPrice = $amount - ($amount * $discountValue / 100);
                    } else {
                        $totalPrice = $amount - $discountValue;
                    }
                }

                // Round the final total price
                $totalPrice = round($totalPrice);

                // Handle receipt file upload for credit card payments
                $receiptPath = null;
                if (isset($paymentData['payment_method']) && $paymentData['payment_method'] === 'credit_card') {
                    $receiptFile = $request->file("payments.{$index}.receipt_file");
                    if ($receiptFile) {
                        $receiptPath = FileHelper::saveImage($receiptFile, 'receipts');
                    }
                }

                // Handle dates based on fee type
                $validFrom = $paymentData['valid_from'] ?? null;
                $validTo = $paymentData['valid_to'] ?? null;

                if ($paymentData['fee_type'] === 'membership_fee') {
                    // Membership fee is lifetime - set to member's joining date and far future
                    $memberJoinDate = Carbon::parse($member->membership_date);
                    $validFrom = $memberJoinDate->format('Y-m-d');
                    $validTo = $memberJoinDate->copy()->addYears(50)->format('Y-m-d');  // Lifetime validity
                }

                // Create financial invoice
                $invoice = FinancialInvoice::create([
                    'member_id' => $request->member_id,
                    'invoice_no' => $paymentData['invoice_no'],
                    'invoice_type' => $paymentData['fee_type'] === 'membership_fee' ? 'membership' : 'maintenance',
                    'fee_type' => $paymentData['fee_type'],
                    'payment_frequency' => $paymentData['payment_frequency'] ?? null,
                    'quarter_number' => $paymentData['quarter_number'] ?? null,
                    'amount' => $amount,
                    'discount_type' => $discountType ?: null,
                    'discount_value' => $discountValue ?: null,
                    'total_price' => $totalPrice,
                    'paid_amount' => $totalPrice,
                    'payment_method' => $paymentData['payment_method'] ?? 'cash',
                    'credit_card_type' => $paymentData['credit_card_type'] ?? null,
                    'receipt' => $receiptPath,
                    'status' => 'paid',  // Assuming migrated data is already paid
                    'payment_date' => $paymentData['payment_date'],
                    'valid_from' => $validFrom,
                    'valid_to' => $validTo,
                    'created_by' => Auth::id(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Map string fee_types to IDs for Items
                $feeTypeId = $paymentData['fee_type'];
                if ($paymentData['fee_type'] === 'membership_fee') {
                    $feeTypeId = AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP;
                } elseif ($paymentData['fee_type'] === 'maintenance_fee') {
                    $feeTypeId = AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE;
                }

                // ✅ Create Invoice Item
                FinancialInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_type' => $feeTypeId,
                    'description' => ucfirst(str_replace('_', ' ', $paymentData['fee_type'])),
                    'qty' => 1,
                    'amount' => $totalPrice,  // Using total price as amount for single item
                    'sub_total' => $totalPrice,
                    'total' => $totalPrice,
                    'start_date' => $validFrom,
                    'end_date' => $validTo,
                ]);

                $createdTransactions[] = $invoice;
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Bulk migration completed successfully',
                'count' => count($createdTransactions)
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $transaction = FinancialInvoice::findOrFail($id);

        $rules = [
            'status' => 'required|in:paid,unpaid,cancelled',
        ];

        if ($request->status === 'paid') {
            $rules['payment_method'] = 'required|in:cash,credit_card,cheque,online,bank_transfer';
            $rules['payment_account_id'] = 'required|exists:payment_accounts,id';
            // $rules['credit_card_type'] = 'required_if:payment_method,credit_card|in:mastercard,visa';
            // Receipt validation:
            if ($request->payment_method === 'credit_card' && empty($transaction->receipt)) {
                $rules['receipt_file'] = 'required|file|mimes:jpeg,png,jpg,gif,pdf|max:2048';
            } else {
                $rules['receipt_file'] = 'nullable|file|mimes:jpeg,png,jpg,gif,pdf|max:2048';
            }
        }

        $validator = Validator::make($request->all(), $rules);

        \Illuminate\Support\Facades\Log::info('updateStatus Request:', $request->all());

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $transaction->status = $request->status;

        if ($request->status === 'paid') {
            $transaction->paid_amount = $transaction->total_price;
            $transaction->payment_date = now();
            $transaction->payment_method = $request->payment_method;

            if ($request->payment_method === 'credit_card') {
                // $transaction->credit_card_type = $request->credit_card_type;

                if ($request->hasFile('receipt_file')) {
                    $receiptPath = FileHelper::saveImage($request->file('receipt_file'), 'receipts');
                    $transaction->receipt = $receiptPath;
                }
            } else {
                $transaction->credit_card_type = null;
            }

            // Auto-cancel overlapping/duplicate unpaid invoices
            $this->cancelOverlappingInvoices($transaction);

            // CREATE RECEIPT AND LEDGER ENTRY
            // 1. Create Receipt Record
            if ($transaction->member_id) {
                $payerType = \App\Models\Member::class;
                $payerId = $transaction->member_id;
            } elseif ($transaction->corporate_member_id) {
                $payerType = \App\Models\CorporateMember::class;
                $payerId = $transaction->corporate_member_id;
            } elseif ($transaction->customer_id) {
                $payerType = \App\Models\Customer::class;
                $payerId = $transaction->customer_id;
            } else {
                $payerType = \App\Models\Member::class;
                $payerId = null;
            }

            // Verify we have a valid payer
            if ($payerId) {
                $paymentAccount = $this->validatedPostingPaymentAccount(
                    $request->payment_account_id,
                    $request->payment_method,
                );
                $receipt = \App\Models\FinancialReceipt::create([
                    'receipt_no' => 'REC-' . time() . '-' . $transaction->invoice_no,
                    'payer_type' => $payerType,
                    'payer_id' => $payerId,
                    'amount' => $transaction->total_price,
                    'payment_method' => $request->payment_method,
                    'payment_account_id' => $paymentAccount->id,
                    'payment_details' => $request->payment_mode_details ?? null,
                    'receipt_date' => now(),
                    'remarks' => "Payment for Invoice #{$transaction->invoice_no}",
                    'created_by' => \Illuminate\Support\Facades\Auth::id(),
                ]);

                // 2. Ledger: Credit the Member
                \App\Models\Transaction::create([
                    'payable_type' => $payerType,
                    'payable_id' => $payerId,
                    'type' => 'credit',
                    'amount' => $transaction->total_price,
                    'reference_type' => \App\Models\FinancialReceipt::class,
                    'reference_id' => $receipt->id,
                    'description' => "Payment Received (Rec #{$receipt->receipt_no}) via Update",
                    'date' => now(),
                ]);
            }
        }

        $transaction->save();

        // CANCELLATION LOGIC
        if ($request->status === 'cancelled') {
            DB::transaction(function () use ($transaction, $request) {
                // 1. Store Reason
                $data = $transaction->data ?? [];
                $data['cancellation_reason'] = $request->cancellation_reason;
                // Update via direct DB query to avoid model issues
                DB::table('financial_invoices')
                    ->where('id', $transaction->id)
                    ->update([
                        'data' => json_encode($data),
                        'status' => 'cancelled'  // Ensure status is set here too
                    ]);

                // 2. Void Ledger Debit (The Invoice Charge)
                \App\Models\Transaction::where('reference_type', FinancialInvoice::class)
                    ->where('reference_id', $transaction->id)
                    ->where('type', 'debit')
                    ->delete();

                // 3. If Paid, Void Ledger Credit (The Payment) & Receipt
                if ($transaction->status === 'paid' || $transaction->paid_amount > 0) {
                    // Find relations
                    $relations = \App\Models\TransactionRelation::where('invoice_id', $transaction->id)->get();

                    foreach ($relations as $relation) {
                        if ($relation->receipt_id) {
                            // Delete Credit Ledger Entry for this Receipt
                            \App\Models\Transaction::where('reference_type', \App\Models\FinancialReceipt::class)
                                ->where('reference_id', $relation->receipt_id)
                                ->where('type', 'credit')
                                ->delete();

                            // Delete/Void Receipt
                            \App\Models\FinancialReceipt::where('id', $relation->receipt_id)->delete();
                        }
                    }

                    // Also check for direct receipt linkage if Relation missing (legacy fallback)
                    // (Assuming strict Relation usage for new system, skipping fallback for now to avoid accidental deletions)
                }
            });
        } elseif ($request->status === 'paid') {
            $data = $transaction->data ?? [];
            if ($request->payment_mode_details) {
                $data['payment_details'] = $request->payment_mode_details;
            }

            DB::table('financial_invoices')
                ->where('id', $transaction->id)
                ->update([
                    'payment_method' => $request->payment_method,
                    'payment_date' => now(),
                    'data' => json_encode($data)
                ]);
        }

        try {
            $member = \App\Models\Member::find($transaction->member_id);
            // Check if member exists (could be null for walk-ins/others)
            if ($member) {
                $superAdmins = \App\Models\User::role('super-admin')->get();
                \Illuminate\Support\Facades\Notification::send($superAdmins, new \App\Notifications\ActivityNotification(
                    "Transaction Status Updated: {$request->status}",
                    "Invoice #{$transaction->invoice_no} status changed to {$request->status}",
                    route('member.profile', $member->id),
                    \Illuminate\Support\Facades\Auth::user(),
                    'Finance'
                ));
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to send notification: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaction status updated successfully',
            'transaction' => $transaction
        ]);
    }

    /**
     * Cancel overlapping or duplicate unpaid invoices
     */
    private function cancelOverlappingInvoices($transaction)
    {
        // Skip if not paid
        if ($transaction->status !== 'paid') {
            return;
        }

        $query = FinancialInvoice::where('member_id', $transaction->member_id)
            ->where('id', '!=', $transaction->id)
            ->where('status', 'unpaid')
            ->where('fee_type', $transaction->fee_type);

        if ($transaction->fee_type === 'membership_fee') {
            return;  // Do not cancel existing membership fee invoices
        }

        // Check if dates are set
        if (!$transaction->valid_from || !$transaction->valid_to) {
            return;  // Cannot check for overlaps without dates
        }

        // For maintenance, subscription, etc., check for date overlaps
        // Overlap logic: (StartA <= EndB) and (EndA >= StartB)
        $query->where(function ($q) use ($transaction) {
            $q
                ->where('valid_from', '<=', $transaction->valid_to)
                ->where('valid_to', '>=', $transaction->valid_from);
        });

        $invoicesToCancel = $query->get();

        foreach ($invoicesToCancel as $invoice) {
            $invoice->update([
                'status' => 'cancelled',
                'remarks' => $invoice->remarks . " [System: Auto-cancelled due to payment of Invoice #{$transaction->invoice_no}]"
            ]);
        }
    }

    public function getTransactionTypes()
    {
        $types = TransactionType::where('status', 'active')->get();
        return response()->json($types);
    }

    public function payInvoiceView($id)
    {
        $invoice = FinancialInvoice::with(['items.transactions', 'member', 'corporateMember', 'customer', 'customer.guestType'])
            ->findOrFail($id);

        $allTransactionTypes = \App\Models\TransactionType::all();

        // Calculate paid_amount for items (same logic as getMemberTransactions)
        $invoice->items->each(function ($item) use ($allTransactionTypes) {
            $item->paid_amount = $item
                ->transactions
                ->where('type', 'credit')
                ->sum('amount');

            // Fix for Fee Type ID mismatch: Map generic category IDs back to specific Transaction Type ID
            // This is needed because 'store' saves the Category ID (e.g. 4) instead of the specific Transaction Type ID
            $categoryIds = [
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_FINANCIAL_CHARGE,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_FOOD_ORDER,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_APPLIED_MEMBER
            ];

            if (in_array($item->fee_type, $categoryIds)) {
                // Try to find matching Transaction Type by Category AND Description starting with Name
                $matchedType = $allTransactionTypes->filter(function ($type) use ($item) {
                    if ($type->type != $item->fee_type)
                        return false;
                    return \Illuminate\Support\Str::startsWith($item->description, $type->name);
                })->first();

                if ($matchedType) {
                    $item->fee_type = $matchedType->id;
                } else {
                    // Fallback to the first type of this category to ensure SOMETHING is selected in the dropdown
                    // rather than an invisible category ID
                    $defaultType = $allTransactionTypes->where('type', $item->fee_type)->first();
                    if ($defaultType) {
                        $item->fee_type = $defaultType->id;
                    }
                }
            }
        });

        $itemsBaseTotal = $invoice->items->sum(function ($item) {
            return (float) ($item->total ?? 0);
        });
        $invoiceTotal = (float) ($invoice->total_price ?? 0);
        $delta = $invoiceTotal - $itemsBaseTotal;

        if (abs($delta) >= 0.01 && $invoice->items->count() > 0) {
            $remaining = $delta;
            $count = $invoice->items->count();
            $idx = 0;
            foreach ($invoice->items as $item) {
                $idx++;
                $base = (float) ($item->total ?? 0);
                $share = 0;
                if ($count === 1) {
                    $share = $remaining;
                } elseif ($itemsBaseTotal > 0) {
                    $share = round(($delta * ($base / $itemsBaseTotal)), 0);
                }
                if ($idx === $count) {
                    $share = $remaining;
                } else {
                    $remaining -= $share;
                }
                $item->total = round($base + $share, 0);
            }
        }

        // Attach Ledger Balance to the relevant member entity
        $memberEntity = $invoice->member ?? $invoice->corporateMember ?? $invoice->customer;
        if ($memberEntity) {
            $debits = \App\Models\Transaction::where('payable_type', get_class($memberEntity))
                ->where('payable_id', $memberEntity->id)
                ->where('type', 'debit')
                ->sum('amount');

            $credits = \App\Models\Transaction::where('payable_type', get_class($memberEntity))
                ->where('payable_id', $memberEntity->id)
                ->where('type', 'credit')
                ->sum('amount');

            $memberEntity->ledger_balance = $debits - $credits;
        }

        return Inertia::render('App/Admin/Membership/Transactions/Create', [
            'invoice' => $invoice,
            'subscriptionTypes' => \App\Models\SubscriptionType::all(),
            'subscriptionCategories' => \App\Models\SubscriptionCategory::where('status', 'active')->with('subscriptionType')->get(),
            'membershipCharges' => $allTransactionTypes->where('type', \App\Constants\AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP)->values(),
            'maintenanceCharges' => $allTransactionTypes->where('type', \App\Constants\AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE)->values(),
            'subscriptionCharges' => $allTransactionTypes->where('type', \App\Constants\AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION)->values(),
            'otherCharges' => $allTransactionTypes->whereNotIn('type', [
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_SUBSCRIPTION,
                \App\Constants\AppConstants::TRANSACTION_TYPE_ID_FINANCIAL_CHARGE
            ])->values(),
            'financialChargeTypes' => \App\Models\FinancialChargeType::all(),
        ]);
    }

    private function payExistingInvoice(Request $request)
    {
        try {
            $invoice = FinancialInvoice::findOrFail($request->invoice_id);

            // Calculate total payment
            $totalPayment = 0;
            $itemsToPay = [];

            foreach ($request->items as $itemData) {
                // Front end sends 'payment_amount'
                $amount = isset($itemData['payment_amount']) ? (float) $itemData['payment_amount'] : 0;

                if ($amount > 0) {
                    $totalPayment += $amount;
                    $itemsToPay[] = [
                        'id' => $itemData['id'],
                        'amount' => $amount
                    ];
                }
            }

            if ($totalPayment <= 0) {
                return response()->json(['error' => 'No payment amount specified.'], 422);
            }

            $alreadyPaid = \App\Models\Transaction::where('invoice_id', $invoice->id)
                ->where('type', 'credit')
                ->sum('amount');
            $remaining = (float) ($invoice->total_price ?? 0) - (float) $alreadyPaid;
            if ($totalPayment > ($remaining + 5)) {
                return response()->json(['error' => 'Payment amount exceeds remaining invoice balance.'], 422);
            }

            // Create Receipt
            // Resolve Payer from Invoice
            $payerType = $invoice->invoiceable_type ?: Member::class;
            $payerId = $invoice->invoiceable_id ?: $invoice->member_id;

            if ($invoice->corporate_member_id) {
                $payerType = CorporateMember::class;
                $payerId = $invoice->corporate_member_id;
            } elseif ($invoice->customer_id) {
                $payerType = \App\Models\Customer::class;
                $payerId = $invoice->customer_id;
            } elseif ($invoice->member_id) {
                $payerType = Member::class;
                $payerId = $invoice->member_id;
            }

            $paymentAccount = $this->validatedPostingPaymentAccount(
                $request->payment_account_id,
                $request->payment_method,
            );

            $receipt = \App\Models\FinancialReceipt::create([
                'receipt_no' => 'REC-' . time(),
                'payer_type' => $payerType,
                'payer_id' => $payerId,
                'amount' => $totalPayment,
                'payment_method' => $request->payment_method,
                'payment_account_id' => $paymentAccount->id,
                'payment_details' => $request->payment_mode_details,
                'receipt_date' => now(),
                'remarks' => $request->remarks ?? ('Partial Payment for Invoice #' . $invoice->invoice_no),
                'created_by' => Auth::id(),
            ]);

            // Create Credit Transactions per Item
            foreach ($itemsToPay as $payItem) {
                $invoiceItem = \App\Models\FinancialInvoiceItem::findOrFail($payItem['id']);

                \App\Models\Transaction::create([
                    'payable_type' => $payerType,
                    'payable_id' => $payerId,
                    'type' => 'credit',
                    'amount' => $payItem['amount'],
                    'reference_type' => \App\Models\FinancialInvoiceItem::class,
                    'reference_id' => $invoiceItem->id,
                    'invoice_id' => $invoice->id,
                    'receipt_id' => $receipt->id,
                    'description' => "Partial Payment (Rec #{$receipt->receipt_no})",
                    'date' => now(),
                ]);
            }

            // Update Invoice Status
            $totalPaid = \App\Models\Transaction::where('invoice_id', $invoice->id)
                ->where('type', 'credit')
                ->sum('amount');

            $invoice->paid_amount = $totalPaid;
            $invoice->customer_charges = max(0, (float) ($invoice->total_price ?? 0) - (float) $totalPaid);
            // Use 5 rupee tolerance for rounding issues
            if ($totalPaid >= ($invoice->total_price - 5)) {
                $invoice->status = 'paid';
            } elseif ($totalPaid > 0) {
                $invoice->status = 'unpaid';
            } else {
                $invoice->status = 'unpaid';
            }

            $invoice->payment_method = $request->payment_method;
            $invoice->payment_date = now();

            $data = $invoice->data ?? [];
            if ($request->payment_mode_details) {
                $data['payment_details'] = $request->payment_mode_details;
                $invoice->data = $data;
            }
            $invoice->save();

            DB::commit();
            // Reload for response
            $invoice->load(['items', 'member', 'corporateMember', 'customer']);

            return response()->json(['success' => true, 'message' => 'Payment recorded successfully.', 'invoice' => $invoice]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payment failed: ' . $e->getMessage());
            return response()->json(['error' => 'Payment failed: ' . $e->getMessage()], 500);
        }
    }

    // Edit Route (Re-uses pay view logic)
    public function edit($id)
    {
        return $this->payInvoiceView($id);
    }

    // Update Route (Placeholder for future implementation)
    public function update(Request $request, $id)
    {
        // TODO: Implement update logic
        return back()->with('info', 'Update functionality not fully implemented.');
    }

    // Destroy Route
    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $invoice = FinancialInvoice::findOrFail($id);

            // Void associated transactions/ledger entries linked to invoice items
            $itemIds = $invoice->items()->pluck('id');

            if ($itemIds->isNotEmpty()) {
                \App\Models\Transaction::whereIn('reference_id', $itemIds)
                    ->where('reference_type', \App\Models\FinancialInvoiceItem::class)
                    ->delete();
            }

            // Delete items
            $invoice->items()->delete();

            // Delete invoice
            $invoice->delete();

            DB::commit();

            return redirect()->route('finance.transaction')->with('success', 'Invoice deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete invoice: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete invoice.');
        }
    }

    private function validatedPostingPaymentAccount(mixed $accountInput, ?string $paymentMethod)
    {
        return app(PaymentAccountPostingGuard::class)->validateRequiredForPosting($accountInput, $paymentMethod);
    }
}
