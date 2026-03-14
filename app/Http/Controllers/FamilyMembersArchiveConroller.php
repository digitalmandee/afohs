<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MemberType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class FamilyMembersArchiveConroller extends Controller
{
    public function index(Request $request)
    {
        $query = Member::whereNotNull('parent_id')->with(['parent:id,member_type_id,full_name,membership_no', 'profilePhoto:id,mediable_id,mediable_type,file_path']);

        // Membership No
        if ($request->filled('membership_no')) {
            $query->where('membership_no', 'like', '%' . $request->membership_no . '%');
        }

        // Name (own name)
        if ($request->filled('name')) {
            $query->where('full_name', 'like', '%' . $request->name . '%');
        }

        // CNIC
        if ($request->filled('cnic')) {
            $cnic = str_replace('-', '', $request->cnic);

            $query->whereRaw("REPLACE(cnic_no, '-', '') LIKE ?", ["%{$cnic}%"]);
        }

        // Contact
        if ($request->filled('contact')) {
            $query->where('mobile_number_a', 'like', '%' . $request->contact . '%');
        }

        // Parent Name (Member Name)
        if ($request->filled('parent_name')) {
            $query->whereHas('parent', function ($q) use ($request) {
                $q->where('full_name', 'like', '%' . $request->parent_name . '%');
            });
        }

        // Relation
        if ($request->filled('relation') && $request->relation !== 'all') {
            $query->where('relation', $request->relation);
        }

        // Card Status
        if ($request->filled('card_status') && $request->card_status !== 'all') {
            $query->where('card_status', $request->card_status);
        }

        // Status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Member Type
        if ($request->filled('member_type') && $request->member_type !== 'all') {
            $query->whereHas('parent', function ($q) use ($request) {
                $q->where('member_type_id', $request->member_type);
            });
        }

        // Over 25 Age Checkbox
        if ($request->boolean('age_over_25')) {
            $query
                ->whereIn('relation', ['Son', 'Daughter'])
                ->whereDate('date_of_birth', '<=', Carbon::now()->subYears(25)->toDateString());
        }

        // Min Age
        if ($request->filled('min_age')) {
            $query->whereDate('date_of_birth', '<=', Carbon::now()->subYears($request->min_age)->toDateString());
        }

        // Max Age
        if ($request->filled('max_age')) {
            $query->whereDate('date_of_birth', '>=', Carbon::now()->subYears($request->max_age + 1)->addDay()->toDateString());
        }

        $familyGroups = $query->latest()->paginate(7)->withQueryString();

        // Add calculated age and expiry info to each member
        $familyGroups->getCollection()->transform(function ($member) {
            $member->calculated_age = $member->age;
            $member->should_expire = $member->shouldExpireByAge();
            $member->has_extension = $member->hasValidExtension();
            return $member;
        });

        // Get statistics for the dashboard
        $stats = [
            'total_family_members' => Member::whereNotNull('parent_id')->count(),
            'total_over_25' => Member::whereNotNull('parent_id')
                ->whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) >= 25')
                ->whereIn('relation', ['Son', 'Daughter'])
                ->count(),
            'expired_by_age' => Member::whereNotNull('parent_id')
                ->where('status', 'expired')
                ->whereIn('relation', ['Son', 'Daughter'])
                ->count(),
            'with_extensions' => Member::whereNotNull('parent_id')
                ->whereNotNull('expiry_extension_date')
                ->where('expiry_extension_date', '>', now())
                ->whereIn('relation', ['Son', 'Daughter'])
                ->count(),
        ];

        return Inertia::render('App/Admin/Membership/FamilyMembersArchive', [
            'familyGroups' => $familyGroups,
            'memberTypes' => MemberType::all(['id', 'name']),
            'filters' => $request->all(),
            'stats' => $stats,
        ]);
    }

    /**
     * Show form to extend expiry for a family member
     */
    public function show(Member $member)
    {
        // Ensure this is a family member
        if (!$member->isFamilyMember()) {
            return redirect()->back()->with('error', 'This is not a family member.');
        }

        if (!in_array(strtolower((string) ($member->relation ?? '')), ['son', 'daughter'], true)) {
            return redirect()->back()->with('error', 'Expiry extension is only applicable to son and daughter.');
        }

        $member->load(['parent', 'memberCategory', 'expiryExtendedBy']);
        $member->calculated_age = $member->age;
        $member->should_expire = $member->shouldExpireByAge();
        $member->has_extension = $member->hasValidExtension();

        return Inertia::render('App/Admin/Membership/FamilyMemberExpiry/Show', [
            'member' => $member
        ]);
    }

    private function formatDateForDatabase($date)
    {
        if (!$date)
            return null;
        try {
            return Carbon::createFromFormat('d-m-Y', $date)->format('Y-m-d');
        } catch (\Exception $e) {
            return $date;
        }
    }

    /**
     * Extend expiry date for a family member (Super Admin only)
     */
    public function extendExpiry(Request $request, Member $member)
    {
        // Check if user has super admin role
        if (!Auth::user()->hasRole('super-admin')) {
            return response()->json([
                'error' => 'Only Super Admins can extend family member expiry dates.'
            ], 403);
        }

        // Ensure this is a family member
        if (!$member->isFamilyMember()) {
            return response()->json([
                'error' => 'This is not a family member.'
            ], 400);
        }

        if (!in_array(strtolower((string) ($member->relation ?? '')), ['son', 'daughter'], true)) {
            return response()->json([
                'error' => 'Expiry extension is only applicable to son and daughter.'
            ], 400);
        }

        $request->validate([
            'extension_date' => 'required|date_format:d-m-Y|after:today',
            'reason' => 'required|string|min:10|max:500',
        ]);

        try {
            $member->extendExpiry(
                $this->formatDateForDatabase($request->extension_date),
                $request->reason,
                Auth::id()
            );

            Log::info('Family member expiry extended by super admin', [
                'member_id' => $member->id,
                'member_name' => $member->full_name,
                'extended_by' => Auth::user()->name,
                'extension_date' => $request->extension_date,
                'reason' => $request->reason,
            ]);

            return response()->json([
                'message' => 'Expiry date extended successfully.',
                'member' => $member->fresh(['expiryExtendedBy'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to extend family member expiry', [
                'member_id' => $member->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to extend expiry date. Please try again.'
            ], 500);
        }
    }

    /**
     * Bulk expire family members over 25 (Super Admin only)
     */
    public function bulkExpire(Request $request)
    {
        // Check if user has super admin role
        if (!Auth::user()->hasRole('super-admin')) {
            return response()->json([
                'error' => 'Only Super Admins can perform bulk operations.'
            ], 403);
        }

        $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:members,id',
        ]);

        $expiredCount = 0;
        $errors = [];

        foreach ($request->member_ids as $memberId) {
            try {
                $member = Member::find($memberId);

                if ($member && $member->isFamilyMember() && $member->shouldExpireByAge()) {
                    $member->expireByAge('Manual expiry by Super Admin: ' . Auth::user()->name);
                    $expiredCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "Failed to expire member ID {$memberId}: " . $e->getMessage();
            }
        }

        Log::info('Bulk family member expiry by super admin', [
            'expired_count' => $expiredCount,
            'performed_by' => Auth::user()->name,
            'member_ids' => $request->member_ids,
        ]);

        return response()->json([
            'message' => "Successfully expired {$expiredCount} family member(s).",
            'expired_count' => $expiredCount,
            'errors' => $errors,
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json(['members' => []]);
        }

        $members = Member::whereNotNull('parent_id')
            ->where(function ($q) use ($query) {
                $q
                    ->where('full_name', 'like', "%{$query}%")
                    ->orWhere('membership_no', 'like', "%{$query}%")
                    ->orWhere('cnic_no', 'like', "%{$query}%");
            })
            ->select('id', 'full_name', 'membership_no', 'cnic_no', 'status', 'mobile_number_a')
            ->limit(50)
            ->get();

        return response()->json(['members' => $members]);
    }

    public function trashed(Request $request)
    {
        // Fetch trashed family members (where parent_id is not null)
        $query = Member::onlyTrashed()->whereNotNull('parent_id')->with(['parent:id,member_type_id,full_name,membership_no']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('membership_no', 'like', "%{$search}%")
                    ->orWhere('cnic_no', 'like', "%{$search}%");
            });
        }

        $familyMembers = $query->orderBy('deleted_at', 'desc')->paginate(10);

        return Inertia::render('App/Admin/Membership/TrashedFamilyMembers', [
            'familyMembers' => $familyMembers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function restore($id)
    {
        $member = Member::withTrashed()->whereNotNull('parent_id')->findOrFail($id);
        $member->restore();

        return redirect()->back()->with('success', 'Family member restored successfully.');
    }
}
