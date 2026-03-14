<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Helpers\FileHelper;
use App\Models\CardPayment;
use App\Models\FinancialInvoice;
use App\Models\Media;
use App\Models\Member;
use App\Models\MemberCategory;
use App\Models\MemberStatusHistory;
use App\Models\MemberType;
use App\Models\SubscriptionCategory;
use App\Models\SubscriptionType;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class MembershipController extends Controller
{
    public function index()
    {
        $members = Member::whereNull('parent_id')
            ->with([
                'memberType:id,name',
                'memberCategory:id,name,description',
                'profilePhoto:id,mediable_id,mediable_type,file_path',
                'documents:id,mediable_id,mediable_type,file_path',
                'membershipInvoice:id,member_id,invoice_no,status,total_price'
            ])
            ->withCount('familyMembers')
            ->latest()
            ->limit(20)
            ->get();

        // Corporate Members for tab display
        $corporateMembers = \App\Models\CorporateMember::whereNull('parent_id')
            ->with([
                'memberCategory:id,name,description',
                'profilePhoto:id,mediable_id,mediable_type,file_path',
                'membershipInvoice:id,corporate_member_id,invoice_no,status,total_price',
            ])
            ->latest()
            ->limit(20)
            ->get();

        $total_members = Member::whereNull('parent_id')->count();

        // Legacy Payment Calculation (Old 'membership' invoice type)
        $legacy_payment = FinancialInvoice::where('invoice_type', 'membership')
            ->where('status', 'paid')
            ->sum('total_price');

        // New Payment Calculation (Items with 'membership_fee')
        $new_payment = \App\Models\FinancialInvoiceItem::where('fee_type', 'membership_fee')
            ->whereHas('invoice', function ($q) {
                $q->where('status', 'paid');
            })
            ->sum('total');

        $total_payment = $legacy_payment + $new_payment;

        $total_corporate_members = \App\Models\CorporateMember::whereNull('parent_id')->count();

        return Inertia::render('App/Admin/Membership/Dashboard', compact('members', 'corporateMembers', 'total_members', 'total_payment', 'total_corporate_members'));
    }

    public function getAllMemberTypes()
    {
        $memberTypes = MemberType::all(['name']);
        return Inertia::render('App/Admin/Membership/Profile', [
            'memberTypesData' => $memberTypes,
        ]);
    }

    public function create()
    {
        $membershipNo = Member::generateNextMembershipNumber();

        $memberTypesData = MemberType::select('id', 'name')->get();
        $membercategories = MemberCategory::select('id', 'name', 'description', 'fee', 'subscription_fee')->where('status', 'active')->get();

        return Inertia::render('App/Admin/Membership/MembershipForm', compact('membershipNo', 'memberTypesData', 'membercategories'));
    }

    public function edit(Request $request)
    {
        $user = Member::where('id', $request->id)
            ->with(['memberType', 'kinshipMember', 'documents', 'profilePhoto', 'memberCategory', 'businessDeveloper'])
            ->first();

        $user->profile_photo = $user->profilePhoto
            ? ['id' => $user->profilePhoto->id, 'file_path' => $user->profilePhoto->file_path]
            : null;

        unset($user->profilePhoto);

        // Load documents media
        $documentsMedia = $user->documents;
        $user->documents = $documentsMedia->map(function ($media) {
            return [
                'id' => $media->id,
                'file_name' => $media->file_name,
                'file_path' => $media->file_path,
                'mime_type' => $media->mime_type,
            ];
        });

        // Replace kinship with only selected fields
        if ($user->kinshipMember) {
            $user->kinship = [
                'id' => $user->kinshipMember['id'],
                'booking_type' => 'member',
                'name' => $user->kinshipMember['full_name'],
                'label' => "{$user->kinshipMember['full_name']} ({$user->kinshipMember['membership_no']})",
                'membership_no' => $user->kinshipMember['membership_no'],
                'email' => $user->kinshipMember['personal_email'],
                'cnic' => $user->kinshipMember['cnic_no'],
                'phone' => $user->kinshipMember['mobile_number_a'],
                'address' => $user->kinshipMember['current_address'],
            ];
        }

        // Convert to array to avoid Model casting reverting our format changes
        $userData = $user->toArray();

        // Format primary member dates
        if ($userData['membership_date']) {
            $userData['membership_date'] = \Carbon\Carbon::parse($userData['membership_date'])->format('d-m-Y');
        }
        if ($userData['card_issue_date']) {
            $userData['card_issue_date'] = \Carbon\Carbon::parse($userData['card_issue_date'])->format('d-m-Y');
        }
        // card_expiry_date is cast to date in Model - use getRawOriginal to avoid timezone issues
        $rawCardExpiry = $user->getRawOriginal('card_expiry_date');
        if ($rawCardExpiry) {
            $userData['card_expiry_date'] = \Carbon\Carbon::createFromFormat('Y-m-d', $rawCardExpiry)->format('d-m-Y');
        }
        // date_of_birth is cast to date in Model - use getRawOriginal to avoid timezone issues
        $rawDob = $user->getRawOriginal('date_of_birth');
        if ($rawDob) {
            $userData['date_of_birth'] = \Carbon\Carbon::createFromFormat('Y-m-d', $rawDob)->format('d-m-Y');
        }
        // Add business developer for form
        if ($user->businessDeveloper) {
            $userData['business_developer'] = [
                'id' => $user->businessDeveloper->id,
                'name' => $user->businessDeveloper->name,
                'label' => $user->businessDeveloper->name,
                'employee_id' => $user->businessDeveloper->employee_id,
            ];
        }

        $familyMembers = $user->familyMembers()->with('profilePhoto')->get()->map(function ($member) use ($user) {
            // Get profile photo media for family member
            $profilePhotoMedia = $member->profilePhoto;
            $pictureUrl = null;
            $pictureId = null;

            if ($profilePhotoMedia) {
                $pictureUrl = $profilePhotoMedia->file_path;
                $pictureId = $profilePhotoMedia->id;
            }

            return [
                'id' => $member->id,
                'membership_no' => $member->membership_no,
                'barcode_no' => $member->barcode_no,
                'family_suffix' => $member->family_suffix,
                'first_name' => $member->first_name,
                'middle_name' => $member->middle_name,
                'last_name' => $member->last_name,
                'full_name' => $member->full_name,
                'member_type_id' => $user->member_type_id,
                'membership_category' => $user->member_category_id,
                'relation' => $member->relation,
                'gender' => $member->gender,
                'nationality' => $member->nationality,
                'passport_no' => $member->passport_no,
                'martial_status' => $member->martial_status,
                'cnic' => $member->cnic_no,
                // Use getRawOriginal to avoid timezone issues for casted date fields
                'date_of_birth' => $member->getRawOriginal('date_of_birth')
                    ? \Carbon\Carbon::createFromFormat('Y-m-d', $member->getRawOriginal('date_of_birth'))->format('d-m-Y')
                    : null,
                'phone_number' => $member->mobile_number_a,
                'email' => $member->personal_email,
                'start_date' => $member->start_date ? \Carbon\Carbon::parse($member->start_date)->format('d-m-Y') : null,
                'end_date' => $member->end_date ? \Carbon\Carbon::parse($member->end_date)->format('d-m-Y') : null,
                'card_issue_date' => $member->card_issue_date ? \Carbon\Carbon::parse($member->card_issue_date)->format('d-m-Y') : null,
                // Use getRawOriginal to avoid timezone issues for casted date fields
                'card_expiry_date' => $member->getRawOriginal('card_expiry_date')
                    ? \Carbon\Carbon::createFromFormat('Y-m-d', $member->getRawOriginal('card_expiry_date'))->format('d-m-Y')
                    : null,
                'profile_photo' => $member->profilePhoto,
                'card_status' => $member->card_status,
                'status' => $member->status,
                'picture' => $pictureUrl,  // Full URL from file_path
                'picture_id' => $pictureId,  // Media ID for tracking
                'comments' => $member->comment_box,
            ];
        });

        $memberTypesData = MemberType::all();
        $membercategories = MemberCategory::select('id', 'name', 'description', 'fee', 'subscription_fee')->where('status', 'active')->get();

        $subscriptionTypes = SubscriptionType::all(['id', 'name']);
        $subscriptionCategories = SubscriptionCategory::where('status', 'active')
            ->with('subscriptionType:id,name')
            ->get(['id', 'name', 'subscription_type_id', 'fee', 'description']);

        return Inertia::render('App/Admin/Membership/MembershipForm', compact('familyMembers', 'memberTypesData', 'membercategories', 'subscriptionTypes', 'subscriptionCategories'))
            ->with([
                'user' => $userData,
            ]);
    }

    public function allMembers(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        Log::info('membership.members.filters.received', [
            'membership_no' => $request->input('membership_no'),
            'name' => $request->input('name'),
            'barcode' => $request->input('barcode'),
            'cnic' => $request->input('cnic'),
            'contact' => $request->input('contact'),
            'city' => $request->input('city'),
            'status' => $request->input('status'),
            'card_status' => $request->input('card_status'),
            'member_category' => $request->input('member_category'),
            'member_type' => $request->input('member_type'),
            'duration' => $request->input('duration'),
            'kinship_filter' => $request->input('kinship_filter'),
            'selected_member_id' => $request->input('selected_member_id'),
            'page' => $request->input('page'),
            'per_page' => $perPage,
        ]);

        $query = Member::whereNull('parent_id')
            ->with([
                'memberType:id,name',
                'profilePhoto:id,mediable_id,mediable_type,file_path',
                'documents:id,mediable_id,mediable_type,file_path',
                'memberCategory:id,name,description',
                'membershipInvoice:id,member_id,invoice_no,status,total_price'  // ✅ Include membership invoice
            ])
            ->withCount('familyMembers');

        if ($request->filled('selected_member_id')) {
            $query->where('id', $request->integer('selected_member_id'));
        }

        // Filter: Membership Number
        if ($request->filled('membership_no')) {
            $query->where('membership_no', 'like', '%' . $request->membership_no . '%');
        }

        // Filter: Barcode
        if ($request->filled('barcode')) {
            $query->where('barcode_no', 'like', '%' . $request->barcode . '%');
        }

        // Filter: Name
        if ($request->filled('name')) {
            $query->where('full_name', 'like', '%' . $request->name . '%');
        }

        // Filter: CNIC
        if ($request->filled('cnic')) {
            $cnic = str_replace('-', '', $request->cnic);

            $query->whereRaw("REPLACE(cnic_no, '-', '') LIKE ?", ["%{$cnic}%"]);
        }

        // Filter: Contact
        if ($request->filled('contact')) {
            $query->where('mobile_number_a', 'like', '%' . $request->contact . '%');
        }

        // Filter: City
        if ($request->filled('city')) {
            $city = trim((string) $request->city);
            $query->where(function ($q) use ($city) {
                $q
                    ->where('current_city', 'like', "%{$city}%")
                    ->orWhere('permanent_city', 'like', "%{$city}%");
            });
        }

        // Filter: Status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('card_status') && $request->card_status !== 'all') {
            $query->where('card_status', $request->card_status);
        }

        // Filter: Category
        if ($request->filled('member_category') && $request->member_category !== 'all') {
            $query->where('member_category_id', $request->member_category);
        }

        // Filter: Member Type
        if ($request->filled('member_type') && $request->member_type !== 'all') {
            $query->whereHas('memberType', function ($q) use ($request) {
                $q->where('name', $request->member_type);
            });
        }

        // Filter: Kinship
        if ($request->filled('kinship_filter') && $request->kinship_filter !== 'include') {
            if ($request->kinship_filter === 'exclude') {
                $query->whereNull('kinship');
            } elseif ($request->kinship_filter === 'only') {
                $query->whereNotNull('kinship');
            }
        }

        // Filter: Duration
        if ($request->filled('duration') && $request->duration !== 'all') {
            $monthsExpr = "TIMESTAMPDIFF(MONTH, COALESCE(membership_date, created_at), CURDATE())";
            if ($request->duration === 'lt1y') {
                $query->whereRaw("{$monthsExpr} < 12");
            } elseif ($request->duration === '1to3y') {
                $query->whereRaw("{$monthsExpr} >= 12 AND {$monthsExpr} < 36");
            } elseif ($request->duration === '3to5y') {
                $query->whereRaw("{$monthsExpr} >= 36 AND {$monthsExpr} < 60");
            } elseif ($request->duration === 'gt5y') {
                $query->whereRaw("{$monthsExpr} >= 60");
            }
        }

        // Sorting (default to newest on top)
        $sortBy = $request->input('sortBy', 'id');
        $sortDirection = $request->input('sort', 'desc');  // latest first

        if ($sortBy === 'name') {
            $query->orderBy('full_name', $sortDirection);
        } elseif ($sortBy === 'membership_no') {
            $query->orderBy('membership_no', $sortDirection);
        } else {
            $query->orderBy('id', $sortDirection);
        }

        $members = $query->paginate($perPage)->withQueryString();
        Log::info('membership.members.filters.result', [
            'total' => $members->total(),
            'current_page' => $members->currentPage(),
            'per_page' => $members->perPage(),
            'returned_ids' => $members->getCollection()->pluck('id')->take(10)->values()->all(),
        ]);
        $cities = Member::query()
            ->whereNull('parent_id')
            ->select('current_city', 'permanent_city')
            ->get()
            ->flatMap(function ($member) {
                return [
                    trim((string) $member->current_city),
                    trim((string) $member->permanent_city),
                ];
            })
            ->filter()
            ->unique()
            ->sort()
            ->values();

        return Inertia::render('App/Admin/Membership/Members', [
            'members' => $members,
            'memberTypes' => MemberType::all(['id', 'name']),
            'memberCategories' => MemberCategory::select('id', 'name')->where('status', 'active')->get(),
            'cities' => $cities,
            'filters' => $request->only([
                'membership_no',
                'barcode',
                'name',
                'cnic',
                'contact',
                'city',
                'status',
                'card_status',
                'member_category',
                'member_type',
                'duration',
                'kinship_filter',
                'selected_member_id',
                'sort',
                'sortBy',
                'per_page',
            ]),
        ]);
    }

    public function membershipHistory()
    {
        $members = User::role('user')->whereNull('parent_user_id')->with('member', 'member.memberType:id,name', 'member.memberCategory:id,name')->get();

        return Inertia::render('App/Admin/Membership/Members', compact('members'));
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

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'membership_no' => 'nullable|string|unique:members,membership_no',
                'personal_email' => 'nullable|email|unique:members,personal_email',
                'barcode_no' => 'nullable|string|unique:members,barcode_no',
                'family_members' => 'array',
                'family_members.*.email' => 'nullable|email|distinct|different:email|unique:members,personal_email',
                'family_members.*.barcode_no' => 'nullable|string|distinct|unique:members,barcode_no',
                'cnic_no' => 'required|string|regex:/^\d{5}-\d{7}-\d{1}$/|unique:members,cnic_no',
                'family_members.*.cnic' => 'nullable|string|regex:/^\d{5}-\d{7}-\d{1}$/|unique:members,cnic_no',
            ], [
                'membership_no.unique' => 'Membership number already exists.⚠️',
                'cnic_no.unique' => 'Member CNIC already exists.⚠️',
                'barcode_no.unique' => 'Barcode number already exists.⚠️',
                'family_members.*.cnic.unique' => "Family member's CNIC already exists.⚠️",
                'family_members.*.barcode_no.unique' => "Family member's barcode number already exists.⚠️",
            ]);

            // Custom validation to check if family member CNIC matches primary user CNIC
            $validator->after(function ($validator) use ($request) {
                $primaryCnic = $request->cnic_no ?? null;
                if (!empty($request->family_members)) {
                    foreach ($request->family_members as $index => $familyMember) {
                        if (!empty($familyMember['cnic']) && $familyMember['cnic'] === $primaryCnic) {
                            $validator->errors()->add(
                                "family_members.$index.cnic",
                                'Family member CNIC must not be the same as the primary user CNIC.'
                            );
                        }
                    }
                }
            });

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            $fullName = trim(preg_replace('/\s+/', ' ', $request->title . ' ' . $request->first_name . ' ' . $request->middle_name . ' ' . $request->last_name));

            $membershipNo = Member::generateNextMembershipNumber();

            // Create primary member record
            $mainMember = Member::create([
                'first_name' => $request->first_name,
                'barcode_no' => $request->barcode_no ?? null,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'full_name' => $fullName,
                'martial_status' => $request->martial_status,
                'kinship' => $request->kinship['id'] ?? null,
                'membership_no' => $request->membership_no ?? $membershipNo,
                'member_type_id' => $request->member_type_id,
                'member_category_id' => $request->membership_category,
                'membership_date' => $this->formatDateForDatabase($request->membership_date),
                'card_status' => $request->card_status,
                'status' => $request->status,
                'card_issue_date' => $this->formatDateForDatabase($request->card_issue_date),
                'card_expiry_date' => $this->formatDateForDatabase($request->card_expiry_date),
                'is_document_missing' => filter_var($request->is_document_missing ?? false, FILTER_VALIDATE_BOOLEAN),
                'missing_documents' => $request->missing_documents ?? null,
                'coa_category_id' => $request->coa_category_id,
                'title' => $request->title,
                'guardian_name' => $request->guardian_name,
                'guardian_membership' => $request->guardian_membership,
                'nationality' => $request->nationality,
                'cnic_no' => $request->cnic_no,
                'passport_no' => $request->passport_no,
                'gender' => $request->gender,
                'ntn' => $request->ntn,
                'date_of_birth' => $this->formatDateForDatabase($request->date_of_birth),
                'education' => $request->education,
                'reason' => $request->reason,
                'start_date' => $this->formatDateForDatabase($request->start_date),
                'end_date' => $this->formatDateForDatabase($request->end_date),
                'mobile_number_a' => $request->mobile_number_a,
                'mobile_number_b' => $request->mobile_number_b,
                'mobile_number_c' => $request->mobile_number_c,
                'telephone_number' => $request->telephone_number,
                'personal_email' => $request->personal_email,
                'critical_email' => $request->critical_email,
                'emergency_name' => $request->emergency_name,
                'emergency_relation' => $request->emergency_relation,
                'emergency_contact' => $request->emergency_contact,
                'current_address' => $request->current_address,
                'current_city' => $request->current_city,
                'current_country' => $request->current_country,
                'permanent_address' => $request->permanent_address,
                'permanent_city' => $request->permanent_city,
                'permanent_country' => $request->permanent_country,
                'country' => $request->country,
                'business_developer_id' => $request->business_developer_id,
                'membership_fee' => $request->membership_fee,
                'additional_membership_charges' => $request->additional_membership_charges,
                'membership_fee_additional_remarks' => $request->membership_fee_additional_remarks,
                'membership_fee_discount' => $request->membership_fee_discount,
                'membership_fee_discount_remarks' => $request->membership_fee_discount_remarks,
                'total_membership_fee' => $request->total_membership_fee,
                'maintenance_fee' => $request->maintenance_fee,
                'additional_maintenance_charges' => $request->additional_maintenance_charges,
                'maintenance_fee_additional_remarks' => $request->maintenance_fee_additional_remarks,
                'maintenance_fee_discount' => $request->maintenance_fee_discount,
                'maintenance_fee_discount_remarks' => $request->maintenance_fee_discount_remarks,
                'total_maintenance_fee' => $request->total_maintenance_fee,
                'per_day_maintenance_fee' => $request->per_day_maintenance_fee,
                'comment_box' => $request->comment_box,
            ]);

            // Handle profile photo using Media model
            if ($request->hasFile('profile_photo')) {
                $file = $request->file('profile_photo');

                // Get file metadata BEFORE moving the file
                $fileName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType();
                $fileSize = $file->getSize();

                // Now save the file
                $filePath = FileHelper::saveImage($file, 'membership');

                $mainMember->media()->create([
                    'type' => 'profile_photo',
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                ]);
            }

            // Handle documents using Media model
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    // Get file metadata BEFORE moving the file
                    $fileName = $file->getClientOriginalName();
                    $mimeType = $file->getMimeType();
                    $fileSize = $file->getSize();

                    // Now save the file
                    $filePath = FileHelper::saveImage($file, 'member_documents');

                    $mainMember->media()->create([
                        'type' => 'member_docs',
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'mime_type' => $mimeType,
                        'file_size' => $fileSize,
                        'disk' => 'public',
                    ]);
                }
            }

            $qrCodeData = route('member.profile', ['id' => $mainMember->id]);

            // Create QR code image and save it
            $qrBinary = QrCode::format('png')->size(300)->generate($qrCodeData);
            $qrImagePath = FileHelper::saveBinaryImage($qrBinary, 'qr_codes');
            $mainMember->qr_code = $qrImagePath;
            $mainMember->save();

            // Handle family members
            if (!empty($request->family_members)) {
                foreach ($request->family_members as $familyMemberData) {
                    $familyMember = Member::create([
                        'barcode_no' => $familyMemberData['barcode_no'] ?? null,
                        'parent_id' => $mainMember->id,
                        'membership_no' => $mainMember->membership_no . '-' . $familyMemberData['family_suffix'],
                        'family_suffix' => $familyMemberData['family_suffix'],
                        'first_name' => $familyMemberData['first_name'] ?? null,
                        'middle_name' => $familyMemberData['middle_name'] ?? null,
                        'last_name' => $familyMemberData['last_name'] ?? null,
                        'full_name' => $familyMemberData['full_name'],
                        'personal_email' => $familyMemberData['email'],
                        'relation' => $familyMemberData['relation'],
                        'gender' => $familyMemberData['gender'] ?? null,
                        'date_of_birth' => $this->formatDateForDatabase($familyMemberData['date_of_birth']),
                        'status' => $familyMemberData['status'],
                        'start_date' => $this->formatDateForDatabase($familyMemberData['start_date'] ?? null),
                        'end_date' => $this->formatDateForDatabase($familyMemberData['end_date'] ?? null),
                        'card_issue_date' => $this->formatDateForDatabase($familyMemberData['card_issue_date'] ?? null),
                        'card_expiry_date' => $this->formatDateForDatabase($familyMemberData['card_expiry_date'] ?? null),
                        'cnic_no' => $familyMemberData['cnic'],
                        'mobile_number_a' => $familyMemberData['phone_number'],
                        'passport_no' => $familyMemberData['passport_no'] ?? null,
                        'nationality' => $familyMemberData['nationality'] ?? null,
                        'martial_status' => $familyMemberData['martial_status'] ?? null,
                        'comment_box' => $familyMemberData['comments'] ?? null,
                    ]);

                    // Handle family member profile photo using Media model
                    if (!empty($familyMemberData['picture'])) {
                        $file = $familyMemberData['picture'];

                        // Get file metadata BEFORE moving the file
                        $fileName = $file->getClientOriginalName();
                        $mimeType = $file->getMimeType();
                        $fileSize = $file->getSize();

                        // Now save the file
                        $filePath = FileHelper::saveImage($file, 'familymembers');

                        $familyMember->media()->create([
                            'type' => 'profile_photo',
                            'file_name' => $fileName,
                            'file_path' => $filePath,
                            'mime_type' => $mimeType,
                            'file_size' => $fileSize,
                            'disk' => 'public',
                        ]);
                    }

                    $familyqrCodeData = route('member.profile', ['id' => $familyMember->id]);

                    // Create QR code image and save it
                    $familyqrqrBinary = QrCode::format('png')->size(300)->generate($familyqrCodeData);
                    $qrImagePath = FileHelper::saveBinaryImage($familyqrqrBinary, 'qr_codes');

                    $familyMember->qr_code = $qrImagePath;
                    $familyMember->save();
                }
            }

            // 1. Create Invoice Header
            $invoice = FinancialInvoice::create([
                'invoice_no' => $this->generateInvoiceNumber(),
                'member_id' => $mainMember->id,
                'fee_type' => 'mixed',
                'invoice_type' => 'invoice',
                'amount' => 0,
                'additional_charges' => 0,
                'discount_type' => null,
                'discount_value' => 0,
                'discount_details' => null,
                'total_price' => 0,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'payment_method' => null,
                'issue_date' => $this->formatDateForDatabase($request->membership_date), // Fix: Use membership date as invoice date
                'status' => 'unpaid',
                'remarks' => $request->membership_fee_additional_remarks,
                'invoiceable_id' => $mainMember->id,
                'invoiceable_type' => Member::class,
            ]);

            // 2. Create Invoice Item (New System Compatibility)
            \App\Models\FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP,
                'description' => 'Membership Fee',
                'qty' => 1,
                'amount' => $request->membership_fee ?? 0,
                'sub_total' => ($request->membership_fee ?? 0) * 1,
                'additional_charges' => $request->additional_membership_charges ?? 0,
                'tax_percentage' => 0,
                'tax_amount' => 0,
                'discount_amount' => $request->membership_fee_discount ?? 0,
                'discount_details' => $request->membership_fee_discount_remarks,
                'total' => $request->total_membership_fee,
                'start_date' => $this->formatDateForDatabase($request->membership_date),
                'end_date' => null,
            ]);

            // Maintenance Fee Item
            if (($request->total_maintenance_fee ?? 0) > 0) {
                \App\Models\FinancialInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_type' => AppConstants::TRANSACTION_TYPE_ID_MAINTENANCE,
                    'description' => 'Maintenance Fee (Initial)',
                    'qty' => 1,
                    'amount' => $request->total_maintenance_fee,
                    'sub_total' => $request->total_maintenance_fee,
                    'total' => $request->total_maintenance_fee,
                ]);
            }

            // 3. Update Invoice Header with Totals
            $invoice->update([
                'amount' => $request->membership_fee ?? 0,
                'additional_charges' => $request->additional_membership_charges ?? 0,
                'discount_type' => 'fixed',
                'discount_value' => $request->membership_fee_discount ?? 0,
                'discount_details' => $request->membership_fee_discount_remarks,
                'discount_amount' => $request->membership_fee_discount ?? 0,
                'total_price' => $request->total_membership_fee,
            ]);

            // 3. Create Ledger Entry (Debit)
            \App\Models\Transaction::create([
                'type' => 'debit',
                'amount' => $request->total_membership_fee,
                'date' => now(),  // Transaction Date
                'description' => 'Membership Fee Invoice #' . $invoice->invoice_no,
                'payable_type' => Member::class,
                'payable_id' => $mainMember->id,  // Linked to the new member
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
            ]);

            DB::commit();

            $mainMember->load('memberCategory');

            // Dispatch Notification to Super Admins
            $superAdmins = User::role('super-admin')->get();

            try {
                \Illuminate\Support\Facades\Notification::send($superAdmins, new \App\Notifications\ActivityNotification(
                    "New Member: {$mainMember->full_name}",
                    "Membership #{$mainMember->membership_no} added to {$mainMember->memberCategory->name}",
                    route('member.profile', $mainMember->id),
                    Auth::user(),
                    'Membership'
                ));
                Log::info('Notification sent successfully.');
            } catch (\Exception $e) {
                Log::error('Failed to send notification: ' . $e->getMessage());
            }

            return response()->json(['message' => 'Membership created successfully.', 'member' => $mainMember], 200);
        } catch (\Throwable $th) {
            Log::error('Error submitting membership details: ' . $th->getMessage());
            return response()->json(['error' => 'Failed to submit membership details: ' . $th->getMessage()], 500);
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

    public function updateMember(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'member_id' => 'required|exists:members,id',
                'personal_email' => 'nullable|email|unique:members,personal_email,' . $request->member_id,
                'barcode_no' => 'nullable|string|unique:members,barcode_no,' . $request->member_id,
                'cnic_no' => 'required|string|regex:/^\d{5}-\d{7}-\d{1}$/|unique:members,cnic_no,' . $request->member_id,
                'family_members' => 'array',
                // 'family_members.*.email' => 'required|email|distinct|different:email|unique:members,personal_email',
            ], [
                'barcode_no.unique' => 'Barcode number already exists.⚠️',
                'cnic_no.unique' => 'Member CNIC already exists.⚠️',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            $member = Member::findOrFail($request->member_id);

            // Store original status to check if it changed
            $originalStatus = $member->status;

            // Handle profile photo update using Media model
            if ($request->hasFile('profile_photo')) {
                $file = $request->file('profile_photo');

                // Get file metadata BEFORE moving the file
                $fileName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType();
                $fileSize = $file->getSize();

                // Now save the file
                $filePath = FileHelper::saveImage($file, 'membership');

                // Delete old profile photo media if exists
                $oldProfilePhoto = $member->profilePhoto;
                if ($oldProfilePhoto) {
                    $oldProfilePhoto->deleteFile();  // Delete physical file
                    $oldProfilePhoto->delete();  // Delete media record
                }

                // Create new profile photo media
                $member->media()->create([
                    'type' => 'profile_photo',
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                ]);
            }

            // Handle documents update using Media model
            if ($request->has('documents')) {
                $requestDocs = (array) ($request->documents ?? []);
                $existingMediaIds = [];

                // FIRST: Get current media IDs BEFORE creating new ones
                $currentMediaIds = $member->media()->where('type', 'member_docs')->pluck('id')->toArray();

                // SECOND: Process the request - upload new files and collect IDs to keep
                foreach ($requestDocs as $doc) {
                    if ($doc instanceof \Illuminate\Http\UploadedFile) {
                        // Get file metadata BEFORE moving the file
                        $fileName = $doc->getClientOriginalName();
                        $mimeType = $doc->getMimeType();
                        $fileSize = $doc->getSize();

                        // Now save the file
                        $filePath = FileHelper::saveImage($doc, 'member_documents');

                        // Create new media record (this will NOT be deleted)
                        $member->media()->create([
                            'type' => 'member_docs',
                            'file_name' => $fileName,
                            'file_path' => $filePath,
                            'mime_type' => $mimeType,
                            'file_size' => $fileSize,
                            'disk' => 'public',
                        ]);
                    } elseif (is_numeric($doc)) {
                        // Existing media ID to keep
                        $existingMediaIds[] = $doc;
                    }
                }

                // THIRD: Delete old media that are not in the keep list
                // Only compare against the ORIGINAL media IDs (before we added new ones)
                $mediaIdsToDelete = array_diff($currentMediaIds, $existingMediaIds);

                // Delete the media records and their files
                if (!empty($mediaIdsToDelete)) {
                    $member
                        ->media()
                        ->whereIn('id', $mediaIdsToDelete)
                        ->each(function ($media) {
                            $media->deleteFile();  // Delete physical file
                            $media->delete();  // Delete media record
                        });
                }
            }

            $fullName = trim(preg_replace('/\s+/', ' ', $request->title . ' ' . $request->first_name . ' ' . $request->middle_name . ' ' . $request->last_name));

            // Update member
            $member->update([
                'membership_no' => $request->membership_no,
                'barcode_no' => $request->barcode_no ?? null,
                'first_name' => $request->first_name,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'full_name' => $fullName,
                'martial_status' => $request->martial_status,
                'kinship' => $request->kinship['id'] ?? null,
                'member_type_id' => $request->member_type_id,
                'member_category_id' => $request->membership_category,
                'membership_date' => $this->formatDateForDatabase($request->membership_date),
                'card_status' => $request->card_status,
                'status' => $request->status,
                'card_issue_date' => $this->formatDateForDatabase($request->card_issue_date),
                'card_expiry_date' => $this->formatDateForDatabase($request->card_expiry_date),
                'is_document_missing' => filter_var($request->is_document_missing ?? false, FILTER_VALIDATE_BOOLEAN),
                'missing_documents' => $request->missing_documents ?? null,
                'coa_category_id' => $request->coa_category_id,
                'title' => $request->title,
                'guardian_name' => $request->guardian_name,
                'guardian_membership' => $request->guardian_membership,
                'nationality' => $request->nationality,
                'cnic_no' => $request->cnic_no,
                'passport_no' => $request->passport_no,
                'gender' => $request->gender,
                'ntn' => $request->ntn,
                'date_of_birth' => $this->formatDateForDatabase($request->date_of_birth),
                'education' => $request->education,
                'reason' => $request->reason,
                'start_date' => $this->formatDateForDatabase($request->start_date),
                'end_date' => $this->formatDateForDatabase($request->end_date),
                'mobile_number_a' => $request->mobile_number_a,
                'mobile_number_b' => $request->mobile_number_b,
                'mobile_number_c' => $request->mobile_number_c,
                'telephone_number' => $request->telephone_number,
                'personal_email' => $request->personal_email,
                'critical_email' => $request->critical_email,
                'emergency_name' => $request->emergency_name,
                'emergency_relation' => $request->emergency_relation,
                'emergency_contact' => $request->emergency_contact,
                'current_address' => $request->current_address,
                'current_city' => $request->current_city,
                'current_country' => $request->current_country,
                'permanent_address' => $request->permanent_address,
                'permanent_city' => $request->permanent_city,
                'permanent_country' => $request->permanent_country,
                'country' => $request->country,
                'business_developer_id' => $request->business_developer_id,
                'membership_fee' => $request->membership_fee,
                'additional_membership_charges' => $request->additional_membership_charges,
                'membership_fee_additional_remarks' => $request->membership_fee_additional_remarks,
                'membership_fee_discount' => $request->membership_fee_discount,
                'membership_fee_discount_remarks' => $request->membership_fee_discount_remarks,
                'total_membership_fee' => $request->total_membership_fee,
                'maintenance_fee' => $request->maintenance_fee,
                'additional_maintenance_charges' => $request->additional_maintenance_charges,
                'maintenance_fee_additional_remarks' => $request->maintenance_fee_additional_remarks,
                'maintenance_fee_discount' => $request->maintenance_fee_discount,
                'maintenance_fee_discount_remarks' => $request->maintenance_fee_discount_remarks,
                'total_maintenance_fee' => $request->total_maintenance_fee,
                'per_day_maintenance_fee' => $request->per_day_maintenance_fee,
                'comment_box' => $request->comment_box,
            ]);

            // Update Family Members
            if ($request->filled('family_members')) {
                foreach ($request->family_members as $newMemberData) {
                    // Check if family member is new

                    if (str_starts_with($newMemberData['id'], 'new-')) {
                        $familyMember = Member::create([
                            'barcode_no' => $newMemberData['barcode_no'] ?? null,
                            'parent_id' => $member->id,
                            'membership_no' => $request->membership_no . ($newMemberData['family_suffix'] ? '-' . $newMemberData['family_suffix'] : ''),
                            'family_suffix' => $newMemberData['family_suffix'] ?? null,
                            'first_name' => $newMemberData['first_name'] ?? null,
                            'middle_name' => $newMemberData['middle_name'] ?? null,
                            'last_name' => $newMemberData['last_name'] ?? null,
                            'full_name' => $newMemberData['full_name'],
                            'personal_email' => $newMemberData['email'] ?? null,
                            'relation' => $newMemberData['relation'],
                            'date_of_birth' => $this->formatDateForDatabase($newMemberData['date_of_birth']),
                            'status' => $newMemberData['status'],
                            'gender' => $newMemberData['gender'] ?? null,
                            'start_date' => $this->formatDateForDatabase($newMemberData['start_date'] ?? null),
                            'end_date' => $this->formatDateForDatabase($newMemberData['end_date'] ?? null),
                            'card_issue_date' => $this->formatDateForDatabase($newMemberData['card_issue_date'] ?? null),
                            'card_expiry_date' => $this->formatDateForDatabase($newMemberData['card_expiry_date'] ?? null),
                            'cnic_no' => $newMemberData['cnic'],
                            'mobile_number_a' => $newMemberData['phone_number'] ?? null,
                            'passport_no' => $newMemberData['passport_no'] ?? null,
                            'nationality' => $newMemberData['nationality'] ?? null,
                            'martial_status' => $newMemberData['martial_status'] ?? null,
                            'comment_box' => $newMemberData['comments'] ?? null,
                        ]);

                        // Handle family member profile photo using Media model
                        if (!empty($newMemberData['picture'])) {
                            $file = $newMemberData['picture'];

                            // Get file metadata BEFORE moving the file
                            $fileName = $file->getClientOriginalName();
                            $mimeType = $file->getMimeType();
                            $fileSize = $file->getSize();

                            // Now save the file
                            $filePath = FileHelper::saveImage($file, 'familymembers');

                            $familyMember->media()->create([
                                'type' => 'profile_photo',
                                'file_name' => $fileName,
                                'file_path' => $filePath,
                                'mime_type' => $mimeType,
                                'file_size' => $fileSize,
                                'disk' => 'public',
                            ]);
                        }

                        $familyqrCodeData = route('member.profile', ['id' => $familyMember->id]);

                        // Create QR code image and save it
                        $familyqrqrBinary = QrCode::format('png')->size(300)->generate($familyqrCodeData);
                        $qrImagePath = FileHelper::saveBinaryImage($familyqrqrBinary, 'qr_codes');

                        $familyMember->qr_code = $qrImagePath;
                        $familyMember->save();
                    } elseif (!empty($newMemberData['id'])) {
                        // Update existing family member

                        $updateFamily = Member::find($newMemberData['id']);
                        if ($updateFamily) {
                            // Handle family member profile photo update using Media model
                            if (!empty($newMemberData['picture']) && $newMemberData['picture'] instanceof \Illuminate\Http\UploadedFile) {
                                $file = $newMemberData['picture'];

                                // Get file metadata BEFORE moving the file
                                $fileName = $file->getClientOriginalName();
                                $mimeType = $file->getMimeType();
                                $fileSize = $file->getSize();

                                // Now save the file
                                $filePath = FileHelper::saveImage($file, 'familymembers');

                                // Delete old profile photo media if exists
                                $oldProfilePhoto = $updateFamily->profilePhoto;
                                if ($oldProfilePhoto) {
                                    $oldProfilePhoto->deleteFile();
                                    $oldProfilePhoto->delete();
                                }

                                // Create new profile photo media
                                $updateFamily->media()->create([
                                    'type' => 'profile_photo',
                                    'file_name' => $fileName,
                                    'file_path' => $filePath,
                                    'mime_type' => $mimeType,
                                    'file_size' => $fileSize,
                                    'disk' => 'public',
                                ]);
                            }

                            // Update member fields
                            $updateFamily->update([
                                'first_name' => $newMemberData['first_name'] ?? null,
                                'middle_name' => $newMemberData['middle_name'] ?? null,
                                'last_name' => $newMemberData['last_name'] ?? null,
                                'full_name' => $newMemberData['full_name'],
                                'barcode_no' => $newMemberData['barcode_no'] ?? null,
                                'personal_email' => $newMemberData['email'] ?? null,
                                'gender' => $newMemberData['gender'] ?? null,
                                'relation' => $newMemberData['relation'],
                                'date_of_birth' => $this->formatDateForDatabase($newMemberData['date_of_birth']),
                                'status' => $newMemberData['status'] ?? null,
                                'start_date' => $this->formatDateForDatabase($newMemberData['start_date'] ?? null),
                                'end_date' => $this->formatDateForDatabase($newMemberData['end_date'] ?? null),
                                'card_issue_date' => $this->formatDateForDatabase($newMemberData['card_issue_date'] ?? null),
                                'card_expiry_date' => $this->formatDateForDatabase($newMemberData['card_expiry_date'] ?? null),
                                'cnic_no' => $newMemberData['cnic'] ?? null,
                                'mobile_number_a' => $newMemberData['phone_number'] ?? null,
                                'passport_no' => $newMemberData['passport_no'] ?? null,
                                'nationality' => $newMemberData['nationality'] ?? null,
                                'martial_status' => $newMemberData['martial_status'] ?? null,
                                'comment_box' => $newMemberData['comments'] ?? null,
                            ]);
                        }
                    }
                }
            }

            // ✅ Handle family member deletions
            if ($request->filled('deleted_family_members')) {
                $idsToDelete = $request->deleted_family_members;

                foreach ($idsToDelete as $familyId) {
                    $family = Member::find($familyId);

                    if ($family && $family->parent_id == $member->id) {
                        // Optionally also delete related User
                        if ($family->user) {
                            $family->user->delete();
                        }

                        $family->delete();
                    }
                }
            }

            // Check if status changed and create status history record
            if ($originalStatus !== $request->status) {
                // Close any existing open status history records
                $member->statusHistories()->whereNull('end_date')->update(['end_date' => now()]);

                // Create new status history record
                MemberStatusHistory::create([
                    'member_id' => $member->id,
                    'status' => $request->status,
                    'reason' => 'Status updated during member profile update',
                    'start_date' => now(),
                    'end_date' => null,  // Open-ended until next status change
                ]);
            }

            DB::commit();

            $member->load('memberCategory');

            // Dispatch Notification
            try {
                $superAdmins = User::role('super-admin')->get();
                \Illuminate\Support\Facades\Notification::send($superAdmins, new \App\Notifications\ActivityNotification(
                    "Member Updated: {$member->full_name}",
                    "Profile details updated for Membership #{$member->membership_no}",
                    route('member.profile', $member->id),
                    Auth::user(),
                    'Membership'
                ));
            } catch (\Exception $e) {
                Log::error('Failed to send notification: ' . $e->getMessage());
            }

            return response()->json(['message' => 'Membership updated successfully.', 'member' => $member]);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Error updating member: ' . $th->getMessage());
            return response()->json(['error' => 'Failed to update membership details.'], 500);
        }
    }

    // Show Public Profile
    public function viewProfile(Request $request, $id)
    {
        if ($request->query('type') === 'corporate') {
            $member = \App\Models\CorporateMember::with([
                'memberCategory',
                'profilePhoto',
                'parent.profilePhoto',
            ])->findOrFail($id);
        } else {
            $member = Member::with([
                'memberType',
                'profilePhoto',
                'parent.profilePhoto',
                'parent.memberType'
            ])->findOrFail($id);
        }

        // Prepare data for the view
        $memberData = [
            'id' => $member->id,
            'full_name' => $member->full_name,
            'membership_no' => $member->membership_no,
            'status' => $member->status,
            'card_status' => $member->card_status,
            'card_expiry_date' => $member->card_expiry_date,
            'profile_photo_url' => $member->profilePhoto ? $member->profilePhoto->file_path : null,
            'is_family_member' => !is_null($member->parent_id),
            'parent_member' => $member->parent ? [
                'full_name' => $member->parent->full_name,
                'membership_no' => $member->parent->membership_no,
            ] : null,
            'is_corporate' => $request->query('type') === 'corporate' || is_a($member, \App\Models\CorporateMember::class),
        ];

        return Inertia::render('App/Membership/Show', ['member' => $memberData]);
    }

    // Show Admin Member Profile with Family Members
    public function showMemberProfile($id)
    {
        $member = Member::with([
            'memberType:id,name',
            'profilePhoto:id,mediable_id,mediable_type,file_path',
            'memberCategory:id,name,description,subscription_fee',
            'kinshipMember:id,full_name,membership_no'
        ])->findOrFail($id);

        // Add membership duration to member
        $member->membership_duration = $member->membership_duration;

        // Load profile photo count
        $member->loadCount(['media as profile_photos_count' => function ($query) {
            $query->where('type', 'profile_photo');
        }]);

        return Inertia::render('App/Admin/Membership/ViewProfile', [
            'member' => $member
        ]);
    }

    // Get Member Family Members with Pagination
    public function getMemberFamilyMembers(Request $request, $id)
    {
        $perPage = $request->get('per_page', 10);

        $familyMembers = Member::where('parent_id', $id)
            ->with(['profilePhoto:id,mediable_id,mediable_type,file_path'])
            ->select('id', 'parent_id', 'full_name', 'membership_no', 'relation', 'gender', 'status', 'card_status', 'card_expiry_date', 'passport_no', 'nationality', 'martial_status', 'comment_box')
            ->paginate($perPage);

        return response()->json($familyMembers);
    }

    // Get All Member Family Members (Non-paginated) for Dropdown
    public function getAllFamilyMembers(Request $request, $id)
    {
        $familyMembers = Member::where('parent_id', $id)
            ->select('id', 'parent_id', 'full_name', 'first_name', 'membership_no', 'relation', 'gender', 'status', 'card_status')
            ->get();

        return response()->json($familyMembers);
    }

    // Get Member Order History (Transactions)
    public function getMemberOrderHistory(Request $request, $id)
    {
        $perPage = $request->get('per_page', 10);

        // Get member with their transactions/orders
        $member = Member::findOrFail($id);

        // Get orders for this member using the same structure as TransactionController
        $query = \App\Models\Order::query()
            ->whereIn('order_type', ['dineIn', 'delivery', 'takeaway', 'reservation'])
            ->with(['member:id,full_name,membership_no', 'customer:id,name,customer_no', 'table:id,table_no', 'orderItems:id,order_id'])
            ->where('member_id', $member->id)
            ->orderBy('created_at', 'desc');

        $orders = $query->paginate($perPage);

        // Get order IDs for invoice lookup
        $orderIds = $orders->pluck('id')->toArray();

        // Get invoices for these orders (same as TransactionController)
        $invoices = \App\Models\FinancialInvoice::select('id', 'data', 'status')
            ->whereJsonContains('data->order_id', $orderIds)
            ->get();

        // Map invoices to orders
        $invoiceMap = [];
        foreach ($invoices as $invoice) {
            $invoiceData = json_decode($invoice->data, true);
            if (isset($invoiceData['order_id'])) {
                $invoiceMap[$invoiceData['order_id']] = $invoice;
            }
        }

        // Add invoice data to orders
        $orders->getCollection()->transform(function ($order) use ($invoiceMap) {
            $order->invoice = $invoiceMap[$order->id] ?? null;
            $order->invoice_id = $order->invoice ? $order->invoice->id : null;
            return $order;
        });

        return response()->json($orders);
    }

    public function updateStatus(Request $request)
    {
        $request->validate([
            'member_id' => 'required|exists:members,id',
            'status' => 'required|in:active,suspended,cancelled,absent,expired,terminated,not_assign,in_suspension_process',
            'reason' => 'nullable|string',
            'duration_type' => 'required_if:status,suspended,absent|in:1Day,1Monthly,1Year,CustomDate',
            'custom_start_date' => 'required_if:duration_type,CustomDate|nullable|date',
            'custom_end_date' => 'required_if:duration_type,CustomDate|nullable|date|after:custom_start_date',
        ]);

        $member = Member::findOrFail($request->member_id);

        $startDate = now();
        $endDate = null;

        if (in_array($request->status, ['suspended', 'absent'])) {
            switch ($request->duration_type) {
                case '1Day':
                    $endDate = now()->addDay();
                    break;
                case '1Monthly':
                    $endDate = now()->addMonth();
                    break;
                case '1Year':
                    $endDate = now()->addYear();
                    break;
                case 'CustomDate':
                    $startDate = Carbon::parse($request->custom_start_date);
                    $endDate = Carbon::parse($request->custom_end_date);
                    break;
            }
        }

        DB::beginTransaction();
        try {
            $member->update([
                'status' => $request->status,
                'paused_at' => $request->status === 'absent' ? now() : null,
            ]);

            $member->statusHistories()->whereNull('end_date')->update(['end_date' => now()]);

            MemberStatusHistory::create([
                'member_id' => $member->id,
                'status' => $request->status,
                'reason' => $request->reason,
                'start_date' => $startDate,
                'end_date' => $endDate,
            ]);

            DB::commit();
            return response()->json(['message' => 'Status updated successfully']);
        } catch (\Exception $e) {
            Log::error('Status update failed', ['error' => $e->getMessage()]);
            DB::rollBack();
            return response()->json(['error' => 'Failed to update status'], 500);
        }
    }

    private function getInvoiceNo()
    {
        $invoiceNo = FinancialInvoice::max('invoice_no');
        $invoiceNo = $invoiceNo + 1;
        return $invoiceNo;
    }

    public function saveProfessionInfo(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'member_id' => 'required|exists:members,id',
                'profession_info' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $member = Member::findOrFail($request->member_id);

            if ($member->professionInfo) {
                $member->professionInfo->update($request->profession_info);
            } else {
                $member->professionInfo()->create($request->profession_info);
            }

            // Dispatch Notification for saveProfessionInfo
            try {
                // Ensure User and Notification facades are imported or fully qualified
                $superAdmins = User::role('super-admin')->get();
                \Illuminate\Support\Facades\Notification::send($superAdmins, new \App\Notifications\ActivityNotification(
                    "Profession Updated: {$member->full_name}",
                    "Profession details updated for Membership #{$member->membership_no}",
                    route('member.profile', $member->id),
                    Auth::user(),
                    'Membership'
                ));
            } catch (\Exception $e) {
                Log::error('Failed to send notification for profession update: ' . $e->getMessage());
            }

            return response()->json(['message' => 'Profession info saved successfully.'], 200);
        } catch (\Throwable $th) {
            Log::error('Error saving profession info: ' . $th->getMessage());
            return response()->json(['error' => 'Failed to save profession info: ' . $th->getMessage()], 500);
        }
    }

    public function getProfessionInfo($id)
    {
        try {
            $member = Member::with(['professionInfo.businessDeveloper'])->findOrFail($id);

            $data = $member->professionInfo ? $member->professionInfo->toArray() : [];

            if ($member->professionInfo && $member->professionInfo->businessDeveloper) {
                $data['business_developer'] = $member->professionInfo->businessDeveloper;
            }

            return response()->json(['profession_info' => $data], 200);
        } catch (\Throwable $th) {
            Log::error('Error fetching profession info: ' . $th->getMessage());
            return response()->json(['error' => 'Failed to fetch profession info: ' . $th->getMessage()], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $member = Member::findOrFail($id);

            DB::beginTransaction();

            // Soft delete family members
            $member->familyMembers()->delete();

            // Soft delete related media (documents, profile photo, etc.)
            $member->media()->delete();

            // Soft delete the member
            $member->delete();

            DB::commit();

            return response()->json(['message' => 'Member deleted successfully.'], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Error deleting member: ' . $th->getMessage());
            return response()->json(['error' => 'Failed to delete member: ' . $th->getMessage()], 500);
        }
    }

    public function storeStep4(Request $request)
    {
        try {
            $member = Member::find($request->member_id);
            if (!$member) {
                return response()->json(['error' => 'Member not found'], 404);
            }

            // Prepare data for MemberProfessionInfo
            $professionData = $request->except([
                'member_id',
                'business_developer',
                'id',
                'created_at',
                'updated_at',
                'deleted_at',
                'created_by',
                'updated_by',
                'deleted_by',
                'profession',
                'office_address',
                'office_phone',
                'referral_name'
            ]);

            // Update or Create MemberProfessionInfo
            if ($member->professionInfo) {
                $member->professionInfo->update($professionData);
            } else {
                $member->professionInfo()->create($professionData);
            }

            // Dispatch Notification
            try {
                $superAdmins = User::role('super-admin')->get();
                \Illuminate\Support\Facades\Notification::send($superAdmins, new \App\Notifications\ActivityNotification(
                    "Profession Updated: {$member->full_name}",
                    "Profession details updated for Membership #{$member->membership_no}",
                    route('member.profile', $member->id),
                    Auth::user(),
                    'Membership'
                ));
            } catch (\Exception $e) {
                Log::error('Failed to send notification: ' . $e->getMessage());
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error saving step 4: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save information'], 500);
        }
    }

    /**
     * Display a listing of trashed members.
     */
    public function trashed(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = Member::onlyTrashed()->with(['memberCategory', 'memberType', 'statusHistories']);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('membership_no', 'like', "%{$search}%")
                    ->orWhere('cnic_no', 'like', "%{$search}%")
                    ->orWhere('personal_email', 'like', "%{$search}%");
            });
        }

        $members = $query->orderBy('deleted_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/Membership/TrashedMembers', [
            'members' => $members,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    /**
     * Restore the specified trashed member.
     */
    public function restore($id)
    {
        $member = Member::withTrashed()->findOrFail($id);
        $member->restore();

        return redirect()->back()->with('success', 'Member restored successfully.');
    }
}
