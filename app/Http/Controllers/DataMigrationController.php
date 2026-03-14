<?php

namespace App\Http\Controllers;

use App\Helpers\FileHelper;
use App\Models\CorporateMember;
use App\Models\FinancialInvoice;
use App\Models\FinancialInvoiceItem;
use App\Models\Media;
use App\Models\Member;
use App\Models\MemberCategory;
use App\Models\Transaction;
use App\Models\TransactionType;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class DataMigrationController extends Controller
{
    public function index()
    {
        // Get statistics for migration dashboard
        $stats = $this->getMigrationStats();

        return Inertia::render('App/Admin/DataMigration/Index', [
            'stats' => $stats
        ]);
    }

    public function getMigrationStats()
    {
        try {
            // Check if old tables exist
            $oldTablesExist = $this->checkOldTablesExist();

            if (!$oldTablesExist) {
                return [
                    'old_tables_exist' => false,
                    'message' => 'Old tables (memberships, mem_families) not found in database'
                ];
            }

            $oldMembersCount = DB::table('old_afohs.memberships')->count();
            $oldFamiliesCount = DB::table('old_afohs.mem_families')->count();
            $oldMediaCount = DB::table('old_afohs.old_media')->count();
            // Employee Stats
            $oldEmployeesCount = DB::table('old_afohs.hr_employments')->count();
            $newEmployeesCount = \App\Models\Employee::whereNotNull('old_employee_id')->count();

            // Department Stats
            $oldDepartmentsCount = DB::connection('old_afohs')->table('hr_departments')->count();
            $oldSubDepartmentsCount = DB::connection('old_afohs')->table('hr_sub_departments')->count();
            $newDepartmentsCount = \App\Models\Department::count();
            $newSubDepartmentsCount = \App\Models\Subdepartment::whereNotNull('department_id')->count();

            $newMembersCount = Member::whereNull('parent_id')->count();
            $newFamiliesCount = Member::whereNotNull('parent_id')->count();
            $newMediaCount = Media::count();
            // The line below was already present, but the instruction's block included it.
            // $newEmployeesCount = \App\Models\Employee::whereNotNull('old_employee_id')->count();

            // Check migration status
            $migratedMembersCount = Member::whereNull('parent_id')
                ->where('status', '!=', 'deleted')  // using status or just count all specific
                ->count();

            $migratedFamiliesCount = Member::whereNotNull('parent_id')
                ->whereNotNull('cnic_no')
                ->count();

            $migratedMediaCount = Media::whereNotNull('mediable_id')->count();

            $migratedMediaCount = Media::whereNotNull('mediable_id')->count();

            $pendingQrCodesCount = Member::whereNull('qr_code')->orWhere('qr_code', '')->count();

            return [
                'pending_qr_codes_count' => $pendingQrCodesCount,
                'old_tables_exist' => true,
                'old_members_count' => $oldMembersCount,
                'old_families_count' => $oldFamiliesCount,
                'old_media_count' => $oldMediaCount,
                'new_members_count' => $newMembersCount,
                'new_families_count' => $newFamiliesCount,
                'new_media_count' => $newMediaCount,
                'migrated_members_count' => $migratedMembersCount,
                'migrated_families_count' => $migratedFamiliesCount,
                'migrated_media_count' => $migratedMediaCount,
                'members_migration_percentage' => $oldMembersCount > 0 ? round(($migratedMembersCount / $oldMembersCount) * 100, 2) : 0,
                'families_migration_percentage' => $oldFamiliesCount > 0 ? round(($migratedFamiliesCount / $oldFamiliesCount) * 100, 2) : 0,
                'media_migration_percentage' => $oldMediaCount > 0 ? round(($migratedMediaCount / $oldMediaCount) * 100, 2) : 0,
                // Invoice Stats
                'old_invoices_count' => DB::connection('old_afohs')->table('finance_invoices')->whereIn('charges_type', [3, 4])->whereNotNull('member_id')->count(),
                'migrated_invoices_count' => FinancialInvoice::whereIn('invoice_type', ['membership', 'maintenance'])->count(),
                'invoices_migration_percentage' => DB::connection('old_afohs')->table('finance_invoices')->whereIn('charges_type', [3, 4])->whereNotNull('member_id')->count() > 0
                    ? round((FinancialInvoice::whereIn('invoice_type', ['membership', 'maintenance'])->count() / DB::connection('old_afohs')->table('finance_invoices')->whereIn('charges_type', [3, 4])->whereNotNull('member_id')->count()) * 100, 2)
                    : 0,
                // Corporate Stats
                'old_corporate_members_count' => DB::connection('old_afohs')->table('corporate_memberships')->count(),
                'old_corporate_families_count' => DB::connection('old_afohs')->table('corporate_mem_families')->count(),
                'corporate_members_count' => CorporateMember::whereNull('parent_id')->count(),
                'corporate_families_count' => CorporateMember::whereNotNull('parent_id')->count(),
                'corporate_members_migration_percentage' => DB::connection('old_afohs')->table('corporate_memberships')->count() > 0
                    ? round((CorporateMember::whereNull('parent_id')->count() / DB::connection('old_afohs')->table('corporate_memberships')->count()) * 100, 2)
                    : 0,
                'corporate_families_migration_percentage' => DB::connection('old_afohs')->table('corporate_mem_families')->count() > 0
                    ? round((CorporateMember::whereNotNull('parent_id')->count() / DB::connection('old_afohs')->table('corporate_mem_families')->count()) * 100, 2)
                    : 0,
                'pending_corporate_qr_codes_count' => CorporateMember::whereNull('qr_code')->orWhere('qr_code', '')->count(),
                // Customer Stats
                'old_customers_count' => DB::connection('old_afohs')->table('customers')->count(),
                'new_customers_count' => \App\Models\Customer::count(),
                'customers_migration_percentage' => DB::connection('old_afohs')->table('customers')->count() > 0
                    ? round((\App\Models\Customer::count() / DB::connection('old_afohs')->table('customers')->count()) * 100, 2)
                    : 0,
                // Employee Stats
                'old_employees_count' => $oldEmployeesCount,
                'new_employees_count' => $newEmployeesCount,
                'employees_migration_percentage' => $oldEmployeesCount > 0 ? round(($newEmployeesCount / $oldEmployeesCount) * 100, 2) : 0,
                // Department Stats
                'old_departments_count' => $oldDepartmentsCount,
                'new_departments_count' => $newDepartmentsCount,
                'departments_migration_percentage' => $oldDepartmentsCount > 0 ? round(($newDepartmentsCount / $oldDepartmentsCount) * 100, 2) : 0,
                'old_subdepartments_count' => $oldSubDepartmentsCount,
                'new_subdepartments_count' => $newSubDepartmentsCount,
                'subdepartments_migration_percentage' => $oldSubDepartmentsCount > 0 ? round(($newSubDepartmentsCount / $oldSubDepartmentsCount) * 100, 2) : 0,
                // Transaction Types Stats
                'old_transaction_types_count' => DB::connection('old_afohs')->table('trans_types')->count(),
                'migrated_transaction_types_count' => \App\Models\TransactionType::withTrashed()->count(),
                // Financial Invoices (All)
                'old_financial_invoices_count' => DB::connection('old_afohs')->table('finance_invoices')->distinct('invoice_no')->count('invoice_no'),
                'migrated_financial_invoices_count' => \App\Models\FinancialInvoice::withTrashed()->count(),
            ];
        } catch (\Exception $e) {
            Log::error('Error getting migration stats: ' . $e->getMessage());
            return [
                'old_tables_exist' => false,
                'error' => 'Error accessing database: ' . $e->getMessage()
            ];
        }
    }

    private function checkOldTablesExist()
    {
        try {
            $tables = DB::connection('old_afohs')->select("SHOW TABLES LIKE 'memberships'");
            $familyTables = DB::connection('old_afohs')->select("SHOW TABLES LIKE 'mem_families'");

            // Check for finance_invoices table in old database connection if possible, or just assume it exists if others do
            // Better to check explicitly if we can
            try {
                $invoiceTables = DB::select("SHOW TABLES LIKE 'finance_invoices'");
            } catch (\Exception $e) {
                $invoiceTables = [];  // Connection might fail or table might not exist
            }

            return !empty($tables) && !empty($familyTables);
        } catch (\Exception $e) {
            return false;
        }
    }

    public function migrateMembers(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            // Get batch of old members
            $oldMembers = DB::connection('old_afohs')
                ->table('memberships')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            Log::info("Processing batch: offset={$offset}, found " . count($oldMembers) . ' records');

            $migrated = 0;
            $errors = [];

            foreach ($oldMembers as $oldMember) {
                try {
                    $this->migrateSingleMember($oldMember);
                    $migrated++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'member_id' => $oldMember->id,
                        'application_no' => $oldMember->application_no ?? 'N/A',
                        'membership_no' => $oldMember->mem_no ?? 'N/A',
                        'name' => $oldMember->applicant_name ?? 'N/A',
                        'error' => $e->getMessage(),
                        'line' => $e->getLine(),
                        'file' => basename($e->getFile())
                    ];
                    Log::error("Error migrating member {$oldMember->id} ({$oldMember->applicant_name}): " . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migrated,
                'errors' => $errors,
                'has_more' => count($oldMembers) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Migration batch error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function migrateSingleMember($oldMember)
    {
        // Check if member already exists using old_member_id (mapped from id) first
        $existingMember = Member::where('old_member_id', $oldMember->id)
            ->whereNull('parent_id')
            ->first();

        // If not found by old_member_id, check by membership_no
        if (!$existingMember) {
            $existingMember = Member::whereNull('parent_id')
                ->where('membership_no', $oldMember->mem_no)
                ->first();
        }

        // Get member category ID
        $memberCategoryId = $this->getMemberCategoryId($oldMember->mem_category_id);

        // Prepare member data
        $memberData = [
            'old_member_id' => $oldMember->id,
            'membership_no' => $oldMember->mem_no,
            'membership_date' => $this->validateDate($oldMember->membership_date),
            // Map applicant_name to last_name as requested
            'last_name' => $oldMember->applicant_name,
            // Construct full name if possible, otherwise just use applicant_name
            'full_name' => trim(preg_replace('/\s+/', ' ', ($oldMember->title ?? '') . ' ' . ($oldMember->first_name ?? '') . ' ' . ($oldMember->middle_name ?? '') . ' ' . ($oldMember->applicant_name ?? ''))),
            'member_category_id' => $memberCategoryId,
            'member_type_id' => 10,  // Default to a specific type? Or should this be dynamic? Keeping 13 as per previous code.
            'classification_id' => $oldMember->mem_classification_id ?? null,
            'card_status' => $this->mapCardStatus($oldMember->card_status ?? null),
            'guardian_name' => $oldMember->father_name ?? null,
            'guardian_membership' => $oldMember->father_mem_no ?? null,
            'cnic_no' => $oldMember->cnic ?? null,
            'date_of_birth' => $this->validateDate($oldMember->date_of_birth),
            'gender' => $oldMember->gender ?? null,
            'education' => $oldMember->education ?? null,
            'ntn' => $oldMember->ntn ?? null,
            'reason' => $oldMember->reason ?? null,
            'blood_group' => $oldMember->blood_group ?? null,
            'mobile_number_a' => $oldMember->mob_a ?? null,
            'mobile_number_b' => $oldMember->mob_b ?? null,
            'tel_number_a' => $oldMember->tel_a ?? null,
            'tel_number_b' => $oldMember->tel_b ?? null,
            'personal_email' => $oldMember->personal_email ?? null,
            'critical_email' => $oldMember->official_email ?? null,
            'card_issue_date' => $this->validateDate($oldMember->card_issue_date),
            'barcode_no' => $oldMember->mem_barcode ?? null,
            'profile_photo' => $this->migrateProfilePhoto($oldMember->mem_picture ?? null),
            'status' => $this->mapMemberStatus($oldMember->active),
            'permanent_address' => $oldMember->per_address ?? null,
            'permanent_city' => $oldMember->per_city ?? null,
            'permanent_country' => $oldMember->per_country ?? null,
            'current_address' => $oldMember->cur_address ?? null,
            'current_city' => $oldMember->cur_city ?? null,
            'current_country' => $oldMember->cur_country ?? null,
            'card_expiry_date' => $this->validateDate($oldMember->card_exp),
            'active_remarks' => $oldMember->active_remarks ?? null,
            'from_date' => $this->validateDate($oldMember->from),
            'to_date' => $this->validateDate($oldMember->to),
            'emergency_name' => $oldMember->emergency_name ?? null,
            'emergency_relation' => $oldMember->emergency_relation ?? null,
            'emergency_contact' => $oldMember->emergency_contact ?? null,
            'passport_no' => $oldMember->passport_no ?? null,
            'title' => $oldMember->title ?? null,
            'first_name' => $oldMember->first_name ?? null,
            'middle_name' => $oldMember->middle_name ?? null,
            'name_comments' => $oldMember->name_comment ?? null,
            'kinship' => $oldMember->kinship ?? null,
            'coa_category_id' => $oldMember->coa_category_id ?? null,
            'nationality' => $oldMember->nationality ?? null,
            // Timestamps handled separately to ensure they are preserved and not overwritten
            // Fee Fields Mapping
            'membership_fee' => $this->sanitizeCurrency($oldMember->mem_fee),
            'additional_membership_charges' => $this->sanitizeCurrency($oldMember->additional_mem),
            'membership_fee_additional_remarks' => $oldMember->additional_mem_remarks ?? null,
            'membership_fee_discount' => $this->sanitizeCurrency($oldMember->mem_discount),
            'membership_fee_discount_remarks' => $oldMember->mem_discount_remarks ?? null,
            'total_membership_fee' => $this->sanitizeCurrency($oldMember->total),
            'maintenance_fee' => $this->sanitizeCurrency($oldMember->maintenance_amount),
            'additional_maintenance_charges' => $this->sanitizeCurrency($oldMember->additional_mt),
            'maintenance_fee_additional_remarks' => $oldMember->additional_mt_remarks ?? null,
            'maintenance_fee_discount' => $this->sanitizeCurrency($oldMember->mt_discount),
            'maintenance_fee_discount_remarks' => $oldMember->mt_discount_remarks ?? null,
            'total_maintenance_fee' => $this->sanitizeCurrency($oldMember->total_maintenance),
            'per_day_maintenance_fee' => $this->sanitizeCurrency($oldMember->maintenance_per_day),
            // Ignoring application_no as requested
            // 'application_number' => $oldMember->application_no,
        ];

        $timestamps = [
            'created_at' => $this->validateDate($oldMember->created_at),
            'updated_at' => $this->validateDate($oldMember->updated_at),
            'deleted_at' => $this->validateDate($oldMember->deleted_at),
        ];

        // Create or Update
        if ($existingMember) {
            $existingMember->fill($memberData);
            $existingMember->forceFill($timestamps);
            $existingMember->timestamps = false;  // Prevent auto-update of updated_at
            $existingMember->save();
            Log::info("Updated existing member {$existingMember->id} (Old ID: {$oldMember->id})");
        } else {
            $member = new Member($memberData);
            $member->forceFill($timestamps);
            $member->timestamps = false;  // Prevent auto-set of created_at/updated_at
            $member->save();
        }
    }

    public function migrateFamilies(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            // Get batch of old family members
            $oldFamilies = DB::connection('old_afohs')
                ->table('mem_families')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            $migrated = 0;
            $errors = [];

            foreach ($oldFamilies as $oldFamily) {
                try {
                    $this->migrateSingleFamily($oldFamily);
                    $migrated++;
                } catch (\Exception $e) {
                    // Get parent membership number for better error tracking
                    $parentMembershipNo = $oldFamily->membership_number;

                    $errors[] = [
                        'family_id' => $oldFamily->id,
                        'member_id' => $oldFamily->member_id ?? 'N/A',
                        'parent_membership_no' => $parentMembershipNo,
                        'family_membership_no' => $oldFamily->sup_card_no ?? 'N/A',
                        'name' => ($oldFamily->title ?? '') . ' ' . ($oldFamily->first_name ?? '') . ' ' . ($oldFamily->middle_name ?? ''),
                        'error' => $e->getMessage(),
                        'line' => $e->getLine(),
                        'file' => basename($e->getFile())
                    ];
                    Log::error("Error migrating family member {$oldFamily->id} ({$oldFamily->name}): " . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migrated,
                'errors' => $errors,
                'has_more' => count($oldFamilies) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Family migration batch error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function migrateSingleFamily($oldFamily)
    {
        // Find parent member by old_member_id instead of application_no
        $parentMember = Member::where('old_member_id', $oldFamily->member_id)
            ->whereNull('parent_id')
            ->first();

        if (!$parentMember) {
            throw new \Exception("Parent member not found for family member ID: {$oldFamily->id}");
        }

        // Check if family member already exists using old_family_id
        $existingFamily = Member::where('old_family_id', $oldFamily->id)
            ->first();

        // Generate unique membership number for family member
        $familyMembershipNo = $oldFamily->sup_card_no;

        // Prepare family member data
        $familyData = [
            'old_family_id' => $oldFamily->id,
            'parent_id' => $parentMember->id,
            'full_name' => trim(preg_replace('/\s+/', ' ', ($oldFamily->title ?? '') . ' ' . ($oldFamily->first_name ?? '') . ' ' . ($oldFamily->middle_name ?? '') . ' ' . ($oldFamily->name ?? ''))),
            'first_name' => $oldFamily->first_name,
            'middle_name' => $oldFamily->middle_name,
            // Map applicant_name to last_name as requested
            'last_name' => $oldFamily->name,
            'date_of_birth' => $this->validateDate($oldFamily->date_of_birth),
            'relation' => $this->mapFamilyRelation($oldFamily->fam_relationship),
            'nationality' => $oldFamily->nationality,
            'cnic_no' => $oldFamily->cnic,
            'mobile_number_a' => $oldFamily->contact,
            'martial_status' => $oldFamily->maritial_status,
            'gender' => $oldFamily->gender ?? null,
            'membership_no' => $familyMembershipNo,
            'card_status' => $this->mapCardStatus($oldFamily->card_status),
            'status' => $this->mapMemberStatus($oldFamily->status),
            'card_issue_date' => $this->validateDate($oldFamily->sup_card_issue),
            'card_expiry_date' => $this->validateDate($oldFamily->sup_card_exp),
            'barcode_no' => $oldFamily->sup_barcode,
        ];

        $timestamps = [
            'created_at' => $this->validateDate($oldFamily->created_at),
            'updated_at' => $this->validateDate($oldFamily->updated_at),
            'deleted_at' => $this->validateDate($oldFamily->deleted_at),
            'created_by' => $oldFamily->created_by,
            'updated_by' => $oldFamily->updated_by,
            'deleted_by' => $oldFamily->deleted_by,
        ];

        // Create or Update
        if ($existingFamily) {
            $existingFamily->fill($familyData);
            $existingFamily->forceFill($timestamps);
            $existingFamily->timestamps = false;  // Prevent auto-update of updated_at
            $existingFamily->save();
            Log::info("Updated existing family member {$existingFamily->id} (Old ID: {$oldFamily->id})");
        } else {
            $family = new Member($familyData);
            $family->forceFill($timestamps);
            $family->timestamps = false;  // Prevent auto-set of created_at/updated_at
            $family->save();
        }
    }

    private function getMemberCategoryId($oldCategoryId)
    {
        // Check if oldCategoryId has valid data before querying
        if (empty($oldCategoryId) || is_null($oldCategoryId)) {
            Log::info('getMemberCategoryId: oldCategoryId is empty or null');
            return null;
        }

        // Check if it's a valid numeric ID
        if (!is_numeric($oldCategoryId)) {
            Log::info("getMemberCategoryId: oldCategoryId is not numeric: {$oldCategoryId}");
            return null;
        }

        try {
            // Get old category data
            $oldCategory = DB::table('mem_categories')->where('id', $oldCategoryId)->first();

            if (!$oldCategory) {
                return null;
            }

            // Find matching new category by name
            $newCategory = MemberCategory::where('name', $oldCategory->unique_code)->first();

            return $newCategory ? $newCategory->id : null;
        } catch (\Exception $e) {
            Log::error('getMemberCategoryId: Database error - ' . $e->getMessage());
            return null;
        }
    }

    private function mapCardStatus($oldStatus)
    {
        // Check if oldStatus has valid data before mapping
        if (empty($oldStatus) || is_null($oldStatus)) {
            return 'Not Applicable';
        }

        $statusMap = [
            'issued' => 'Issued',
            'not_applicable' => 'Not Applicable',
            'in_process' => 'In-Process',
            'printed' => 'Printed',
            'received' => 'Received',
            're_printed' => 'Re-Printed',
            'e_card_issued' => 'E-Card Issued',
        ];

        return $statusMap[strtolower($oldStatus)] ?? 'Not Applicable';
    }

    private function mapMemberStatus($oldStatus)
    {
        // Check if oldStatus has valid data before querying
        if (empty($oldStatus) || is_null($oldStatus)) {
            return 'active';  // Default status
        }

        // Check if it's a valid numeric ID
        if (!is_numeric($oldStatus)) {
            return 'active';  // Default status for non-numeric values
        }

        // Get status from mem_statuses table
        try {
            $status = DB::table('old_afohs.mem_statuses')->where('id', $oldStatus)->first();

            if ($status) {
                // Map status name to new enum values
                $statusMap = [
                    'active' => 'active',
                    'expired' => 'expired',
                    'suspended' => 'suspended',
                    'terminated' => 'terminated',
                    'absent' => 'absent',
                    'cancelled' => 'cancelled',
                    'not assign' => 'not_assign',
                    'manual inactive' => 'suspended',
                    'not qualified' => 'not_assign',
                    'transferred' => 'terminated',
                    'in suspension process' => 'in_suspension_process',
                ];

                $mappedStatus = $statusMap[strtolower($status->desc)] ?? null;

                if ($mappedStatus === null) {
                    Log::error("mapMemberStatus: Status '{$status->desc}' (ID: {$oldStatus}) not found in mapping");
                    throw new \Exception("Status '{$status->desc}' (ID: {$oldStatus}) not found in mapping. Please add mapping for this status.");
                }

                return $mappedStatus;
            } else {
                Log::error("mapMemberStatus: Status ID {$oldStatus} not found in mem_statuses table");
                throw new \Exception("Status ID {$oldStatus} not found in mem_statuses table.");
            }
        } catch (\Exception $e) {
            Log::error('Error mapping member status: ' . $e->getMessage());
            throw $e;  // Re-throw the exception to be caught by migration error handling
        }
    }

    private function mapFamilyRelation($oldRelation)
    {
        // Check if oldRelation has valid data before querying
        if (empty($oldRelation) || is_null($oldRelation)) {
            Log::info('mapFamilyRelation: oldRelation is empty or null');
            return null;
        }

        // Check if it's a valid numeric ID
        if (!is_numeric($oldRelation)) {
            Log::info("mapFamilyRelation: oldRelation is not numeric: {$oldRelation}");
            return $oldRelation;  // Return as-is if it's already a string relation
        }

        // Get relation from mem_relations table
        try {
            $relation = DB::table('mem_relations')->where('id', $oldRelation)->first();

            if ($relation) {
                return $relation->desc;
            } else {
                Log::info("mapFamilyRelation: No relation found for ID: {$oldRelation}");
                return $oldRelation;
            }
        } catch (\Exception $e) {
            Log::error('mapFamilyRelation: Database error - ' . $e->getMessage());
            return $oldRelation;
        }
    }

    private function migrateProfilePhoto($oldPhotoPath)
    {
        if (!$oldPhotoPath) {
            return null;
        }

        // Only change the path name, don't move or save files
        // Convert: public/upload/xxxxx.png to tenants/default/membership/xxxxx.png
        return 'tenants/default/membership/' . basename($oldPhotoPath);
    }

    private function migrateFamilyPhoto($oldPhotoPath)
    {
        if (!$oldPhotoPath) {
            return null;
        }

        // Only change the path name, don't move or save files
        // Convert: public/familymemberupload/xxxxx.png to tenants/default/familymembers/xxxxx.png
        return 'tenants/default/familymembers/' . basename($oldPhotoPath);
    }

    public function resetMigration(Request $request)
    {
        try {
            DB::beginTransaction();

            // Disable foreign key checks temporarily
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Force delete all migrated data (bypass soft delete) - first delete family members (children), then primary members
            // Get all family members including soft deleted ones and force delete them
            $familyMembers = Member::withTrashed()->whereNotNull('parent_id')->get();
            foreach ($familyMembers as $familyMember) {
                $familyMember->forceDelete();
            }

            // Get all primary members including soft deleted ones and force delete them
            $primaryMembers = Member::withTrashed()->whereNull('parent_id')->get();
            foreach ($primaryMembers as $primaryMember) {
                $primaryMember->forceDelete();
            }

            // Reset auto-increment counter to start from 1
            DB::statement('ALTER TABLE members AUTO_INCREMENT = 1;');

            // DB::truncate('members');

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            DB::commit();

            Log::info('Migration data reset completed - all records permanently deleted');

            return response()->json([
                'success' => true,
                'message' => 'Migration data reset successfully - all records permanently deleted'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            // Make sure to re-enable foreign key checks even on error
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            } catch (\Exception $fkError) {
                Log::error('Error re-enabling foreign key checks: ' . $fkError->getMessage());
            }

            Log::error('Reset migration error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function resetFamiliesOnly(Request $request)
    {
        try {
            DB::beginTransaction();

            // Disable foreign key checks temporarily
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Force delete only family members (children), keep primary members
            $familyMembers = Member::withTrashed()->whereNotNull('parent_id')->get();
            foreach ($familyMembers as $familyMember) {
                $familyMember->forceDelete();
            }

            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');

            DB::commit();

            Log::info('Family members reset completed - all family member records permanently deleted');

            return response()->json([
                'success' => true,
                'message' => 'Family members reset successfully - all family member records permanently deleted'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            // Make sure to re-enable foreign key checks even on error
            try {
                DB::statement('SET FOREIGN_KEY_CHECKS=1;');
            } catch (\Exception $fkError) {
                Log::error('Error re-enabling foreign key checks: ' . $fkError->getMessage());
            }

            Log::error('Reset families error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteProfilePhotos(Request $request)
    {
        try {
            DB::beginTransaction();

            // Delete all media records where type is 'profile_photo' (including soft deleted ones)
            $mediaRecords = \App\Models\Media::withTrashed()->where('type', 'profile_photo')->get();
            $deletedCount = $mediaRecords->count();

            foreach ($mediaRecords as $media) {
                $media->forceDelete();  // Permanently delete including soft deleted records
            }

            DB::commit();

            Log::info('Profile photos deletion completed', [
                'deleted_count' => $deletedCount
            ]);

            return response()->json([
                'success' => true,
                'message' => "Profile photos deleted successfully - {$deletedCount} records removed",
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Delete profile photos error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function validateMigration()
    {
        try {
            $validation = [
                'members_count_match' => false,
                'families_count_match' => false,
                'sample_data_integrity' => [],
                'errors' => []
            ];

            // Count validation
            $oldMembersCount = DB::table('memberships')->count();
            $oldFamiliesCount = DB::table('mem_families')->count();
            $newMembersCount = Member::whereNull('parent_id')->count();
            $newFamiliesCount = Member::whereNotNull('parent_id')->count();

            $validation['members_count_match'] = $oldMembersCount == $newMembersCount;
            $validation['families_count_match'] = $oldFamiliesCount == $newFamiliesCount;

            // Sample data integrity check
            $sampleOldMembers = DB::table('memberships')->limit(5)->get();
            foreach ($sampleOldMembers as $oldMember) {
                $newMember = Member::where('application_no', $oldMember->application_no)->first();

                if ($newMember) {
                    $validation['sample_data_integrity'][] = [
                        'old_id' => $oldMember->id,
                        'new_id' => $newMember->id,
                        'name_match' => $oldMember->applicant_name == $newMember->full_name,
                        'membership_no_match' => $oldMember->mem_no == $newMember->membership_no,
                        'cnic_match' => $oldMember->cnic == $newMember->cnic_no,
                    ];
                } else {
                    $validation['errors'][] = "Member not found: {$oldMember->application_no}";
                }
            }

            return response()->json($validation);
        } catch (\Exception $e) {
            Log::error('Validation error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function validateDate($date)
    {
        // Handle null or empty dates
        if (empty($date) || is_null($date)) {
            return null;
        }

        $date = is_string($date) ? trim($date) : $date;

        // Handle invalid dates like '0000-00-00' or '0000-00-00 00:00:00'
        if (strpos($date, '0000-00-00') === 0) {
            return null;
        }

        try {
            if (is_string($date) && preg_match('/^\d{1,2}\/\d{1,2}\/\d{4}(?:\s+\d{1,2}:\d{2}(?::\d{2})?)?$/', $date)) {
                $formats = [
                    'd/m/Y H:i:s',
                    'd/m/Y H:i',
                    'd/m/Y',
                    'm/d/Y H:i:s',
                    'm/d/Y H:i',
                    'm/d/Y',
                ];

                $carbonDate = null;
                $matchedFormat = null;
                foreach ($formats as $fmt) {
                    try {
                        $carbonDate = Carbon::createFromFormat($fmt, $date);
                        $matchedFormat = $fmt;
                        break;
                    } catch (\Throwable $e) {
                    }
                }

                if (!$carbonDate) {
                    return null;
                }

                if ($matchedFormat && strpos($matchedFormat, 'H:i:s') === false && strpos($matchedFormat, 'H:i') === false) {
                    $carbonDate = $carbonDate->startOfDay();
                } elseif ($matchedFormat && strpos($matchedFormat, 'H:i') !== false && strpos($matchedFormat, 'H:i:s') === false) {
                    $carbonDate = $carbonDate->setSecond(0);
                }
            } else {
                $carbonDate = Carbon::parse($date);
                if (is_string($date) && !preg_match('/\d{1,2}:\d{2}/', $date)) {
                    $carbonDate = $carbonDate->startOfDay();
                }
            }

            // Check if the date is valid (not year 0 or before 1900)
            if ($carbonDate->year < 1800) {
                return null;
            }

            return $carbonDate->format('Y-m-d H:i:s');
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function resolveNonNullDate(...$candidates)
    {
        foreach ($candidates as $candidate) {
            $validated = $this->validateDate($candidate);
            if (!empty($validated)) {
                return $validated;
            }
        }

        return now()->format('Y-m-d H:i:s');
    }

    public function migrateCustomers(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            // Get batch of old customers from old_afohs database
            $oldCustomers = DB::table('old_afohs.customers')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            $migrated = 0;
            $errors = [];

            foreach ($oldCustomers as $oldCustomer) {
                try {
                    $this->migrateSingleCustomer($oldCustomer);
                    $migrated++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'customer_id' => $oldCustomer->id,
                        'customer_name' => $oldCustomer->customer_name ?? 'N/A',
                        'error' => $e->getMessage(),
                    ];
                    Log::error("Error migrating customer {$oldCustomer->id}: " . $e->getMessage());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migrated,
                'errors' => $errors,
                'has_more' => count($oldCustomers) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Customer migration batch error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function migrateSingleCustomer($oldCustomer)
    {
        // Check if customer already exists using old_customer_id
        $existingCustomer = \App\Models\Customer::where('old_customer_id', $oldCustomer->id)->first();

        if ($existingCustomer) {
            return;  // Skip if already migrated
        }

        // Map data
        $customerData = [
            'old_customer_id' => $oldCustomer->id,
            'customer_no' => $oldCustomer->customer_no,
            'name' => $oldCustomer->customer_name,
            'address' => $oldCustomer->customer_address,
            'cnic' => $oldCustomer->customer_cnic,
            'contact' => $oldCustomer->customer_contact,
            'email' => $oldCustomer->customer_email,
            'guest_type_id' => !empty($oldCustomer->guest_type) && $oldCustomer->guest_type > 0 ? $oldCustomer->guest_type : null,
            'member_name' => $oldCustomer->member_name,
            'member_no' => $oldCustomer->mem_no,
            'account' => $oldCustomer->account,
            'affiliate' => $oldCustomer->affiliate,
            'gender' => $oldCustomer->gender,
            'created_by' => $oldCustomer->created_by,
            'updated_by' => $oldCustomer->updated_by,
            'deleted_by' => $oldCustomer->deleted_by,
            'created_at' => $this->validateDate($oldCustomer->created_at),
            'updated_at' => $this->validateDate($oldCustomer->updated_at),
            'deleted_at' => $this->validateDate($oldCustomer->deleted_at),
        ];

        \App\Models\Customer::create($customerData);
    }

    public function migrateCorporateMembers(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            $oldMembers = DB::connection('old_afohs')
                ->table('corporate_memberships')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            $migrated = 0;
            $errors = [];

            foreach ($oldMembers as $oldMember) {
                try {
                    $this->migrateSingleCorporateMember($oldMember);
                    $migrated++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'member_id' => $oldMember->id,
                        'application_no' => $oldMember->application_no ?? 'N/A',
                        'membership_no' => $oldMember->mem_no ?? 'N/A',
                        'name' => $oldMember->applicant_name ?? 'N/A',
                        'error' => $e->getMessage(),
                        'line' => $e->getLine(),
                        'file' => basename($e->getFile())
                    ];
                    Log::error("Error migrating corporate member {$oldMember->id}: " . $e->getMessage());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migrated,
                'errors' => $errors,
                'has_more' => count($oldMembers) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Corporate Migration batch error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function migrateSingleCorporateMember($oldMember)
    {
        // Check if member already exists using old_member_id
        $existingMember = CorporateMember::where('old_member_id', $oldMember->id)
            ->whereNull('parent_id')
            ->first();

        // If not found by old_member_id, check by membership_no
        if (!$existingMember) {
            $existingMember = CorporateMember::whereNull('parent_id')
                ->where('membership_no', $oldMember->mem_no)
                ->first();
        }

        // Get member category ID
        $memberCategoryId = $this->getMemberCategoryId($oldMember->mem_category_id);

        // Map Corporate Company
        $corporateCompanyId = isset($oldMember->corporate_company) ? $oldMember->corporate_company : null;

        // Prepare member data
        $memberData = [
            'old_member_id' => $oldMember->id,
            // 'application_number' => $oldMember->application_no, // Ignored as per request
            'membership_no' => $oldMember->mem_no,
            'membership_date' => $this->validateDate($oldMember->membership_date),
            'last_name' => $oldMember->applicant_name,
            'full_name' => trim(preg_replace('/\s+/', ' ', ($oldMember->title ?? '') . ' ' . ($oldMember->first_name ?? '') . ' ' . ($oldMember->middle_name ?? '') . ' ' . ($oldMember->applicant_name ?? ''))),
            'member_category_id' => $memberCategoryId,
            'corporate_company_id' => $corporateCompanyId,
            'card_status' => $this->mapCardStatus($oldMember->card_status ?? null),
            'guardian_name' => $oldMember->father_name ?? null,
            'guardian_membership' => $oldMember->father_mem_no ?? null,
            'cnic_no' => $oldMember->cnic ?? null,
            'date_of_birth' => $this->validateDate($oldMember->date_of_birth),
            'gender' => $oldMember->gender ?? null,
            'education' => $oldMember->education ?? null,
            'ntn' => $oldMember->ntn ?? null,
            'reason' => $oldMember->reason ?? null,
            'blood_group' => $oldMember->blood_group ?? null,
            'mobile_number_a' => $oldMember->mob_a ?? null,
            'mobile_number_b' => $oldMember->mob_b ?? null,
            'tel_number_a' => $oldMember->tel_a ?? null,
            'tel_number_b' => $oldMember->tel_b ?? null,
            'personal_email' => $oldMember->personal_email ?? null,
            'critical_email' => $oldMember->official_email ?? null,
            'card_issue_date' => $this->validateDate($oldMember->card_issue_date),
            'barcode_no' => $oldMember->mem_barcode ?? null,
            'profile_photo' => $this->migrateProfilePhoto($oldMember->mem_picture ?? null),
            'status' => $this->mapMemberStatus($oldMember->active),
            'permanent_address' => $oldMember->per_address ?? null,
            'permanent_city' => $oldMember->per_city ?? null,
            'permanent_country' => $oldMember->per_country ?? null,
            'current_address' => $oldMember->cur_address ?? null,
            'current_city' => $oldMember->cur_city ?? null,
            'current_country' => $oldMember->cur_country ?? null,
            'card_expiry_date' => $this->validateDate($oldMember->card_exp),
            'active_remarks' => $oldMember->active_remarks ?? null,
            'from_date' => $this->validateDate($oldMember->from),
            'to_date' => $this->validateDate($oldMember->to),
            'emergency_name' => $oldMember->emergency_name ?? null,
            'emergency_relation' => $oldMember->emergency_relation ?? null,
            'emergency_contact' => $oldMember->emergency_contact ?? null,
            'passport_no' => $oldMember->passport_no ?? null,
            'title' => $oldMember->title ?? null,
            'first_name' => $oldMember->first_name ?? null,
            'middle_name' => $oldMember->middle_name ?? null,
            'name_comments' => $oldMember->name_comment ?? null,
            'kinship' => $oldMember->kinship ?? null,
            'coa_category_id' => $oldMember->coa_category_id ?? null,
            'nationality' => $oldMember->nationality ?? null,
            // Fee Fields Mapping
            'membership_fee' => $this->sanitizeCurrency($oldMember->mem_fee),
            'additional_membership_charges' => $this->sanitizeCurrency($oldMember->additional_mem),
            'membership_fee_additional_remarks' => $oldMember->additional_mem_remarks ?? null,
            'membership_fee_discount' => $this->sanitizeCurrency($oldMember->mem_discount),
            'membership_fee_discount_remarks' => $oldMember->mem_discount_remarks ?? null,
            'total_membership_fee' => $this->sanitizeCurrency($oldMember->total),
            'maintenance_fee' => $this->sanitizeCurrency($oldMember->maintenance_amount),
            'additional_maintenance_charges' => $this->sanitizeCurrency($oldMember->additional_mt),
            'maintenance_fee_additional_remarks' => $oldMember->additional_mt_remarks ?? null,
            'maintenance_fee_discount' => $this->sanitizeCurrency($oldMember->mt_discount),
            'maintenance_fee_discount_remarks' => $oldMember->mt_discount_remarks ?? null,
            'total_maintenance_fee' => $this->sanitizeCurrency($oldMember->total_maintenance),
            'per_day_maintenance_fee' => $this->sanitizeCurrency($oldMember->maintenance_per_day),
        ];

        $timestamps = [
            'created_at' => $this->validateDate($oldMember->created_at),
            'updated_at' => $this->validateDate($oldMember->updated_at),
            'deleted_at' => $this->validateDate($oldMember->deleted_at),
        ];

        if ($existingMember) {
            $existingMember->fill($memberData);
            $existingMember->forceFill($timestamps);
            $existingMember->timestamps = false;
            $existingMember->save();
            Log::info("Updated existing corporate member {$existingMember->id} (Old ID: {$oldMember->id})");
        } else {
            $member = new CorporateMember($memberData);
            $member->forceFill($timestamps);
            $member->timestamps = false;
            $member->save();
        }
    }

    public function migrateCorporateFamilies(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            $oldFamilies = DB::table('old_afohs.corporate_mem_families')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            $migrated = 0;
            $errors = [];

            foreach ($oldFamilies as $oldFamily) {
                try {
                    $this->migrateSingleCorporateFamily($oldFamily);
                    $migrated++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'family_id' => $oldFamily->id,
                        'name' => ($oldFamily->title ?? '') . ' ' . ($oldFamily->first_name ?? ''),
                        'error' => $e->getMessage()
                    ];
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migrated,
                'errors' => $errors,
                'has_more' => count($oldFamilies) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Corporate Family migration batch error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function migrateSingleCorporateFamily($oldFamily)
    {
        // Find parent member
        $parentMember = CorporateMember::where('old_member_id', $oldFamily->member_id)
            ->whereNull('parent_id')
            ->first();

        if (!$parentMember) {
            throw new \Exception("Parent corporate member not found (old_member_id: {$oldFamily->member_id})");
        }

        // Check if family member already exists
        $existingFamily = CorporateMember::where('old_family_id', $oldFamily->id)
            ->first();

        if ($existingFamily) {
            return;
        }

        $familyMembershipNo = $oldFamily->sup_card_no;

        $familyData = [
            'old_family_id' => $oldFamily->id,
            'parent_id' => $parentMember->id,
            'full_name' => trim(preg_replace('/\s+/', ' ', $oldFamily->title . ' ' . $oldFamily->first_name . ' ' . $oldFamily->middle_name)),
            'first_name' => $oldFamily->first_name,
            'middle_name' => $oldFamily->middle_name,
            'date_of_birth' => $this->validateDate($oldFamily->date_of_birth),
            'relation' => $this->mapFamilyRelation($oldFamily->fam_relationship),
            'nationality' => $oldFamily->nationality,
            'cnic_no' => $oldFamily->cnic,
            'mobile_number_a' => $oldFamily->contact,
            'martial_status' => $oldFamily->maritial_status,
            'gender' => $oldFamily->gender ?? null,
            'membership_no' => $familyMembershipNo,
            'card_status' => $this->mapCardStatus($oldFamily->card_status),
            'card_issue_date' => $this->validateDate($oldFamily->sup_card_issue),
            'card_expiry_date' => $this->validateDate($oldFamily->sup_card_exp),
            'barcode_no' => $oldFamily->sup_barcode,
            'status' => $this->mapMemberStatus($oldFamily->status),
            'created_at' => $this->validateDate($oldFamily->created_at),
            'updated_at' => $this->validateDate($oldFamily->updated_at),
            'deleted_at' => $this->validateDate($oldFamily->deleted_at),
            'created_by' => $oldFamily->created_by,
            'updated_by' => $oldFamily->updated_by,
            'deleted_by' => $oldFamily->deleted_by,
        ];

        CorporateMember::create($familyData);
    }

    public function migrateMedia(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            // Get batch of old media records
            $oldMediaRecords = DB::table('old_afohs.old_media')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            Log::info("Processing media batch: offset={$offset}, found " . count($oldMediaRecords) . ' records');

            if ($oldMediaRecords->isEmpty()) {
                DB::commit();
                return response()->json([
                    'success' => true,
                    'processed' => 0,
                    'message' => 'No more media records to migrate'
                ]);
            }

            $processed = 0;
            $errors = [];

            foreach ($oldMediaRecords as $oldMedia) {
                try {
                    // Map trans_type to new type
                    $typeMapping = [
                        3 => 'profile_photo',  // Member profile photos
                        90 => 'member_docs',  // Member documents
                        100 => 'profile_photo',  // Family member profile photos
                    ];

                    $newType = $typeMapping[$oldMedia->trans_type] ?? null;

                    if (!$newType) {
                        Log::warning("Unknown trans_type: {$oldMedia->trans_type} for media ID: {$oldMedia->id}");
                        continue;
                    }

                    // Find the new member ID based on trans_type and old ID
                    $newMemberId = null;

                    if ($oldMedia->trans_type == 3 || $oldMedia->trans_type == 90) {
                        // For member photos and documents, check old_member_id
                        $member = Member::where('old_member_id', $oldMedia->trans_type_id)->first();
                        $newMemberId = $member ? $member->id : null;
                    } elseif ($oldMedia->trans_type == 100) {
                        // For family member photos, check old_family_id
                        $member = Member::where('old_family_id', $oldMedia->trans_type_id)->first();
                        $newMemberId = $member ? $member->id : null;
                    }

                    // Skip if member not found
                    if (!$newMemberId) {
                        Log::warning("Member not found for media ID: {$oldMedia->id}, trans_type: {$oldMedia->trans_type}, trans_type_id: {$oldMedia->trans_type_id}");
                        $errors[] = [
                            'media_id' => $oldMedia->id,
                            'error' => "Member not found (trans_type: {$oldMedia->trans_type}, old_id: {$oldMedia->trans_type_id})"
                        ];
                        continue;
                    }

                    // Transform file path based on trans_type
                    $newFilePath = $this->transformMediaPath($oldMedia->url, $oldMedia->trans_type);
                    $fileName = basename($newFilePath);

                    // Determine mediable_type based on trans_type
                    $mediableType = 'App\Models\Member';

                    // Get MIME type from file extension
                    $mimeType = $this->getMimeTypeFromPath($newFilePath);

                    // Create new media record
                    Media::create([
                        'mediable_type' => $mediableType,
                        'mediable_id' => $newMemberId,  // Use the mapped new member ID
                        'type' => $newType,
                        'file_name' => $fileName,
                        'file_path' => $newFilePath,
                        'mime_type' => $mimeType,
                        'disk' => 'public',
                        'created_at' => $this->validateDate($oldMedia->created_at),
                        'updated_at' => $this->validateDate($oldMedia->updated_at),
                        'deleted_at' => $this->validateDate($oldMedia->deleted_at),
                        'created_by' => $oldMedia->created_by,
                        'updated_by' => $oldMedia->updated_by,
                        'deleted_by' => $oldMedia->deleted_by,
                    ]);

                    $processed++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'media_id' => $oldMedia->id,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Error migrating media ID {$oldMedia->id}: " . $e->getMessage());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'processed' => $processed,
                'errors' => $errors,
                'has_more' => count($oldMediaRecords) === $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Media migration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function transformMediaPath($oldUrl, $transType)
    {
        // Remove 'public/' prefix if exists
        $cleanUrl = str_replace('public/', '', $oldUrl);

        // Extract original filename
        $originalFileName = basename($cleanUrl);

        // Map trans_type to new directory structure
        switch ($transType) {
            case 3:  // Member profile photos
                return '/tenants/default/membership/' . $originalFileName;
            case 90:  // Member documents
                return '/tenants/default/member_documents/' . $originalFileName;
            case 100:  // Family member profile photos
                return '/tenants/default/familymembers/' . $originalFileName;
            default:
                return '/tenants/default/media/' . $originalFileName;
        }
    }

    private function getMimeTypeFromPath($path)
    {
        $extension = strtolower(pathinfo($path, PATHINFO_EXTENSION));

        $mimeTypes = [
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'png' => 'image/png',
            'gif' => 'image/gif',
            'pdf' => 'application/pdf',
            'doc' => 'application/msword',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xls' => 'application/vnd.ms-excel',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }

    private function sanitizeCurrency($value)
    {
        if (is_null($value)) {
            return 0;
        }
        // Remove commas and convert to float
        return (float) str_replace(',', '', $value);
    }

    public function generateQrCodes(Request $request)
    {
        $batchSize = $request->get('batch_size', 50);  // Smaller batch size for image generation
        $offset = $request->get('offset', 0);

        try {
            // Get batch of members without QR codes
            // We use skip/take logic, but since we are updating records, the "offset" strategy
            // might be tricky if we re-query "whereNull" every time (the list shrinks).
            // However, the frontend sends an increasing offset.
            // IF the frontend sends offset 0, 100, 200... then we should NOT use "whereNull" with offset,
            // because the first 100 would be fixed, and the next 100 would be the *new* first 100.
            //
            // BETTER STRATEGY: The frontend logic in Index.jsx uses a fixed offset loop?
            // Let's look at Index.jsx... it passes `offset`.
            // If I use `whereNull`, I should ALWAYS use offset 0 if I'm processing a queue.
            // BUT, if the user wants to resume or if we want to show progress based on total,
            // it's safer to just query *all* members and check if they need update, OR
            // rely on the frontend to handle the "progress" visualization but the backend to just "take next batch".
            //
            // User asked: "only those create which has not"
            //
            // If I use `whereNull(...)->limit($batchSize)->get()`, I get the next batch of pending ones.
            // I don't need `offset` from the request if I'm always grabbing the "next pending".
            // BUT, if the frontend sends offset, and I ignore it, the progress bar math might be weird if it relies on offset.
            //
            // Let's stick to: Query ALL members, but only process those with missing QR codes?
            // No, that's inefficient.
            //
            // Correct approach for "Queue" processing:
            // Always take the first N records that match the "Pending" criteria.
            // Ignore the 'offset' parameter for the query itself, OR use it if we are iterating through a fixed list.
            // Since we are modifying the state (adding QR code), the "Pending" list shrinks.
            // So `offset` should effectively be 0 for the query.

            $members = Member::where(function ($query) {
                $query
                    ->whereNull('qr_code')
                    ->orWhere('qr_code', '');
            })
                ->limit($batchSize)
                ->get();

            Log::info('Processing QR code batch: found ' . count($members) . ' records');

            if ($members->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'processed' => 0,
                    'message' => 'No more members pending QR codes',
                    'has_more' => false
                ]);
            }

            $processed = 0;
            $errors = [];

            foreach ($members as $member) {
                try {
                    $qrCodeData = route('member.profile', ['id' => $member->id]);

                    // Create QR code image
                    $qrBinary = QrCode::format('png')->size(300)->generate($qrCodeData);

                    // Save it
                    $qrImagePath = FileHelper::saveBinaryImage($qrBinary, 'qr_codes');

                    // Update member
                    $member->qr_code = $qrImagePath;
                    $member->save();

                    $processed++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'member_id' => $member->id,
                        'name' => $member->full_name,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Error generating QR for member {$member->id}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'processed' => $processed,
                'errors' => $errors,
                'has_more' => count($members) == $batchSize
            ]);
        } catch (\Exception $e) {
            Log::error('QR Code generation batch error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function generateCorporateQrCodes(Request $request)
    {
        $batchSize = $request->get('batch_size', 50);

        try {
            $members = CorporateMember::where(function ($query) {
                $query
                    ->whereNull('qr_code')
                    ->orWhere('qr_code', '');
            })
                ->limit($batchSize)
                ->get();

            Log::info('Processing Corporate QR code batch: found ' . count($members) . ' records');

            if ($members->isEmpty()) {
                return response()->json([
                    'success' => true,
                    'processed' => 0,
                    'message' => 'No more corporate members pending QR codes',
                    'has_more' => false
                ]);
            }

            $processed = 0;
            $errors = [];

            foreach ($members as $member) {
                try {
                    $qrCodeData = route('member.profile', ['id' => $member->id, 'type' => 'corporate']);

                    // Create QR code image
                    $qrBinary = QrCode::format('png')->size(300)->generate($qrCodeData);

                    // Save it
                    $qrImagePath = FileHelper::saveBinaryImage($qrBinary, 'qr_codes');

                    // Update member
                    $member->qr_code = $qrImagePath;
                    $member->save();

                    $processed++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'member_id' => $member->id,
                        'name' => $member->full_name,
                        'error' => $e->getMessage()
                    ];
                    Log::error("Error generating Corporate QR for member {$member->id}: " . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'processed' => $processed,
                'errors' => $errors,
                'has_more' => count($members) == $batchSize
            ]);
        } catch (\Exception $e) {
            Log::error('Corporate QR Code generation batch error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function migrateEmployees(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            $oldEmployees = DB::table('old_afohs.hr_employments')
                ->offset($offset)
                ->limit($batchSize)
                ->get();

            $migrated = 0;
            $errors = [];

            foreach ($oldEmployees as $oldEmployee) {
                try {
                    $this->migrateSingleEmployee($oldEmployee);
                    $migrated++;
                } catch (\Exception $e) {
                    $errors[] = [
                        'old_id' => $oldEmployee->id,
                        'name' => $oldEmployee->name ?? 'N/A',
                        'error' => $e->getMessage(),
                    ];
                    Log::error("Error migrating employee {$oldEmployee->id}: " . $e->getMessage());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migrated,
                'errors' => $errors,
                'has_more' => count($oldEmployees) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Employee migration batch error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function migrateSingleEmployee($oldEmployee)
    {
        // Check if exists
        $existing = \App\Models\Employee::where('old_employee_id', $oldEmployee->id)->first();

        if ($existing) {
            return;
        }

        $employeeData = [
            'old_employee_id' => $oldEmployee->id,
            'employee_id' => $oldEmployee->barcode ?: 'OLD-' . $oldEmployee->id,
            'name' => $oldEmployee->name,
            'father_name' => $oldEmployee->father_name,
            'national_id' => $oldEmployee->cnic,
            'phone_no' => $oldEmployee->mob_a,
            'mob_b' => $oldEmployee->mob_b,
            'tel_a' => $oldEmployee->tel_a,
            'tel_b' => $oldEmployee->tel_b,
            'email' => !empty($oldEmployee->email) ? $oldEmployee->email : null,
            'address' => $oldEmployee->cur_address,
            'cur_city' => $oldEmployee->cur_city,
            'cur_country' => $oldEmployee->cur_country,
            'per_address' => $oldEmployee->per_address,
            'per_city' => $oldEmployee->per_city,
            'per_country' => $oldEmployee->per_country,
            'gender' => $oldEmployee->gender,
            'age' => $oldEmployee->age,
            'license' => $oldEmployee->license,
            'license_no' => $oldEmployee->license_no,
            'bank_details' => $oldEmployee->bank_details,
            'account_no' => $oldEmployee->account,  // Map account -> account_no
            'vehicle_details' => $oldEmployee->vehicle_details,
            'learn_of_org' => $oldEmployee->learn_of_org,
            'anyone_in_org' => $oldEmployee->anyone_in_org,
            'crime' => $oldEmployee->crime,
            'crime_details' => $oldEmployee->crime_details,
            'company' => $oldEmployee->company,
            'remarks' => $oldEmployee->remarks,
            'salary' => $oldEmployee->current_salary,  // Map current_salary -> salary
            'total_salary' => $oldEmployee->total_salary,
            'total_addon_charges' => $oldEmployee->total_addon_charges,
            'total_deduction_charges' => $oldEmployee->total_deduction_charges,
            'days' => $oldEmployee->days,
            'hours' => $oldEmployee->hours,
            'joining_date' => $oldEmployee->date_of_joining,
            'barcode' => $oldEmployee->barcode,
            'designation' => $oldEmployee->designation,
            'old_department' => $oldEmployee->department,  // Map string
            'old_subdepartment' => $oldEmployee->subdepartment,  // Map string
            'created_by' => $oldEmployee->created_by,
            'updated_by' => $oldEmployee->updated_by,
            'deleted_by' => $oldEmployee->deleted_by,
            'created_at' => $this->validateDate($oldEmployee->created_at),
            'updated_at' => $this->validateDate($oldEmployee->updated_at),
            'deleted_at' => $this->validateDate($oldEmployee->deleted_at),
        ];

        \App\Models\Employee::create($employeeData);
    }

    public function migrateFinancials(Request $request)
    {
        $stats = [
            'transaction_types' => 0,
            'invoices' => 0,
            'receipts' => 0,
            'transactions' => 0,
            'errors' => []
        ];

        try {
            DB::beginTransaction();

            $stats['transaction_types'] = $this->migrateTransactionTypes();
            $stats['receipts'] = $this->migrateReceipts();
            $stats['invoices'] = $this->migrateInvoices();
            $stats['transactions'] = $this->migrateTransactions();

            // Relations are handled within transactions or separately if needed.
            // Based on plan, we can migrate relations here too.
            $this->migrateTransactionRelations();

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Financials migrated successfully', 'stats' => $stats]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => 'Migration failed: ' . $e->getMessage() . ' Line: ' . $e->getLine(), 'trace' => $e->getTraceAsString()], 500);
        }
    }

    public function migrateDepartmentsAndSubdepartments(Request $request)
    {
        try {
            DB::beginTransaction();

            // 1. Migrate Departments
            $oldDepartments = DB::connection('old_afohs')->table('hr_departments')->get();
            $deptMap = [];  // old_id => new_id

            $departmentsMigrated = 0;
            foreach ($oldDepartments as $oldDept) {
                // Check if already exists by name (desc) to avoid duplicates
                $dept = \App\Models\Department::firstOrCreate(
                    ['name' => $oldDept->desc],  // Mapped from 'desc'
                    [
                        'created_by' => $oldDept->created_by ?? null,  // Assuming column exists or null
                        'updated_by' => $oldDept->updated_by ?? null,
                        'deleted_by' => $oldDept->deleted_by ?? null,
                        'created_at' => $this->validateDate($oldDept->created_at),
                        'updated_at' => $this->validateDate($oldDept->updated_at),
                        'deleted_at' => $this->validateDate($oldDept->deleted_at),
                    ]
                );

                // Map old ID to new ID
                $deptMap[$oldDept->id] = $dept->id;
                $departmentsMigrated++;
            }

            // 2. Migrate Subdepartments
            $oldSubDepartments = DB::connection('old_afohs')->table('hr_sub_departments')->get();
            $subDeptMap = [];  // old_id => new_id

            $subDepartmentsMigrated = 0;
            foreach ($oldSubDepartments as $oldSub) {
                // 'department' column is the FK in old table
                $newDeptId = $deptMap[$oldSub->department] ?? null;

                if (!$newDeptId) {
                    Log::warning("Skipping Subdepartment {$oldSub->desc} (Old ID: {$oldSub->id}) - Parent Old Dept ID {$oldSub->department} not found.");
                    continue;
                }

                $subDept = \App\Models\Subdepartment::firstOrCreate(
                    [
                        'name' => $oldSub->desc,  // Mapped from 'desc'
                        'department_id' => $newDeptId
                    ],
                    [
                        'created_by' => $oldSub->created_by ?? null,
                        'updated_by' => $oldSub->updated_by ?? null,
                        'deleted_by' => $oldSub->deleted_by ?? null,
                        'created_at' => $this->validateDate($oldSub->created_at),
                        'updated_at' => $this->validateDate($oldSub->updated_at),
                        'deleted_at' => $this->validateDate($oldSub->deleted_at),
                    ]
                );

                $subDeptMap[$oldSub->id] = $subDept->id;
                $subDepartmentsMigrated++;
            }

            // 3. Link Employees
            // Fetch employees who have old_department set
            $employees = \App\Models\Employee::whereNotNull('old_department')->orWhereNotNull('old_subdepartment')->get();

            $employeesLinked = 0;
            foreach ($employees as $employee) {
                $updated = false;

                // Link Department
                if ($employee->old_department && isset($deptMap[$employee->old_department])) {
                    $employee->department_id = $deptMap[$employee->old_department];
                    $updated = true;
                }

                // Link Subdepartment
                if ($employee->old_subdepartment && isset($subDeptMap[$employee->old_subdepartment])) {
                    $employee->subdepartment_id = $subDeptMap[$employee->old_subdepartment];
                    $updated = true;
                }

                if ($updated) {
                    $employee->save();
                    $employeesLinked++;
                }
            }

            // 3. Data Migration: Move strings to Designations table
            $employees = DB::table('employees')->select('id', 'designation')->whereNotNull('designation')->where('designation', '!=', '')->get();
            $designationMap = [];

            foreach ($employees as $employee) {
                $designationName = trim($employee->designation);
                if (empty($designationName))
                    continue;

                if (!isset($designationMap[$designationName])) {
                    $id = null;
                    $existing = DB::table('designations')->where('name', $designationName)->first();

                    if ($existing) {
                        $id = $existing->id;
                    } else {
                        try {
                            $id = DB::table('designations')->insertGetId([
                                'name' => $designationName,
                                'status' => 'active',
                                'created_at' => now(),
                                'updated_at' => now()
                            ]);
                        } catch (\Exception $e) {
                            // Fallback if concurrency or case sensitivity causes duplicate error
                            $id = DB::table('designations')->where('name', $designationName)->value('id');
                        }
                    }
                    $designationMap[$designationName] = $id;
                }

                DB::table('employees')->where('id', $employee->id)->update([
                    'designation_id' => $designationMap[$designationName]
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Departments and Subdepartments migrated and employees linked successfully.',
                'stats' => [
                    'departments_migrated' => $departmentsMigrated,
                    'subdepartments_migrated' => $subDepartmentsMigrated,
                    'employees_linked' => $employeesLinked
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Department migration error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function migrateTransactionTypesPublic(Request $request)
    {
        try {
            DB::beginTransaction();
            $count = $this->migrateTransactionTypes();
            DB::commit();

            // Get total count for progress
            $total = DB::connection('old_afohs')->table('trans_types')->count();

            return response()->json([
                'success' => true,
                'message' => 'Transaction Types migrated successfully',
                'migrated' => $count,
                'total' => $total
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private function migrateReceipts()
    {
        $oldReceipts = DB::connection('old_afohs')->table('finance_cash_receipts')->get();
        $count = 0;

        foreach ($oldReceipts as $old) {
            if (\App\Models\FinancialReceipt::where('id', $old->id)->exists())
                continue;

            $payer = null;
            if ($old->member_id) {
                $payer = \App\Models\Member::where('old_member_id', $old->member_id)->first();
            } elseif ($old->corporate_id) {
                $payer = \App\Models\CorporateMember::where('old_member_id', $old->corporate_id)->first();  // Use old_member_id as per plan
            } elseif ($old->customer_id) {
                $payer = \App\Models\Customer::where('old_customer_id', $old->customer_id)->first();
            }

            \App\Models\FinancialReceipt::create([
                'id' => $old->id,  // Preserve ID
                'receipt_no' => $old->id,
                'amount' => $old->total ?? 0,
                'payment_method' => $old->account == 1 ? 'Cash' : ($old->account == 2 ? 'Bank' : 'Other'),
                'receipt_date' => $this->validateDate($old->invoice_date),
                'payer_type' => $payer ? get_class($payer) : null,
                'payer_id' => $payer ? $payer->id : null,
                'remarks' => $old->remarks,
                'created_at' => $this->validateDate($old->created_at),
                'updated_at' => $this->validateDate($old->updated_at),
            ]);
            $count++;
        }
        return $count;
    }

    private function migrateInvoices()
    {
        // Group by invoice_no - Include deleted records
        $oldInvoices = DB::connection('old_afohs')
            ->table('finance_invoices')
            ->orderBy('id')
            ->get()
            ->groupBy('invoice_no');

        $count = 0;

        foreach ($oldInvoices as $invoiceNo => $rows) {
            $first = $rows->first();

            // Check if already migrated
            if (\App\Models\FinancialInvoice::where('invoice_no', $invoiceNo)->withTrashed()->exists())
                continue;

            $memberId = null;
            $corporateMemberId = null;
            $customerId = null;

            if ($first->member_id) {
                $member = \App\Models\Member::where('old_member_id', $first->member_id)->withTrashed()->first();
                $memberId = $member ? $member->id : null;
            } elseif ($first->corporate_id) {
                $corp = \App\Models\CorporateMember::where('old_member_id', $first->corporate_id)->withTrashed()->first();
                $corporateMemberId = $corp ? $corp->id : null;
            } elseif ($first->customer_id) {
                $cust = \App\Models\Customer::where('old_customer_id', $first->customer_id)->withTrashed()->first();
                $customerId = $cust ? $cust->id : null;
            }

            // Create Header
            $invoice = \App\Models\FinancialInvoice::create([
                'invoice_no' => $invoiceNo,
                'member_id' => $memberId,
                'corporate_member_id' => $corporateMemberId,
                'customer_id' => $customerId,
                'issue_date' => $this->validateDate($first->invoice_date),
                // period_start and period_end removed as per request (exist in items)
                'total_price' => $rows->sum('grand_total'),
                'remarks' => $first->comments,
                'status' => 'unpaid',
                'created_at' => $this->validateDate($first->created_at),
                'updated_at' => $this->validateDate($first->updated_at),
                'deleted_at' => $first->deleted_at ? $this->validateDate($first->deleted_at) : null,
            ]);

            // Create Items
            foreach ($rows as $row) {
                $familyMember = null;
                if ($row->family) {
                    $familyMember = \App\Models\Member::where('old_family_id', $row->family)->first();
                }

                $feeTypeMap = [
                    3 => 'membership_fee',
                    4 => 'maintenance_fee',
                ];
                $feeType = $feeTypeMap[$row->charges_type] ?? 'other';

                $taxAmount = ($row->sub_total * ($row->tax_percentage ?? 0)) / 100;

                \App\Models\FinancialInvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'fee_type' => $feeType,
                    'description' => $row->comments,
                    'qty' => $row->qty ?? 1,
                    'amount' => $row->charges_amount ?? 0,
                    'sub_total' => $row->sub_total ?? 0,
                    'total' => $row->grand_total ?? 0,
                    'tax_percentage' => $row->tax_percentage ?? 0,
                    'tax_amount' => $taxAmount,
                    'discount_amount' => $row->discount_amount ?? 0,
                    'discount_details' => $row->discount_details,
                    'start_date' => $this->validateDate($row->start_date),
                    'end_date' => $this->validateDate($row->end_date),
                    'family_member_id' => $familyMember ? $familyMember->id : null,
                    'additional_charges' => $row->extra_charges,
                    'remarks' => $row->comments,  // Redundant but requested
                    'data' => [
                        'per_day_amount' => $row->per_day_amount,
                        'days' => $row->days,
                        'extra_details' => $row->extra_details,
                        'tax_details' => $row->tax_details,
                    ]
                ]);
            }
            $count++;
        }
        return $count;
    }

    public function migrateInvoicesPublic(Request $request)
    {
        $batchSize = $request->get('batch_size', 50);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            // Get all unique invoice numbers for this batch
            $invoiceNos = DB::connection('old_afohs')
                ->table('finance_invoices')
                ->select('invoice_no')
                ->distinct()
                ->orderBy('invoice_no')
                ->offset($offset)
                ->limit($batchSize)
                ->pluck('invoice_no')
                ->toArray();

            $migrated = 0;
            $errors = [];

            if (!empty($invoiceNos)) {
                // Fetch rows for this chunk of invoices
                $rows = DB::connection('old_afohs')
                    ->table('finance_invoices')
                    ->whereIn('invoice_no', $invoiceNos)
                    ->orderBy('id')
                    ->get();

                $grouped = $rows->groupBy('invoice_no');

                foreach ($grouped as $invoiceNo => $groupRows) {
                    try {
                        $first = $groupRows->first();

                        // Check if already migrated
                        if (\App\Models\FinancialInvoice::where('invoice_no', $invoiceNo)->withTrashed()->exists())
                            continue;

                        $memberId = null;
                        $corporateMemberId = null;
                        $customerId = null;

                        if ($first->member_id) {
                            $member = \App\Models\Member::where('old_member_id', $first->member_id)->withTrashed()->first();
                            $memberId = $member ? $member->id : null;
                        } elseif ($first->corporate_id) {
                            $corp = \App\Models\CorporateMember::where('old_member_id', $first->corporate_id)->withTrashed()->first();
                            $corporateMemberId = $corp ? $corp->id : null;
                        } elseif ($first->customer_id) {
                            $cust = \App\Models\Customer::where('old_customer_id', $first->customer_id)->withTrashed()->first();
                            $customerId = $cust ? $cust->id : null;
                        }

                        // Create Header
                        $invoice = \App\Models\FinancialInvoice::create([
                            'invoice_no' => $invoiceNo,
                            'member_id' => $memberId,
                            'corporate_member_id' => $corporateMemberId,
                            'customer_id' => $customerId,
                            'name' => $first->name,  // Mapped from old table
                            'mem_no' => $first->mem_no,
                            'address' => $first->address,
                            'contact' => $first->contact,
                            'cnic' => $first->cnic,
                            'email' => $first->email,
                            'coa_code' => $first->coa_code,
                            'invoice_type' => $first->invoice_type,  // Mapped from old table (nullable now)
                            'issue_date' => $this->validateDate($first->invoice_date),
                            'total_price' => $groupRows->sum('grand_total'),
                            'remarks' => $first->comments,
                            'status' => 'unpaid',
                            'created_at' => $this->validateDate($first->created_at),
                            'updated_at' => $this->validateDate($first->updated_at),
                            'deleted_at' => $first->deleted_at ? $this->validateDate($first->deleted_at) : null,
                        ]);

                        // Create Items
                        foreach ($groupRows as $row) {
                            $familyMember = null;
                            if ($row->family) {
                                $familyMember = \App\Models\Member::where('old_family_id', $row->family)->withTrashed()->first();
                            }

                            $feeTypeMap = [
                                3 => 'membership_fee',
                                4 => 'maintenance_fee',
                                1 => 'guest_fee',
                                11 => 'subscription_fee'
                            ];

                            $chargeTypeId = null;
                            if (array_key_exists($row->charges_type, $feeTypeMap)) {
                                $feeType = $feeTypeMap[$row->charges_type];
                            } elseif (!empty($row->charges_type)) {
                                $feeType = (string) $row->charges_type;
                                $chargeTypeId = $row->charges_type;
                            } else {
                                $feeType = 'general';
                            }

                            $taxAmount = ($row->sub_total * ($row->tax_percentage ?? 0)) / 100;

                            \App\Models\FinancialInvoiceItem::create([
                                'invoice_id' => $invoice->id,
                                'fee_type' => $feeType,
                                'financial_charge_type_id' => $chargeTypeId,
                                'description' => $row->comments,
                                'qty' => $row->qty ?? 1,
                                'amount' => $row->charges_amount ?? 0,
                                'sub_total' => $row->sub_total ?? 0,
                                'total' => $row->grand_total ?? 0,
                                'tax_percentage' => $row->tax_percentage ?? 0,
                                'tax_amount' => $taxAmount,
                                'discount_amount' => $row->discount_amount ?? 0,
                                'discount_details' => $row->discount_details,
                                'discount_type' => 'percent',
                                'discount_value' => $row->discount_percentage ?? 0,
                                'start_date' => $this->validateDate($row->start_date),
                                'end_date' => $this->validateDate($row->end_date),
                                'family_member_id' => $familyMember ? $familyMember->id : null,
                                'additional_charges' => $row->extra_charges ?? 0,
                                'extra_percentage' => $row->extra_percentage ?? 0,
                                'overdue_percentage' => $row->overdue_percentage ?? 0,
                                'remarks' => $row->comments,
                                'data' => [
                                    'per_day_amount' => $row->per_day_amount,
                                    'days' => $row->days,
                                    'extra_details' => $row->extra_details,
                                    'tax_details' => $row->tax_details,
                                ]
                            ]);
                        }
                        $migrated++;
                    } catch (\Exception $e) {
                        $errors[] = [
                            'invoice_no' => $invoiceNo,
                            'error' => $e->getMessage()
                        ];
                    }
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migrated,
                'errors' => $errors,
                'has_more' => count($invoiceNos) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    private function migrateTransactions()
    {
        $count = 0;

        DB::connection('old_afohs')
            ->table('transactions')
            ->orderBy('id')
            ->chunk(1000, function ($oldTrans) use (&$count) {
                foreach ($oldTrans as $t) {
                    $payable = null;
                    if ($t->trans_moc) {
                        $payable = \App\Models\Member::where('old_member_id', $t->trans_moc)->first();
                        if (!$payable)
                            $payable = \App\Models\CorporateMember::where('old_member_id', $t->trans_moc)->first();
                        if (!$payable)
                            $payable = \App\Models\Customer::where('old_customer_id', $t->trans_moc)->first();
                    }

                    $referenceType = null;
                    $referenceId = null;

                    if ($t->debit_or_credit == 0) {
                        // Invoice (Debit)
                        $oldInvoiceRow = DB::connection('old_afohs')->table('finance_invoices')->where('id', $t->trans_type_id)->first();
                        if ($oldInvoiceRow) {
                            $newInvoice = \App\Models\FinancialInvoice::where('invoice_no', $oldInvoiceRow->invoice_no)->first();
                            if ($newInvoice) {
                                $referenceType = \App\Models\FinancialInvoice::class;
                                $referenceId = $newInvoice->id;
                            }
                        }
                    } else {
                        // Receipt (Credit)
                        if ($t->receipt_id) {
                            $newReceipt = \App\Models\FinancialReceipt::find($t->receipt_id);
                            if ($newReceipt) {
                                $referenceType = \App\Models\FinancialReceipt::class;
                                $referenceId = $newReceipt->id;
                            }
                        }
                    }

                    Transaction::create([
                        'amount' => $t->trans_amount,
                        'type' => $t->debit_or_credit == 0 ? 'credit' : 'debit',
                        'payable_type' => $payable ? get_class($payable) : null,
                        'payable_id' => $payable ? $payable->id : null,
                        'reference_type' => $referenceType,
                        'reference_id' => $referenceId,
                        'date' => $this->resolveNonNullDate($t->date, $t->created_at, $t->updated_at),
                        'created_at' => $this->validateDate($t->created_at),
                        'updated_at' => $this->validateDate($t->updated_at),
                    ]);
                    $count++;
                }
            });

        return $count;
    }

    public function getOldTransactionTypesPublic()
    {
        try {
            $types = DB::connection('old_afohs')
                ->table('trans_types')
                ->select('id', 'name')
                ->orderBy('id')
                ->get();
            return response()->json($types);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getPendingInvoicesCount(Request $request)
    {
        $typeId = $request->get('type_id');
        if (!$typeId) {
            return response()->json(['count' => 0]);
        }

        try {
            // Count invoices in old db with this charge type
            // Note: Invoices are grouped by invoice_no, so we count distinct invoice_no
            $count = DB::connection('old_afohs')
                ->table('finance_invoices')
                ->where('charges_type', $typeId)
                ->distinct('invoice_no')
                ->count('invoice_no');

            // Check established count (optional, but good for UI "Pending" logic)
            // But getting exact "pending" (Old - New) is hard without mapping every single one.
            // For now, return Total Old Records count for that type.
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Atomic Deep Migration for Invoices
     */
    public function migrateInvoicesDeep(Request $request)
    {
        $batchSize = $request->get('batch_size', 50);
        $oldTransTypeId = $request->get('old_trans_type_id');

        if (!$oldTransTypeId) {
            return response()->json(['success' => false, 'error' => 'Transaction Type ID required'], 400);
        }

        try {
            DB::beginTransaction();

            // 1. Fetch Batch of Invoices
            // We need to find invoices that are NOT yet migrated.
            // Complex to check "not migrated" efficiently in SQL across DBs.
            // Strategy: Get chunk from old DB, check existence in foreach.
            // To make "chunk" effective (skipping already processed), we might need offset.
            // But if we simply iterate all, it's slow.
            // Better: User provides offset from frontend loop.

            $offset = $request->get('offset', 0);

            $invoiceNos = DB::connection('old_afohs')
                ->table('finance_invoices')
                ->where('charges_type', $oldTransTypeId)
                ->select('invoice_no')
                ->distinct()
                ->orderBy('invoice_no')
                ->offset($offset)
                ->limit($batchSize)
                ->pluck('invoice_no')
                ->toArray();

            if (empty($invoiceNos)) {
                DB::commit();
                return response()->json(['success' => true, 'migrated' => 0, 'has_more' => false]);
            }

            $rows = DB::connection('old_afohs')
                ->table('finance_invoices')
                ->whereIn('invoice_no', $invoiceNos)
                ->get();

            $grouped = $rows->groupBy('invoice_no');
            $migratedCount = 0;
            $errors = [];

            foreach ($grouped as $invoiceNo => $groupRows) {
                try {
                    // Check if exists
                    if (FinancialInvoice::where('invoice_no', $invoiceNo)->exists()) {
                        continue;
                    }

                    $first = $groupRows->first();

                    // --- A. Migrate Invoice Header & Items (and return Items map) ---
                    // Modified to return invoice AND items array
                    $result = $this->createInvoiceFromLegacy($first, $groupRows, $oldTransTypeId);
                    $invoice = $result['invoice'];
                    $itemsMap = $result['items_map'];  // [ legacy_id => new_item_object ]

                    // --- B. Migrate Transactions Per Item ---
                    foreach ($groupRows as $legacyRow) {
                        if (isset($itemsMap[$legacyRow->id])) {
                            $this->migrateInvoiceTransactions($invoice, $itemsMap[$legacyRow->id], $legacyRow);
                        }
                    }

                    // --- C. Atomic Receipt & Relation Migration ---
                    // Relations handled in B, but check if we need this separately or if B covers it.
                    // Legacy system: payments linked to 'invoice' usually via trans_relations.
                    // But user also mentioned 'transactions' table has credit/receipt links.
                    // Let's keep migrateRelatedReceipts as a fallback for pure invoice-level payments not in transactions table?
                    // Or purely rely on transactions?
                    // Current code: migrateRelatedReceipts uses trans_relations table.
                    // User request implies using 'transactions' table for debit/credit structure.
                    // However, payments are often in 'trans_relations' too.
                    // Strategy: Keep migrateRelatedReceipts for safety (it creates Invoice-level relations),
                    // IF B doesn't find credits.
                    // But wait, user said "old system ... transaction has reciept_id ... link with reciepts".
                    // So we should prioritize B for credits too.
                    // Let's run migrateRelatedReceipts at the end to catch any payments NOT in transactions table (if any).
                    $this->migrateRelatedReceipts($invoice);
                    $this->updateInvoiceStatus($invoice);

                    $migratedCount++;
                } catch (\Exception $e) {
                    $errors[] = ['invoice_no' => $invoiceNo, 'error' => $e->getMessage()];
                    Log::error("Deep migration error for invoice $invoiceNo: " . $e->getMessage());
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'migrated' => $migratedCount,
                'errors' => $errors,
                'has_more' => count($invoiceNos) == $batchSize
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    private function createInvoiceFromLegacy($first, $groupRows, $oldTransTypeId = null)
    {
        static $transactionTypeIds = null;
        static $subscriptionCategoryCache = [];
        static $chargeTypeCache = [];

        if ($transactionTypeIds === null) {
            $transactionTypeIds = [
                'membership_fee' => TransactionType::where('name', 'Membership Fee')->value('id') ?? 'membership_fee',
                'maintenance_fee' => TransactionType::where('name', 'Monthly Maintenance Fee')->value('id') ?? 'maintenance_fee',
                'subscription_fee' => TransactionType::where('name', 'Subscription Fee')->value('id') ?? 'subscription_fee',
                'charges_fee' => TransactionType::where('name', 'Charges Fee')->value('id') ?? 'charges_fee',
            ];
        }

        // Resolve Payer
        $memberId = null;
        $corpId = null;
        $custId = null;

        if ($first->member_id) {
            $m = Member::where('old_member_id', $first->member_id)->first();
            $memberId = $m ? $m->id : null;
        } elseif ($first->corporate_id) {
            $c = CorporateMember::where('old_member_id', $first->corporate_id)->first();
            $corpId = $c ? $c->id : null;
        } elseif ($first->customer_id) {
            $cu = \App\Models\Customer::where('old_customer_id', $first->customer_id)->first();
            $custId = $cu ? $cu->id : null;
        }

        // Map Type & Reference IDs
        // Map Type & Reference IDs logic moved inside loop below

        // Header
        $invoice = FinancialInvoice::create([
            'invoice_no' => $first->invoice_no,
            'member_id' => $memberId,
            'corporate_member_id' => $corpId,
            'customer_id' => $custId,
            'issue_date' => $this->validateDate($first->invoice_date),
            'total_price' => $groupRows->sum('grand_total'),
            'remarks' => $first->comments,
            'status' => 'unpaid',  // Will update later
            'created_at' => $this->validateDate($first->created_at),
            'updated_at' => $this->validateDate($first->updated_at),
            'created_by' => $first->created_by ?? null,
            'updated_by' => $first->updated_by ?? null,
        ]);

        $itemsMap = [];

        // Items
        foreach ($groupRows as $row) {
            // Map Type & Reference IDs Per Item
            $typeId = $row->charges_type;
            $feeType = 'custom';
            $finChargeTypeId = null;
            $subTypeId = null;
            $subCategoryId = null;

            if ($typeId == 3) {
                $feeType = $transactionTypeIds['membership_fee'];
            } elseif ($typeId == 4) {
                $feeType = $transactionTypeIds['maintenance_fee'];
            } else {
                // Lookup Legacy Definition to decide strategy
                $legacyDef = DB::connection('old_afohs')->table('trans_types')->where('id', $typeId)->first();

                if ($legacyDef) {
                    if ($legacyDef->type == 3) {  // Subscription Strategy
                        $feeType = $transactionTypeIds['subscription_fee'];

                        if (!array_key_exists($legacyDef->name, $subscriptionCategoryCache)) {
                            $subscriptionCategoryCache[$legacyDef->name] = \App\Models\SubscriptionCategory::where('name', $legacyDef->name)->first();
                        }
                        $subTypeModel = $subscriptionCategoryCache[$legacyDef->name];
                        $subTypeId = $subTypeModel ? $subTypeModel->subscription_type_id : null;
                        $subCategoryId = $subTypeModel ? $subTypeModel->id : null;
                    } elseif ($legacyDef->type == 2) {  // Ad-hoc / Charges Strategy
                        $feeType = $transactionTypeIds['charges_fee'];

                        if (!array_key_exists($legacyDef->mod_id, $chargeTypeCache)) {
                            $chargeTypeCache[$legacyDef->mod_id] = \App\Models\FinancialChargeType::where('id', $legacyDef->mod_id)->first();
                        }
                        $ChargeTypeModel = $chargeTypeCache[$legacyDef->mod_id];
                        $finChargeTypeId = $ChargeTypeModel ? $ChargeTypeModel->id : null;
                    } else {
                        // skip
                        continue;
                    }
                }
            }

            $item = \App\Models\FinancialInvoiceItem::create([
                'invoice_id' => $invoice->id,
                'fee_type' => $feeType,
                'financial_charge_type_id' => $finChargeTypeId,
                'subscription_type_id' => $subTypeId,
                'subscription_category_id' => $subCategoryId,
                'description' => $row->comments,
                'amount' => $row->charges_amount ?? 0,
                'qty' => $row->qty ?? 1,
                'sub_total' => $row->sub_total ?? 0,
                'total' => $row->grand_total ?? 0,
                'tax_amount' => ($row->sub_total * ($row->tax_percentage ?? 0)) / 100,
                'start_date' => $this->validateDate($row->start_date),
                'end_date' => $this->validateDate($row->end_date),
                'created_by' => $row->created_by ?? null,
                'updated_by' => $row->updated_by ?? null,
            ]);
            $itemsMap[$row->id] = $item;
        }

        return ['invoice' => $invoice, 'items_map' => $itemsMap];
    }

    private function migrateInvoiceTransactions($newInvoice, $newItem, $legacyRow)
    {
        $payableType = $this->getPayableType($newInvoice);
        $payableId = $this->getPayableId($newInvoice);

        // 1. Synthesize DEBIT (Charge) Transaction from the Item itself
        // We do this to ensure every item has a corresponding charge, avoiding legacy data gaps.
        \App\Models\Transaction::create([
            'amount' => $newItem->total,  // Usage Total from Item
            'type' => 'debit',
            'payable_type' => $payableType,
            'payable_id' => $payableId,
            'reference_type' => \App\Models\FinancialInvoiceItem::class,
            'reference_id' => $newItem->id,
            'invoice_id' => $newInvoice->id,
            'date' => $this->resolveNonNullDate($newItem->start_date, $newInvoice->issue_date, $legacyRow->invoice_date ?? null, $legacyRow->created_at ?? null),
            'created_at' => $newItem->created_at,
            'updated_at' => $newItem->updated_at,
            'created_by' => $newItem->created_by,
            'updated_by' => $newItem->updated_by,
        ]);

        // 2. Find legacy CREDITS (Payments) linked to this specific row/item
        $legacyTrans = DB::connection('old_afohs')
            ->table('transactions')
            ->where('trans_type_id', $legacyRow->id)
            ->where('trans_type', $legacyRow->charges_type)  // STRICT MATCH
            ->where('debit_or_credit', '>', 0)  // ONLY CREDITS
            ->whereNull('deleted_at')
            ->orderBy('id', 'asc')
            ->get();

        foreach ($legacyTrans as $t) {
            // SKIP Credits that have no Receipt ID (Phantom/Duplicate Credits)
            if (empty($t->receipt_id)) {
                continue;
            }

            // CREDIT (Payment)
            // Try to find Receipt (for metadata/linking if possible, or just to verify existence)
            $receipt = null;
            if ($t->receipt_id) {
                $receipt = \App\Models\FinancialReceipt::where('legacy_id', $t->receipt_id)->first();
                if (!$receipt) {
                    $oldReceipt = DB::connection('old_afohs')->table('finance_cash_receipts')->where('id', $t->receipt_id)->whereNull('deleted_at')->first();
                    if ($oldReceipt) {
                        $receipt = $this->migrateSingleReceipt($oldReceipt, $payableType, $payableId, false);
                    }
                }
            }

            $remarks = $t->remarks ?? 'Legacy Credit';
            if ($receipt) {
                $remarks .= " (Receipt #{$receipt->receipt_no})";
            } elseif ($t->receipt_id) {
                $remarks .= " (Legacy Receipt ID: {$t->receipt_id} - Not Found)";
            }

            \App\Models\Transaction::create([
                'amount' => $t->trans_amount,
                'type' => 'credit',
                'payable_type' => $payableType,
                'payable_id' => $payableId,
                'reference_type' => \App\Models\FinancialInvoiceItem::class,
                'reference_id' => $newItem->id,
                'invoice_id' => $newInvoice->id,
                'receipt_id' => $receipt ? $receipt->id : ($t->receipt_id ?? null),
                'date' => $this->resolveNonNullDate($t->date, $receipt ? $receipt->receipt_date : null, $t->created_at, $legacyRow->invoice_date ?? null, $newInvoice->issue_date),
                'remarks' => $remarks,
                'created_at' => $this->validateDate($t->created_at),
                'updated_at' => $this->validateDate($t->updated_at),
                'created_by' => $t->created_by ?? null,
                'updated_by' => $t->updated_by ?? null,
            ]);

            // Update Invoice-Level Relation if receipt exists
            if ($receipt) {
                \App\Models\TransactionRelation::updateOrCreate([
                    'invoice_id' => $newInvoice->id,
                    'receipt_id' => $receipt->id
                ], [
                    'amount' => $t->trans_amount,
                    'legacy_transaction_id' => $t->id
                ]);
            }
        }
    }

    private function migrateInvoiceTransactionsPreloaded($newInvoice, $newItem, $legacyRow, $creditsGrouped, array &$receiptByLegacyId, array $oldReceiptsById)
    {
        $payableType = $this->getPayableType($newInvoice);
        $payableId = $this->getPayableId($newInvoice);

        \App\Models\Transaction::create([
            'amount' => $newItem->total,
            'type' => 'debit',
            'payable_type' => $payableType,
            'payable_id' => $payableId,
            'reference_type' => \App\Models\FinancialInvoiceItem::class,
            'reference_id' => $newItem->id,
            'invoice_id' => $newInvoice->id,
            'date' => $this->resolveNonNullDate($newItem->start_date, $newInvoice->issue_date, $legacyRow->invoice_date ?? null, $legacyRow->created_at ?? null),
            'created_at' => $newItem->created_at,
            'updated_at' => $newItem->updated_at,
            'created_by' => $newItem->created_by,
            'updated_by' => $newItem->updated_by,
        ]);

        $legacyTrans = $creditsGrouped[$legacyRow->id][$legacyRow->charges_type] ?? [];

        foreach ($legacyTrans as $t) {
            if (empty($t->receipt_id)) {
                continue;
            }

            $receipt = $receiptByLegacyId[$t->receipt_id] ?? null;
            if (!$receipt && isset($oldReceiptsById[$t->receipt_id])) {
                $receipt = $this->migrateSingleReceipt($oldReceiptsById[$t->receipt_id], $payableType, $payableId, false);
                if ($receipt) {
                    $receiptByLegacyId[$t->receipt_id] = $receipt;
                }
            }

            $remarks = $t->remarks ?? 'Legacy Credit';
            if ($receipt) {
                $remarks .= " (Receipt #{$receipt->receipt_no})";
            } elseif ($t->receipt_id) {
                $remarks .= " (Legacy Receipt ID: {$t->receipt_id} - Not Found)";
            }

            \App\Models\Transaction::create([
                'amount' => $t->trans_amount,
                'type' => 'credit',
                'payable_type' => $payableType,
                'payable_id' => $payableId,
                'reference_type' => \App\Models\FinancialInvoiceItem::class,
                'reference_id' => $newItem->id,
                'invoice_id' => $newInvoice->id,
                'receipt_id' => $receipt ? $receipt->id : ($t->receipt_id ?? null),
                'date' => $this->resolveNonNullDate($t->date, $receipt ? $receipt->receipt_date : null, $t->created_at, $legacyRow->invoice_date ?? null, $newInvoice->issue_date),
                'remarks' => $remarks,
                'created_at' => $this->validateDate($t->created_at),
                'updated_at' => $this->validateDate($t->updated_at),
                'created_by' => $t->created_by ?? null,
                'updated_by' => $t->updated_by ?? null,
            ]);

            if ($receipt) {
                \App\Models\TransactionRelation::updateOrCreate([
                    'invoice_id' => $newInvoice->id,
                    'receipt_id' => $receipt->id
                ], [
                    'amount' => $t->trans_amount,
                    'legacy_transaction_id' => $t->id
                ]);
            }
        }
    }

    private function migrateRelatedReceipts($invoice)
    {
        // 1. Find relations in legacy DB using Invoice ID (we need the legacy ID)
        // We can get legacy ID by querying old invoice table by invoice_no again or passing it.
        // Let's query quickly.
        $oldInvoice = DB::connection('old_afohs')->table('finance_invoices')->where('invoice_no', $invoice->invoice_no)->first();
        if (!$oldInvoice)
            return;

        // 2. The 'invoice' column in trans_relations likely points to 'transactions.id' (Legacy Items), not 'finance_invoices.id'.
        // So we get all transaction IDs for this invoice and query relations for them.
        $transIds = DB::connection('old_afohs')
            ->table('transactions')
            ->where('trans_type_id', $oldInvoice->id)
            ->whereNull('deleted_at')
            ->pluck('id')
            ->toArray();

        if (empty($transIds)) {
            return;
        }

        $relations = DB::connection('old_afohs')
            ->table('trans_relations')
            ->whereIn('invoice', $transIds)
            ->get();

        $totalPaid = 0;

        foreach ($relations as $rel) {
            // The 'receipt' column in trans_relations points to a Transaction ID (Type 2), NOT the Receipt ID directly.
            $legacyTransId = $rel->receipt;
            $legacyTrans = DB::connection('old_afohs')->table('transactions')->where('id', $legacyTransId)->whereNull('deleted_at')->first();

            if (!$legacyTrans) {
                continue;
            }

            $legacyReceiptId = $legacyTrans->receipt_id;

            // Check existence
            $receipt = \App\Models\FinancialReceipt::where('legacy_id', $legacyReceiptId)->first();

            if (!$receipt) {
                // Must migrate NOW
                $oldReceipt = DB::connection('old_afohs')->table('finance_cash_receipts')->where('id', $legacyReceiptId)->whereNull('deleted_at')->first();
                if ($oldReceipt) {
                    $receipt = $this->migrateSingleReceipt($oldReceipt);
                }
            }

            if ($receipt) {
                // Fetch the specific credit transaction to get the exact allocated amount
                $creditTransId = $rel->account;
                $creditTrans = DB::connection('old_afohs')->table('transactions')->where('id', $creditTransId)->whereNull('deleted_at')->first();
                $allocatedAmount = $creditTrans ? $creditTrans->trans_amount : $receipt->amount;

                // Create Relation
                // We use updateOrCreate to ensure we capture the legacy ID and amount if the relation was created by the other method with 0 amount.
                \App\Models\TransactionRelation::updateOrCreate([
                    'invoice_id' => $invoice->id,
                    'receipt_id' => $receipt->id
                ], [
                    'amount' => $allocatedAmount,
                    'legacy_transaction_id' => $creditTransId
                ]);
                $totalPaid += $allocatedAmount;
            }
        }

        // Update Status
        if ($totalPaid >= $invoice->total_price) {
            $invoice->update(['status' => 'paid']);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'unpaid']);
        }
    }

    private function migrateRelatedReceiptsPreloaded($invoice, $legacyInvoiceRow, $relations, array $legacyTransactionsById, array &$receiptByLegacyId, array $oldReceiptsById)
    {
        if ($relations instanceof \Illuminate\Support\Collection) {
            $relationsIterable = $relations;
        } else {
            $relationsIterable = collect($relations);
        }

        if ($relationsIterable->isEmpty()) {
            return;
        }

        $totalPaid = 0;

        foreach ($relationsIterable as $rel) {
            $legacyTransId = $rel->receipt ?? null;
            if (!$legacyTransId || !isset($legacyTransactionsById[$legacyTransId])) {
                continue;
            }

            $legacyTrans = $legacyTransactionsById[$legacyTransId];
            $legacyReceiptId = $legacyTrans->receipt_id ?? null;
            if (!$legacyReceiptId) {
                continue;
            }

            $receipt = $receiptByLegacyId[$legacyReceiptId] ?? null;
            if (!$receipt && isset($oldReceiptsById[$legacyReceiptId])) {
                $receipt = $this->migrateSingleReceipt($oldReceiptsById[$legacyReceiptId]);
                if ($receipt) {
                    $receiptByLegacyId[$legacyReceiptId] = $receipt;
                }
            }

            if (!$receipt) {
                continue;
            }

            $creditTransId = $rel->account ?? null;
            $creditTrans = $creditTransId && isset($legacyTransactionsById[$creditTransId]) ? $legacyTransactionsById[$creditTransId] : null;
            $allocatedAmount = $creditTrans ? $creditTrans->trans_amount : $receipt->amount;

            \App\Models\TransactionRelation::updateOrCreate([
                'invoice_id' => $invoice->id,
                'receipt_id' => $receipt->id
            ], [
                'amount' => $allocatedAmount,
                'legacy_transaction_id' => $creditTransId
            ]);
            $totalPaid += $allocatedAmount;
        }

        if ($totalPaid >= $invoice->total_price) {
            $invoice->update(['status' => 'paid']);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'unpaid']);
        }
    }

    private function updateInvoiceStatus($invoice)
    {
        $totalPaid = \App\Models\TransactionRelation::where('invoice_id', $invoice->id)->sum('amount');

        if ($totalPaid >= $invoice->total_price) {
            $invoice->update(['status' => 'paid']);
        } elseif ($totalPaid > 0) {
            $invoice->update(['status' => 'unpaid']);
        } else {
            $invoice->update(['status' => 'unpaid']);
        }
    }

    private function migrateSingleReceipt($old, $knownPayerType = null, $knownPayerId = null, $createTransaction = true)
    {
        // 1. Resolve Payer
        $payerType = $knownPayerType;
        $payerId = $knownPayerId;

        if (!$payerType || !$payerId) {
            // "mem_number" -> Member
            if (!empty($old->mem_number)) {
                $m = Member::where('old_member_id', $old->mem_number)->first();
                $payerType = Member::class;
                $payerId = $m ? $m->id : null;
            }
            // "corporate_id" -> Corporate
            elseif (!empty($old->corporate_id)) {
                // CAREFUL: corporate_id might be ID or some code. Assuming old_member_id map.
                // If corporate_id is integer from corporate_memberships.id logic:
                $c = CorporateMember::where('old_member_id', $old->corporate_id)->first();
                $payerType = CorporateMember::class;
                $payerId = $c ? $c->id : null;
            }
            // "customer_id" -> Customer
            elseif (!empty($old->customer_id)) {
                $cu = \App\Models\Customer::where('old_customer_id', $old->customer_id)->first();
                $payerType = \App\Models\Customer::class;
                $payerId = $cu ? $cu->id : null;
            }
        }

        // 2. Resolve Employee (Created By) - Handled below via direct map as requested/kept

        // 3. Map Payment Method
        // User requested: 22 -> Cash, 23 -> Cheque, 24 -> Online
        // Old Logic: ($old->account == 1) ? 'cash' : 'bank'
        $paymentMethod = 'cash';  // Default
        if ($old->account == 22) {
            $paymentMethod = 'cash';
        } elseif ($old->account == 23) {
            $paymentMethod = 'cheque';
        } elseif ($old->account == 24) {
            $paymentMethod = 'online';
        } elseif ($old->account == 1) {
            // Keep legacy fallback for old rows if any
            $paymentMethod = 'cash';
        } else {
            $paymentMethod = 'bank';  // Fallback for others
        }

        // 4. Map Advance
        // Maps directly to advance_amount below.

        // 5. Create Receipt
        // Map NTN/CTS (Legacy field 'entertainment': 1=ntn, 2=cts, 0/null=null)
        $ntnValue = null;
        if (isset($old->entertainment)) {
            if ($old->entertainment == 1) {
                $ntnValue = 'ntn';
            } elseif ($old->entertainment == 2) {
                $ntnValue = 'cts';
            }
        }

        $receiptData = [
            // 'id' => $old->id, // REMOVED: User requested auto-increment
            'receipt_no' => $old->id,  // finance_cash_receipts.invoice_no is the receipt #
            'amount' => $old->total ?? 0,
            'payment_method' => $paymentMethod,
            'receipt_date' => $this->resolveNonNullDate($old->invoice_date, $old->created_at, $old->updated_at),
            'payer_type' => $payerType,
            'payer_id' => $payerId,
            'remarks' => $old->remarks,
            'created_by' => $old->created_by,  // Mapped directly
            'updated_by' => $old->updated_by ?? null,
            // New Fields
            'employee_id' => \App\Models\Employee::where('old_employee_id', $old->employee_id)->value('id'),  // Lookup new ID
            'guest_name' => $old->guest_name,
            'guest_contact' => $old->guest_contact,
            'legacy_id' => $old->id,
            'advance_amount' => $old->advance ?? 0,
            'ntn' => $ntnValue,
            'created_at' => $this->validateDate($old->created_at),
            'updated_at' => $this->validateDate($old->updated_at),
            'deleted_at' => $old->deleted_at ? $this->validateDate($old->deleted_at) : null,
            'deleted_by' => $old->deleted_by ?? null,
        ];

        $newId = \App\Models\FinancialReceipt::insertGetId($receiptData);

        // Hydrate a model instance manually for return/usage to avoid re-query
        $receiptData['id'] = $newId;  // Add the new ID to data
        $receipt = new \App\Models\FinancialReceipt($receiptData);
        $receipt->exists = true;  // Mark as existing to avoid issues if used later

        if ($createTransaction) {
            // 6. Create Credit Transaction
            \App\Models\Transaction::create([
                'amount' => $old->total ?? 0,
                'type' => 'credit',
                'payable_type' => $payerType,
                'payable_id' => $payerId,
                'reference_type' => \App\Models\FinancialReceipt::class,
                'reference_id' => $receipt->id,
                'date' => $this->resolveNonNullDate($receipt->receipt_date, $old->invoice_date, $old->created_at, $old->updated_at),
                'created_at' => $this->validateDate($old->created_at),
                'updated_at' => $this->validateDate($old->updated_at),
            ]);
        }

        return $receipt;
    }

    private function getPayableType($invoice)
    {
        if ($invoice->member_id)
            return Member::class;
        if ($invoice->corporate_member_id)
            return CorporateMember::class;
        if ($invoice->customer_id)
            return \App\Models\Customer::class;
        return null;
    }

    private function getPayableId($invoice)
    {
        if ($invoice->member_id)
            return $invoice->member_id;
        if ($invoice->corporate_member_id)
            return $invoice->corporate_member_id;
        if ($invoice->customer_id)
            return $invoice->customer_id;
        return null;
    }

    public function migrateTransactionTypes(Request $request = null)
    {
        $count = 0;

        // 1. Migrate Types 1, 2, 4, 6 (Charges, Ad-hoc, Finance, POS)
        $types = DB::connection('old_afohs')
            ->table('trans_types')
            ->whereIn('type', [1, 2, 4, 6])  // Exclude 3 (Subscriptions) and 7 (Payments)
            ->get();

        foreach ($types as $t) {
            // Check if exists
            $exists = TransactionType::where('name', $t->name)->exists();
            if (!$exists) {
                TransactionType::create([
                    'name' => $t->name,
                    'type' => 2,  // Default to "Charges Type" behavior for new system compatibility
                    'status' => 'active',
                    'cash_or_payment' => 0,  // Assuming charge
                    'table_name' => 'finance_invoice',  // Default
                ]);
                $count++;
            }
        }

        // 2. Ensure Generic "Monthly Subscription" Type Exists
        $genericName = 'Monthly Subscription';
        if (!TransactionType::where('name', $genericName)->exists()) {
            TransactionType::create([
                'name' => $genericName,
                'type' => 2,
                'status' => 'active',
                'cash_or_payment' => 0,
                'table_name' => 'finance_invoice'
            ]);
            $count++;
        }

        return $count;
    }

    public function migrateSubscriptionTypes(Request $request = null)
    {
        $count = 0;

        // Migrate Type 3 (Subscriptions) -> Valid Subscription Types
        $types = DB::connection('old_afohs')
            ->table('sports_subscriptions')
            ->get();

        foreach ($types as $t) {
            // Check existence
            $exists = \App\Models\SubscriptionCategory::where('name', $t->desc)->exists();
            if (!$exists) {
                \App\Models\SubscriptionCategory::create([
                    'subscription_type_id' => 1,
                    'name' => $t->desc,
                    'status' => 'active',
                    'fee' => $t->charges,
                ]);
                $count++;
            }
        }

        return $count;
    }

    public function migrateSubscriptionTypesPublic(Request $request)
    {
        try {
            DB::beginTransaction();
            $count = $this->migrateSubscriptionTypes($request);
            DB::commit();

            $total = DB::connection('old_afohs')
                ->table('trans_types')
                ->where('type', 3)
                ->count();

            return response()->json([
                'success' => true,
                'migrated' => $count,
                'total' => $total,
                'message' => 'Subscription Types migrated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    public function migrateInvoicesGlobal(Request $request)
    {
        set_time_limit(0);
        $batchSize = (int) $request->get('batch_size', 50);
        $batchSize = max(1, min($batchSize, 20));

        try {
            // 1. Fetch Batch of Unmigrated Invoices
            // We use the "migrated" flag in the OLD database to track progress.
            // "migrated" = 0 or NULL means not yet migrated.
            $invoiceNos = DB::connection('old_afohs')
                ->table('finance_invoices')
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q
                        ->whereNull('migrated')
                        ->orWhere('migrated', 0);
                })
                ->select('invoice_no')
                ->distinct()
                ->orderBy('invoice_no')  // Deterministic order
                ->limit($batchSize)
                ->pluck('invoice_no')
                ->toArray();

            if (empty($invoiceNos)) {
                return response()->json([
                    'success' => true,
                    'migrated' => 0,
                    'errors' => [],
                    'has_more' => false,
                    'remaining' => 0,
                    'message' => 'No more unmigrated invoices found.',
                ]);
            }

            $rows = DB::connection('old_afohs')
                ->table('finance_invoices')
                ->whereIn('invoice_no', $invoiceNos)
                ->whereNull('deleted_at')
                ->get();

            $grouped = $rows->groupBy('invoice_no');
            $migratedCount = 0;
            $errors = [];

            foreach ($grouped as $invoiceNo => $groupRows) {
                try {
                    if (FinancialInvoice::where('invoice_no', $invoiceNo)->exists()) {
                        DB::connection('old_afohs')
                            ->table('finance_invoices')
                            ->where('invoice_no', $invoiceNo)
                            ->update(['migrated' => 1]);
                        continue;
                    }

                    $legacyRowIds = $groupRows->pluck('id')->all();
                    $legacyChargesTypes = $groupRows->pluck('charges_type')->unique()->filter(fn($v) => $v !== null)->values()->all();

                    $legacyCredits = DB::connection('old_afohs')
                        ->table('transactions')
                        ->whereIn('trans_type_id', $legacyRowIds)
                        ->when(!empty($legacyChargesTypes), function ($q) use ($legacyChargesTypes) {
                            $q->whereIn('trans_type', $legacyChargesTypes);
                        })
                        ->where('debit_or_credit', '>', 0)
                        ->whereNull('deleted_at')
                        ->orderBy('id', 'asc')
                        ->get();

                    $creditsGrouped = [];
                    $receiptIds = [];

                    foreach ($legacyCredits as $t) {
                        $creditsGrouped[$t->trans_type_id][$t->trans_type][] = $t;
                        if (!empty($t->receipt_id)) {
                            $receiptIds[$t->receipt_id] = true;
                        }
                    }

                    $first = $groupRows->first();

                    $invoiceTransIds = DB::connection('old_afohs')
                        ->table('transactions')
                        ->where('trans_type_id', $first->id)
                        ->whereNull('deleted_at')
                        ->pluck('id')
                        ->all();

                    $relations = collect();
                    $legacyTransactionsById = [];

                    if (!empty($invoiceTransIds)) {
                        $relations = DB::connection('old_afohs')
                            ->table('trans_relations')
                            ->whereIn('invoice', $invoiceTransIds)
                            ->get();

                        $relationTransIds = [];
                        foreach ($relations as $rel) {
                            if (!empty($rel->receipt)) {
                                $relationTransIds[$rel->receipt] = true;
                            }
                            if (!empty($rel->account)) {
                                $relationTransIds[$rel->account] = true;
                            }
                        }

                        if (!empty($relationTransIds)) {
                            $legacyTransactionsById = DB::connection('old_afohs')
                                ->table('transactions')
                                ->whereIn('id', array_keys($relationTransIds))
                                ->whereNull('deleted_at')
                                ->get()
                                ->keyBy('id')
                                ->all();

                            foreach ($legacyTransactionsById as $t) {
                                if (!empty($t->receipt_id)) {
                                    $receiptIds[$t->receipt_id] = true;
                                }
                            }
                        }
                    }

                    $receiptIds = array_keys($receiptIds);

                    $oldReceiptsById = [];
                    if (!empty($receiptIds)) {
                        $oldReceiptsById = DB::connection('old_afohs')
                            ->table('finance_cash_receipts')
                            ->whereIn('id', $receiptIds)
                            ->whereNull('deleted_at')
                            ->get()
                            ->keyBy('id')
                            ->all();
                    }

                    $receiptByLegacyId = [];
                    if (!empty($receiptIds)) {
                        $receiptByLegacyId = \App\Models\FinancialReceipt::whereIn('legacy_id', $receiptIds)->get()->keyBy('legacy_id')->all();
                    }

                    DB::transaction(function () use ($invoiceNo, $groupRows, $first, $creditsGrouped, $relations, $legacyTransactionsById, $oldReceiptsById, &$receiptByLegacyId) {
                        $result = $this->createInvoiceFromLegacy($first, $groupRows);
                        $invoice = $result['invoice'];
                        $itemsMap = $result['items_map'];

                        foreach ($groupRows as $legacyRow) {
                            if (isset($itemsMap[$legacyRow->id])) {
                                $this->migrateInvoiceTransactionsPreloaded($invoice, $itemsMap[$legacyRow->id], $legacyRow, $creditsGrouped, $receiptByLegacyId, $oldReceiptsById);
                            }
                        }

                        $this->migrateRelatedReceiptsPreloaded($invoice, $first, $relations, $legacyTransactionsById, $receiptByLegacyId, $oldReceiptsById);
                        $this->updateInvoiceStatus($invoice);
                    });

                    DB::connection('old_afohs')
                        ->table('finance_invoices')
                        ->where('invoice_no', $invoiceNo)
                        ->update(['migrated' => 1]);

                    $migratedCount++;
                } catch (\Throwable $e) {
                    $errors[] = ['invoice_no' => $invoiceNo, 'error' => $e->getMessage()];
                    Log::error("Global migration error for invoice {$invoiceNo}: " . $e->getMessage());
                }
            }

            // Check if there are more
            $remaining = DB::connection('old_afohs')
                ->table('finance_invoices')
                ->whereNull('deleted_at')
                ->where(function ($q) {
                    $q
                        ->whereNull('migrated')
                        ->orWhere('migrated', 0);
                })
                ->distinct('invoice_no')
                ->count('invoice_no');

            return response()->json([
                'success' => true,
                'migrated' => $migratedCount,
                'errors' => $errors,
                'has_more' => $remaining > 0,
                'remaining' => $remaining
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'migrated' => 0,
                'errors' => [['error' => $e->getMessage()]],
                'has_more' => false,
                'remaining' => null,
            ]);
        }
    }

    /**
     * Specialized migration for Member/Family Profile Photos.
     * Checks old_media (types 3, 100) without trashed items,
     * and updates/creates the corresponding Media record with correct path.
     */
    public function migrateMediaPhotos(Request $request)
    {
        $batchSize = $request->get('batch_size', 100);
        $offset = $request->get('offset', 0);

        try {
            DB::beginTransaction();

            // 1. Iterate through Members who have either old_member_id OR old_family_id
            // We use 'skip' and 'take' for batching based on the offset passed from frontend
            $members = Member::where(function ($q) {
                $q
                    ->whereNotNull('old_member_id')
                    ->orWhereNotNull('old_family_id');
            })
                ->skip($offset)
                ->take($batchSize)
                ->get();

            $updated = 0;
            $created = 0;
            $errors = [];
            $migratedCount = 0;

            foreach ($members as $member) {
                try {
                    $oldMedia = null;

                    // A. Check for Member Photo (Type 3)
                    if ($member->old_member_id) {
                        $oldMedia = DB::connection('old_afohs')
                            ->table('media')
                            ->where('trans_type', 3)
                            ->where('trans_type_id', $member->old_member_id)
                            ->whereNull('deleted_at')
                            ->orderBy('id', 'desc')  // Get latest
                            ->first();
                    }

                    // B. If no Member Photo found, check for Family Photo (Type 100) if applicable
                    if (!$oldMedia && $member->old_family_id) {
                        $oldMedia = DB::connection('old_afohs')
                            ->table('media')
                            ->where('trans_type', 100)
                            ->where('trans_type_id', $member->old_family_id)
                            ->whereNull('deleted_at')
                            ->orderBy('id', 'desc')  // Get latest
                            ->first();
                    }

                    // If still no media found, skip
                    if (!$oldMedia) {
                        continue;
                    }

                    // Define New Mapping
                    $mediableType = Member::class;
                    $mediableId = $member->id;
                    $newType = 'profile_photo';  // or 'member_photo' based on your conventions

                    // Logic to copy/map file
                    // Use transformMediaPath to get the correct new path based on trans_type
                    // This handles directory structure like /tenants/default/membership/ etc.
                    $newFilePath = $this->transformMediaPath($oldMedia->url, $oldMedia->trans_type);

                    // Extract filename from the new path
                    $fileName = basename($newFilePath);

                    // If file name is empty, skip
                    if (!$fileName)
                        continue;

                    // Mime type detection (consistent with migrateMedia)
                    $mimeType = $this->getMimeTypeFromPath($newFilePath);

                    // Check if Media record already exists for this member
                    $existingMedia = Media::where('mediable_type', $mediableType)
                        ->where('mediable_id', $mediableId)
                        ->where('type', $newType)
                        ->first();

                    if ($existingMedia) {
                        // Update existing
                        $existingMedia->update([
                            'file_name' => $fileName,
                            // 'file_path' => $newFilePath, // Don't overwrite path if we aren't actually moving files yet, or do if we are.
                            // Assuming we are just mapping data for now, or if we need to set the path validation:
                            'file_path' => $newFilePath,
                            'mime_type' => $mimeType,
                            'updated_at' => now(),
                        ]);
                        $updated++;
                    } else {
                        // Create new
                        Media::create([
                            'mediable_type' => $mediableType,
                            'mediable_id' => $mediableId,
                            'type' => $newType,
                            'file_name' => $fileName,
                            'file_path' => $newFilePath,
                            'mime_type' => $mimeType,
                            'disk' => 'public',
                            'created_at' => $oldMedia->created_at ? Carbon::parse($oldMedia->created_at) : now(),
                            'updated_at' => $oldMedia->updated_at ? Carbon::parse($oldMedia->updated_at) : now(),
                            'created_by' => $oldMedia->created_by ?? 1,  // Default to admin/system
                            'updated_by' => $oldMedia->updated_by ?? 1,
                        ]);
                        $created++;
                    }
                    $migratedCount++;
                } catch (\Exception $e) {
                    // Log error but continue with next member
                    $errors[] = ['member_id' => $member->id, 'error' => $e->getMessage()];
                    Log::error("Media migration error for member {$member->id}: " . $e->getMessage());
                }
            }

            DB::commit();

            // Calculate remaining
            // This is an approximation since we iterate Members, not Media.
            // We can just count remaining Members with old_ids.
            $totalMembersToCheck = Member::where(function ($q) {
                $q
                    ->whereNotNull('old_member_id')
                    ->orWhereNotNull('old_family_id');
            })->count();

            $remaining = $totalMembersToCheck - ($offset + $batchSize);
            if ($remaining < 0)
                $remaining = 0;

            return response()->json([
                'success' => true,
                'migrated' => $migratedCount,  // This batch
                'created' => $created,
                'updated' => $updated,
                'errors' => $errors,
                'has_more' => $remaining > 0,
                'remaining' => $remaining,
                'total' => $totalMembersToCheck  // Useful for progress bar
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Media photo migration fatal error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cleanupProfilePhotos(Request $request)
    {
        try {
            DB::beginTransaction();

            $deletedCount = 0;
            $processedGroups = 0;

            // Find members with multiple profile photos
            // Group by mediable_id and mediable_type where type is profile_photo
            // We can't easily do "HAVING COUNT > 1" on complex polymorphic queries in one go efficiently without raw SQL or collection processing.
            // Given the dataset might be large, let's try a raw query approach to find IDs with duplicates.

            $duplicates = DB::table('media')
                ->select('mediable_type', 'mediable_id', DB::raw('count(*) as count'))
                ->whereIn('type', ['profile_photo'])  // Ensure we stick to profile photos
                ->whereNull('deleted_at')
                ->groupBy('mediable_type', 'mediable_id')
                ->having('count', '>', 1)
                ->get();

            foreach ($duplicates as $duplicate) {
                // Get all photos for this member, ordered by ID DESC (latest first)
                // This MATCHES the logic in Member::profilePhoto() -> orderBy('id', 'desc')
                // So the first photo in this list is the one currently visible on the profile.
                $photos = Media::where('mediable_type', $duplicate->mediable_type)
                    ->where('mediable_id', $duplicate->mediable_id)
                    ->where('type', 'profile_photo')
                    ->orderBy('id', 'desc')
                    ->get();

                // Keep the first one (latest), delete the rest
                if ($photos->count() > 1) {
                    $photosToDelete = $photos->slice(1);
                    foreach ($photosToDelete as $photo) {
                        $photo->delete();  // Soft delete
                        $deletedCount++;
                    }
                    $processedGroups++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Cleanup complete. Processed {$processedGroups} members, deleted {$deletedCount} duplicate photos.",
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Cleanup profile photos error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function deleteLegacyInvoices(Request $request)
    {
        try {
            DB::beginTransaction();

            // Define the legacy ID threshold
            $legacyIdThreshold = 8915;

            // 1. Delete Financial Invoice Items (Children)
            $deletedItems = FinancialInvoiceItem::whereHas('invoice', function ($q) use ($legacyIdThreshold) {
                $q->where('id', '<=', $legacyIdThreshold);
            })->forceDelete();

            // 2. Identify Receipts linked to these invoices (via Transactions)
            // Get all receipt_ids from transactions linked to these invoices
            $receiptIds = \App\Models\Transaction::whereHas('invoice', function ($q) use ($legacyIdThreshold) {
                $q->where('id', '<=', $legacyIdThreshold);
            })->whereNotNull('receipt_id')->pluck('receipt_id')->unique();

            // 3. Delete Transaction Relations (Where invoice_id is legacy OR receipt_id is from legacy transactions)
            $deletedRelations = \App\Models\TransactionRelation::where(function ($q) use ($legacyIdThreshold, $receiptIds) {
                $q->whereIn('invoice_id', function ($sub) use ($legacyIdThreshold) {
                    $sub->select('id')->from('financial_invoices')->where('id', '<=', $legacyIdThreshold);
                });

                if ($receiptIds->isNotEmpty()) {
                    $q->orWhereIn('receipt_id', $receiptIds);
                }
            })->forceDelete();

            // 4. Delete Transactions related to these receipts (Credit side)
            $deletedReceiptTransactions = 0;
            if ($receiptIds->isNotEmpty()) {
                $deletedReceiptTransactions = \App\Models\Transaction::whereIn('receipt_id', $receiptIds)->forceDelete();
            }

            // 5. Delete Transactions related to invoices (Debit side)
            $deletedInvoiceTransactions = \App\Models\Transaction::whereHas('invoice', function ($q) use ($legacyIdThreshold) {
                $q->where('id', '<=', $legacyIdThreshold);
            })->forceDelete();

            // 6. Delete Receipts
            $deletedReceipts = 0;
            if ($receiptIds->isNotEmpty()) {
                $deletedReceipts = \App\Models\FinancialReceipt::whereIn('id', $receiptIds)->forceDelete();
            }

            // 7. Delete Invoices (Parents)
            $deletedInvoices = FinancialInvoice::where('id', '<=', $legacyIdThreshold)->forceDelete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "Successfully hard-deleted legacy invoices (ID <= {$legacyIdThreshold}) and their relations.",
                'stats' => [
                    'invoices_deleted' => $deletedInvoices,
                    'items_deleted' => $deletedItems,
                    'transaction_relations_deleted' => $deletedRelations,
                    'invoice_transactions_deleted' => $deletedInvoiceTransactions,
                    'receipt_transactions_deleted' => $deletedReceiptTransactions,
                    'receipts_deleted' => $deletedReceipts
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Delete Legacy Invoices Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function migrateFnB(Request $request)
    {
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');

        // Truncate tables (DDL causes implicit commit, so must be outside transaction)
        if (\Illuminate\Support\Facades\Schema::hasTable('user_tenant_access')) {
            DB::table('user_tenant_access')->truncate();
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('domains')) {
            DB::table('domains')->truncate();
        }
        if (\Illuminate\Support\Facades\Schema::hasTable('tenants')) {
            DB::table('tenants')->truncate();
        }
        \App\Models\Category::truncate();
        \App\Models\PosSubCategory::truncate();
        \App\Models\PosManufacturer::truncate();
        \App\Models\PosUnit::truncate();
        \App\Models\ProductIngredient::truncate();
        \App\Models\ProductVariantValue::truncate();
        \App\Models\ProductVariant::truncate();
        \App\Models\Product::truncate();

        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

        try {
            DB::beginTransaction();

            $tenantResult = $this->migrateRestaurantLocations();
            $tenantMap = $tenantResult['map'];
            $tenantIds = $tenantResult['tenant_ids'];
            $fallbackTenantId = $tenantResult['fallback_tenant_id'];

            // Migrate Categories and get map
            $catResult = $this->migrateCategories($tenantMap, $fallbackTenantId);
            $catMap = $catResult['map'];

            // Migrate SubCategories (needs catMap)
            $subResult = $this->migrateSubCategories($catMap, $catResult['category_tenant_map'], $fallbackTenantId);
            $subMap = $subResult['map'];

            // Migrate Manufacturers
            $manResult = $this->migrateManufacturers($tenantIds, $tenantMap, $fallbackTenantId);

            // Migrate Units
            $unitResult = $this->migrateUnits($tenantIds, $tenantMap, $fallbackTenantId);

            // Migrate Products (needs all maps)
            $prodCount = $this->migrateProducts(
                $catMap,
                $subMap,
                $manResult['map'],
                $unitResult['map'],
                $catResult['category_tenant_map'],
                $tenantMap,
                $fallbackTenantId
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'results' => [
                    'locations' => $tenantResult['count'],
                    'categories' => $catResult['count'],
                    'sub_categories' => $subResult['count'],
                    'manufacturers' => $manResult['count'],
                    'units' => $unitResult['count'],
                    'products' => $prodCount,
                ]
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('FnB Migration Error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function migrateRestaurantLocations()
    {
        $oldLocations = DB::connection('old_afohs')->table('fnb_restaurant_locations')->get();
        $count = 0;
        $map = [];
        $tenantIds = [];

        if (!\Illuminate\Support\Facades\Schema::hasTable('tenants')) {
            return [
                'count' => 0,
                'map' => [],
                'tenant_ids' => [],
                'fallback_tenant_id' => 1,
            ];
        }

        $tenantColumns = \Illuminate\Support\Facades\Schema::getColumnListing('tenants');
        $hasColumn = fn(string $col) => in_array($col, $tenantColumns, true);

        foreach ($oldLocations as $oldLoc) {
            $oldId = (int) $oldLoc->id;
            $row = [];

            if ($hasColumn('name')) {
                $row['name'] = $oldLoc->desc;
            }
            if ($hasColumn('branch_id')) {
                $row['branch_id'] = 1;
            }
            if ($hasColumn('status')) {
                $row['status'] = $oldLoc->status == 1 ? 'active' : 'inactive';
            }
            if ($hasColumn('printer_ip')) {
                $row['printer_ip'] = null;
            }
            if ($hasColumn('printer_port')) {
                $row['printer_port'] = 9100;
            }
            if ($hasColumn('expeditor_printer_ip')) {
                $row['expeditor_printer_ip'] = null;
            }
            if ($hasColumn('expeditor_printer_port')) {
                $row['expeditor_printer_port'] = 9100;
            }
            if ($hasColumn('created_at')) {
                $row['created_at'] = $oldLoc->created_at ?? null;
            }
            if ($hasColumn('updated_at')) {
                $row['updated_at'] = $oldLoc->updated_at ?? null;
            }
            if ($hasColumn('deleted_at')) {
                $row['deleted_at'] = $oldLoc->deleted_at ?? null;
            }
            if ($hasColumn('data')) {
                $row['data'] = null;
            }

            $newId = (int) DB::table('tenants')->insertGetId($row);

            $map[$oldId] = $newId;
            $tenantIds[] = $newId;
            $count++;
        }

        return [
            'count' => $count,
            'map' => $map,
            'tenant_ids' => $tenantIds,
            'fallback_tenant_id' => $tenantIds[0] ?? 1,
        ];
    }

    private function migrateUnits(array $tenantIds, array $tenantMap, int $fallbackTenantId)
    {
        // Try mapping from 'fnb_measurement_units'
        $oldUnits = DB::connection('old_afohs')->table('fnb_measurement_units')->get();
        $count = 0;
        $map = [];

        foreach ($oldUnits as $oldUnit) {
            $targets = [];

            if (isset($oldUnit->pos_location) && $oldUnit->pos_location !== null && $oldUnit->pos_location !== '') {
                $tenantId = $tenantMap[(int) $oldUnit->pos_location] ?? null;
                if ($tenantId) {
                    $targets = [$tenantId];
                }
            }

            if (empty($targets)) {
                $targets = !empty($tenantIds) ? $tenantIds : [$fallbackTenantId];
            }

            foreach ($targets as $tenantId) {
                $existingUnit = \App\Models\PosUnit::withTrashed()
                    ->where('tenant_id', $tenantId)
                    ->where('name', $oldUnit->desc)
                    ->first();

                if ($existingUnit) {
                    if ($existingUnit->trashed()) {
                        $existingUnit->restore();
                    }
                    $map[$tenantId][$oldUnit->id] = $existingUnit->id;
                    continue;
                }

                $newUnit = \App\Models\PosUnit::create([
                    'tenant_id' => $tenantId,
                    'name' => $oldUnit->desc,
                    'code' => $oldUnit->code,
                    'status' => $oldUnit->status == 1 ? 'active' : 'inactive',
                    'created_by' => $oldUnit->created_by,
                    'updated_by' => $oldUnit->updated_by,
                    'created_at' => $oldUnit->created_at,
                    'updated_at' => $oldUnit->updated_at,
                ]);

                $map[$tenantId][$oldUnit->id] = $newUnit->id;
                $count++;
            }
        }
        return ['count' => $count, 'map' => $map];
    }

    private function migrateCategories(array $tenantMap, int $fallbackTenantId)
    {
        $oldCategories = DB::connection('old_afohs')->table('fnb_item_categories')->get();
        $count = 0;
        $map = [];
        $categoryTenantMap = [];

        foreach ($oldCategories as $oldCat) {
            $tenantId = null;
            if (isset($oldCat->pos_location) && $oldCat->pos_location !== null && $oldCat->pos_location !== '') {
                $tenantId = $tenantMap[(int) $oldCat->pos_location] ?? null;
            }
            $tenantId = $tenantId ?? $fallbackTenantId;

            $newCat = \App\Models\Category::create([
                'name' => $oldCat->desc,
                'tenant_id' => $tenantId,
                'location_id' => $tenantId,
                'status' => $oldCat->status == 1 ? 'active' : 'inactive',  // Map to enum
                'created_by' => $oldCat->created_by,
                'updated_by' => $oldCat->updated_by,
                'created_at' => $oldCat->created_at,
                'updated_at' => $oldCat->updated_at,
            ]);

            $map[$oldCat->id] = $newCat->id;
            $categoryTenantMap[$oldCat->id] = $tenantId;
            $count++;
        }
        return ['count' => $count, 'map' => $map, 'category_tenant_map' => $categoryTenantMap];
    }

    private function migrateSubCategories(array $catMap, array $categoryTenantMap, int $fallbackTenantId)
    {
        $oldSubCats = DB::connection('old_afohs')->table('fnb_item_sub_categories')->get();
        $count = 0;
        $map = [];

        if ($oldSubCats->isNotEmpty()) {
            // Diagnostic passed: 'item_category' exists
        }

        foreach ($oldSubCats as $oldSub) {
            // Find new Category ID
            $newCatId = $catMap[$oldSub->item_category] ?? null;
            $tenantId = $categoryTenantMap[$oldSub->item_category] ?? $fallbackTenantId;

            if ($newCatId) {
                $newSub = \App\Models\PosSubCategory::create([
                    'tenant_id' => $tenantId,
                    'category_id' => $newCatId,
                    'name' => $oldSub->desc,
                    'status' => $oldSub->status == 1 ? 'active' : 'inactive',  // Map to enum
                    'created_by' => $oldSub->created_by,
                    'updated_by' => $oldSub->updated_by,
                    'created_at' => $oldSub->created_at,
                    'updated_at' => $oldSub->updated_at,
                ]);

                $map[$oldSub->id] = $newSub->id;
                $count++;
            }
        }
        return ['count' => $count, 'map' => $map];
    }

    private function migrateManufacturers(array $tenantIds, array $tenantMap, int $fallbackTenantId)
    {
        $oldMans = DB::connection('old_afohs')->table('fnb_item_manufacturers')->get();
        $count = 0;
        $map = [];

        foreach ($oldMans as $oldMan) {
            $targets = [];

            if (isset($oldMan->pos_location) && $oldMan->pos_location !== null && $oldMan->pos_location !== '') {
                $tenantId = $tenantMap[(int) $oldMan->pos_location] ?? null;
                if ($tenantId) {
                    $targets = [$tenantId];
                }
            }

            if (empty($targets)) {
                $targets = !empty($tenantIds) ? $tenantIds : [$fallbackTenantId];
            }

            foreach ($targets as $tenantId) {
                $existingMan = \App\Models\PosManufacturer::withTrashed()
                    ->where('tenant_id', $tenantId)
                    ->where('name', $oldMan->desc)
                    ->first();

                if ($existingMan) {
                    if ($existingMan->trashed()) {
                        $existingMan->restore();
                    }
                    $map[$tenantId][$oldMan->id] = $existingMan->id;
                    continue;
                }

                $newMan = \App\Models\PosManufacturer::create([
                    'tenant_id' => $tenantId,
                    'name' => $oldMan->desc,
                    'status' => $oldMan->status == 1 ? 'active' : 'inactive',  // Map to enum
                    'created_by' => $oldMan->created_by,
                    'updated_by' => $oldMan->updated_by,
                    'created_at' => $oldMan->created_at,
                    'updated_at' => $oldMan->updated_at,
                ]);

                $map[$tenantId][$oldMan->id] = $newMan->id;
                $count++;
            }
        }
        return ['count' => $count, 'map' => $map];
    }

    private function migrateProducts(array $catMap, array $subMap, array $manMap, array $unitMap, array $categoryTenantMap, array $tenantMap, int $fallbackTenantId)
    {
        $oldProducts = DB::connection('old_afohs')->table('fnb_item_definitions')->get();
        $count = 0;

        foreach ($oldProducts as $oldProd) {
            $itemType = 'finished_product';
            if (isset($oldProd->product_classification)) {
                if ($oldProd->product_classification == 1) {
                    $itemType = 'raw_material';
                } elseif ($oldProd->product_classification == 2) {
                    $itemType = 'finished_product';
                }
            }

            $tenantId = null;
            if (isset($oldProd->pos_location) && $oldProd->pos_location !== null && $oldProd->pos_location !== '') {
                $tenantId = $tenantMap[(int) $oldProd->pos_location] ?? null;
            }
            $tenantId = $tenantId ?? ($categoryTenantMap[$oldProd->category] ?? $fallbackTenantId);

            // Map keys
            $newCatId = $catMap[$oldProd->category] ?? null;
            $newSubId = $subMap[$oldProd->sub_category] ?? null;
            $newManId = $manMap[$tenantId][$oldProd->manufacturer] ?? ($manMap[$fallbackTenantId][$oldProd->manufacturer] ?? null);
            $newUnitId = $unitMap[$tenantId][$oldProd->unit] ?? ($unitMap[$fallbackTenantId][$oldProd->unit] ?? null);  // Added unit mapping

            $maxDiscount = 0;
            $maxDiscountType = 'percentage';

            if (!empty($oldProd->discount_amount) && $oldProd->discount_amount > 0) {
                $maxDiscount = $oldProd->discount_amount;
                $maxDiscountType = 'fixed';
            } elseif (!empty($oldProd->discount_percentage) && $oldProd->discount_percentage > 0) {
                $maxDiscount = $oldProd->discount_percentage;
                $maxDiscountType = 'percentage';
            }

            \App\Models\Product::create([
                'name' => $oldProd->item_details,
                'menu_code' => $oldProd->item_code,
                'available_order_types' => [
                    'dineIn',
                    'pickUp',
                    'delivery',
                    'takeaway',
                    'reservation'
                ],
                'category_id' => $newCatId,
                'sub_category_id' => $newSubId,
                'manufacturer_id' => $newManId,
                'unit_id' => $newUnitId,
                'cost_of_goods_sold' => $oldProd->purchase_price ?? 0,
                'base_price' => $oldProd->sale_price ?? 0,
                // 'current_stock' => $oldProd->qty ?? 0, // Old qty is unreliable
                'current_stock' => 0,
                'manage_stock' => false,  // Default to infinite stock
                'is_discountable' => $oldProd->discountable ?? 0,
                'is_taxable' => $oldProd->taxable ?? 0,
                'is_salable' => $oldProd->salable ?? 1,
                'is_purchasable' => $oldProd->purchasable ?? 1,
                'is_returnable' => $oldProd->returnable ?? 1,
                'status' => $oldProd->status == 1 ? 'active' : 'inactive',
                'item_type' => $itemType,
                'tenant_id' => $tenantId,
                'created_by' => $oldProd->created_by,
                'updated_by' => $oldProd->updated_by,
                'created_at' => $oldProd->created_at,
                'updated_at' => $oldProd->updated_at,
                'max_discount' => $maxDiscount,
                'max_discount_type' => $maxDiscountType,
            ]);
            $count++;
        }
        return $count;
    }
}
