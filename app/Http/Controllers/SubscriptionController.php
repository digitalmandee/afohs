<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Helpers\FileHelper;
use App\Models\Category;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\FinancialReceipt;
use App\Models\Member;
use App\Models\Subscription;
use App\Models\SubscriptionCategory;
use App\Models\SubscriptionType;
use App\Models\Transaction;
use App\Models\TransactionRelation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class SubscriptionController extends Controller
{
    public function index()
    {
        // 1. Total Active Subscriptions
        $totalActiveSubscriptions = Subscription::where(function ($query) {
            $query
                ->whereNull('valid_to')
                ->orWhere('valid_to', '>=', now());
        })
            ->count();

        // 2. New Subscriptions Today
        $newSubscriptionsToday = Subscription::whereDate('created_at', today())->count();

        // 3. Total Revenue (From Invoices)
        $totalRevenue = FinancialInvoice::where('fee_type', 'subscription_fee')
            ->where('status', 'paid')
            ->sum('total_price');

        // 4. Recent Subscriptions
        $recentSubscriptions = Subscription::with([
            'member:id,full_name,membership_no',
            'subscriptionType:id,name',
            'subscriptionCategory:id,name,fee',
            'financialInvoice',
            'legacyInvoice'
        ])
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($sub) {
                $invoice = $sub->invoice;  // Accessor

                $amount = 0;
                $invoiceNo = 'N/A';
                $status = 'pending';
                $paymentDate = null;
                $invoiceId = null;

                if ($invoice) {
                    $invoiceNo = $invoice->invoice_no;
                    $status = $invoice->status;
                    $paymentDate = $invoice->payment_date;
                    $invoiceId = $invoice->id;
                    $amount = $invoice->total_price;  // Default

                    if (!empty($invoice->data['items']) && is_array($invoice->data['items'])) {
                        foreach ($invoice->data['items'] as $item) {
                            if (
                                ($item['subscription_type_id'] ?? null) == $sub->subscription_type_id &&
                                ($item['subscription_category_id'] ?? null) == $sub->subscription_category_id
                            ) {
                                $amount = $item['amount'] ?? $amount;
                                break;
                            }
                        }
                    }
                }

                return [
                    'id' => $sub->id,
                    'invoice_id' => $invoiceId,
                    'invoice_no' => $invoiceNo,
                    'member' => $sub->member,
                    'subscription_type' => $sub->subscriptionType,
                    'subscription_category' => $sub->subscriptionCategory,
                    'total_price' => $amount,
                    'valid_from' => $sub->valid_from,
                    'valid_to' => $sub->valid_to,
                    'status' => $status,
                    'payment_date' => $paymentDate,
                ];
            });

        return Inertia::render('App/Admin/Subscription/Dashboard', [
            'statistics' => [
                'total_active_subscriptions' => $totalActiveSubscriptions,
                'new_subscriptions_today' => $newSubscriptionsToday,
                'total_revenue' => $totalRevenue,
            ],
            'recent_subscriptions' => $recentSubscriptions
        ]);
    }

    public function management(Request $request)
    {
        // Get subscription fee statistics for management page
        $totalSubscriptions = Subscription::count();

        $activeSubscriptions = Subscription::where(function ($query) {
            $query
                ->whereNull('valid_to')
                ->orWhere('valid_to', '>=', now());
        })
            ->count();

        $expiredSubscriptions = Subscription::where('valid_to', '<', now())
            ->whereNotNull('valid_to')
            ->count();

        $totalRevenue = FinancialInvoice::where('fee_type', 'subscription_fee')
            ->where('status', 'paid')
            ->sum('total_price');

        // Get paginated subscription transactions with search
        $query = Subscription::with([
            'member:id,full_name,membership_no',
            'subscriptionType:id,name',
            'subscriptionCategory:id,name,fee',
            'financialInvoice',
            'legacyInvoice'
        ]);

        // Add search functionality
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $query->whereHas('member', function ($q) use ($searchTerm) {
                $q
                    ->where('full_name', 'like', "%{$searchTerm}%")
                    ->orWhere('membership_no', 'like', "%{$searchTerm}%");
            });
        }

        $subscriptions = $query
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(15)
            ->withQueryString()
            ->through(function ($sub) {
                $invoice = $sub->invoice;  // Accessor

                $amount = 0;
                $invoiceNo = 'N/A';
                $status = 'pending';
                $paymentDate = null;
                $invoiceId = null;

                if ($invoice) {
                    $invoiceNo = $invoice->invoice_no;
                    $status = $invoice->status;
                    $paymentDate = $invoice->payment_date;
                    $invoiceId = $invoice->id;
                    $amount = $invoice->total_price;  // Default

                    if (!empty($invoice->data['items']) && is_array($invoice->data['items'])) {
                        foreach ($invoice->data['items'] as $item) {
                            if (
                                ($item['subscription_type_id'] ?? null) == $sub->subscription_type_id &&
                                ($item['subscription_category_id'] ?? null) == $sub->subscription_category_id
                            ) {
                                $amount = $item['amount'] ?? $amount;
                                break;
                            }
                        }
                    }
                }

                return [
                    'id' => $sub->id,
                    'invoice_id' => $invoiceId,
                    'invoice_no' => $invoiceNo,
                    'member' => $sub->member,
                    'subscription_type' => $sub->subscriptionType,
                    'subscription_category' => $sub->subscriptionCategory,
                    'total_price' => $amount,
                    'valid_from' => $sub->valid_from,
                    'valid_to' => $sub->valid_to,
                    'status' => $status,
                    'payment_date' => $paymentDate,
                ];
            });

        return Inertia::render('App/Admin/Subscription/Management', [
            'statistics' => [
                'total_subscriptions' => $totalSubscriptions,
                'active_subscriptions' => $activeSubscriptions,
                'expired_subscriptions' => $expiredSubscriptions,
                'total_revenue' => $totalRevenue,
            ],
            'subscriptions' => $subscriptions,
            'filters' => $request->only(['search'])
        ]);
    }
}
