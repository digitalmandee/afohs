<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\CardPayment;
use App\Models\FinancialInvoice;
use App\Models\Member;
use App\Models\MemberType;
use App\Models\Subscription;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $invoiceId = $request->query('invoice_no');  // or $request->member_id

        $invoice = null;

        if ($invoiceId) {
            $invoice = FinancialInvoice::where('invoice_no', $invoiceId)->with('member:id,membership_no,first_name,last_name,personal_email,membership_date')->first();
        }

        return Inertia::render('App/Admin/Membership/Payment', compact('invoice'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'invoice_no' => 'required|exists:financial_invoices,invoice_no',
            'subscription_type' => 'required|in:one_time,monthly,quarter,annual',
            'amount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'customer_charges' => 'required|numeric|min:0',
            // 'duration' => 'required|integer|min:1',
            'payment_method' => 'required|string',
            'remarks' => Rule::requiredIf(fn() => floatval($request->total_amount) === 0),
            'receipt' => 'nullable|file',
            'paid_for_quarter' => 'nullable|array',
            'paid_for_quarter.*' => 'string',  // e.g. '2025-Q2'
        ]);

        try {
            DB::beginTransaction();

            $invoice = FinancialInvoice::where('invoice_no', $request->invoice_no)->firstOrFail();

            // $paidForMonth = Carbon::parse($request->input('paid_for_month', now()->format('Y-m-d')));
            // $expiryDate = $paidForMonth->copy()->addMonths((int) $request->duration)->subDay();

            $expiryDate = null;
            if (in_array($request->subscription_type, ['quarter', 'annual']) && $request->filled('paid_for_quarter')) {
                $lastQuarter = collect($request->paid_for_quarter)->sort()->last();  // e.g. "2025-Q4"
                if (preg_match('/(\d{4})-Q([1-4])/', $lastQuarter, $matches)) {
                    $year = $matches[1];
                    $quarter = (int) $matches[2];

                    // Calculate expiry as end of that quarter
                    $month = ($quarter * 3);  // Q1 = 3, Q2 = 6, Q3 = 9, Q4 = 12
                    $expiryDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();
                }
            }

            // Attach payment info to invoice
            $invoice->update([
                'subscription_type' => $request->subscription_type == 'annual' ? 'yearly' : $request->subscription_type,
                'amount' => $request->amount,
                'total_price' => $request->total_amount,
                'paid_amount' => $request->total_amount,
                'discount_type' => $request->discount_type,
                'discount_value' => $request->discount_type ? (float) $request->discount_value : 0,
                'customer_charges' => $request->customer_charges,
                'payment_method' => $request->payment_method,
                'payment_date' => now(),
                'reciept' => $request->file('receipt') ? $request->file('receipt')->store('receipts') : null,
                'remarks' => $request->remarks,
                'status' => 'paid',
                'paid_for_quarter' => $request->paid_for_quarter,  // if column exists in DB
                // 'paid_for_month' => $paidForMonth,
            ]);

            $data = $invoice->data ?? [];

            foreach ($data as &$item) {
                if ($item['invoice_type'] === 'membership') {
                    $item['amount'] = (float) $request->membership_amount;
                }
            }

            // Save updated data JSON back to invoice
            $invoice->data = $data;
            $invoice->save();

            DB::commit();

            return response()->json(['message' => 'Payment saved successfully'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Payment failed: ' . $e->getMessage()], 500);
        }
    }

    function generateInvoiceNumber()
    {
        $lastPayment = CardPayment::latest('id')->first();
        $nextId = $lastPayment ? $lastPayment->id + 1 : 1;
        $year = date('Y');
        return 'INV-' . $year . '-' . str_pad($nextId, 5, '0', STR_PAD_LEFT);
    }
}