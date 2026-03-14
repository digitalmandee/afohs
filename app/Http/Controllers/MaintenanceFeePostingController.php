<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Models\CorporateMember;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\Member;
use App\Models\Transaction;
use App\Models\TransactionType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MaintenanceFeePostingController extends Controller
{
    public function create()
    {
        // Fetch Maintenance Charge Type (ID 4) for default selection
        $maintenanceType = TransactionType::where('type', AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE)->first();

        return Inertia::render('App/Admin/Finance/MaintenancePosting/Create', [
            'maintenanceType' => $maintenanceType
        ]);
    }

    public function preview(Request $request)
    {
        $validated = $request->validate([
            'member_type' => 'required|in:member,corporate',
            'start_id' => 'required|integer|min:1',
            'end_id' => 'required|integer|gte:start_id',
            'statuses' => 'array',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'amount' => 'nullable|numeric|min:0',
            // Charges for preview calculation
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_is_percent' => 'boolean',
            'tax_amount' => 'nullable|numeric|min:0',
            'tax_is_percent' => 'boolean',
            'overdue_amount' => 'nullable|numeric|min:0',
            'overdue_is_percent' => 'boolean',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);

        // Ensure absolute difference
        $days = abs($endDate->diffInDays($startDate)) + 1;

        $model = $validated['member_type'] === 'corporate' ? CorporateMember::class : Member::class;
        $query = $model::whereBetween('id', [$validated['start_id'], $validated['end_id']]);

        if (!empty($validated['statuses'])) {
            $query->whereIn('status', $validated['statuses']);
        }

        $members = $query->select(
            'id',
            'membership_no',
            'full_name',
            'status',
            'maintenance_fee',
            'total_maintenance_fee'
        )->get();

        $previewData = $members->map(function ($member) use ($validated, $days, $startDate, $endDate, $model, $request) {
            $monthlyRate = $validated['amount'] !== null
                ? floatval($validated['amount'])
                : floatval($member->total_maintenance_fee ?? 0);

            $subTotal = ($monthlyRate / 30) * $days;

            // Apply Charges Calculation logic (replicated from store)
            $tax = 0;
            if ($request->tax_amount > 0) {
                $tax = $request->tax_is_percent
                    ? ($subTotal * $request->tax_amount / 100)
                    : $request->tax_amount;
            }

            $discount = 0;
            if ($request->discount_amount > 0) {
                $discount = $request->discount_is_percent
                    ? ($subTotal * $request->discount_amount / 100)
                    : $request->discount_amount;
            }

            $overdue = 0;
            if ($request->overdue_amount > 0) {
                $overdue = $request->overdue_is_percent
                    ? ($subTotal * $request->overdue_amount / 100)
                    : $request->overdue_amount;
            }

            $finalTotal = $subTotal + $tax + $overdue - $discount;

            $isOverlap = $this->hasOverlap($member->id, $model, $startDate, $endDate);

            return [
                'member_id' => $member->id,
                'membership_no' => $member->membership_no,
                'full_name' => $member->full_name,
                'status' => $member->status,
                'monthly_rate' => $monthlyRate,
                'days' => $days,
                'sub_total' => round($subTotal, 2),
                'total' => round($finalTotal, 2),  // Final with charges
                'charges_breakdown' => [
                    'tax' => round($tax, 2),
                    'discount' => round($discount, 2),
                    'overdue' => round($overdue, 2)
                ],
                'start_date' => $startDate->format('d/m/Y'),
                'end_date' => $endDate->format('d/m/Y'),
                'is_skipped' => $isOverlap,
                'skip_reason' => $isOverlap ? 'Already billed for this period' : null,
            ];
        });

        // Calculate Totals (only for valid ones)
        $validMembers = $previewData->where('is_skipped', false);
        $grandTotal = $validMembers->sum('total');
        $memberCount = $validMembers->count();

        return response()->json([
            'members' => $previewData,
            'grand_total' => $grandTotal,
            'member_count' => $memberCount,
            'skipped_count' => $previewData->where('is_skipped', true)->count()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_type' => 'required|in:member,corporate',
            'start_id' => 'required|integer|min:1',
            'end_id' => 'required|integer|gte:start_id',
            'statuses' => 'array',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'amount' => 'nullable|numeric|min:0',
            'invoice_date' => 'required|date',
            'comments' => 'nullable|string',
            'amount_in_words' => 'nullable|string',
            // Allow overrides like discount/tax? The UI Screenshot has them as global fields.
            'discount_amount' => 'nullable|numeric|min:0',
            'discount_is_percent' => 'boolean',
            'tax_amount' => 'nullable|numeric|min:0',
            'tax_is_percent' => 'boolean',
            'overdue_amount' => 'nullable|numeric|min:0',
            'overdue_is_percent' => 'boolean',
        ]);

        $startDate = Carbon::parse($validated['start_date']);
        $endDate = Carbon::parse($validated['end_date']);
        $invoiceDate = Carbon::parse($validated['invoice_date']);
        $days = abs($endDate->diffInDays($startDate)) + 1;

        $model = $validated['member_type'] === 'corporate' ? CorporateMember::class : Member::class;

        // Fetch matched members
        $query = $model::whereBetween('id', [$validated['start_id'], $validated['end_id']]);
        if (!empty($validated['statuses'])) {
            $query->whereIn('status', $validated['statuses']);
        }
        $members = $query->get();

        if ($members->isEmpty()) {
            return response()->json(['message' => 'No members found for the selected range.'], 422);
        }

        DB::beginTransaction();
        try {
            $createdCount = 0;
            $skippedMembers = [];

            foreach ($members as $member) {
                // Check Overlap
                if ($this->hasOverlap($member->id, $model, $startDate, $endDate)) {
                    $skippedMembers[] = [
                        'membership_no' => $member->membership_no,
                        'full_name' => $member->full_name,
                        'reason' => 'Already billed for this period'
                    ];
                    continue;
                }

                // Calculation Logic (Per Member)
                $monthlyRate = $validated['amount'] !== null
                    ? floatval($validated['amount'])
                    : floatval($member->total_maintenance_fee ?? 0);

                // Skip if rate is 0 (unless we want 0 value invoices?)
                if ($monthlyRate <= 0)
                    continue;

                $subTotal = round(($monthlyRate / 30) * $days, 2);

                // Additional Charges (Global applied to all?)
                // Screenshot shows "Discount Amount", "Tax Charges", "Overdue Charges" below the list.
                // Assuming these apply to the FINAL invoice for each member.

                // Calculate Tax
                $tax = 0;
                if ($request->tax_amount > 0) {
                    $tax = $request->tax_is_percent
                        ? ($subTotal * $request->tax_amount / 100)
                        : $request->tax_amount;
                }

                // Calculate Discount
                $discount = 0;
                if ($request->discount_amount > 0) {
                    $discount = $request->discount_is_percent
                        ? ($subTotal * $request->discount_amount / 100)
                        : $request->discount_amount;
                }

                // Calculate Overdue (Added to total usually)
                $overdue = 0;
                if ($request->overdue_amount > 0) {
                    $overdue = $request->overdue_is_percent
                        ? ($subTotal * $request->overdue_amount / 100)
                        : $request->overdue_amount;
                }

                $finalTotal = $subTotal + $tax + $overdue - $discount;

                // 1. Create Invoice Header
                $invoiceNo = $this->generateInvoiceNumber();

                $invoiceData = [
                    'invoice_no' => $invoiceNo,
                    'invoiceable_id' => $member->id,
                    'invoiceable_type' => $model,
                    'fee_type' => \App\Constants\AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE,
                    'invoice_type' => 'invoice',
                    'amount' => $finalTotal - $tax + $discount,  // Net total before charges/discounts usually, but here matches logic
                    'total_price' => $finalTotal,
                    'tax_amount' => $tax,
                    'discount_amount' => $discount,
                    'additional_charges' => $overdue,
                    'status' => 'unpaid',
                    'issue_date' => $invoiceDate,
                    'due_date' => $invoiceDate->copy()->addDays(10),
                    'remarks' => $request->comments . ($request->amount_in_words ? "\nAmount in Words: " . $request->amount_in_words : ''),
                    'created_by' => Auth::id(),
                    // Match MemberTransactionController data structure
                    'data' => [
                        'member_name' => $member->full_name,
                        'action' => 'maintenance_bulk_posting'
                    ]
                ];

                // Set explicit IDs
                if ($validated['member_type'] === 'corporate') {
                    $invoiceData['corporate_member_id'] = $member->id;
                } else {
                    $invoiceData['member_id'] = $member->id;
                }

                $invoice = FinancialInvoice::create($invoiceData);

                // 2. Create Invoice Item
                // Match MemberTransactionController fields
                $item = FinancialInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_type' => AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE,
                    'description' => "Monthly Maintenance Fee ({$startDate->format('M Y')} - {$endDate->format('M Y')})",
                    'qty' => 1,
                    'amount' => $subTotal,  // Using subtotal as the base rate for this calculated period
                    'sub_total' => $subTotal,
                    'tax_percentage' => $request->tax_is_percent ? ($request->tax_amount ?? 0) : 0,
                    'tax_amount' => $tax,
                    'overdue_percentage' => $request->overdue_is_percent ? ($request->overdue_amount ?? 0) : 0,
                    'additional_charges' => $overdue,  // Mapping overdue to additional_charges
                    'discount_type' => $request->discount_is_percent ? 'percentage' : 'fixed',
                    'discount_value' => $request->discount_amount ?? 0,
                    'discount_amount' => $discount,
                    'total' => $finalTotal,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ]);

                // 3. Create Ledger Entry (Debit)
                Transaction::create([
                    'payable_type' => $model,
                    'payable_id' => $member->id,
                    'type' => 'debit',
                    'amount' => $finalTotal,
                    'reference_type' => FinancialInvoiceItem::class,
                    'reference_id' => $item->id,
                    'invoice_id' => $invoice->id,
                    'description' => "Invoice #{$invoiceNo} - Maintenance Fee",
                    'date' => $invoiceDate,
                    'created_by' => Auth::id(),
                ]);

                $createdCount++;
            }

            DB::commit();

            return response()->json([
                'message' => "Successfully generated {$createdCount} invoices.",
                'skipped_members' => $skippedMembers,
                'created_count' => $createdCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error generating invoices: ' . $e->getMessage()], 500);
        }
    }

    private function hasOverlap($memberId, $modelClass, $startDate, $endDate)
    {
        return FinancialInvoiceItem::whereHas('invoice', function ($q) use ($memberId, $modelClass) {
            $q
                ->where('invoiceable_id', $memberId)
                ->where('invoiceable_type', $modelClass);
        })
            ->whereIn('fee_type', ['maintenance_fee', AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE])
            ->where(function ($q) use ($startDate, $endDate) {
                $q
                    ->where('start_date', '<=', $endDate)
                    ->where('end_date', '>=', $startDate);
            })
            ->exists();
    }

    private function generateInvoiceNumber()
    {
        // Get the highest invoice_no from all financial_invoices
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
}
