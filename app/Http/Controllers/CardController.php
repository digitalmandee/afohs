<?php

namespace App\Http\Controllers;

use App\Models\FinancialInvoice;
use App\Models\Member;
use App\Models\MemberCategory;
use App\Models\SubscriptionCategory;
use App\Models\SubscriptionType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CardController extends Controller
{
    public function index(Request $request)
    {
        $cardType = $request->input('card_type', 'members');  // members, family, subscriptions

        if ($cardType === 'subscriptions') {
            // Fetch subscription cards from FinancialInvoice where fee_type is subscription_fee
            $query = FinancialInvoice::where('fee_type', 'subscription_fee')
                ->with([
                    'member:id,full_name,membership_no,mobile_number_a,status',
                    'member.memberCategory:id,name,description',
                    'member.profilePhoto:id,mediable_id,mediable_type,file_path',
                    'subscriptionCategory:id,name,fee',
                    'subscriptionType:id,name'
                ]);

            // Filter: Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->whereHas('member', function ($q) use ($search) {
                    $q
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('membership_no', 'like', "%{$search}%")
                        ->orWhere('mobile_number_a', 'like', "%{$search}%");
                });
            }

            // Filter: Payment Status
            if ($request->filled('payment_status') && $request->payment_status !== 'all') {
                $query->where('status', $request->payment_status);
            }

            // Filter: Subscription Category
            if ($request->filled('subscription_category') && $request->subscription_category !== 'all') {
                $query->where('subscription_category_id', $request->subscription_category);
            }

            // Filter: Subscription Type
            if ($request->filled('subscription_type') && $request->subscription_type !== 'all') {
                $query->where('subscription_type_id', $request->subscription_type);
            }

            // Filter: Card Status (for subscriptions)
            if ($request->filled('card_status') && $request->card_status !== 'all') {
                if ($request->card_status === 'active') {
                    $query
                        ->where('status', 'paid')
                        ->where(function ($q) {
                            $q
                                ->whereNull('valid_to')
                                ->orWhere('valid_to', '>=', now());
                        });
                } elseif ($request->card_status === 'expired') {
                    $query
                        ->where('status', 'paid')
                        ->where('valid_to', '<', now());
                } elseif ($request->card_status === 'suspended') {
                    $query->where('status', 'unpaid');
                } elseif ($request->card_status === 'cancelled') {
                    $query->where('status', 'unpaid');
                }
            }

            // Filter: Valid From Date
            if ($request->filled('valid_from_start')) {
                $query->where('valid_from', '>=', $request->valid_from_start);
            }
            if ($request->filled('valid_from_end')) {
                $query->where('valid_from', '<=', $request->valid_from_end);
            }

            // Filter: Valid To Date
            if ($request->filled('valid_to_start')) {
                $query->where('valid_to', '>=', $request->valid_to_start);
            }
            if ($request->filled('valid_to_end')) {
                $query->where('valid_to', '<=', $request->valid_to_end);
            }

            // Sorting
            $sortBy = $request->input('sortBy', 'id');
            $sortDirection = $request->input('sort', 'desc');

            if ($sortBy === 'member_name') {
                $query
                    ->join('members', 'financial_invoices.member_id', '=', 'members.id')
                    ->orderBy('members.full_name', $sortDirection)
                    ->select('financial_invoices.*');
            } elseif ($sortBy === 'created_at') {
                $query->orderBy('created_at', $sortDirection);
            } else {
                $query->orderBy('id', $sortDirection);
            }

            $subscriptions = $query->paginate(10)->withQueryString();

            // Statistics for subscriptions
            $total_active_subscriptions = FinancialInvoice::where('fee_type', 'subscription_fee')
                ->where('status', 'paid')
                ->where(function ($query) {
                    $query
                        ->whereNull('valid_to')
                        ->orWhere('valid_to', '>=', now());
                })
                ->count();

            $total_expired_subscriptions = FinancialInvoice::where('fee_type', 'subscription_fee')
                ->where('status', 'paid')
                ->where('valid_to', '<', now())
                ->count();

            $total_pending_subscriptions = FinancialInvoice::where('fee_type', 'subscription_fee')
                ->where('status', 'unpaid')
                ->count();

            return Inertia::render('App/Admin/Card/Dashboard', [
                'subscriptions' => $subscriptions,
                'total_active_subscriptions' => $total_active_subscriptions,
                'total_expired_subscriptions' => $total_expired_subscriptions,
                'total_pending_subscriptions' => $total_pending_subscriptions,
                'subscriptionCategories' => SubscriptionCategory::select('id', 'name', 'fee')->get(),
                'subscriptionTypes' => SubscriptionType::select('id', 'name')->get(),
                'cardType' => $cardType,
                'filters' => $request->only(['search', 'payment_status', 'subscription_category', 'subscription_type', 'card_status', 'valid_from_start', 'valid_from_end', 'valid_to_start', 'valid_to_end', 'sort', 'sortBy', 'card_type'])
            ]);
        } elseif ($cardType === 'corporate' || $cardType === 'corporate_family') {
            // Corporate Member Logic
            $query = \App\Models\CorporateMember::with([
                'memberCategory:id,name,description',
                'membershipInvoice:id,member_id,invoice_no,status,total_price',
                'profilePhoto:id,mediable_id,mediable_type,file_path',
                'parent:id,full_name,membership_no'  // For family members
            ])
                ->withCount('familyMembers');

            // Filter: Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('membership_no', 'like', "%{$search}%")
                        ->orWhere('mobile_number_a', 'like', "%{$search}%");
                });
            }

            // Filter: Card Status
            if ($request->filled('card_status') && $request->card_status !== 'all') {
                $query->where('card_status', $request->card_status);
            }

            // Filter: Status
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter: Member Category
            if ($request->filled('member_category') && $request->member_category !== 'all') {
                $query->where('member_category_id', $request->member_category);
            }

            // Type Filter
            if ($cardType === 'corporate') {
                $query->whereNull('parent_id');
            } else {
                // corporate_family
                $query->whereNotNull('parent_id');
            }

            // Sorting
            $sortBy = $request->input('sortBy', 'id');
            $sortDirection = $request->input('sort', 'desc');

            if ($sortBy === 'name') {
                $query->orderBy('full_name', $sortDirection);
            } elseif ($sortBy === 'membership_no') {
                $query->orderBy('membership_no', $sortDirection);
            } else {
                $query->orderBy('id', $sortDirection);
            }

            $members = $query->paginate(10)->withQueryString();

            // Transform members to include is_corporate flag for frontend consistency
            $members->getCollection()->transform(function ($member) {
                $member->is_corporate = true;
                $member->member_type = (object) ['name' => 'Corporate'];
                return $member;
            });

            // Statistics (Corporate)
            $total_active_members = \App\Models\CorporateMember::whereNull('parent_id')
                ->where('status', 'active')
                ->count();

            $total_active_family_members = \App\Models\CorporateMember::whereNotNull('parent_id')
                ->where('status', 'active')
                ->count();

            return Inertia::render('App/Admin/Card/Dashboard', [
                'members' => $members,
                'total_active_members' => $total_active_members,
                'total_active_family_members' => $total_active_family_members,
                'memberCategories' => \App\Models\MemberCategory::select('id', 'name', 'description')->where('status', 'active')->whereJsonContains('category_types', 'corporate')->get(),
                'cardType' => $cardType,
                'filters' => $request->only(['search', 'card_status', 'status', 'member_category', 'sort', 'sortBy', 'card_type'])
            ]);
        } else {
            // Existing member/family logic
            $query = Member::with([
                'memberType:id,name',
                'memberCategory:id,name,description',
                'membershipInvoice:id,member_id,invoice_no,status,total_price',
                'profilePhoto:id,mediable_id,mediable_type,file_path',
                'parent:id,full_name,membership_no'  // For family members to show parent info
            ])
                ->withCount('familyMembers');

            // Filter: Search
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q
                        ->where('full_name', 'like', "%{$search}%")
                        ->orWhere('membership_no', 'like', "%{$search}%")
                        ->orWhere('mobile_number_a', 'like', "%{$search}%");
                });
            }

            // Filter: Card Status
            if ($request->filled('card_status') && $request->card_status !== 'all') {
                $query->where('card_status', $request->card_status);
            }

            // Filter: Member Status
            if ($request->filled('status') && $request->status !== 'all') {
                $query->where('status', $request->status);
            }

            // Filter: Member Category
            if ($request->filled('member_category') && $request->member_category !== 'all') {
                $query->where('member_category_id', $request->member_category);
            }

            // Filter: Member Type (Primary or Family)
            if ($request->filled('member_type_filter')) {
                if ($request->member_type_filter === 'primary') {
                    $query->whereNull('parent_id');
                } elseif ($request->member_type_filter === 'family') {
                    $query->whereNotNull('parent_id');
                }
                // 'all' shows both
            } else {
                if ($cardType === 'family') {
                    $query->whereNotNull('parent_id');
                } else {
                    $query->whereNull('parent_id');
                }
            }

            // Sorting
            $sortBy = $request->input('sortBy', 'id');
            $sortDirection = $request->input('sort', 'desc');

            if ($sortBy === 'name') {
                $query->orderBy('full_name', $sortDirection);
            } elseif ($sortBy === 'membership_no') {
                $query->orderBy('membership_no', $sortDirection);
            } else {
                $query->orderBy('id', $sortDirection);
            }

            $members = $query->paginate(10)->withQueryString();

            // Statistics
            $total_active_members = Member::whereNull('parent_id')
                ->where('status', 'active')
                ->count();

            $total_active_family_members = Member::whereNotNull('parent_id')
                ->where('status', 'active')
                ->count();

            return Inertia::render('App/Admin/Card/Dashboard', [
                'members' => $members,
                'total_active_members' => $total_active_members,
                'total_active_family_members' => $total_active_family_members,
                'memberCategories' => MemberCategory::select('id', 'name', 'description')->where('status', 'active')->get(),
                'cardType' => $cardType,
                'filters' => $request->only(['search', 'card_status', 'status', 'member_category', 'member_type_filter', 'sort', 'sortBy', 'card_type'])
            ]);
        }
    }
}
