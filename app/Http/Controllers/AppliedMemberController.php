<?php

namespace App\Http\Controllers;

use App\Models\AppliedMember;
use App\Models\FinancialInvoice;
use App\Models\FinancialReceipt;
use App\Models\Member;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Models\User;
use App\Models\UserDetail;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class AppliedMemberController extends Controller
{
    public function index(Request $request)
    {
        $query = AppliedMember::query()->with('financialInvoice.items')->orderBy('created_at', 'desc');

        // Apply Filters
        if ($request->has('name') && $request->name) {
            $query->where('name', 'like', '%' . $request->name . '%');
        }

        if ($request->has('email') && $request->email) {
            $query->where('email', 'like', '%' . $request->email . '%');
        }

        if ($request->has('phone_number') && $request->phone_number) {
            $query->where('phone_number', 'like', '%' . $request->phone_number . '%');
        }

        if ($request->has('cnic') && $request->cnic) {
            $query->where('cnic', 'like', '%' . $request->cnic . '%');
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'permanent') {
                $query->where('is_permanent_member', true);
            } elseif ($request->status === 'not_permanent') {
                $query->where('is_permanent_member', false);
            }
        }

        $members = $query->get()->map(function ($member) {
            return [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'phone_number' => $member->phone_number,
                'address' => $member->address,
                'cnic' => $member->cnic ?? 'N/A',
                'amount_paid' => $member->amount_paid,
                'start_date' => $member->start_date,
                'end_date' => $member->end_date,
                'is_permanent_member' => $member->is_permanent_member,
                'invoice' => $member->financialInvoice,
            ];
        });

        $memberData = null;
        if ($request->query('mode') === 'edit' && $request->query('id')) {
            $member = AppliedMember::findOrFail($request->query('id'));
            $memberData = [
                'id' => $member->id,
                'name' => $member->name,
                'email' => $member->email,
                'phone_number' => $member->phone_number,
                'address' => $member->address,
                'cnic' => $member->cnic,
                'amount_paid' => $member->amount_paid,
                'start_date' => $member->start_date,
                'end_date' => $member->end_date,
                'is_permanent_member' => $member->is_permanent_member,
            ];
        }

        $membershipNo = AppliedMember::generateMembershipNumber();

        return Inertia::render('App/Admin/Membership/AppliedMember', [
            'familyGroups' => $members,
            'memberData' => $memberData,
            'membershipNo' => $membershipNo,
            'mode' => $request->query('mode', 'list'),
            'filters' => $request->only(['name', 'email', 'phone_number', 'cnic', 'status']),
        ]);
    }

    private function formatDateForDatabase($date)
    {
        if (!$date)
            return null;
        try {
            return \Carbon\Carbon::createFromFormat('d-m-Y', $date)->format('Y-m-d');
        } catch (\Exception $e) {
            return $date;
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
                'email' => 'nullable|email|unique:applied_member,email|max:255',
                'address' => 'nullable|string|max:500',
                'cnic' => 'nullable|string|regex:/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/|unique:applied_member,cnic',
                'amount_paid' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date_format:d-m-Y',
                'end_date' => 'nullable|date_format:d-m-Y|after_or_equal:start_date',
                'is_permanent_member' => 'boolean',
            ], [
                'email.unique' => 'The email address is already in use.',
                'phone_number.regex' => 'The phone number must be exactly 11 digits.',
                'cnic.regex' => 'The CNIC must be in the format XXXXX-XXXXXXX-X.',
                'cnic.unique' => 'The CNIC is already in use.',
                'end_date.after_or_equal' => 'The end date must be on or after the start date.',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for applied member creation', ['errors' => $validator->errors(), 'request' => $request->all()]);
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $amountPaid = $request->input('amount_paid') !== null ? (float) $request->amount_paid : 0.0;
            $startDate = $request->start_date ? $this->formatDateForDatabase($request->start_date) : now()->format('Y-m-d');
            $endDate = $request->end_date ? $this->formatDateForDatabase($request->end_date) : null;

            $appliedMember = AppliedMember::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'address' => $request->address ?: null,
                'cnic' => $request->cnic,  // Use raw CNIC with hyphens
                'amount_paid' => $amountPaid,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_permanent_member' => $request->is_permanent_member ?? false,
            ]);

            // Generate Invoice
            $invoiceNo = FinancialInvoice::withTrashed()->max('invoice_no') + 1;

            $invoice = FinancialInvoice::create([
                'invoice_no' => $invoiceNo,
                'invoice_type' => 'applied_member',  // Custom type
                'invoiceable_id' => $appliedMember->id,
                'invoiceable_type' => AppliedMember::class,
                'amount' => $appliedMember->amount_paid,
                'total_price' => $appliedMember->amount_paid,
                'paid_amount' => $appliedMember->amount_paid,
                'status' => 'paid',
                'issue_date' => now(),
                'due_date' => now(),
                'payment_date' => now(),
                'remarks' => 'Applied Member Registration Fee',
                'data' => [
                    'member_name' => $appliedMember->name,
                ]
            ]);

            // ✅ Create Invoice Item
            \App\Models\FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => \App\Constants\AppConstants::TRANSACTION_TYPE_ID_APPLIED_MEMBER,
                'description' => 'Applied Member Registration Fee',
                'qty' => 1,
                'amount' => $appliedMember->amount_paid,
                'sub_total' => $appliedMember->amount_paid,
                'total' => $appliedMember->amount_paid,
            ]);

            // 1. Create Ledger Entry (Debit) - Invoice
            Transaction::create([
                'type' => 'debit',
                'amount' => $appliedMember->amount_paid,
                'date' => now(),
                'description' => 'Applied Member Registration Fee Invoice #' . $invoiceNo,
                'payable_type' => AppliedMember::class,
                'payable_id' => $appliedMember->id,
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
                'created_by' => auth()->id(),
            ]);

            if ($appliedMember->amount_paid > 0) {
                // 2. Create Receipt
                $receipt = FinancialReceipt::create([
                    'receipt_no' => time(),
                    'payer_type' => AppliedMember::class,
                    'payer_id' => $appliedMember->id,
                    'amount' => $appliedMember->amount_paid,
                    'payment_method' => 'cash',  // Defaulting to cash as per previous logic
                    'receipt_date' => now(),
                    'status' => 'active',
                    'created_by' => auth()->id(),
                ]);

                // 3. Create Ledger Entry (Credit) - Payment
                Transaction::create([
                    'type' => 'credit',
                    'amount' => $appliedMember->amount_paid,
                    'date' => now(),
                    'description' => 'Payment Received (Rec #' . $receipt->receipt_no . ')',
                    'payable_type' => AppliedMember::class,
                    'payable_id' => $appliedMember->id,
                    'reference_type' => FinancialReceipt::class,
                    'reference_id' => $receipt->id,
                    'created_by' => auth()->id(),
                ]);

                // 4. Link Invoice and Receipt
                TransactionRelation::create([
                    'invoice_id' => $invoice->id,
                    'receipt_id' => $receipt->id,
                    'amount' => $appliedMember->amount_paid,
                ]);
            }

            return response()->json(['message' => 'Applied member created successfully.'], 200);
        } catch (QueryException $e) {
            Log::error('Database error creating applied member: ' . $e->getMessage(), ['request' => $request->all()]);
            return response()->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        } catch (\Throwable $th) {
            Log::error('Unexpected error creating applied member: ' . $th->getMessage(), ['request' => $request->all()]);
            return response()->json(['error' => 'Failed to create applied member: ' . $th->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'phone_number' => 'required|string|regex:/^[0-9]{11}$/',
                'email' => 'nullable|email|unique:applied_member,email,' . $id . '|max:255',
                'address' => 'nullable|string|max:500',
                'cnic' => 'nullable|string|regex:/^[0-9]{5}-[0-9]{7}-[0-9]{1}$/|unique:applied_member,cnic,' . $id,
                'amount_paid' => 'nullable|numeric|min:0',
                'start_date' => 'nullable|date_format:d-m-Y',
                'end_date' => 'nullable|date_format:d-m-Y|after_or_equal:start_date',
                'is_permanent_member' => 'boolean',
            ], [
                'email.unique' => 'The email address is already in use.',
                'phone_number.regex' => 'The phone number must be exactly 11 digits.',
                'cnic.regex' => 'The CNIC must be in the format XXXXX-XXXXXXX-X.',
                'cnic.unique' => 'The CNIC is already in use.',
                'end_date.after_or_equal' => 'The end date must be on or after the start date.',
            ]);

            if ($validator->fails()) {
                Log::warning('Validation failed for applied member update', ['errors' => $validator->errors(), 'id' => $id, 'request' => $request->all()]);
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $member = AppliedMember::findOrFail($id);

            $amountPaid = $request->input('amount_paid') !== null ? (float) $request->amount_paid : 0.0;
            $startDate = $request->start_date ? $this->formatDateForDatabase($request->start_date) : now()->format('Y-m-d');
            $endDate = $request->end_date ? $this->formatDateForDatabase($request->end_date) : null;

            // Check if amount_paid changed from 0 to > 0
            $shouldGenerateInvoice = $member->amount_paid == 0 && $amountPaid > 0;

            // Update the applied_member table
            $member->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'address' => $request->address ?: null,
                'cnic' => $request->cnic,  // Use raw CNIC with hyphens
                'amount_paid' => $amountPaid,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'is_permanent_member' => $request->is_permanent_member ?? false,
            ]);

            if ($shouldGenerateInvoice || ($member->amount_paid > 0 && $amountPaid != $member->amount_paid)) {
                // Check if invoice exists
                $invoice = $member->financialInvoice;

                if ($invoice) {
                    // Update existing invoice
                    $invoice->update([
                        'amount' => $amountPaid,
                        'total_price' => $amountPaid,
                        'paid_amount' => $amountPaid,
                    ]);
                } else {
                    // Generate Invoice
                    $invoiceNo = $this->generateInvoiceNumber();

                    $invoice = FinancialInvoice::create([
                        'invoice_no' => $invoiceNo,
                        'invoice_type' => 'applied_member',  // Custom type
                        'invoiceable_id' => $member->id,
                        'invoiceable_type' => AppliedMember::class,
                        'amount' => $amountPaid,
                        'total_price' => $amountPaid,
                        'paid_amount' => $amountPaid,
                        'status' => 'paid',
                        'payment_method' => 'cash',
                        'issue_date' => now(),
                        'due_date' => now(),
                        'payment_date' => now(),
                        'remarks' => 'Applied Member Registration Fee',
                        'data' => [
                            'member_name' => $member->name,
                        ]
                    ]);

                    // ✅ Create Invoice Item
                    \App\Models\FinancialInvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'fee_type' => \App\Constants\AppConstants::TRANSACTION_TYPE_ID_APPLIED_MEMBER,
                        'description' => 'Applied Member Registration Fee',
                        'qty' => 1,
                        'amount' => $amountPaid,
                        'sub_total' => $amountPaid,
                        'total' => $amountPaid,
                    ]);

                    // 1. Create Ledger Entry (Debit) - Invoice
                    Transaction::create([
                        'type' => 'debit',
                        'amount' => $amountPaid,
                        'date' => now(),
                        'description' => 'Applied Member Registration Fee Invoice #' . $invoiceNo,
                        'payable_type' => AppliedMember::class,
                        'payable_id' => $member->id,
                        'reference_type' => FinancialInvoice::class,
                        'reference_id' => $invoice->id,
                        'created_by' => auth()->id(),
                    ]);

                    if ($amountPaid > 0) {
                        // 2. Create Receipt
                        $receipt = FinancialReceipt::create([
                            'receipt_no' => time(),
                            'payer_type' => AppliedMember::class,
                            'payer_id' => $member->id,
                            'amount' => $amountPaid,
                            'payment_method' => 'cash',
                            'receipt_date' => now(),
                            'status' => 'active',
                            'created_by' => auth()->id(),
                        ]);

                        // 3. Create Ledger Entry (Credit) - Payment
                        Transaction::create([
                            'type' => 'credit',
                            'amount' => $amountPaid,
                            'date' => now(),
                            'description' => 'Payment Received (Rec #' . $receipt->receipt_no . ')',
                            'payable_type' => AppliedMember::class,
                            'payable_id' => $member->id,
                            'reference_type' => FinancialReceipt::class,
                            'reference_id' => $receipt->id,
                            'created_by' => auth()->id(),
                        ]);

                        // 4. Link Invoice and Receipt
                        TransactionRelation::create([
                            'invoice_id' => $invoice->id,
                            'receipt_id' => $receipt->id,
                            'amount' => $amountPaid,
                        ]);
                    }
                }
            }

            $newMemberId = null;
            // If is_permanent_member is true, distribute data to other tables and assign role
            if ($request->is_permanent_member) {
                // Create or update member in member table
                $newMember = Member::create(
                    [
                        'application_no' => Member::generateNextApplicationNo(),
                        'membership_no' => Member::generateNextMembershipNumber(),
                        'full_name' => $request->name,
                        'first_name' => $request->name,
                        'personal_email' => $request->email,
                        'mobile_number_a' => $request->phone_number,
                        'current_address' => $request->address ?: null,
                        'cnic_no' => $request->cnic,
                        'start_date' => $this->formatDateForDatabase($request->start_date),
                        'end_date' => $this->formatDateForDatabase($request->end_date),
                    ]
                );

                $newMemberId = $newMember->id;

                // Update member_id in applied_member if not set
                if (!$member->member_id) {
                    $member->update(['member_id' => $newMember->id]);
                }
            }

            return response()->json(['message' => 'Applied member updated successfully.', 'is_permanent_member' => $request->is_permanent_member, 'member_id' => $newMemberId], 200);
        } catch (QueryException $e) {
            Log::error('Database error updating applied member: ' . $e->getMessage(), ['id' => $id, 'request' => $request->all()]);
            return response()->json(['error' => 'Database error: ' . $e->getMessage()], 500);
        } catch (\Throwable $th) {
            Log::error('Unexpected error updating applied member: ' . $th->getMessage(), ['id' => $id, 'request' => $request->all()]);
            return response()->json(['error' => 'Failed to update applied member: ' . $th->getMessage()], 500);
        }
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

    public function search(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json(['members' => []]);
        }

        $members = AppliedMember::where(function ($q) use ($query) {
            $q
                ->where('name', 'like', "%{$query}%")
                ->orWhere('email', 'like', "%{$query}%")
                ->orWhere('cnic', 'like', "%{$query}%");
        })
            ->select('id', 'name', 'email', 'cnic', 'phone_number', 'is_permanent_member')
            ->limit(10)
            ->get();

        return response()->json(['members' => $members]);
    }

    public function destroy($id)
    {
        try {
            $member = AppliedMember::findOrFail($id);
            $member->delete();
            return redirect()->back()->with('success', 'Applied member deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete applied member.');
        }
    }

    public function trashed(Request $request)
    {
        $query = AppliedMember::onlyTrashed();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('cnic', 'like', "%{$search}%");
            });
        }

        $members = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Membership/TrashedAppliedMembers', [
            'members' => $members,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $member = AppliedMember::withTrashed()->findOrFail($id);
        $member->restore();

        return redirect()->back()->with('success', 'Applied member restored successfully.');
    }
}
