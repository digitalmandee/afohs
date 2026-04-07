<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Constants\AppConstants;
use App\Helpers\FileHelper;
use App\Models\Booking;
use App\Models\BookingEvents;
use App\Models\Customer;
use App\Models\EventBooking;
use App\Models\EventBookingMenu;
use App\Models\EventBookingMenuAddOn;
use App\Models\EventBookingOtherCharges;
use App\Models\EventChargeType;
use App\Models\EventMenu;
use App\Models\EventMenuAddOn;
use App\Models\EventMenuCategory;
use App\Models\EventVenue;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\FinancialReceipt;
use App\Models\Member;
use App\Models\Room;
use App\Models\RoomBooking;
use App\Models\RoomCategory;
use App\Models\RoomChargesType;
use App\Models\RoomMiniBar;
use App\Models\RoomType;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Services\Accounting\Support\PaymentAccountPostingGuard;

class EventBookingController extends Controller
{
    // Create Events
    public function create()
    {
        $bookingNo = $this->getBookingId();
        $eventVenues = EventVenue::select('id', 'name')->get();
        $chargesTypeItems = EventChargeType::where('status', 'active')->select('id', 'name', 'amount')->get();

        // Get event menus with their items
        $eventMenus = EventMenu::where('status', 'active')
            ->with('items:id,event_menu_id,menu_category_id,name,status')
            ->select('id', 'name', 'amount', 'status')
            ->get();

        // Get menu category items for selection
        $menuCategoryItems = EventMenuCategory::where('status', 'active')
            ->select('id', 'name')
            ->get();

        // Get menu add-ons (similar to charges)
        $menuAddOnItems = EventMenuAddOn::where('status', 'active')
            ->select('id', 'name', 'amount')
            ->get();

        return Inertia::render('App/Admin/Events/CreateBooking', compact('bookingNo', 'eventVenues', 'chargesTypeItems', 'eventMenus', 'menuCategoryItems', 'menuAddOnItems'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'guest' => 'required',
            'bookedBy' => 'required|string',
            'natureOfEvent' => 'required|string',
            'eventDate' => 'required|date',
            'eventTimeFrom' => 'required|date_format:H:i',
            'eventTimeTo' => 'required|date_format:H:i',
            'venue' => 'required|exists:event_venues,id',
            'selectedMenu' => 'nullable|exists:event_menus,id',
            'numberOfGuests' => 'required|integer|min:1',
            'menu_addons' => 'nullable|array',
            'other_charges' => 'nullable|array',
            'discountType' => 'required|in:fixed,percentage',
            'discount' => 'nullable|numeric|min:0',
            'grandTotal' => 'required|numeric|min:0',
            'paymentOption' => 'nullable|in:advance,full',
        ]);

        // Check for duplicate booking (overlapping time)
        $start = $request->eventTimeFrom;
        $end = $request->eventTimeTo;

        $existingBooking = EventBooking::where('event_venue_id', $request->venue)
            ->where('event_date', $request->eventDate)
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->where(function ($query) use ($start, $end) {
                $query
                    ->where('event_time_from', '<', $end)
                    ->where('event_time_to', '>', $start);
            })
            ->exists();

        if ($existingBooking) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'venue' => ['This venue is already booked for the selected date and time slot.'],
            ]);
        }

        $member_id = Auth::user()->id;
        $bookingNo = $this->getBookingId();

        DB::beginTransaction();

        try {
            $documentPaths = [];
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $documentPaths[] = FileHelper::saveImage($file, 'booking_documents');
                }
            }

            // Prepare booking data
            $bookingData = [
                'booking_no' => $bookingNo,
                'event_venue_id' => $request->venue,
                'family_id' => $request->familyMember ?? null,
                'name' => $request->guest['name'] ?? '',
                'address' => $request->guest['address'] ?? '',
                'cnic' => $request->guest['cnic'] ?? '',
                'mobile' => $request->guest['phone'] ?? '',
                'email' => $request->guest['email'] ?? '',
                'booking_date' => now()->toDateString(),
                'booked_by' => $request->bookedBy,
                'nature_of_event' => $request->natureOfEvent,
                'event_date' => $request->eventDate,
                'event_time_from' => $request->eventTimeFrom,
                'event_time_to' => $request->eventTimeTo,
                'menu_charges' => $request->menuAmount ?? 0,
                'addons_charges' => $this->calculateMenuAddOnsTotal($request->menu_addons ?? []),
                'total_per_person_charges' => ($request->menuAmount ?? 0) + $this->calculateMenuAddOnsTotal($request->menu_addons ?? []),
                'no_of_guests' => $request->numberOfGuests,
                'guest_charges' => (($request->menuAmount ?? 0) + $this->calculateMenuAddOnsTotal($request->menu_addons ?? [])) * $request->numberOfGuests,
                'total_food_charges' => (($request->menuAmount ?? 0) + $this->calculateMenuAddOnsTotal($request->menu_addons ?? [])) * $request->numberOfGuests,
                'total_other_charges' => $this->calculateOtherChargesTotal($request->other_charges ?? []),
                'total_charges' => round(floatval($request->grandTotal)),
                'reduction_type' => $request->discountType,
                'reduction_amount' => $request->discount ?? 0,
                'total_price' => round(floatval($request->grandTotal)),
                'booking_docs' => json_encode($documentPaths),
                'additional_notes' => $request->notes ?? '',
                'status' => 'confirmed',
                'created_by' => $member_id,
            ];

            // ✅ Assign IDs based on booking_type (same as RoomBookingController)
            if (!empty($request->guest['is_corporate']) || ($request->guest['booking_type'] ?? '') == '2') {
                $bookingData['corporate_member_id'] = (int) $request->guest['id'];
                $bookingData['booking_type'] = '2';  // Corporate Member
            } elseif (!empty($request->guest['booking_type']) && $request->guest['booking_type'] === 'member') {
                $bookingData['member_id'] = (int) $request->guest['id'];
                $bookingData['booking_type'] = '0';  // Member
            } else {
                $bookingData['customer_id'] = (int) $request->guest['id'];
                $bookingData['booking_type'] = '1';  // Guest
            }

            // Create main event booking
            $eventBooking = EventBooking::create($bookingData);

            // Store selected menu
            if ($request->selectedMenu) {
                $selectedMenu = EventMenu::find($request->selectedMenu);
                EventBookingMenu::create([
                    'event_booking_id' => $eventBooking->id,
                    'event_menu_id' => $request->selectedMenu,
                    'name' => $selectedMenu->name,
                    'amount' => $selectedMenu->amount,
                    'items' => $request->menuItems ?? [],
                ]);
            }
            // Store menu add-ons
            if ($request->menu_addons) {
                foreach ($request->menu_addons as $addon) {
                    if (!empty($addon['type'])) {
                        EventBookingMenuAddOn::create([
                            'event_booking_id' => $eventBooking->id,
                            'type' => $addon['type'],
                            'details' => $addon['details'] ?? '',
                            'amount' => $addon['amount'] ?? 0,
                            'is_complementary' => filter_var($addon['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN),
                        ]);
                    }
                }
            }

            // Store other charges
            if ($request->other_charges) {
                foreach ($request->other_charges as $charge) {
                    if (!empty($charge['type'])) {
                        EventBookingOtherCharges::create([
                            'event_booking_id' => $eventBooking->id,
                            'type' => $charge['type'],
                            'details' => $charge['details'] ?? '',
                            'amount' => $charge['amount'] ?? 0,
                            'is_complementary' => filter_var($charge['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN),
                        ]);
                    }
                }
            }

            // ✅ Create financial invoice using polymorphic relationship
            $invoice_no = $this->getInvoiceNo();

            // Calculate original amount (before discount) and final amount (after discount)
            $originalAmount = round($this->calculateOriginalAmount($request));
            $finalAmount = round(floatval($request->grandTotal));

            $invoiceData = [
                'invoice_no' => $invoice_no,
                'invoice_type' => 'event_booking',
                'discount_type' => $request->discountType ?? null,
                'discount_value' => $request->discount ?? 0,
                'amount' => $originalAmount,  // Original amount before discount
                'total_price' => $finalAmount,  // Final amount after discount
                'issue_date' => now(),
                'status' => 'unpaid',
                // Keep data for backward compatibility
                'data' => [
                    'booking_no' => $eventBooking->booking_no,
                    'booking_type' => 'event_booking'
                ]
            ];

            // ✅ Determine Payer Details for Ledger & Invoice Data
            $payerId = null;
            $payerType = null;
            $memberName = 'Guest';

            if (!empty($request->guest['is_corporate']) || ($request->guest['booking_type'] ?? '') == '2') {
                $payerId = (int) $request->guest['id'];
                $payerType = \App\Models\CorporateMember::class;
                $memberName = $request->guest['name'] ?? 'Corporate Member';
                $invoiceData['corporate_member_id'] = $payerId;
            } elseif (!empty($request->guest['booking_type']) && $request->guest['booking_type'] === 'member') {
                $payerId = (int) $request->guest['id'];
                $payerType = \App\Models\Member::class;
                $memberName = $request->guest['name'] ?? 'Member';
                $invoiceData['member_id'] = $payerId;
            } else {
                $payerId = (int) $request->guest['id'];
                $payerType = \App\Models\Customer::class;
                $memberName = $request->guest['name'] ?? 'Guest';
                $invoiceData['customer_id'] = $payerId;
            }

            // ✅ Add member_name to invoice data
            $invoiceData['data']['member_name'] = $memberName;

            // ✅ Use relationship to create invoice (automatically sets invoiceable_id and invoiceable_type)
            $invoice = $eventBooking->invoice()->create($invoiceData);

            // ✅ Create Invoice Items
            // 1. Menu Charges
            if ($request->menuAmount > 0) {
                FinancialInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_type' => AppConstants::TRANSACTION_TYPE_ID_EVENT_BOOKING,
                    'description' => 'Event Menu Charges',
                    'qty' => $request->numberOfGuests,
                    'amount' => $request->menuAmount,  // Per person
                    'sub_total' => $request->menuAmount * $request->numberOfGuests,
                    'total' => $request->menuAmount * $request->numberOfGuests,
                ]);
            }

            // 2. Addons
            if ($request->menu_addons) {
                foreach ($request->menu_addons as $addon) {
                    if (!empty($addon['amount'])) {
                        $addonAmount = $addon['amount'];
                        $isComplementary = filter_var($addon['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN);
                        if ($isComplementary)
                            continue;  // Skip if free? Or record as 0? Usually skip.

                        FinancialInvoiceItem::create([
                            'invoice_id' => $invoice->id,
                            'fee_type' => AppConstants::TRANSACTION_TYPE_ID_EVENT_BOOKING,
                            'description' => 'Addon: ' . ($addon['type'] ?? 'Addon'),
                            'qty' => $request->numberOfGuests,  // Addons usually per guest? Or lumpsum? Code calculated total add-ons then multiplied by guests in store method line 136?
                            // Line 136: (($request->menuAmount ?? 0) + calculateMenuAddOnsTotal) * Guests. So yes, per guest.
                            'amount' => $addonAmount,
                            'sub_total' => $addonAmount * $request->numberOfGuests,
                            'total' => $addonAmount * $request->numberOfGuests,
                        ]);
                    }
                }
            }

            // 3. Other Charges
            if ($request->other_charges) {
                foreach ($request->other_charges as $charge) {
                    if (!empty($charge['amount'])) {
                        $chargeAmount = $charge['amount'];
                        $isComplementary = filter_var($charge['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN);
                        if ($isComplementary)
                            continue;

                        FinancialInvoiceItem::create([
                            'invoice_id' => $invoice->id,
                            'fee_type' => AppConstants::TRANSACTION_TYPE_ID_EVENT_BOOKING,
                            'description' => 'Charge: ' . ($charge['type'] ?? 'Charge'),
                            'qty' => 1,  // Other charges usually lumpsum?
                            'amount' => $chargeAmount,
                            'sub_total' => $chargeAmount,
                            'total' => $chargeAmount,
                        ]);
                    }
                }
            }

            // ✅ Create Ledger Entry (Debit) - Invoice Created
            Transaction::create([
                'type' => 'debit',
                'amount' => $finalAmount,
                'date' => now(),
                'description' => 'Event Booking Invoice #' . $invoice->invoice_no,
                'payable_type' => $payerType,
                'payable_id' => $payerId,
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
                'created_by' => Auth::id(),
            ]);

            // ✅ Handle Advance Payment & Security Deposit
            $paymentOption = $request->paymentOption ?? 'advance';
            $advanceAmountInput = floatval($request->advanceAmount ?? 0);
            $securityDeposit = floatval($request->securityDeposit ?? 0);
            $amountToApplyToInvoice = $paymentOption === 'full' ? (float) $finalAmount : $advanceAmountInput;
            $advanceAmount = $paymentOption === 'full' ? 0 : $advanceAmountInput;

            if ($paymentOption === 'advance' && $amountToApplyToInvoice <= 0) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'advanceAmount' => ['Advance amount is required.'],
                ]);
            }

            $totalReceived = $amountToApplyToInvoice + $securityDeposit;

            if ($totalReceived > 0) {
                $paymentMethod = $this->normalizeReceiptMethod($request->paymentMode);
                $paymentAccount = $this->validatedPostingPaymentAccount($request->paymentAccount, $paymentMethod, 'paymentAccount');

                // 1. Create Receipt
                $receipt = FinancialReceipt::create([
                    'receipt_no' => 'REC-' . time(),
                    'payer_type' => $payerType,
                    'payer_id' => $payerId,
                    'amount' => $totalReceived,
                    'payment_method' => $paymentMethod,
                    'payment_account_id' => $paymentAccount->id,
                    'receipt_date' => now(),
                    'remarks' => ($paymentOption === 'full' ? 'Full Payment (' . $amountToApplyToInvoice . ')' : 'Advance (' . $amountToApplyToInvoice . ')') . ' & Security (' . $securityDeposit . ') for Event Booking #' . $bookingNo,
                    'created_by' => Auth::id(),
                ]);

                // 2. Create Transaction (Credit) for TOTAL Received
                $transaction = Transaction::create([
                    'type' => 'credit',
                    'amount' => $totalReceived,
                    'date' => now(),
                    'description' => 'Payment (Adv+Sec) for Event Booking #' . $bookingNo,
                    'payable_type' => $payerType,
                    'payable_id' => $payerId,
                    'reference_type' => FinancialReceipt::class,
                    'reference_id' => $receipt->id,
                    'payment_mode' => $request->paymentMode ?? 'Cash',
                    'created_by' => Auth::id(),
                ]);

                $appliedToInvoice = min((float) $invoice->total_price, (float) $amountToApplyToInvoice);

                // 3. Link Payment to Invoice (TransactionRelation)
                if ($appliedToInvoice > 0) {
                    TransactionRelation::create([
                        'receipt_id' => $receipt->id,
                        'invoice_id' => $invoice->id,
                        'amount' => $appliedToInvoice,
                    ]);
                }

                // 4. Update Invoice
                $invoice->paid_amount = $appliedToInvoice;
                $invoice->status = (($invoice->paid_amount + $securityDeposit) >= $invoice->total_price) ? 'paid' : 'unpaid';
                $invoice->save();

                // 5. Update Booking Financial Fields
                $eventBooking->security_deposit = $securityDeposit;
                $eventBooking->advance_amount = $advanceAmount;
                $eventBooking->paid_amount = $appliedToInvoice;
                $eventBooking->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Event booking created successfully',
                'booking_no' => $bookingNo,
                'invoice_no' => $invoice->id,
                'booking_id' => $eventBooking->id
            ], 200);
        } catch (\Exception $e) {
            DB::rollback();
            Log::error('Event booking creation failed: ' . $e->getMessage());

            return response()->json([
                'message' => 'Failed to create event booking',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getBookingId()
    {
        $maxBookingNo = EventBooking::withTrashed()
            ->selectRaw('MAX(CAST(booking_no AS UNSIGNED)) as max_no')
            ->value('max_no');

        return ($maxBookingNo ? (int) $maxBookingNo : 0) + 1;
    }

    private function getInvoiceNo()
    {
        $invoiceNo = FinancialInvoice::withTrashed()->max('invoice_no');
        $invoiceNo = $invoiceNo + 1;
        return $invoiceNo;
    }

    /**
     * Calculate total amount for menu add-ons (excluding complementary)
     */
    private function calculateMenuAddOnsTotal($menuAddOns)
    {
        $total = 0;
        foreach ($menuAddOns as $addon) {
            if (!($addon['is_complementary'] ?? false)) {
                $total += floatval($addon['amount'] ?? 0);
            }
        }
        return $total;
    }

    /**
     * Calculate total amount for other charges (excluding complementary)
     */
    private function calculateOtherChargesTotal($otherCharges)
    {
        $total = 0;
        foreach ($otherCharges as $charge) {
            if (!($charge['is_complementary'] ?? false)) {
                $total += floatval($charge['amount'] ?? 0);
            }
        }
        return $total;
    }

    private function normalizeReceiptMethod(?string $paymentMode): string
    {
        return match ($paymentMode ?? 'Cash') {
            'Bank Transfer' => 'bank_transfer',
            'Credit Card' => 'credit_card',
            'Online' => 'online',
            'Cheque' => 'cheque',
            default => 'cash',
        };
    }

    private function validatedPostingPaymentAccount(mixed $accountInput, ?string $paymentMethod, string $field = 'payment_account_id')
    {
        return app(PaymentAccountPostingGuard::class)->validateRequiredForPosting($accountInput, $paymentMethod, $field);
    }

    /**
     * Show edit form for event booking
     */
    public function edit($id)
    {
        $booking = EventBooking::with([
            'customer',
            'member',
            'corporateMember',
            'eventVenue',
            'menu',
            'menuAddOns',
            'otherCharges',
            'invoice'
        ])->findOrFail($id);

        // Get the same data as create form
        $eventVenues = EventVenue::select('id', 'name')->get();
        $chargesTypeItems = EventChargeType::where('status', 'active')->select('id', 'name', 'amount')->get();

        // Get event menus with their items
        $eventMenus = EventMenu::where('status', 'active')
            ->with('items:id,event_menu_id,menu_category_id,name,status')
            ->select('id', 'name', 'amount', 'status')
            ->get();

        // Get menu category items for selection
        $menuCategoryItems = EventMenuCategory::where('status', 'active')
            ->select('id', 'name')
            ->get();

        // Get menu add-ons (similar to charges)
        $menuAddOnItems = EventMenuAddOn::where('status', 'active')
            ->select('id', 'name', 'amount')
            ->get();

        return Inertia::render('App/Admin/Events/CreateBooking', [
            'bookingNo' => $booking->booking_no,
            'eventVenues' => $eventVenues,
            'chargesTypeItems' => $chargesTypeItems,
            'eventMenus' => $eventMenus,
            'menuCategoryItems' => $menuCategoryItems,
            'menuAddOnItems' => $menuAddOnItems,
            'editMode' => true,
            'bookingData' => [
                ...$booking->toArray(),
                'menuAddOns' => $booking->menuAddOns->toArray(),
                'otherCharges' => $booking->otherCharges->toArray(),
                'menu' => $booking->menu ? $booking->menu->toArray() : null,
                'member' => $booking->member ? $booking->member->toArray() : null,
                'corporateMember' => $booking->corporateMember ? $booking->corporateMember->toArray() : null,
                'customer' => $booking->customer ? $booking->customer->toArray() : null,
                'eventVenue' => $booking->eventVenue ? $booking->eventVenue->toArray() : null,
            ]
        ]);
    }

    /**
     * Update event booking
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'bookedBy' => 'required|string',
            'natureOfEvent' => 'required|string',
            'eventDate' => 'required|date',
            'eventTimeFrom' => 'required',
            'eventTimeTo' => 'required',
            'venue' => 'required|exists:event_venues,id',
            'numberOfGuests' => 'required|integer|min:1',
            'grandTotal' => 'required|numeric|min:0',
            'status' => 'nullable|in:completed',
            'completionPaymentAmount' => 'nullable|numeric|min:0',
        ]);

        // Check for duplicate booking (overlapping time)
        $start = $request->eventTimeFrom;
        $end = $request->eventTimeTo;

        $existingBooking = EventBooking::where('event_venue_id', $request->venue)
            ->where('event_date', $request->eventDate)
            ->whereNotIn('status', ['cancelled', 'completed'])
            ->where('id', '!=', $id)
            ->where(function ($query) use ($start, $end) {
                $query
                    ->where('event_time_from', '<', $end)
                    ->where('event_time_to', '>', $start);
            })
            ->exists();

        if ($existingBooking) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'venue' => ['This venue is already booked for the selected date and time slot.'],
            ]);
        }

        DB::beginTransaction();

        try {
            $booking = EventBooking::findOrFail($id);

            // Handle document uploads if any
            $oldDocs = $booking->booking_docs ? json_decode($booking->booking_docs, true) : [];
            $documentPaths = [];

            // Handle file uploads (new files from drag & drop or file input)
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $documentPaths[] = FileHelper::saveImage($file, 'booking_documents');
                }
            }

            // Handle existing documents (paths sent from frontend)
            if ($request->has('existingDocuments') && is_array($request->existingDocuments)) {
                foreach ($request->existingDocuments as $existingDoc) {
                    if (!empty($existingDoc)) {
                        $documentPaths[] = $existingDoc;
                    }
                }
            }

            // If no documents field but we have existing docs, keep them
            if (!$request->hasFile('documents') && !$request->has('existingDocuments') && !empty($oldDocs)) {
                $documentPaths = $oldDocs;
            }

            // Step 2: Find deleted docs (compare old docs with new document paths)
            $deleted = array_diff($oldDocs, $documentPaths);

            // Step 3: Delete them from filesystem
            foreach ($deleted as $docPath) {
                $absolutePath = public_path(ltrim($docPath, '/'));

                if (file_exists($absolutePath)) {
                    @unlink($absolutePath);
                }
            }

            // Update booking data (don't change member/customer info)
            // Calculate charges for update
            $addonsCharges = $this->calculateMenuAddOnsTotal($request->menu_addons ?? []);
            $menuAmount = $request->menuAmount ?? 0;
            $perPersonCharges = $menuAmount + $addonsCharges;
            $guestCharges = $perPersonCharges * $request->numberOfGuests;
            $otherCharges = $this->calculateOtherChargesTotal($request->other_charges ?? []);

            $guestName = $request->guest['name'] ?? '';
            $guestAddress = $request->guest['address'] ?? '';
            $guestCnic = $request->guest['cnic'] ?? '';
            $guestMobile = $request->guest['phone'] ?? '';
            $guestEmail = $request->guest['email'] ?? '';

            $memberId = null;
            $customerId = null;
            $corporateMemberId = null;
            $bookingType = '1';

            if (!empty($request->guest['is_corporate']) || ($request->guest['booking_type'] ?? '') == '2') {
                $corporateMemberId = (int) $request->guest['id'];
                $bookingType = '2';
            } elseif (!empty($request->guest['booking_type']) && $request->guest['booking_type'] === 'member') {
                $memberId = (int) $request->guest['id'];
                $bookingType = '0';
            } else {
                $customerId = (int) $request->guest['id'];
                $bookingType = '1';
            }

            $updateData = [
                'booked_by' => $request->bookedBy,
                'nature_of_event' => $request->natureOfEvent,
                'family_id' => $request->familyMember ?? null,
                'name' => $guestName,
                'address' => $guestAddress,
                'cnic' => $guestCnic,
                'mobile' => $guestMobile,
                'email' => $guestEmail,
                'event_date' => $request->eventDate,
                'event_time_from' => $request->eventTimeFrom,
                'event_time_to' => $request->eventTimeTo,
                'event_venue_id' => $request->venue,
                'member_id' => $memberId,
                'customer_id' => $customerId,
                'corporate_member_id' => $corporateMemberId,
                'booking_type' => $bookingType,
                'no_of_guests' => $request->numberOfGuests,
                'reduction_type' => $request->discountType,
                'reduction_amount' => $request->discount ?? 0,
                'total_price' => round(floatval($request->grandTotal)),
                'booking_docs' => json_encode($documentPaths),
                'additional_notes' => $request->notes ?? '',
                // Update detailed charges
                'menu_charges' => $menuAmount,
                'addons_charges' => $addonsCharges,
                'total_per_person_charges' => $perPersonCharges,
                'guest_charges' => $guestCharges,
                'total_food_charges' => $guestCharges,
                'total_other_charges' => $otherCharges,
                'total_charges' => round(floatval($request->grandTotal)),
            ];

            // Handle Status Update
            if ($request->filled('status')) {
                $updateData['status'] = $request->status;

                if ($request->status === 'completed' && $booking->status !== 'completed') {
                    $updateData['additional_data'] = array_merge(
                        $booking->additional_data ?? [],
                        ['completed_time' => now()->format('H:i')]
                    );
                }
            }

            $booking->update($updateData);

            // Update menu if changed
            if ($request->selectedMenu) {
                // Delete existing menu
                $booking->menu()->delete();

                // Create new menu
                $selectedMenu = EventMenu::find($request->selectedMenu);
                EventBookingMenu::create([
                    'event_booking_id' => $booking->id,
                    'event_menu_id' => $request->selectedMenu,
                    'name' => $selectedMenu->name,
                    'amount' => $selectedMenu->amount,
                    'items' => $request->menuItems ?? [],
                ]);
            }

            // Update menu add-ons
            $booking->menuAddOns()->delete();
            if ($request->menu_addons) {
                foreach ($request->menu_addons as $addon) {
                    if (!empty($addon['type'])) {
                        EventBookingMenuAddOn::create([
                            'event_booking_id' => $booking->id,
                            'type' => $addon['type'],
                            'details' => $addon['details'] ?? '',
                            'amount' => $addon['amount'] ?? 0,
                            'is_complementary' => filter_var($addon['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN),
                        ]);
                    }
                }
            }

            // Update other charges
            $booking->otherCharges()->delete();
            if ($request->other_charges) {
                foreach ($request->other_charges as $charge) {
                    if (!empty($charge['type'])) {
                        EventBookingOtherCharges::create([
                            'event_booking_id' => $booking->id,
                            'type' => $charge['type'],
                            'details' => $charge['details'] ?? '',
                            'amount' => $charge['amount'] ?? 0,
                            'is_complementary' => filter_var($charge['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN),
                        ]);
                    }
                }
            }

            // ✅ Update associated invoice using polymorphic relationship
            $invoice = $booking->invoice;

            // Handle Advance Payment & Security Deposit Changes (Only Increases)
            $oldAdvance = $booking->advance_amount ?? 0;
            $newAdvance = floatval($request->advanceAmount ?? 0);

            $oldSecurity = $booking->security_deposit ?? 0;
            $newSecurity = floatval($request->securityDeposit ?? 0);

            $diffAdvance = max(0, $newAdvance - $oldAdvance);
            $diffSecurity = max(0, $newSecurity - $oldSecurity);

            $totalDiff = $diffAdvance + $diffSecurity;

            if ($totalDiff > 0) {
                $paymentMethod = $this->normalizeReceiptMethod($request->paymentMode);
                $paymentAccount = $this->validatedPostingPaymentAccount($request->paymentAccount, $paymentMethod, 'paymentAccount');

                // 1. Create Receipt for Difference
                $receipt = FinancialReceipt::create([
                    'receipt_no' => 'REC-' . time(),
                    'payer_type' => $invoice && $invoice->member_id ? \App\Models\Member::class : ($invoice && $invoice->corporate_member_id ? \App\Models\CorporateMember::class : \App\Models\Customer::class),
                    'payer_id' => $invoice->member_id ?? ($invoice->corporate_member_id ?? $invoice->customer_id),
                    'amount' => $totalDiff,
                    'payment_method' => $paymentMethod,
                    'payment_account_id' => $paymentAccount->id,
                    'receipt_date' => now(),
                    'remarks' => 'Additional: Adv (' . $diffAdvance . ') & Sec (' . $diffSecurity . ') for Event #' . $booking->booking_no,
                    'created_by' => Auth::id(),
                ]);

                // 2. Create Transaction (Credit)
                $transaction = Transaction::create([
                    'type' => 'credit',
                    'amount' => $totalDiff,
                    'date' => now(),
                    'description' => 'Additional Payment for Event Booking #' . $booking->booking_no,
                    'payable_type' => $invoice && $invoice->member_id ? \App\Models\Member::class : ($invoice && $invoice->corporate_member_id ? \App\Models\CorporateMember::class : \App\Models\Customer::class),
                    'payable_id' => $invoice->member_id ?? ($invoice->corporate_member_id ?? $invoice->customer_id),
                    'reference_type' => FinancialReceipt::class,
                    'reference_id' => $receipt->id,
                    'payment_mode' => $request->paymentMode ?? 'Cash',
                    'created_by' => Auth::id(),
                ]);

                // 3. Link to Invoice (ONLY Advance)
                if ($diffAdvance > 0 && $invoice) {
                    TransactionRelation::create([
                        'receipt_id' => $receipt->id,
                        'invoice_id' => $invoice->id,
                        'amount' => $diffAdvance,
                    ]);

                    // Update Invoice Paid Amount
                    $invoice->paid_amount += $diffAdvance;
                    $invoice->status = (($invoice->paid_amount + $newSecurity) >= $invoice->total_price) ? 'paid' : 'unpaid';
                    $invoice->save();
                }

                // Update Booking
                $booking->advance_amount = $newAdvance;
                $booking->security_deposit = $newSecurity;
                $booking->paid_amount += $diffAdvance;  // Update paid_amount to reflect invoice payments
                $booking->save();
            }

            if ($invoice) {
                // Calculate original amount (before discount) and final amount (after discount)
                $originalAmount = round($this->calculateOriginalAmount($request));
                $finalAmount = round(floatval($request->grandTotal));

                // ✅ Determine Payer Details for Ledger & Invoice Data
                $payerId = null;
                $payerType = null;
                $memberName = 'Guest';

                // Check guest info from request - logic matches store()
                if (!empty($request->guest['is_corporate']) || ($request->guest['booking_type'] ?? '') == '2') {
                    $payerId = (int) $request->guest['id'];
                    $payerType = \App\Models\CorporateMember::class;
                    $memberName = $request->guest['name'] ?? 'Corporate Member';
                } elseif (!empty($request->guest['booking_type']) && $request->guest['booking_type'] === 'member') {
                    $payerId = (int) $request->guest['id'];
                    $payerType = \App\Models\Member::class;
                    $memberName = $request->guest['name'] ?? 'Member';
                } else {
                    $payerId = (int) $request->guest['id'];
                    $payerType = \App\Models\Customer::class;
                    $memberName = $request->guest['name'] ?? 'Guest';
                }

                $invoiceData = [
                    'discount_type' => $request->discountType ?? null,
                    'discount_value' => $request->discount ?? 0,
                    'amount' => $originalAmount,  // Original amount before discount
                    'total_price' => $finalAmount,  // Final amount after discount
                    'member_id' => $payerType === \App\Models\Member::class ? $payerId : null,
                    'corporate_member_id' => $payerType === \App\Models\CorporateMember::class ? $payerId : null,
                    'customer_id' => $payerType === \App\Models\Customer::class ? $payerId : null,
                    'data' => array_merge($invoice->data ?? [], ['member_name' => $memberName])
                ];

                $invoice->update($invoiceData);

                // ✅ Sync Invoice Items (Delete old, create new)
                $invoice->items()->delete();

                // 1. Menu Charges
                if ($request->menuAmount > 0) {
                    FinancialInvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'fee_type' => AppConstants::TRANSACTION_TYPE_ID_EVENT_BOOKING,
                        'description' => 'Event Menu Charges',
                        'qty' => $request->numberOfGuests,
                        'amount' => $request->menuAmount,
                        'sub_total' => $request->menuAmount * $request->numberOfGuests,
                        'total' => $request->menuAmount * $request->numberOfGuests,
                    ]);
                }

                // 2. Addons
                if ($request->menu_addons) {
                    foreach ($request->menu_addons as $addon) {
                        if (!empty($addon['amount'])) {
                            $addonAmount = $addon['amount'];
                            $isComplementary = filter_var($addon['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN);
                            if ($isComplementary)
                                continue;

                            FinancialInvoiceItem::create([
                                'invoice_id' => $invoice->id,
                                'fee_type' => AppConstants::TRANSACTION_TYPE_ID_EVENT_BOOKING,
                                'description' => 'Addon: ' . ($addon['type'] ?? 'Addon'),
                                'qty' => $request->numberOfGuests,
                                'amount' => $addonAmount,
                                'sub_total' => $addonAmount * $request->numberOfGuests,
                                'total' => $addonAmount * $request->numberOfGuests,
                            ]);
                        }
                    }
                }

                // 3. Other Charges
                if ($request->other_charges) {
                    foreach ($request->other_charges as $charge) {
                        if (!empty($charge['amount'])) {
                            $chargeAmount = $charge['amount'];
                            $isComplementary = filter_var($charge['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN);
                            if ($isComplementary)
                                continue;

                            FinancialInvoiceItem::create([
                                'invoice_id' => $invoice->id,
                                'fee_type' => AppConstants::TRANSACTION_TYPE_ID_EVENT_BOOKING,
                                'description' => 'Charge: ' . ($charge['type'] ?? 'Charge'),
                                'qty' => 1,
                                'amount' => $chargeAmount,
                                'sub_total' => $chargeAmount,
                                'total' => $chargeAmount,
                            ]);
                        }
                    }
                }

                // ✅ Sync Ledger (Debit Transaction) if Invoice is Unpaid
                // If unpaid, we assume we can just correct the ledger entry.
                if ($invoice->status === 'unpaid') {
                    $transaction = Transaction::where('reference_type', FinancialInvoice::class)
                        ->where('reference_id', $invoice->id)
                        ->where('type', 'debit')
                        ->first();

                    if ($transaction) {
                        $transaction->update([
                            'amount' => $finalAmount,
                            'payable_type' => $payerType,
                            'payable_id' => $payerId,
                            'description' => 'Event Booking Invoice #' . $invoice->invoice_no . ' (Updated)',
                        ]);
                    }
                }
            }

            if ($request->input('status') === 'completed') {
                if (in_array($booking->status, ['cancelled', 'refunded'], true)) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'status' => ['Cancelled bookings cannot be completed.'],
                    ]);
                }

                if (!$invoice) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'status' => ['Cannot complete booking without an invoice.'],
                    ]);
                }

                $invoice->refresh();
                $remainingDue = max(0, (float) $invoice->total_price - ((float) $invoice->paid_amount + (float) ($booking->security_deposit ?? 0)));

                if ($remainingDue > 0) {
                    $paymentNow = floatval($request->completionPaymentAmount ?? 0);
                    if ($paymentNow < $remainingDue) {
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'completionPaymentAmount' => ['Full payment is required to complete the event.'],
                        ]);
                    }

                    $paymentMethod = $this->normalizeReceiptMethod($request->paymentMode);
                    $paymentAccount = $this->validatedPostingPaymentAccount($request->paymentAccount, $paymentMethod, 'paymentAccount');
                    $payerDetails = $this->getPayerDetails($invoice);
                    $receipt = FinancialReceipt::create([
                        'receipt_no' => 'REC-' . time(),
                        'payer_type' => $payerDetails['type'],
                        'payer_id' => $payerDetails['id'],
                        'amount' => $remainingDue,
                        'payment_method' => $paymentMethod,
                        'payment_account_id' => $paymentAccount->id,
                        'receipt_date' => now(),
                        'remarks' => 'Event completion payment for Booking #' . $booking->booking_no,
                        'created_by' => Auth::id(),
                    ]);
                    $invoiceItem = $invoice->items()->first();

                    Transaction::create([
                        'type' => 'credit',
                        'amount' => $remainingDue,
                        'date' => now(),
                        'description' => 'Completion payment for Event Booking #' . $booking->booking_no,
                        'payable_type' => $payerDetails['type'],
                        'payable_id' => $payerDetails['id'],
                        'reference_type' => $invoiceItem ? FinancialInvoiceItem::class : FinancialInvoice::class,
                        'reference_id' => $invoiceItem ? $invoiceItem->id : $invoice->id,
                        'invoice_id' => $invoice->id,
                        'payment_mode' => $request->paymentMode ?? 'Cash',
                        'created_by' => Auth::id(),
                    ]);

                    TransactionRelation::create([
                        'receipt_id' => $receipt->id,
                        'invoice_id' => $invoice->id,
                        'amount' => $remainingDue,
                    ]);

                    $invoice->paid_amount = (float) $invoice->paid_amount + $remainingDue;
                }

                $invoice->status = (((float) $invoice->paid_amount + (float) ($booking->security_deposit ?? 0)) >= (float) $invoice->total_price) ? 'paid' : 'unpaid';
                $invoice->save();

                if ($invoice->status !== 'paid') {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'completionPaymentAmount' => ['Full payment is required to complete the event.'],
                    ]);
                }

                $booking->paid_amount = $invoice->paid_amount;
                $booking->status = 'completed';
                $booking->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Event booking updated successfully',
                'booking_no' => $booking->booking_no,
                'invoice_no' => $invoice->invoice_no ?? null,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Event booking update failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update event booking'], 500);
        }
    }

    /**
     * Show event booking invoice
     */
    public function showInvoice(Request $request, $id)
    {
        if ($request->header('X-Inertia')) {
            return redirect()->route('events.booking.edit', ['id' => $id]);
        }

        $booking = EventBooking::with([
            'customer',
            'member:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'familyMember:id,membership_no,full_name,personal_email',
            'eventVenue:id,name',
            'menu',
            'menuAddOns',
            'otherCharges',
            'invoice'  // ✅ Eager load invoice using polymorphic relationship
        ])->findOrFail($id);

        return response()->json(['booking' => $booking]);
    }

    /**
     * Update event booking status
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,completed,cancelled',
            'completed_time' => 'nullable|date_format:H:i',
            'cancellation_reason' => 'nullable|string'
        ]);

        $booking = EventBooking::with('invoice')->findOrFail($id);

        if ($request->status === 'completed') {
            if (!$booking->invoice || $booking->invoice->status !== 'paid') {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'status' => ['Full payment is required to complete the event.'],
                ]);
            }
        }

        $booking->status = $request->status;

        if ($request->status === 'completed' && $request->completed_time) {
            $booking->additional_data = array_merge(
                $booking->additional_data ?? [],
                ['completed_time' => $request->completed_time]
            );
        }

        if ($request->status === 'cancelled' && $request->cancellation_reason) {
            $booking->additional_data = array_merge(
                $booking->additional_data ?? [],
                ['cancellation_reason' => $request->cancellation_reason]
            );
        }

        $booking->save();

        return response()->json(['success' => true, 'message' => 'Booking status updated successfully']);
    }

    /**
     * Get calendar data for event bookings
     */
    public function calendarData(Request $request)
    {
        $from = $request->get('from');
        $to = $request->get('to');

        if (!empty($from) && !empty($to)) {
            $startDate = Carbon::parse($from)->startOfDay();
            $endDate = Carbon::parse($to)->endOfDay();
        } else {
            $month = $request->get('month', date('m'));
            $year = $request->get('year', date('Y'));

            $startDate = Carbon::createFromDate((int) $year, (int) $month, 1)->startOfDay();
            if ($startDate->isSameMonth(Carbon::now())) {
                $startDate = Carbon::now()->startOfDay();
            }
            $endDate = (clone $startDate)->addDays(30)->endOfDay();
        }

        // Get all event venues
        $venues = EventVenue::select('id', 'name')
            ->orderBy('name')
            ->get();

        // Get bookings for the month
        $bookings = EventBooking::with([
            'customer:id,name,email',
            'member:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'eventVenue:id,name'
        ])
            ->whereBetween('event_date', [$startDate->toDateString(), $endDate->toDateString()])
            ->whereNotIn('status', ['cancelled', 'refunded'])
            ->orderBy('event_date')
            ->orderBy('event_time_from')
            ->get()
            ->map(function ($booking) {
                return [
                    'id' => $booking->id,
                    'booking_no' => $booking->booking_no,
                    'event_venue_id' => $booking->event_venue_id,
                    'event_date' => $booking->event_date,
                    'event_time_from' => $booking->event_time_from,
                    'event_time_to' => $booking->event_time_to,
                    'nature_of_event' => $booking->nature_of_event,
                    'booked_by' => $booking->booked_by,
                    'name' => $booking->name,
                    'mobile' => $booking->mobile,
                    'membership_no' => $booking->member ? $booking->member->membership_no : ($booking->corporateMember ? $booking->corporateMember->membership_no : ($booking->customer ? $booking->customer->customer_no : null)),
                    'no_of_guests' => $booking->no_of_guests,
                    'status' => $booking->status,
                    'total_price' => $booking->total_price,
                    'additional_notes' => $booking->additional_notes,
                    'event_venue' => $booking->eventVenue,
                    'customer' => $booking->customer,
                    'member' => $booking->member,
                    'corporateMember' => $booking->corporateMember,
                ];
            });

        return response()->json([
            'venues' => $venues,
            'bookings' => $bookings
        ]);
    }

    /**
     * Show all event bookings page
     */
    public function index(Request $request)
    {
        $query = EventBooking::with([
            'customer',
            'member:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'eventVenue:id,name'
        ]);

        // Apply centralized filters
        $filters = $request->only(['search', 'search_id', 'customer_type', 'booking_date_from', 'booking_date_to', 'event_date_from', 'event_date_to', 'membership_no']);
        $this->applyFilters($query, $filters);

        $bookings = $query->orderBy('created_at', 'desc')->limit(50)->get();

        $data = [
            'bookingsData' => $bookings,
            'totalEventBookings' => EventBooking::count(),
            'availableVenuesToday' => EventVenue::where('status', 'active')->count(),
            'confirmedBookings' => EventBooking::where('status', 'confirmed')->count(),
            'completedBookings' => EventBooking::where('status', 'completed')->count(),
        ];

        $eventVenues = EventVenue::where('status', 'active')->get();

        return Inertia::render('App/Admin/Events/BookingDashboard', [
            'data' => $data,
            'filters' => $filters,
            'eventVenues' => $eventVenues
        ]);
    }

    // ... (create, store, edit, update, showInvoice, updateStatus, calendarData methods remain unchanged) ...

    public function manage(Request $request)
    {
        $query = EventBooking::with([
            'customer:id,name,email,contact,customer_no,guest_type_id',
            'customer.guestType:id,name',
            'member:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'eventVenue:id,name',
            'menu:id,event_booking_id,event_menu_id,name,amount',
            'invoice'
        ])->where('event_bookings.status', 'confirmed');

        $filters = $request->only(['search', 'search_id', 'customer_type', 'booking_date_from', 'booking_date_to', 'event_date_from', 'event_date_to', 'venues', 'status', 'membership_no']);
        $this->applyFilters($query, $filters);

        // Filter by venues (specific to manage/completed/cancelled pages which have extra venue filter)
        if ($request->filled('venues') && is_array($request->venues)) {
            $query->whereHas('eventVenue', function ($q) use ($request) {
                $q->whereIn('name', $request->venues);
            });
        }

        if ($request->filled('status') && is_array($request->status)) {
            $includesPaid = in_array('paid', $request->status, true);
            $includesUnpaid = in_array('unpaid', $request->status, true);

            if ($includesPaid && !$includesUnpaid) {
                $query->whereHas('invoice', function ($q) {
                    $q->where('status', 'paid')->orWhere('paid_amount', '>', 0);
                });
            } elseif ($includesUnpaid && !$includesPaid) {
                $query->whereHas('invoice', function ($q) {
                    $q->where('status', 'unpaid')->orWhere('paid_amount', '<=', 0);
                });
            }
        }

        $aggregates = (clone $query)
            ->leftJoin('financial_invoices as fi', function ($join) {
                $join
                    ->on('fi.invoiceable_id', '=', 'event_bookings.id')
                    ->where('fi.invoiceable_type', \App\Models\EventBooking::class)
                    ->where('fi.invoice_type', 'event_booking')
                    ->whereNull('fi.deleted_at');
            })
            ->selectRaw('
                COALESCE(SUM(event_bookings.total_price), 0) as total_amount,
                COALESCE(SUM(event_bookings.advance_amount), 0) as total_advance,
                COALESCE(SUM(COALESCE(fi.paid_amount, 0) + COALESCE(fi.advance_payment, 0)), 0) as total_paid,
                COALESCE(SUM(event_bookings.total_price - (COALESCE(fi.paid_amount, 0) + COALESCE(fi.advance_payment, 0))), 0) as total_balance
            ')
            ->first();

        $bookings = $query->orderBy('created_at', 'desc')->paginate(50)->withQueryString();

        return inertia('App/Admin/Events/Manage', [
            'bookings' => $bookings,
            'filters' => $filters,
            'aggregates' => $aggregates
        ]);
    }

    public function completed(Request $request)
    {
        $query = EventBooking::with([
            'customer:id,name,email,contact,customer_no,guest_type_id',
            'customer.guestType:id,name',
            'member:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'eventVenue:id,name',
            'menu:id,event_booking_id,event_menu_id,name,amount',
            'invoice'
        ])->where('event_bookings.status', 'completed');

        $filters = $request->only(['search', 'search_id', 'customer_type', 'booking_date_from', 'booking_date_to', 'event_date_from', 'event_date_to', 'venues', 'membership_no']);
        $this->applyFilters($query, $filters);

        if ($request->filled('venues') && is_array($request->venues)) {
            $query->whereHas('eventVenue', function ($q) use ($request) {
                $q->whereIn('name', $request->venues);
            });
        }

        $aggregates = (clone $query)
            ->leftJoin('financial_invoices as fi', function ($join) {
                $join
                    ->on('fi.invoiceable_id', '=', 'event_bookings.id')
                    ->where('fi.invoiceable_type', \App\Models\EventBooking::class)
                    ->where('fi.invoice_type', 'event_booking')
                    ->whereNull('fi.deleted_at');
            })
            ->selectRaw('
                COALESCE(SUM(event_bookings.total_price), 0) as total_amount,
                COALESCE(SUM(event_bookings.advance_amount), 0) as total_advance,
                COALESCE(SUM(COALESCE(fi.paid_amount, 0) + COALESCE(fi.advance_payment, 0)), 0) as total_paid,
                COALESCE(SUM(event_bookings.total_price - (COALESCE(fi.paid_amount, 0) + COALESCE(fi.advance_payment, 0))), 0) as total_balance
            ')
            ->first();

        $bookings = $query->orderBy('created_at', 'desc')->paginate(50)->withQueryString();

        return inertia('App/Admin/Events/Completed', [
            'bookings' => $bookings,
            'filters' => $filters,
            'aggregates' => $aggregates
        ]);
    }

    public function cancelled(Request $request)
    {
        $query = EventBooking::with([
            'customer:id,name,email,contact,customer_no,guest_type_id',
            'customer.guestType:id,name',
            'member:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'corporateMember:id,membership_no,full_name,personal_email',
            'eventVenue:id,name',
            'menu:id,event_booking_id,event_menu_id,name,amount',
            'invoice'
        ])->whereIn('event_bookings.status', ['cancelled', 'refunded']);

        $filters = $request->only(['search', 'search_id', 'customer_type', 'booking_date_from', 'booking_date_to', 'event_date_from', 'event_date_to', 'venues', 'membership_no']);
        $this->applyFilters($query, $filters);

        if ($request->filled('venues') && is_array($request->venues)) {
            $query->whereHas('eventVenue', function ($q) use ($request) {
                $q->whereIn('name', $request->venues);
            });
        }

        $aggregates = (clone $query)
            ->leftJoin('financial_invoices as fi', function ($join) {
                $join
                    ->on('fi.invoiceable_id', '=', 'event_bookings.id')
                    ->where('fi.invoiceable_type', \App\Models\EventBooking::class)
                    ->where('fi.invoice_type', 'event_booking')
                    ->whereNull('fi.deleted_at');
            })
            ->selectRaw('
                COALESCE(SUM(event_bookings.total_price), 0) as total_amount,
                COALESCE(SUM(event_bookings.advance_amount), 0) as total_advance,
                COALESCE(SUM(COALESCE(fi.paid_amount, 0) + COALESCE(fi.advance_payment, 0)), 0) as total_paid,
                COALESCE(SUM(event_bookings.total_price - (COALESCE(fi.paid_amount, 0) + COALESCE(fi.advance_payment, 0))), 0) as total_balance
            ')
            ->first();

        $bookings = $query->orderBy('created_at', 'desc')->paginate(50)->withQueryString();

        return inertia('App/Admin/Events/Cancelled', [
            'bookings' => $bookings,
            'filters' => $filters,
            'aggregates' => $aggregates
        ]);
    }

    /**
     * Apply common filters to the query
     */
    private function applyFilters($query, $filters)
    {
        // 1. Customer Type Filter
        $customerType = $filters['customer_type'] ?? 'all';
        // Note: The original 'manage' search logic conflated search term with type check somewhat.
        // Here we explictly filter by type if selected.
        if (is_string($customerType) && str_starts_with($customerType, 'guest-')) {
            $guestTypeId = (int) substr($customerType, strlen('guest-'));
            $query
                ->whereNotNull('customer_id')
                ->whereNull('member_id')
                ->whereNull('corporate_member_id')
                ->whereHas('customer', function ($q) use ($guestTypeId) {
                    $q->where('guest_type_id', $guestTypeId);
                });
        } elseif ($customerType === 'member') {
            $query->whereNotNull('member_id');
        } elseif ($customerType === 'corporate') {
            $query->whereNotNull('corporate_member_id');
        } elseif ($customerType === 'guest') {
            $query
                ->whereNotNull('customer_id')
                ->whereNull('member_id')
                ->whereNull('corporate_member_id');
        }

        // 2. Search Filter (Name, ID, etc.)
        // This 'search' comes from the unified search box in BookingFilter
        // It replaces 'search_name' from the old logic, but we should support both or map them.
        // We will prioritize 'search' but fallback to 'search_name' if passed (legacy support or if frontend uses it).
        $search = $filters['search'] ?? ($filters['search_name'] ?? null);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")  // Guest Name stored directly on booking sometimes? Or is it 'name' column?
                    ->orWhere('booking_no', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($sub) use ($search) {
                        $sub
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('customer_no', 'like', "%{$search}%");
                    })
                    ->orWhereHas('member', function ($sub) use ($search) {
                        $sub
                            ->where('full_name', 'like', "%{$search}%")
                            ->orWhere('membership_no', 'like', "%{$search}%");
                    })
                    ->orWhereHas('corporateMember', function ($sub) use ($search) {
                        $sub
                            ->where('full_name', 'like', "%{$search}%")
                            ->orWhere('membership_no', 'like', "%{$search}%");
                    })
                    ->orWhereHas('eventVenue', function ($sub) use ($search) {
                        $sub->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // 3. Search by ID (Specific field)
        if (!empty($filters['search_id'])) {
            $query->where('booking_no', 'like', "%{$filters['search_id']}%");
        }

        // 4. Booking Date Range
        if (!empty($filters['booking_date_from'])) {
            $query->whereDate('created_at', '>=', $filters['booking_date_from']);
        }
        if (!empty($filters['booking_date_to'])) {
            $query->whereDate('created_at', '<=', $filters['booking_date_to']);
        }

        // 5. Event Date Range
        if (!empty($filters['event_date_from'])) {
            $query->whereDate('event_date', '>=', $filters['event_date_from']);
        }
        if (!empty($filters['event_date_to'])) {
            $query->whereDate('event_date', '<=', $filters['event_date_to']);
        }

        // 6. Membership Number Filter
        if (!empty($filters['membership_no'])) {
            $query->where(function ($q) use ($filters) {
                $term = $filters['membership_no'];
                $q
                    ->whereHas('member', function ($sub) use ($term) {
                        $sub->where('membership_no', 'like', "%{$term}%");
                    })
                    ->orWhereHas('corporateMember', function ($sub) use ($term) {
                        $sub->where('membership_no', 'like', "%{$term}%");
                    })
                    ->orWhereHas('customer', function ($sub) use ($term) {
                        $sub->where('customer_no', 'like', "%{$term}%");
                    });
            });
        }
    }

    /**
     * Get available venues for filter dropdown
     */
    public function getVenues()
    {
        $venues = EventVenue::select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(function ($venue) {
                return [
                    'value' => $venue->name,
                    'label' => $venue->name
                ];
            });

        return response()->json($venues);
    }

    public function searchCustomers(Request $request)
    {
        $query = $request->input('query');
        $type = $request->input('type', 'all');
        $includeInactive = filter_var($request->input('include_inactive', false), FILTER_VALIDATE_BOOLEAN);

        if (!$type) {
            $type = 'all';
        }

        if (empty($query)) {
            return response()->json([]);
        }

        $normalizedQuery = preg_replace('/[^A-Za-z0-9]/', '', (string) $query);

        $results = collect();

        if ($type === 'all' || $type === 'member') {
            $members = \App\Models\Member::query()
                ->when(!$includeInactive, function ($q) {
                    $q->where('status', 'active');
                })
                ->where(function ($q) use ($query) {
                    $q
                        ->where('full_name', 'like', "%{$query}%")
                        ->orWhere('membership_no', 'like', "%{$query}%")
                        ->orWhere('cnic_no', 'like', "%{$query}%")
                        ->orWhere('mobile_number_a', 'like', "%{$query}%")
                        ->orWhere('mobile_number_b', 'like', "%{$query}%")
                        ->orWhere('telephone_number', 'like', "%{$query}%")
                        ->orWhere('personal_email', 'like', "%{$query}%");
                })
                ->when($normalizedQuery, function ($q) use ($normalizedQuery) {
                    $q->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(membership_no, '-', ''), ' ', ''), '/', '') like ?",
                        ["%{$normalizedQuery}%"]
                    );
                })
                ->limit(40)
                ->get()
                ->map(function ($m) {
                    return [
                        'label' => "{$m->full_name} (Member - {$m->membership_no})",
                        'value' => $m->full_name,
                        'type' => 'Member',
                        'name' => $m->full_name,
                        'membership_no' => $m->membership_no,
                        'status' => $m->status,
                        'cnic' => $m->cnic_no,
                        'contact' => $m->mobile_number_a,
                    ];
                });
            $results = $results->merge($members);
        }

        if ($type === 'all' || $type === 'corporate') {
            $corporate = \App\Models\CorporateMember::query()
                ->when(!$includeInactive, function ($q) {
                    $q->where('status', 'active');
                })
                ->where(function ($q) use ($query) {
                    $q
                        ->where('full_name', 'like', "%{$query}%")
                        ->orWhere('membership_no', 'like', "%{$query}%");
                })
                ->when($normalizedQuery, function ($q) use ($normalizedQuery) {
                    $q->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(membership_no, '-', ''), ' ', ''), '/', '') like ?",
                        ["%{$normalizedQuery}%"]
                    );
                })
                ->limit(40)
                ->get()
                ->map(function ($m) {
                    return [
                        'label' => "{$m->full_name} (Corporate - {$m->membership_no})",
                        'value' => $m->full_name,
                        'type' => 'Corporate',
                        'name' => $m->full_name,
                        'membership_no' => $m->membership_no,
                        'status' => $m->status,
                    ];
                });
            $results = $results->merge($corporate);
        }

        if ($type === 'all' || $type === 'guest') {
            $guests = \App\Models\Customer::query()
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('customer_no', 'like', "%{$query}%");
                })
                ->when($normalizedQuery, function ($q) use ($normalizedQuery) {
                    $q->orWhereRaw(
                        "REPLACE(REPLACE(REPLACE(customer_no, '-', ''), ' ', ''), '/', '') like ?",
                        ["%{$normalizedQuery}%"]
                    );
                })
                ->limit(40)
                ->get()
                ->map(function ($c) {
                    return [
                        'label' => "{$c->name} (Guest - {$c->customer_no})",
                        'value' => $c->name,
                        'type' => 'Guest',
                        'name' => $c->name,
                        'customer_no' => $c->customer_no,
                        'id' => $c->id,
                        'status' => null,
                        'guest_type_id' => $c->guest_type_id,
                        'booking_type' => 'guest',
                    ];
                });
            $results = $results->merge($guests);

            $eventGuests = \App\Models\EventBooking::where('name', 'like', "%{$query}%")
                ->select('name')
                ->distinct()
                ->limit(5)
                ->get()
                ->map(function ($eb) {
                    return [
                        'label' => "{$eb->name} (Event Guest)",
                        'value' => $eb->name,
                        'type' => 'Guest',
                        'name' => $eb->name,
                        'membership_no' => 'N/A',
                        'status' => 'active',
                    ];
                });

            $results = $results->merge($eventGuests);
        }

        if (is_string($type) && str_starts_with($type, 'guest-')) {
            $guestTypeId = str_replace('guest-', '', $type);
            $guests = \App\Models\Customer::query()
                ->where('guest_type_id', $guestTypeId)
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('customer_no', 'like', "%{$query}%");
                })
                ->limit(30)
                ->get()
                ->map(function ($c) {
                    return [
                        'label' => "{$c->name} (Guest - {$c->customer_no})",
                        'value' => $c->name,
                        'type' => 'Guest',
                        'name' => $c->name,
                        'customer_no' => $c->customer_no,
                        'id' => $c->id,
                        'status' => null,
                        'booking_type' => 'guest',
                    ];
                });
            $results = $results->merge($guests);
        }

        return response()->json($results);
    }

    /**
     * Calculate original amount before discount
     */
    private function calculateOriginalAmount($request)
    {
        // Calculate total other charges (excluding complementary items)
        $totalOtherCharges = 0;
        if (!empty($request->other_charges)) {
            foreach ($request->other_charges as $charge) {
                if (!filter_var($charge['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $totalOtherCharges += floatval($charge['amount'] ?? 0);
                }
            }
        }

        // Calculate total menu add-ons (excluding complementary items)
        $totalMenuAddOns = 0;
        if (!empty($request->menu_addons)) {
            foreach ($request->menu_addons as $addon) {
                if (!filter_var($addon['is_complementary'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
                    $totalMenuAddOns += floatval($addon['amount'] ?? 0);
                }
            }
        }

        // Calculate menu charges
        $menuAmount = floatval($request->menuAmount ?? 0);
        $numberOfGuests = intval($request->numberOfGuests ?? 1);
        $perPersonMenuCharges = $menuAmount + $totalMenuAddOns;
        $totalMenuCharges = $perPersonMenuCharges * $numberOfGuests;

        // Base total (before discount)
        $baseTotal = $totalOtherCharges + $totalMenuCharges;

        return $baseTotal;
    }

    public function cancelBooking(Request $request, $id)
    {
        $request->validate([
            'cancellation_reason' => 'nullable|string|max:500',
            'refund_amount' => 'nullable|numeric|min:0',
            'refund_mode' => 'nullable|string|required_with:refund_amount',
            'refund_account' => 'nullable|string',
        ]);

        $booking = EventBooking::with('invoice')->findOrFail($id);
        $booking->status = 'cancelled';

        $notes = "\n[Cancelled: " . now()->toDateTimeString() . ']';
        if ($request->filled('cancellation_reason')) {
            $notes .= ' Reason: ' . $request->cancellation_reason;
        }

        $bookingDate = $booking->booking_date ? \Carbon\Carbon::parse($booking->booking_date)->startOfDay() : $booking->created_at?->copy()->startOfDay();

        // Handle Advance Return (optional at time of cancellation)
        if ($request->filled('refund_amount') && $request->refund_amount > 0) {
            if ($bookingDate && $bookingDate->diffInDays(now()->startOfDay()) > 2) {
                return redirect()->back()->withErrors(['refund_amount' => 'Advance return is allowed within 2 days of booking only.']);
            }

            $invoice = $booking->invoice;
            if ($invoice) {
                $maxRefundable = min((float) ($invoice->paid_amount ?? 0), (float) ($booking->advance_amount ?? 0));
                if ($maxRefundable <= 0) {
                    return redirect()->back()->withErrors(['refund_amount' => 'No refundable advance found for this booking.']);
                }

                if ($request->refund_amount > $maxRefundable) {
                    return redirect()->back()->withErrors(['refund_amount' => 'Refund amount cannot be greater than refundable amount (' . $maxRefundable . ').']);
                }

                // Update Invoice Paid Amount
                $invoice->paid_amount = max(0, (float) $invoice->paid_amount - (float) $request->refund_amount);
                $invoice->save();

                $booking->advance_amount = max(0, (float) ($booking->advance_amount ?? 0) - (float) $request->refund_amount);
                $booking->paid_amount = max(0, (float) ($booking->paid_amount ?? 0) - (float) $request->refund_amount);

                // Determine Payer Details for Ledger
                $payerDetails = $this->getPayerDetails($invoice);

                // Find main invoice item to attach refund to (or generic)
                $invoiceItem = $invoice->items()->where('fee_type', '1')->first() ?? $invoice->items()->first();

                // Create Refund Ledger Entry (Debit)
                Transaction::create([
                    'type' => 'debit',
                    'amount' => $request->refund_amount,
                    'date' => now(),
                    'description' => 'Refund processed for Event Booking Cancellation #' . $booking->booking_no,
                    'payable_type' => $payerDetails['type'],
                    'payable_id' => $payerDetails['id'],
                    'reference_type' => $invoiceItem ? FinancialInvoiceItem::class : FinancialInvoice::class,
                    'reference_id' => $invoiceItem ? $invoiceItem->id : $invoice->id,
                    'invoice_id' => $invoice->id,
                    'created_by' => Auth::id(),
                ]);

                $notes .= "\n[Advance Returned (Cancelled Booking): " . now()->toDateTimeString() . ']';
                $notes .= ' Amount: ' . $request->refund_amount . ' via ' . $request->refund_mode;
                if ($request->filled('refund_account')) {
                    $notes .= ' Account: ' . $request->refund_account;
                }
            }
        }

        $booking->additional_notes .= $notes;
        $booking->save();

        return redirect()->back()->with('success', 'Event Booking cancelled successfully');
    }

    public function processRefund(Request $request, $id)
    {
        $request->validate([
            'refund_amount' => 'required|numeric|min:1',
            'refund_mode' => 'required|string',
            'refund_account' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $booking = EventBooking::with('invoice')->findOrFail($id);
        $invoice = $booking->invoice;

        if ($booking->status !== 'cancelled') {
            return redirect()->back()->withErrors(['refund_amount' => 'Advance return is only allowed for cancelled bookings.']);
        }

        $bookingDate = $booking->booking_date ? \Carbon\Carbon::parse($booking->booking_date)->startOfDay() : $booking->created_at?->copy()->startOfDay();
        if ($bookingDate && $bookingDate->diffInDays(now()->startOfDay()) > 2) {
            return redirect()->back()->withErrors(['refund_amount' => 'Advance return is allowed within 2 days of booking only.']);
        }

        if (!$invoice) {
            return redirect()->back()->withErrors(['refund_amount' => 'No invoice found for this booking.']);
        }

        if (($invoice->paid_amount ?? 0) <= 0 || ($booking->advance_amount ?? 0) <= 0) {
            return redirect()->back()->withErrors(['refund_amount' => 'No refundable advance found for this booking.']);
        }

        $maxRefundable = min((float) $invoice->paid_amount, (float) ($booking->advance_amount ?? 0));

        if ($request->refund_amount > $maxRefundable) {
            return redirect()->back()->withErrors(['refund_amount' => 'Refund amount cannot be greater than remaining refundable amount (' . $maxRefundable . ').']);
        }

        // Deduct from paid_amount
        $invoice->paid_amount = max(0, $invoice->paid_amount - $request->refund_amount);
        $invoice->save();

        $booking->advance_amount = max(0, ($booking->advance_amount ?? 0) - $request->refund_amount);
        $booking->paid_amount = max(0, ($booking->paid_amount ?? 0) - $request->refund_amount);

        // Determine Payer Details for Ledger
        $payerDetails = $this->getPayerDetails($invoice);

        $invoiceItem = $invoice->items()->where('fee_type', '1')->first() ?? $invoice->items()->first();

        // Create Refund Ledger Entry (Debit)
        Transaction::create([
            'type' => 'debit',
            'amount' => $request->refund_amount,
            'date' => now(),
            'description' => 'Refund processed (Post-Cancel) for Event Booking #' . $booking->booking_no,
            'payable_type' => $payerDetails['type'],
            'payable_id' => $payerDetails['id'],
            'reference_type' => $invoiceItem ? FinancialInvoiceItem::class : FinancialInvoice::class,
            'reference_id' => $invoiceItem ? $invoiceItem->id : $invoice->id,
            'invoice_id' => $invoice->id,
            'created_by' => Auth::id(),
        ]);

        $notes = "\n[Advance Returned (Cancelled Booking): " . now()->toDateTimeString() . ']';
        $notes .= ' Amount: ' . $request->refund_amount . ' via ' . $request->refund_mode;
        if ($request->filled('refund_account')) {
            $notes .= ' Account: ' . $request->refund_account;
        }
        if ($request->filled('notes')) {
            $notes .= ' Note: ' . $request->notes;
        }

        $booking->additional_notes .= $notes;
        $booking->save();

        return redirect()->back()->with('success', 'Refund processed successfully');
    }

    public function undoBooking($id)
    {
        $booking = EventBooking::findOrFail($id);
        $previousStatus = $booking->status;

        $booking->status = 'confirmed';

        if ($previousStatus === 'refunded' || ($booking->invoice && $booking->invoice->status === 'refunded')) {
            if ($booking->invoice) {
                $booking->invoice->status = 'unpaid';
                $booking->invoice->paid_amount = 0;
                $booking->invoice->save();
                $booking->invoice->save();
            }
            $booking->security_deposit = 0;
            $booking->advance_amount = 0;
            $booking->paid_amount = 0;
        } elseif ($booking->invoice && $booking->invoice->status === 'cancelled') {
            // Revert logic
            $total = $booking->invoice->total_price;
            $paid = $booking->invoice->paid_amount;
            $booking->invoice->status = ($paid >= $total && $total > 0) ? 'paid' : 'unpaid';
            $booking->invoice->save();
        }

        $booking->additional_notes .= "\n[Undo Cancel: " . now()->toDateTimeString() . ']';
        $booking->save();

        return redirect()->back()->with('success', 'Booking cancellation undone successfully');
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
