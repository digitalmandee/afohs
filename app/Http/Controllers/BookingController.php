<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Helpers\FileHelper;
use App\Models\Booking;
use App\Models\BookingEvents;
use App\Models\CorporateMember;
use App\Models\EventBooking;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\FinancialReceipt;
use App\Models\Member;
use App\Models\PaymentAccount;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\RoomCategory;
use App\Models\RoomChargesType;
use App\Models\RoomMiniBar;
use App\Models\RoomType;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Models\User;
use App\Services\Accounting\Support\PaymentAccountPostingGuard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class BookingController extends Controller
{
    public function index()
    {
        // Step 1: Build bookingId => invoice mapping
        $invoices = FinancialInvoice::where('invoice_type', 'room_booking')->get();

        $bookingInvoiceMap = [];

        foreach ($invoices as $invoice) {
            foreach ($invoice->data as $entry) {
                if (!empty($entry['booking_id'])) {
                    $bookingInvoiceMap[$entry['booking_id']] = [
                        'id' => $invoice->id,
                        'status' => $invoice->status,
                    ];
                }
            }
        }

        // Step 2: Get all RoomBookings
        $bookings = RoomBooking::with('room', 'customer', 'member')->latest()->take(10)->get();

        // Step 3: Attach invoice data to each booking
        $bookings->transform(function ($booking) use ($bookingInvoiceMap) {
            $invoice = $bookingInvoiceMap[$booking->id] ?? null;
            $booking->invoice = $invoice;
            return $booking;
        });

        $totalBookings = RoomBooking::count();
        $totalRoomBookings = RoomBooking::count();

        $rooms = Room::latest()->get();

        $totalRooms = $rooms->count();

        // Determine unavailable rooms today
        $conflictedRooms = RoomBooking::query()
            ->whereIn('status', ['confirmed', 'pending'])
            ->where('check_in_date', '<', now()->addDay())  // today and future
            ->where('check_out_date', '>', now())  // overlapping today
            ->pluck('room_id')
            ->unique();

        $availableRoomsToday = Room::query()
            ->whereNotIn('id', $conflictedRooms)
            ->count();

        $data = [
            'bookingsData' => $bookings,
            'rooms' => $rooms,
            'totalRooms' => $totalRooms,
            'availableRoomsToday' => $availableRoomsToday,
            'totalBookings' => $totalBookings,
            'totalRoomBookings' => $totalRoomBookings,
        ];

        $roomTypes = RoomType::where('status', 'active')->select('id', 'name')->get();

        return Inertia::render('App/Admin/Booking/Dashboard', [
            'data' => $data,
            'roomTypes' => $roomTypes
        ]);
    }

    public function search(Request $request)
    {
        $checkin = $request->query('checkin');  // Y-m-d
        $checkout = $request->query('checkout');  // Y-m-d
        $persons = (int) $request->query('persons', 0);
        $excludeBookingId = $request->query('exclude_booking_id');

        // Find conflicted rooms (already booked)
        $conflicted = RoomBooking::query()
            ->whereNotIn('status', ['cancelled', 'refunded', 'checked_out', 'Cancelled', 'Refunded'])
            ->when($excludeBookingId, function ($query, $id) {
                $query->where('id', '!=', $id);
            })
            ->where(function ($query) use ($checkin, $checkout) {
                $query
                    ->where('check_in_date', '<', $checkout)
                    ->where('check_out_date', '>', $checkin);
            })
            ->pluck('room_id');

        // Get available rooms - optionally filter by capacity if persons provided
        $query = Room::query()
            ->whereNotIn('id', $conflicted)
            ->with(['roomType', 'categoryCharges', 'categoryCharges.Category']);

        // Only apply capacity filter if persons > 0
        if ($persons > 0) {
            $maxCapacityLimit = $persons + 2;
            $query->whereBetween('max_capacity', [$persons, $maxCapacityLimit]);
        }

        $available = $query->get();

        return response()->json($available);
    }

    public function payNow(Request $request)
    {
        $invoice_no = $request->query('invoice_no');

        $invoice = FinancialInvoice::where('id', $invoice_no)->with('customer', 'member:id,membership_no,full_name,personal_email', 'corporateMember:id,membership_no,full_name,personal_email', 'member.memberType', 'invoiceable:id,booking_no')->first();

        if (!$invoice) {
            return response()->json(['message' => 'Invoice not found'], 404);
        }

        // Check for room orders if this is a room booking
        $roomOrders = [];
        if ($invoice->invoice_type === 'room_booking' && $invoice->invoiceable) {
            $booking = RoomBooking::find($invoice->invoiceable_id);  // Re-fetch to be safe or use relation if setup
            if ($booking) {
                // Fetch unpaid orders
                $orders = $booking
                    ->orders()
                    ->where('payment_status', '!=', 'paid')
                    ->where('status', '!=', 'cancelled')
                    ->with('orderItems')
                    ->get();
                $roomOrders = $orders;
            }
        }

        return Inertia::render('App/Admin/Booking/Payment', compact('invoice', 'roomOrders'));
    }

    // Search family Members
    public function familyMembers(Request $request, $id)
    {
        $type = $request->query('type', 'member');  // default to member

        if ($type == '2' || $type == 'corporate') {
            // Get corporate family members
            $familyMembers = CorporateMember::select(
                'id',
                'full_name',
                'membership_no',
                'personal_email',
                'mobile_number_a',
                'family_suffix',
                'cnic_no',
                'current_address'
            )
                ->where('parent_id', $id)
                ->limit(10)
                ->get();

            // Format for frontend
            $results = $familyMembers->map(function ($member) {
                return [
                    'id' => $member->id,
                    'label' => "{$member->full_name} ({$member->membership_no})",
                    'membership_no' => $member->membership_no,
                    'email' => $member->personal_email,
                    'cnic' => $member->cnic_no,
                    'phone' => $member->mobile_number_a,
                    'address' => $member->current_address,
                    'family_suffix' => $member->family_suffix,
                ];
            });

            return response()->json(['success' => true, 'results' => $results], 200);
        }

        // Standard Members (existing logic)
        // Get family members (members with parent_id = main member id)
        $familyMembers = Member::select(
            'id',
            'full_name',
            'membership_no',
            'personal_email',
            'mobile_number_a',
            'family_suffix',
            'cnic_no',
            'current_address'
        )
            ->where('parent_id', $id)
            ->limit(10)
            ->get();

        // Format for frontend
        $results = $familyMembers->map(function ($member) {
            return [
                'id' => $member->id,
                'label' => "{$member->full_name} ({$member->membership_no})",
                'membership_no' => $member->membership_no,
                'email' => $member->personal_email,
                'cnic' => $member->cnic_no,
                'phone' => $member->mobile_number_a,
                'address' => $member->current_address,
                'family_suffix' => $member->family_suffix,
            ];
        });

        return response()->json(['success' => true, 'results' => $results], 200);
    }

    public function paymentStore(Request $request)
    {
        $request->validate([
            'invoice_no' => 'required|exists:financial_invoices,invoice_no',
            'amount' => 'required|numeric|min:0',
            'pay_orders' => 'nullable|boolean',
            'payment_method' => 'required|string',
            'payment_account_id' => 'required|exists:payment_accounts,id',
        ]);

        $invoice = FinancialInvoice::where('invoice_no', $request->invoice_no)->first();

        // Check for orders to include
        $ordersTotal = 0;
        $ordersToUpdate = collect([]);

        if ($request->pay_orders && $invoice->invoice_type === 'room_booking' && $invoice->invoiceable_id) {
            $booking = RoomBooking::find($invoice->invoiceable_id);
            if ($booking) {
                $ordersToUpdate = $booking
                    ->orders()
                    ->where('payment_status', '!=', 'paid')
                    ->where('status', '!=', 'cancelled')
                    ->get();
                $ordersTotal = $ordersToUpdate->sum('total_price');
            }
        }

        // Calculate remaining balance INCLUDING orders if selected
        $currentTotal = $invoice->total_price + ($request->pay_orders ? $ordersTotal : 0);
        $remaining = $currentTotal - $invoice->paid_amount;

        if ($request->amount < $remaining && $request->pay_orders) {
            // If paying orders, usually require fetching info.
            // Logic: If paying orders, we expect FULL payment of orders + whatever remaining.
            // But simpler: just validate against new remaining.
        }

        // Allow split amount payment even with orders?
        // User said "add one time this total and then paid".
        // Let's assume if pay_orders is checked, we add the cost to invoice PERMANENTLY?
        // Or just for this transaction?
        // Better to add permanently to reflect the "Room Bill".

        if ($request->amount > $remaining) {
            // Allow overpayment? Probably not.
        }

        DB::beginTransaction();

        try {
            $recieptPath = null;
            if ($request->payment_method == 'credit_card' && $request->has('receipt')) {
                $recieptPath = FileHelper::saveImage($request->file('receipt'), 'receipts');
            }

            // Update orders if we are paying them
            if ($request->pay_orders && $ordersTotal > 0) {
                // Mark orders as paid
                foreach ($ordersToUpdate as $order) {
                    $order->payment_status = 'paid';
                    $order->save();
                }

                // Increase invoice total
                $invoice->amount += $ordersTotal;
                $invoice->total_price += $ordersTotal;

                // Create Invoice Item for these orders
                // fee_type '7' for Food Order Fee per Admin Doc
                $orderItem = FinancialInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_type' => AppConstants::TRANSACTION_TYPE_ID_FOOD_ORDER,
                    'description' => 'Room Service Orders (Added during payment)',
                    'qty' => 1,
                    'amount' => $ordersTotal,
                    'sub_total' => $ordersTotal,
                    'total' => $ordersTotal,
                ]);

                // Create Debit Transaction for the added charge
                // We need to debit the user for these new charges before we credit the payment
                // Payer determination logic is needed here or we check invoice relations
                $payerDetails = $this->getPayerDetails($invoice);

                Transaction::create([
                    'type' => 'debit',
                    'amount' => $ordersTotal,
                    'date' => now(),
                    'description' => 'Invoice #' . $invoice->invoice_no . ' (Room Orders)',
                    'payable_type' => $payerDetails['type'],
                    'payable_id' => $payerDetails['id'],
                    'reference_type' => FinancialInvoiceItem::class,
                    'reference_id' => $orderItem->id,
                    'invoice_id' => $invoice->id,
                    'created_by' => Auth::id(),
                ]);
            }

            $invoice->payment_date = now();
            $invoice->paid_amount = $invoice->paid_amount + $request->amount;  // ✅ accumulate payments
            $invoice->customer_charges = $request->customer_charges ?? $invoice->customer_charges;
            $invoice->payment_method = $request->payment_method;
            if ($request->has('credit_card_type')) {
                // $invoice->credit_card_type = $request->credit_card_type;
            }
            $invoice->receipt = $recieptPath;

            $invoiceData = is_array($invoice->data) ? $invoice->data : [];
            if ($request->filled('payment_account_id')) {
                $paymentAccount = PaymentAccount::withTrashed()
                    ->select('id', 'name')
                    ->find($request->payment_account_id);

                $invoiceData['payment_account_id'] = (int) $request->payment_account_id;
                if ($paymentAccount?->name) {
                    $invoiceData['payment_account'] = $paymentAccount->name;
                }
            } elseif ($request->filled('paymentAccount')) {
                $invoiceData['payment_account'] = (string) $request->paymentAccount;
            }
            $invoice->data = $invoiceData;

            // Re-calculate status based on NEW total
            $invoice->status = $invoice->paid_amount >= $invoice->total_price ? 'paid' : 'unpaid';
            $invoice->save();

            // ✅ Determine Payer Details for Ledger
            $payerDetails = $this->getPayerDetails($invoice);
            $payerType = $payerDetails['type'];
            $payerId = $payerDetails['id'];
            $paymentAccount = app(PaymentAccountPostingGuard::class)->validateRequiredForPosting(
                $request->payment_account_id,
                $request->payment_method,
            );

            // ✅ 1. Create Financial Receipt
            $receipt = FinancialReceipt::create([
                'receipt_no' => time(),
                'payer_type' => $payerType,
                'payer_id' => $payerId,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,  // Trust the frontend values (cash, credit_card, etc.)
                'payment_account_id' => $paymentAccount->id,
                'payment_details' => $request->paymentAccount ?? null,
                'receipt_date' => now(),
                'status' => 'active',
                'remarks' => 'Payment for Booking Invoice #' . $invoice->invoice_no,
                'created_by' => Auth::id(),
                'receipt_image' => $recieptPath,
            ]);

            // ✅ 2. Create Ledger Entries (Credit) - Allocated to Items
            // Distribute the payment amount across items per Finance Architecture
            $remainingPayment = $request->amount;

            // Ensure items are loaded
            if (!$invoice->relationLoaded('items')) {
                $invoice->load('items');
            }
            $items = $invoice->items;

            foreach ($items as $item) {
                if ($remainingPayment <= 0.01)
                    break;

                // Calculate item balance (Total - Paid Credits for this item)
                // Use DB aggregation to find how much of THIS item has been paid
                $itemPaid = Transaction::where('reference_type', FinancialInvoiceItem::class)
                    ->where('reference_id', $item->id)
                    ->where('type', 'credit')
                    ->sum('amount');

                $itemBalance = $item->total - $itemPaid;

                if ($itemBalance > 0.01) {
                    $toPay = min($remainingPayment, $itemBalance);

                    Transaction::create([
                        'type' => 'credit',
                        'amount' => $toPay,
                        'date' => now(),
                        'description' => 'Payment Received (Rec #' . $receipt->receipt_no . ') - ' . $item->description,
                        'payable_type' => $payerType,
                        'payable_id' => $payerId,
                        'reference_type' => FinancialInvoiceItem::class,  // Link to Item
                        'reference_id' => $item->id,  // Link to Item
                        'invoice_id' => $invoice->id,
                        'receipt_id' => $receipt->id,  // Link to Receipt
                        'created_by' => Auth::id(),
                    ]);

                    $remainingPayment -= $toPay;
                }
            }

            // Note: If anything remains (overpayment), we could potentially create a credit for the invoice generally
            // or just leave it attached to the last item as overpayment.
            // For now, strict allocation to items until exhausted.

            // ✅ 3. Link Receipt to Invoice
            TransactionRelation::create([
                'invoice_id' => $invoice->id,
                'receipt_id' => $receipt->id,
                'amount' => $request->amount,
            ]);

            // ✅ Update booking status using polymorphic relationship
            if ($request->booking_status && $invoice->invoiceable) {
                $booking = $invoice->invoiceable;
                $booking->status = $request->booking_status;
                $booking->save();
            }

            DB::commit();

            return response()->json(['success' => true, 'message' => 'Payment successful']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private function getPayerDetails($invoice)
    {
        if ($invoice->member_id) {
            return ['type' => \App\Models\Member::class, 'id' => $invoice->member_id];
        } elseif ($invoice->corporate_member_id) {
            return ['type' => \App\Models\CorporateMember::class, 'id' => $invoice->corporate_member_id];
        } elseif ($invoice->customer_id) {
            return ['type' => \App\Models\Customer::class, 'id' => $invoice->customer_id];
        }
        return ['type' => null, 'id' => null];
    }
}
