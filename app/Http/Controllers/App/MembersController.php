<?php

namespace App\Http\Controllers\App;

use App\Helpers\FileHelper;
use App\Http\Controllers\Controller;
use App\Models\AddressType;
use App\Models\CorporateMember;
use App\Models\Member;
use App\Models\MemberType;
use App\Models\User;
use App\Models\UserDetail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class MembersController extends Controller
{
    private function extractMembershipBaseNumber(?string $membershipNo): int
    {
        $membershipNo = trim((string) $membershipNo);
        if ($membershipNo === '') {
            return 0;
        }

        if (!preg_match('/(\d+)(?:-\d+)?\s*$/', $membershipNo, $matches)) {
            return 0;
        }

        $digits = $matches[1] ?? '';
        if ($digits === '' || strlen($digits) > 6) {
            return 0;
        }

        return (int) $digits;
    }

    private function formatMembershipBaseNumber(int $number): string
    {
        return str_pad((string) $number, 3, '0', STR_PAD_LEFT);
    }

    public function index(Request $request)
    {
        $limit = $request->query('limit') ?? 10;

        $users = User::with(['memberType', 'userDetail'])->role('user', 'web')->latest()->paginate($limit);

        return Inertia::render('App/Member/Dashboard', compact('users'));
    }

    public function byUser($userId)
    {
        $member = Member::with([
            'memberCategory',
            'pausedHistories' => function ($q) {
                $q->orderBy('start_date');
            }
        ])->where('user_id', $userId)->firstOrFail();

        return response()->json($member);
    }

    public function checkDuplicateCnic(Request $request)
    {
        $request->validate([
            'cnic_no' => 'required|string',
            'member_id' => 'nullable|integer',
            'is_corporate' => 'nullable|boolean'
        ]);

        $isCorporate = $request->is_corporate ?? false;

        // Check in members table
        $memberQuery = Member::where('cnic_no', $request->cnic_no);
        if ($request->member_id && !$isCorporate) {
            $memberQuery->where('id', '!=', $request->member_id);
        }
        $existsInMembers = $memberQuery->exists();

        // Check in corporate_members table
        $corporateQuery = CorporateMember::where('cnic_no', $request->cnic_no);
        if ($request->member_id && $isCorporate) {
            $corporateQuery->where('id', '!=', $request->member_id);
        }
        $existsInCorporate = $corporateQuery->exists();

        $exists = $existsInMembers || $existsInCorporate;

        return response()->json([
            'exists' => $exists,
            'message' => $exists ? 'CNIC already exists in ' . ($existsInMembers ? 'Primary Members' : 'Corporate Members') : 'CNIC is available'
        ]);
    }

    public function checkDuplicateBarcode(Request $request)
    {
        $barcode = $request->barcode_no;
        $memberId = $request->member_id;

        if (!$barcode) {
            return response()->json(['exists' => false]);
        }

        $query = Member::where('barcode_no', $barcode);

        if ($memberId) {
            $query->where('id', '!=', $memberId);
        }

        $exists = $query->exists();

        return response()->json(['exists' => $exists]);
    }

    public function checkDuplicateMembershipNo(Request $request)
    {
        $request->validate([
            'membership_no' => 'required|string',
            'member_id' => 'nullable|integer',
            'is_corporate' => 'nullable|boolean'
        ]);

        $isCorporate = $request->is_corporate ?? false;

        // Extract the number part from membership number (e.g., "123" from "OP 123" or "123-1" from "AR/S 123-1")
        $membershipNo = $request->membership_no;
        $numberPart = '';

        // Split by space and get the last part (the number part)
        $parts = explode(' ', trim($membershipNo));
        if (count($parts) >= 2) {
            $numberPart = end($parts);  // Get the last part (e.g., "123" or "123-1")
        } else {
            $numberPart = $membershipNo;  // If no space, use the whole string
        }

        // Search in members table
        $memberQuery = Member::where(function ($q) use ($numberPart) {
            $q
                ->where('membership_no', 'LIKE', '% ' . $numberPart)
                ->orWhere('membership_no', $numberPart);
        });
        if (!empty($request->member_id) && !$isCorporate) {
            $memberQuery->where('id', '!=', $request->member_id);
        }
        $existsInMembers = $memberQuery->exists();

        // Search in corporate_members table
        $corporateQuery = CorporateMember::where(function ($q) use ($numberPart) {
            $q
                ->where('membership_no', 'LIKE', '% ' . $numberPart)
                ->orWhere('membership_no', $numberPart);
        });
        if (!empty($request->member_id) && $isCorporate) {
            $corporateQuery->where('id', '!=', $request->member_id);
        }
        $existsInCorporate = $corporateQuery->exists();

        $exists = $existsInMembers || $existsInCorporate;

        // Generate next available number suggestion
        $suggestion = null;
        if ($exists) {
            // Find the highest number in use from both tables
            $allMemberNumbers = Member::select('membership_no')->get()->pluck('membership_no');
            $allCorporateNumbers = CorporateMember::select('membership_no')->get()->pluck('membership_no');
            $allNumbers = $allMemberNumbers->merge($allCorporateNumbers);
            $maxNumber = 0;

            foreach ($allNumbers as $membershipNumber) {
                $maxNumber = max($maxNumber, $this->extractMembershipBaseNumber($membershipNumber));
            }

            $suggestion = $this->formatMembershipBaseNumber($maxNumber + 1);
        }

        return response()->json([
            'exists' => $exists,
            'number_part' => $numberPart,
            'exists_in_members' => $existsInMembers,
            'exists_in_corporate' => $existsInCorporate,
            'suggestion' => $suggestion,
            'message' => $exists ? 'Membership number already exists in ' . ($existsInMembers ? 'Primary Members' : 'Corporate Members') : 'Membership number is available'
        ]);
    }

    public function getNextMembershipNumber()
    {
        // Find the highest number in use from both tables
        $allMemberNumbers = Member::select('membership_no')->get()->pluck('membership_no');
        $allCorporateNumbers = CorporateMember::select('membership_no')->get()->pluck('membership_no');
        $allNumbers = $allMemberNumbers->merge($allCorporateNumbers);
        $maxNumber = 0;

        foreach ($allNumbers as $membershipNumber) {
            $maxNumber = max($maxNumber, $this->extractMembershipBaseNumber($membershipNumber));
        }

        $nextNumber = $maxNumber + 1;

        return response()->json([
            'next_number' => $this->formatMembershipBaseNumber($nextNumber),
            'message' => 'Next available membership number generated'
        ]);
    }

    public function search(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json(['members' => []]);
        }

        $members = Member::whereNull('parent_id')
            ->where(function ($q) use ($query) {
                $q
                    ->where('full_name', 'like', "%{$query}%")
                    ->orWhere('membership_no', 'like', "%{$query}%")
                    ->orWhere('cnic_no', 'like', "%{$query}%");
            })
            ->select('id', 'full_name', 'membership_no', 'cnic_no', 'status', 'mobile_number_a')
            ->limit(10)
            ->get();

        return response()->json(['members' => $members]);
    }
}
