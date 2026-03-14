<?php

namespace App\Http\Controllers;

use App\Constants\AppConstants;
use App\Helpers\FileHelper;
use App\Models\CorporateMember;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\MemberCategory;
use App\Models\Membership;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class CorporateMembershipController extends Controller
{
    /**
     * Display dashboard - redirects to main membership dashboard which has tabs.
     */
    public function index()
    {
        return redirect()->route('membership.dashboard');
    }

    /**
     * Show create form with categories filtered for corporate.
     */
    public function create()
    {
        $membershipNo = '';

        // Filter categories that have 'corporate' in their category_types JSON array
        $membercategories = MemberCategory::select('id', 'name', 'description', 'fee', 'subscription_fee')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereJsonContains('category_types', 'corporate');
            })
            ->get();

        return Inertia::render('App/Admin/CorporateMembership/CorporateMemberForm', compact('membershipNo', 'membercategories'));
    }

    /**
     * Store new corporate member.
     */
    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'membership_no' => 'nullable|string|unique:corporate_members,membership_no',
                'personal_email' => 'nullable|email|unique:corporate_members,personal_email',
                'barcode_no' => 'nullable|string|unique:corporate_members,barcode_no',
                'cnic_no' => 'required|string|regex:/^\d{5}-\d{7}-\d{1}$/|unique:corporate_members,cnic_no',
            ], [
                'membership_no.unique' => 'Membership number already exists.⚠️',
                'cnic_no.unique' => 'Corporate Member CNIC already exists.⚠️',
                'barcode_no.unique' => 'Barcode number already exists.⚠️',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            $fullName = trim(preg_replace('/\s+/', ' ', $request->title . ' ' . $request->first_name . ' ' . $request->middle_name . ' ' . $request->last_name));
            // $membershipNo = CorporateMember::generateNextMembershipNumber();

            $mainMember = CorporateMember::create([
                'first_name' => $request->first_name,
                'barcode_no' => $request->barcode_no ?? null,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'full_name' => $fullName,
                'martial_status' => $request->martial_status,
                'membership_no' => $request->membership_no,
                'member_category_id' => $request->membership_category,
                'corporate_company_id' => $request->corporate_company_id,
                'membership_date' => $this->formatDateForDatabase($request->membership_date),
                'card_status' => $request->card_status,
                'status' => $request->status,
                'card_issue_date' => $this->formatDateForDatabase($request->card_issue_date),
                'card_expiry_date' => $this->formatDateForDatabase($request->card_expiry_date),
                'is_document_missing' => filter_var($request->is_document_missing ?? false, FILTER_VALIDATE_BOOLEAN),
                'missing_documents' => $request->missing_documents ?? null,
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

            // Handle profile photo
            if ($request->hasFile('profile_photo')) {
                $file = $request->file('profile_photo');
                $fileName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType();
                $fileSize = $file->getSize();
                $filePath = FileHelper::saveImage($file, 'corporate_membership');

                $mainMember->media()->create([
                    'type' => 'profile_photo',
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                ]);
            }

            // Handle documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $fileName = $file->getClientOriginalName();
                    $mimeType = $file->getMimeType();
                    $fileSize = $file->getSize();
                    $filePath = FileHelper::saveImage($file, 'corporate_member_documents');

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

            // Create QR code
            $qrCodeData = route('member.profile', ['id' => $mainMember->id, 'type' => 'corporate']);
            $qrBinary = QrCode::format('png')->size(300)->generate($qrCodeData);
            $qrImagePath = FileHelper::saveBinaryImage($qrBinary, 'qr_codes');
            $mainMember->qr_code = $qrImagePath;
            $mainMember->save();

            // Create unpaid membership fee invoice
            // 1. Create Invoice Header (Minimal)
            $invoice = FinancialInvoice::create([
                'invoice_no' => $this->generateInvoiceNumber(),
                'member_id' => null,  // Explicitly null for corporate invoice
                'corporate_member_id' => $mainMember->id,
                'invoice_type' => 'membership',
                'fee_type' => 'mixed',
                'amount' => 0,
                'additional_charges' => 0,
                'discount_type' => null,
                'discount_value' => 0,
                'discount_details' => null,
                'total_price' => 0,
                'payment_method' => null,
                'issue_date' => $this->formatDateForDatabase($request->membership_date),
                'status' => 'unpaid',
                'remarks' => $request->membership_fee_additional_remarks,
                'invoiceable_id' => $mainMember->id,
                'invoiceable_type' => CorporateMember::class,
            ]);

            // 2. Create Invoice Item (Detailed)
            \App\Models\FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => AppConstants::TRANSACTION_TYPE_ID_MEMBERSHIP,
                'description' => 'Corporate Membership Fee',
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
                FinancialInvoiceItem::create([
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
            $grandTotal = $request->total_membership_fee + ($request->total_maintenance_fee ?? 0);
            $invoice->update([
                'amount' => $request->membership_fee ?? 0,
                'additional_charges' => $request->additional_membership_charges ?? 0,
                'discount_type' => 'fixed',
                'discount_value' => $request->membership_fee_discount ?? 0,
                'discount_details' => $request->membership_fee_discount_remarks,
                'discount_amount' => $request->membership_fee_discount ?? 0,
                'total_price' => $grandTotal,
            ]);

            // 4. Create Ledger Entry (Debit)
            \App\Models\Transaction::create([
                'type' => 'debit',
                'amount' => $grandTotal,
                'date' => now(),
                'description' => 'Corporate Membership Fee Invoice #' . $invoice->invoice_no,
                'payable_type' => CorporateMember::class,
                'payable_id' => $mainMember->id,
                'reference_type' => FinancialInvoice::class,
                'reference_id' => $invoice->id,
            ]);

            // Handle family members
            if (!empty($request->family_members)) {
                foreach ($request->family_members as $familyMemberData) {
                    $familyMember = CorporateMember::create([
                        'barcode_no' => $familyMemberData['barcode_no'] ?? null,
                        'parent_id' => $mainMember->id,
                        'membership_no' => $mainMember->membership_no . '-' . $familyMemberData['family_suffix'],
                        'family_suffix' => $familyMemberData['family_suffix'],
                        'first_name' => $familyMemberData['first_name'] ?? null,
                        'middle_name' => $familyMemberData['middle_name'] ?? null,
                        'last_name' => $familyMemberData['last_name'] ?? null,
                        'full_name' => $familyMemberData['full_name'],
                        'personal_email' => $familyMemberData['email'] ?? null,
                        'relation' => $familyMemberData['relation'],
                        'gender' => $familyMemberData['gender'] ?? null,
                        'date_of_birth' => $this->formatDateForDatabase($familyMemberData['date_of_birth']),
                        'card_status' => $familyMemberData['card_status'],
                        'status' => $familyMemberData['status'],
                        'start_date' => $this->formatDateForDatabase($familyMemberData['start_date'] ?? null),
                        'end_date' => $this->formatDateForDatabase($familyMemberData['end_date'] ?? null),
                        'card_issue_date' => $this->formatDateForDatabase($familyMemberData['card_issue_date'] ?? null),
                        // Use getRawOriginal to avoid timezone issues for casted date fields if needed, but here we are setting it.
                        'card_expiry_date' => $this->formatDateForDatabase($familyMemberData['card_expiry_date'] ?? null),
                        'cnic_no' => $familyMemberData['cnic'] ?? null,
                        'mobile_number_a' => $familyMemberData['phone_number'] ?? null,
                        'passport_no' => $familyMemberData['passport_no'] ?? null,
                        'nationality' => $familyMemberData['nationality'] ?? null,
                        'martial_status' => $familyMemberData['martial_status'] ?? null,
                        'corporate_company_id' => $mainMember->corporate_company_id,  // Inherit company
                        'member_category_id' => $mainMember->member_category_id,  // Inherit category
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

                    $familyqrCodeData = route('member.profile', ['id' => $familyMember->id, 'type' => 'corporate']);

                    // Create QR code image and save it
                    $familyqrqrBinary = QrCode::format('png')->size(300)->generate($familyqrCodeData);
                    $qrImagePath = FileHelper::saveBinaryImage($familyqrqrBinary, 'qr_codes');

                    $familyMember->qr_code = $qrImagePath;
                    $familyMember->save();
                }
            }

            DB::commit();

            return response()->json(['message' => 'Corporate Membership created successfully.', 'member' => $mainMember], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Error creating corporate member: ' . $th->getMessage());
            return response()->json(['error' => 'Failed to create corporate member: ' . $th->getMessage()], 500);
        }
    }

    /**
     * Show all corporate members list.
     */
    public function allMembers(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        Log::info('corporate-membership.members.filters.received', [
            'membership_no' => $request->input('membership_no'),
            'name' => $request->input('name'),
            'barcode' => $request->input('barcode'),
            'cnic' => $request->input('cnic'),
            'contact' => $request->input('contact'),
            'city' => $request->input('city'),
            'status' => $request->input('status'),
            'card_status' => $request->input('card_status'),
            'member_category' => $request->input('member_category'),
            'duration' => $request->input('duration'),
            'selected_member_id' => $request->input('selected_member_id'),
            'page' => $request->input('page'),
            'per_page' => $perPage,
        ]);

        $query = CorporateMember::whereNull('parent_id')
            ->with([
                'profilePhoto:id,mediable_id,mediable_type,file_path',
                'documents:id,mediable_id,mediable_type,file_path',
                'memberCategory:id,name,description',
                'membershipInvoice:id,corporate_member_id,invoice_no,status,total_price'
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

        // Filter: Card Status
        if ($request->filled('card_status') && $request->card_status !== 'all') {
            $query->where('card_status', $request->card_status);
        }

        // Filter: Member Category
        if ($request->filled('member_category') && $request->member_category !== 'all') {
            $query->where('member_category_id', $request->member_category);
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

        $members = $query->paginate($perPage)->withQueryString();
        Log::info('corporate-membership.members.filters.result', [
            'total' => $members->total(),
            'current_page' => $members->currentPage(),
            'per_page' => $members->perPage(),
            'returned_ids' => $members->getCollection()->pluck('id')->take(10)->values()->all(),
        ]);

        // Get Member Categories for filter
        $memberCategories = \App\Models\MemberCategory::select('id', 'name')->get();
        $cities = CorporateMember::query()
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

        return Inertia::render('App/Admin/CorporateMembership/CorporateMembers', [
            'members' => $members,
            'memberCategories' => $memberCategories,
            'cities' => $cities,
            'filters' => $request->all() + ['per_page' => $perPage],
        ]);
    }

    /**
     * Show edit form.
     */
    public function edit(Request $request)
    {
        $user = CorporateMember::where('id', $request->id)
            ->with(['documents', 'profilePhoto', 'memberCategory', 'familyMembers.profilePhoto', 'businessDeveloper', 'professionInfo'])
            ->first();

        if (!$user) {
            return redirect()->route('corporate-membership.dashboard')->with('error', 'Corporate member not found.');
        }

        $user->profile_photo = $user->profilePhoto
            ? ['id' => $user->profilePhoto->id, 'file_path' => $user->profilePhoto->file_path]
            : null;

        // Format dates for frontend (DD-MM-YYYY format) before toArray()
        // For casted date fields, use getRawOriginal() to get raw database value
        // This prevents timezone-induced day shifts
        $formattedMembershipDate = $user->membership_date
            ? \Carbon\Carbon::parse($user->membership_date)->format('d-m-Y')
            : null;
        $formattedCardIssueDate = $user->card_issue_date
            ? \Carbon\Carbon::parse($user->card_issue_date)->format('d-m-Y')
            : null;
        // card_expiry_date is cast as 'date' - use getRawOriginal to avoid timezone issues
        $formattedCardExpiryDate = null;
        $rawCardExpiry = $user->getRawOriginal('card_expiry_date');
        if ($rawCardExpiry) {
            $formattedCardExpiryDate = \Carbon\Carbon::createFromFormat('Y-m-d', $rawCardExpiry)->format('d-m-Y');
        }
        // date_of_birth is cast as 'date' - use getRawOriginal to avoid timezone issues
        $formattedDateOfBirth = null;
        $rawDob = $user->getRawOriginal('date_of_birth');
        if ($rawDob) {
            $formattedDateOfBirth = \Carbon\Carbon::createFromFormat('Y-m-d', $rawDob)->format('d-m-Y');
        }

        $userData = $user->toArray();

        // Apply formatted dates
        $userData['membership_date'] = $formattedMembershipDate;
        $userData['card_issue_date'] = $formattedCardIssueDate;
        $userData['card_expiry_date'] = $formattedCardExpiryDate;
        $userData['date_of_birth'] = $formattedDateOfBirth;

        // Add business developer for form
        if ($user->businessDeveloper) {
            $userData['business_developer'] = [
                'id' => $user->businessDeveloper->id,
                'name' => $user->businessDeveloper->name,
                'label' => $user->businessDeveloper->name,
                'employee_id' => $user->businessDeveloper->employee_id,
            ];
        }

        // Format family members for the separate prop
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
                // 'martial_status' => $member->martial_status, // CorporateMember model might not have this, checking needed?
                'cnic' => $member->cnic,  // Ensure column name matches
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

        // Still keeping the nested loop for user["family_members"] if other parts need it,
        // OR we can rely on the prop. The previous code modified $userData['family_members'].
        // Let's keep $userData clean or matching the other controller.

        $membercategories = MemberCategory::select('id', 'name', 'description', 'fee', 'subscription_fee')
            ->where('status', 'active')
            ->where(function ($query) {
                $query->whereJsonContains('category_types', 'corporate');
            })
            ->get();

        return Inertia::render('App/Admin/CorporateMembership/CorporateMemberForm', compact('membercategories', 'familyMembers'))
            ->with(['user' => $userData]);
    }

    /**
     * Show member profile.
     */
    public function showMemberProfile($id)
    {
        $member = CorporateMember::with([
            'memberCategory',
            'profilePhoto',
            'documents',
            'familyMembers.profilePhoto',
            'professionInfo',
            'businessDeveloper',
        ])->findOrFail($id);

        return Inertia::render('App/Admin/CorporateMembership/ViewProfile', [
            'member' => $member,
        ]);
    }

    /**
     * Get family members for profile.
     */
    public function getFamilyMembers(Request $request, $id)
    {
        $perPage = $request->input('per_page', 10);

        $familyMembers = CorporateMember::where('parent_id', $id)
            ->with(['profilePhoto:id,mediable_id,mediable_type,file_path'])
            ->select('id', 'parent_id', 'full_name', 'membership_no', 'relation', 'gender', 'status', 'card_status', 'card_expiry_date', 'passport_no', 'nationality', 'martial_status', 'comment_box')
            ->paginate($perPage);

        return response()->json($familyMembers);
    }

    /**
     * Get All Corporate Family Members (Non-paginated) for Dropdown
     */
    public function getAllFamilyMembers(Request $request, $id)
    {
        $familyMembers = CorporateMember::where('parent_id', $id)
            ->select('id', 'parent_id', 'full_name', 'first_name', 'membership_no', 'relation', 'status')
            ->get();

        return response()->json($familyMembers);
    }

    /**
     * Get Profession Info for Corporate Member
     */
    public function getProfessionInfo($id)
    {
        $member = CorporateMember::with('professionInfo')->find($id);

        if (!$member) {
            return response()->json(['error' => 'Member not found'], 404);
        }

        return response()->json(['profession_info' => $member->professionInfo]);
    }

    /**
     * Store Step 4 (Next of Kin) for Corporate Member
     */
    public function storeStep4(Request $request)
    {
        try {
            $member = CorporateMember::find($request->member_id);
            if (!$member) {
                return response()->json(['error' => 'Member not found'], 404);
            }

            // Prepare data for MemberProfessionInfo
            // Note: CorporateMember uses MemberProfessionInfo via 'professionInfo' relationship
            // IMPORTANT: The migration '2025_12_26_180000_add_corporate_member_id_to_profession.php' adds corporate_member_id
            // and '2025_12_26_181500_make_member_id_nullable_in_profession.php' makes member_id nullable.
            $professionData = $request->except([
                'id',
                'created_at',
                'updated_at',
                'deleted_at',
                'created_by',
                'updated_by',
                'deleted_by',
                'member_id',  // Prevent overwriting member_id if it's passed
                'profession',  // Exclude fields that are not in the table
                'office_address',
                'office_phone',
                'referral_name',
            ]);

            // Explicitly set corporate_member_id and nullify member_id (since this is a corporate member)
            // But relying on relation create/update handles the foreign key for the relation (corporate_member_id via 'professionInfo')
            // However, checking the 'professionInfo' relation in CorporateMember model is key.
            // If relationship is `hasOne(MemberProfessionInfo::class, 'corporate_member_id')`, then creating via relation sets it automatically.

            // Ensure our new ID fields are included if passed
            $professionData['nominee_id'] = $request->nominee_id;
            $professionData['referral_member_id'] = $request->referral_member_id;
            $professionData['referral_is_corporate'] = $request->boolean('referral_is_corporate');

            // Update or Create MemberProfessionInfo
            if ($member->professionInfo) {
                $member->professionInfo->update($professionData);
            } else {
                // Creating via relationship automatically sets the foreign key defined in the relationship
                $member->professionInfo()->create($professionData);
            }

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Error saving corporate step 4: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save information: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Update corporate member.
     */
    public function update(Request $request, $id)
    {
        try {
            $member = CorporateMember::findOrFail($id);

            $validator = Validator::make($request->all(), [
                'membership_no' => 'nullable|string|unique:corporate_members,membership_no,' . $id,
                'personal_email' => 'nullable|email|unique:corporate_members,personal_email,' . $id,
                'barcode_no' => 'nullable|string|unique:corporate_members,barcode_no,' . $id,
                'cnic_no' => 'required|string|regex:/^\d{5}-\d{7}-\d{1}$/|unique:corporate_members,cnic_no,' . $id,
            ], [
                'membership_no.unique' => 'Membership number already exists.⚠️',
                'cnic_no.unique' => 'Corporate Member CNIC already exists.⚠️',
                'barcode_no.unique' => 'Barcode number already exists.⚠️',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            DB::beginTransaction();

            $fullName = trim(preg_replace('/\s+/', ' ', $request->title . ' ' . $request->first_name . ' ' . $request->middle_name . ' ' . $request->last_name));

            $member->update([
                'first_name' => $request->first_name,
                'barcode_no' => $request->barcode_no ?? null,
                'middle_name' => $request->middle_name,
                'last_name' => $request->last_name,
                'full_name' => $fullName,
                'martial_status' => $request->martial_status,
                'member_category_id' => $request->membership_category,
                'corporate_company_id' => $request->corporate_company_id,
                'membership_date' => $this->formatDateForDatabase($request->membership_date),
                'card_status' => $request->card_status,
                'status' => $request->status,
                'card_issue_date' => $this->formatDateForDatabase($request->card_issue_date),
                'card_expiry_date' => $this->formatDateForDatabase($request->card_expiry_date),
                'is_document_missing' => filter_var($request->is_document_missing ?? false, FILTER_VALIDATE_BOOLEAN),
                'missing_documents' => $request->missing_documents ?? null,
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

            // Handle profile photo update
            if ($request->hasFile('profile_photo')) {
                // Delete old photo
                $member->media()->where('type', 'profile_photo')->delete();

                $file = $request->file('profile_photo');
                $fileName = $file->getClientOriginalName();
                $mimeType = $file->getMimeType();
                $fileSize = $file->getSize();
                $filePath = FileHelper::saveImage($file, 'corporate_membership');

                $member->media()->create([
                    'type' => 'profile_photo',
                    'file_name' => $fileName,
                    'file_path' => $filePath,
                    'mime_type' => $mimeType,
                    'file_size' => $fileSize,
                    'disk' => 'public',
                ]);
            }

            // Handle new documents
            if ($request->hasFile('documents')) {
                foreach ($request->file('documents') as $file) {
                    $fileName = $file->getClientOriginalName();
                    $mimeType = $file->getMimeType();
                    $fileSize = $file->getSize();
                    $filePath = FileHelper::saveImage($file, 'corporate_member_documents');

                    $member->media()->create([
                        'type' => 'member_docs',
                        'file_name' => $fileName,
                        'file_path' => $filePath,
                        'mime_type' => $mimeType,
                        'file_size' => $fileSize,
                        'disk' => 'public',
                    ]);
                }
            }

            // Update Family Members
            if ($request->filled('family_members')) {
                foreach ($request->family_members as $newMemberData) {
                    // Check if family member is new
                    if (str_starts_with($newMemberData['id'], 'new-')) {
                        $familyMember = CorporateMember::create([
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
                            'card_status' => $newMemberData['card_status'],
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

                        $familyqrCodeData = route('member.profile', ['id' => $familyMember->id, 'type' => 'corporate']);

                        // Create QR code image and save it
                        $familyqrqrBinary = QrCode::format('png')->size(300)->generate($familyqrCodeData);
                        $qrImagePath = FileHelper::saveBinaryImage($familyqrqrBinary, 'qr_codes');

                        $familyMember->qr_code = $qrImagePath;
                        $familyMember->save();
                    } else {
                        // Update existing family member
                        $familyMember = CorporateMember::find($newMemberData['id']);
                        if ($familyMember) {
                            $familyMember->update([
                                'first_name' => $newMemberData['first_name'] ?? null,
                                'middle_name' => $newMemberData['middle_name'] ?? null,
                                'last_name' => $newMemberData['last_name'] ?? null,
                                'full_name' => $newMemberData['full_name'],
                                'barcode_no' => $newMemberData['barcode_no'] ?? null,
                                'personal_email' => $newMemberData['email'] ?? null,
                                'gender' => $newMemberData['gender'] ?? null,
                                'relation' => $newMemberData['relation'],
                                'date_of_birth' => $this->formatDateForDatabase($newMemberData['date_of_birth']),
                                'card_status' => $newMemberData['card_status'],
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

                            // Handle profile photo update
                            if (!empty($newMemberData['picture']) && $newMemberData['picture'] instanceof \Illuminate\Http\UploadedFile) {
                                $file = $newMemberData['picture'];

                                $fileName = $file->getClientOriginalName();
                                $mimeType = $file->getMimeType();
                                $fileSize = $file->getSize();

                                $filePath = FileHelper::saveImage($file, 'familymembers');

                                // Delete old photo
                                $oldPhoto = $familyMember->media()->where('type', 'profile_photo')->first();
                                if ($oldPhoto) {
                                    $oldPhoto->deleteFile();
                                    $oldPhoto->delete();
                                }

                                $familyMember->media()->create([
                                    'type' => 'profile_photo',
                                    'file_name' => $fileName,
                                    'file_path' => $filePath,
                                    'mime_type' => $mimeType,
                                    'file_size' => $fileSize,
                                    'disk' => 'public',
                                ]);
                            }
                        }
                    }
                }
            }

            DB::commit();

            return response()->json(['message' => 'Corporate Membership updated successfully.', 'member' => $member], 200);
        } catch (\Throwable $th) {
            DB::rollBack();
            Log::error('Error updating corporate member: ' . $th->getMessage());
            return response()->json(['error' => 'Failed to update corporate member: ' . $th->getMessage()], 500);
        }
    }

    /**
     * Delete corporate member.
     */
    public function destroy($id)
    {
        $member = CorporateMember::findOrFail($id);
        $member->delete();

        return response()->json(['message' => 'Corporate member deleted successfully.']);
    }

    /**
     * Show trashed members.
     */
    public function trashed(Request $request)
    {
        $perPage = (int) $request->integer('per_page', 25);
        if (!in_array($perPage, [10, 25, 50, 100], true)) {
            $perPage = 25;
        }

        $query = CorporateMember::onlyTrashed()->whereNull('parent_id');

        if ($request->filled('search')) {
            $search = trim((string) $request->search);
            $query->where(function ($q) use ($search) {
                $q
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('membership_no', 'like', "%{$search}%");
            });
        }

        $members = $query->orderBy('deleted_at', 'desc')->paginate($perPage)->withQueryString();

        return Inertia::render('App/Admin/CorporateMembership/TrashedCorporateMembers', [
            'members' => $members,
            'filters' => $request->only(['search', 'per_page']),
        ]);
    }

    /**
     * Restore trashed member.
     */
    public function restore($id)
    {
        $member = CorporateMember::withTrashed()->findOrFail($id);
        $member->restore();

        return redirect()->back()->with('success', 'Corporate member restored successfully.');
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

    private function generateInvoiceNumber()
    {
        $lastInvoice = FinancialInvoice::withTrashed()
            ->orderBy('invoice_no', 'desc')
            ->whereNotNull('invoice_no')
            ->first();

        $nextNumber = 1;
        if ($lastInvoice && $lastInvoice->invoice_no) {
            $nextNumber = $lastInvoice->invoice_no + 1;
        }

        while (FinancialInvoice::withTrashed()->where('invoice_no', $nextNumber)->exists()) {
            $nextNumber++;
        }

        return $nextNumber;
    }

    /**
     * Display a listing of corporate family members (archive).
     */
    public function familyMembersIndex(Request $request)
    {
        // Query Corporate Members where parent_id is not null
        $query = CorporateMember::whereNotNull('parent_id')->with(['parent:id,membership_no,first_name,last_name,full_name', 'profilePhoto']);

        // Membership No
        if ($request->filled('membership_no')) {
            $query->where('membership_no', 'like', '%' . $request->membership_no . '%');
        }

        // Name (own name)
        if ($request->filled('name')) {
            $name = $request->name;
            $query->where(function ($q) use ($name) {
                $q
                    ->where('first_name', 'like', '%' . $name . '%')
                    ->orWhere('last_name', 'like', '%' . $name . '%')
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $name . '%']);
            });
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
                $parentName = $request->parent_name;
                $q->where(function ($subQ) use ($parentName) {
                    $subQ
                        ->where('first_name', 'like', '%' . $parentName . '%')
                        ->orWhere('last_name', 'like', '%' . $parentName . '%')
                        ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ['%' . $parentName . '%']);
                });
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

        // Member Category
        if ($request->filled('member_category') && $request->member_category !== 'all') {
            $query->where('member_category_id', $request->member_category);
        }

        // Over 25 Age Checkbox
        if ($request->boolean('age_over_25')) {
            $query
                ->whereIn('relation', ['Son', 'Daughter'])
                ->whereDate('date_of_birth', '<=', Carbon::now()->subYears(25)->toDateString());
        }

        $familyGroups = $query->latest()->paginate(7)->withQueryString();

        // Add calculated age and expiry info to each member
        $familyGroups->getCollection()->transform(function ($member) {
            $member->calculated_age = $member->age ?? \Carbon\Carbon::parse($member->date_of_birth)->age;
            $member->should_expire = $member->shouldExpireByAge();
            $member->has_extension = $member->hasValidExtension();
            return $member;
        });

        // Get statistics
        $stats = [
            'total_family_members' => CorporateMember::whereNotNull('parent_id')->count(),
            'total_over_25' => CorporateMember::whereNotNull('parent_id')
                ->whereRaw('TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) >= 25')
                ->whereIn('relation', ['Son', 'Daughter'])
                ->count(),
            'expired_by_age' => CorporateMember::whereNotNull('parent_id')
                ->where('status', 'expired')
                ->whereIn('relation', ['Son', 'Daughter'])
                ->count(),
            'with_extensions' => CorporateMember::whereNotNull('parent_id')
                ->whereNotNull('expiry_extension_date')
                ->where('expiry_extension_date', '>', now())
                ->whereIn('relation', ['Son', 'Daughter'])
                ->count(),
        ];

        // Use MemberCategory for filter options
        $memberCategories = \App\Models\MemberCategory::select('id', 'name')->get();

        return Inertia::render('App/Admin/CorporateMembership/FamilyMembersArchive', [
            'familyGroups' => $familyGroups,
            'memberCategories' => $memberCategories,
            'filters' => $request->all(),
            'stats' => $stats,
        ]);
    }

    public function extendFamilyExpiry(Request $request, CorporateMember $corporateMember)
    {
        if (!Auth::user()->hasRole('super-admin')) {
            return response()->json([
                'error' => 'Only Super Admins can extend family member expiry dates.'
            ], 403);
        }

        if (!$corporateMember->isFamilyMember()) {
            return response()->json([
                'error' => 'This is not a family member.'
            ], 400);
        }

        if (!in_array(strtolower((string) ($corporateMember->relation ?? '')), ['son', 'daughter'], true)) {
            return response()->json([
                'error' => 'Expiry extension is only applicable to son and daughter.'
            ], 400);
        }

        $request->validate([
            'extension_date' => 'required|date_format:d-m-Y|after:today',
            'reason' => 'required|string|min:10|max:500',
        ]);

        try {
            $corporateMember->extendExpiry(
                $this->formatDateForDatabase($request->extension_date),
                $request->reason,
                Auth::id()
            );

            Log::info('Corporate family member expiry extended by super admin', [
                'member_id' => $corporateMember->id,
                'member_name' => $corporateMember->full_name,
                'extended_by' => Auth::user()->name,
                'extension_date' => $request->extension_date,
                'reason' => $request->reason,
            ]);

            return response()->json([
                'message' => 'Expiry date extended successfully.',
                'member' => $corporateMember->fresh(['expiryExtendedBy'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to extend corporate family member expiry', [
                'member_id' => $corporateMember->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'error' => 'Failed to extend expiry date. Please try again.'
            ], 500);
        }
    }

    public function bulkExpireFamily(Request $request)
    {
        if (!Auth::user()->hasRole('super-admin')) {
            return response()->json([
                'error' => 'Only Super Admins can perform bulk operations.'
            ], 403);
        }

        $request->validate([
            'member_ids' => 'required|array',
            'member_ids.*' => 'exists:corporate_members,id',
        ]);

        $expiredCount = 0;
        $errors = [];

        foreach ($request->member_ids as $memberId) {
            try {
                $member = CorporateMember::find($memberId);

                if ($member && $member->isFamilyMember() && $member->shouldExpireByAge()) {
                    $member->expireByAge('Manual expiry by Super Admin: ' . Auth::user()->name);
                    $expiredCount++;
                }
            } catch (\Exception $e) {
                $errors[] = "Failed to expire member ID {$memberId}: " . $e->getMessage();
            }
        }

        Log::info('Bulk corporate family member expiry by super admin', [
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

    /**
     * Search corporate members for autocomplete.
     */
    public function search(Request $request)
    {
        $query = $request->input('query');

        if (!$query) {
            return response()->json(['members' => []]);
        }

        $members = CorporateMember::whereNull('parent_id')
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

    /**
     * Update status of corporate member.
     */
    public function updateStatus(Request $request)
    {
        $request->validate([
            'member_id' => 'required|exists:corporate_members,id',
            'status' => 'required|in:active,suspended,cancelled,absent,expired,terminated,not_assign,in_suspension_process',
            'reason' => 'nullable|string',
            'duration_type' => 'required_if:status,suspended,absent|in:1Day,1Monthly,1Year,CustomDate',
            'custom_start_date' => 'required_if:duration_type,CustomDate|nullable|date',
            'custom_end_date' => 'required_if:duration_type,CustomDate|nullable|date|after:custom_start_date',
        ]);

        $member = CorporateMember::findOrFail($request->member_id);

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
                // 'paused_at' => $request->status === 'absent' ? now() : null,
            ]);

            // Update open-ended history
            $member->statusHistories()->whereNull('end_date')->update(['end_date' => now()]);

            // Create new history
            \App\Models\MemberStatusHistory::create([
                'corporate_member_id' => $member->id,
                'status' => $request->status,
                'reason' => $request->reason,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'created_by' => Auth::id(),
            ]);

            DB::commit();
            return response()->json(['message' => 'Status updated successfully']);
        } catch (\Exception $e) {
            Log::error('Corporate Status update failed', ['error' => $e->getMessage()]);
            DB::rollBack();
            return response()->json(['error' => 'Failed to update status'], 500);
        }
    }
}
