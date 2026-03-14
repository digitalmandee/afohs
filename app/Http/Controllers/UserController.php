<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Employee;
use App\Models\Member;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class UserController extends Controller
{
    // Search for members
    public function searchMember(Request $request)
    {
        $query = $request->input('q');
        $memberType = $request->input('type');

        $results = [];

        if ($memberType == 1) {
            $members = Member::select(
                'members.id',
                'members.full_name',
                'members.membership_no',
                'members.cnic_no',
                'members.current_address',
                'members.personal_email',
                'members.mobile_number_a',
                'members.status',
                'member_categories.name as category_name',
            )
                ->leftJoin('member_categories', 'members.member_category_id', '=', 'member_categories.id')
                ->whereNull('members.parent_id')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('members.full_name', 'like', "%{$query}%")
                        ->orWhere('members.membership_no', 'like', "%{$query}%");
                });

            $members = $members->limit(40)->get();

            $results = $members->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->full_name,
                    'booking_type' => 'member',
                    'label' => "{$user->full_name} ({$user->membership_no}) - " . ucfirst($user->status),
                    'membership_no' => $user->membership_no,
                    'email' => $user->personal_email,
                    'cnic' => $user->cnic_no,
                    'phone' => $user->mobile_number_a,
                    'address' => $user->current_address,
                    'status' => $user->status ?? 'active',  // Added status
                ];
            });

            return response()->json(['success' => true, 'results' => $results]);
        } else if ($memberType == 2) {
            $customers = Customer::select(
                'id',
                'customer_no',
                'name',
                'email',
                'contact',
                'cnic',
                'address',
                'member_name',
                'member_no',
                'guest_type_id'
            )
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('customer_no', 'like', "%{$query}%")
                        ->orWhere('cnic', 'like', "%{$query}%");
                })
                ->limit(10)
                ->get();

            $results = $customers->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'booking_type' => 'guest',
                    'name' => $customer->name,
                    'label' => "{$customer->name} ({$customer->customer_no})",
                    'customer_no' => $customer->customer_no,
                    'email' => $customer->email,
                    'cnic' => $customer->cnic,
                    'phone' => $customer->contact,
                    'address' => $customer->address,
                ];
            });
        } else if ($memberType == 3) {
            $employees = Employee::select(
                'id',
                'employee_id',
                'name',
                'email',
                'phone_no',
            )
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('employee_id', 'like', "%{$query}%");
                })
                ->limit(40)
                ->get();

            $results = $employees->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'booking_type' => 'employee',
                    'name' => $employee->name,
                    'label' => "{$employee->name} ({$employee->employee_id})",
                    'customer_no' => $employee->employee_id,
                    'email' => $employee->email,
                    'phone' => $employee->phone_no,
                ];
            });
        }

        return response()->json(['success' => true, 'results' => $results]);
    }

    // get waiters
    public function waiters()
    {
        $waiters = Employee::with(['department', 'subdepartment'])
            ->whereHas('designation', function ($q) {
                $q->where('name', 'Waiter');
            })
            ->select('id', 'employee_id', 'name', 'email', 'status', 'department_id', 'subdepartment_id', 'company')
            ->get()
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'employee_id' => $employee->employee_id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'status' => $employee->status ?? 'active',
                    'department_name' => $employee->department->name ?? null,
                    'subdepartment_name' => $employee->subdepartment->name ?? null,
                    'company' => $employee->company,
                ];
            });

        return response()->json([
            'success' => true,
            'waiters' => $waiters
        ], 200);
    }

    // get riders
    public function riders()
    {
        $riders = Employee::with(['department', 'subdepartment'])
            ->whereHas('designation', function ($q) {
                $q->where('name', 'Rider');
            })
            ->select('id', 'employee_id', 'name', 'email', 'status', 'department_id', 'subdepartment_id', 'company')
            ->get()
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'employee_id' => $employee->employee_id,
                    'name' => $employee->name,
                    'email' => $employee->email,
                    'status' => $employee->status ?? 'active',
                    'department_name' => $employee->department->name ?? null,
                    'subdepartment_name' => $employee->subdepartment->name ?? null,
                    'company' => $employee->company,
                ];
            });

        return response()->json([
            'success' => true,
            'riders' => $riders
        ], 200);
    }

    public function kitchens()
    {
        $kitchens = User::role('kitchen', 'web')->select('id', 'name', 'email')->get();

        return response()->json(['success' => true, 'kitchens' => $kitchens], 200);
    }

    // Search users
    public function searchUsers(Request $request)
    {
        $query = $request->input('q');
        $bookingType = $request->query('type') ?? '0';
        $includeKinships = $request->boolean('include_kinships');

        // Prevent empty search from returning all results
        if (!$query || trim($query) === '') {
            return response()->json(['success' => true, 'results' => []]);
        }

        // Case 1: bookingType = 0 => Search in Users table (members)
        // Case 4: bookingType = 'employee' => Search in Employees table
        if ($bookingType === 'employee' || $bookingType == '3') {
            $employees = Employee::with(['department', 'subdepartment'])
                ->select('id', 'name', 'employee_id', 'email', 'designation', 'phone_no', 'department_id', 'subdepartment_id', 'company', 'status')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('employee_id', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%");
                })
                ->limit(40)
                ->get();

            $results = $employees->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'booking_type' => 'employee',
                    'name' => $employee->name,
                    'label' => "{$employee->name} ({$employee->employee_id})",
                    'employee_id' => $employee->employee_id,
                    'email' => $employee->email,
                    'phone' => $employee->phone_no,
                    'designation' => $employee->designation,
                    'status' => $employee->status ?? 'active',
                    'department_name' => $employee->department->name ?? null,
                    'subdepartment_name' => $employee->subdepartment->name ?? null,
                    'company' => $employee->company,
                ];
            });
        } elseif ($bookingType === '0') {
            $selectColumns = [
                'members.id',
                'members.full_name',
                'members.membership_no',
                'members.cnic_no',
                'members.current_address',
                'members.personal_email',
                'members.mobile_number_a',
                'members.status',
                'members.reason',
                'member_categories.name as category_name',
                DB::raw('(SELECT msh.reason FROM member_status_histories msh WHERE msh.member_id = members.id ORDER BY msh.id DESC LIMIT 1) as status_reason'),
            ];
            if ($includeKinships) {
                $selectColumns[] = DB::raw('(SELECT COUNT(*) FROM members AS fm WHERE fm.kinship = members.id) as total_kinships');
            }

            $members = Member::select($selectColumns)
                ->leftJoin('member_categories', 'members.member_category_id', '=', 'member_categories.id')
                ->whereNull('members.parent_id')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('members.full_name', 'like', "%{$query}%")
                        ->orWhere('members.membership_no', 'like', "%{$query}%");
                });

            $members = $members->limit(40)->get();

            $results = $members->map(function ($user) use ($includeKinships) {
                $payload = [
                    'id' => $user->id,
                    'booking_type' => 'member',
                    'name' => $user->full_name,
                    'label' => "{$user->full_name} ({$user->membership_no})",
                    'membership_no' => $user->membership_no,
                    'email' => $user->personal_email,
                    'cnic' => $user->cnic_no,
                    'phone' => $user->mobile_number_a,
                    'address' => $user->current_address,
                    'status' => $user->status ?? 'active',
                    'status_reason' => $user->status_reason ?: ($user->reason ?? null),
                ];
                if ($includeKinships) {
                    $payload['total_kinships'] = $user->total_kinships;
                }
                return $payload;
            });
        } elseif ($bookingType === '2') {
            $selectColumns = [
                'corporate_members.id',
                'corporate_members.full_name',
                'corporate_members.membership_no',
                'corporate_members.cnic_no',
                'corporate_members.current_address',
                'corporate_members.personal_email',
                'corporate_members.mobile_number_a',
                'corporate_members.status',
                'corporate_members.reason',
                'member_categories.name as category_name',
                DB::raw('(SELECT msh.reason FROM member_status_histories msh WHERE msh.corporate_member_id = corporate_members.id ORDER BY msh.id DESC LIMIT 1) as status_reason'),
            ];
            if ($includeKinships) {
                $selectColumns[] = DB::raw('(SELECT COUNT(*) FROM corporate_members AS fm WHERE fm.kinship = corporate_members.id) as total_kinships');
            }

            $members = \App\Models\CorporateMember::select($selectColumns)
                ->leftJoin('member_categories', 'corporate_members.member_category_id', '=', 'member_categories.id')
                ->whereNull('corporate_members.parent_id')
                ->where(function ($q) use ($query) {
                    $q
                        ->where('corporate_members.full_name', 'like', "%{$query}%")
                        ->orWhere('corporate_members.membership_no', 'like', "%{$query}%");
                });

            $members = $members->limit(40)->get();

            $results = $members->map(function ($user) use ($includeKinships) {
                $payload = [
                    'id' => $user->id,
                    'booking_type' => 'member',  // Use 'member' to keep frontend logic consistent if it relies on this
                    'is_corporate' => true,
                    'name' => $user->full_name,
                    'label' => "{$user->full_name} ({$user->membership_no})",
                    'membership_no' => $user->membership_no,
                    'email' => $user->personal_email,
                    'cnic' => $user->cnic_no,
                    'phone' => $user->mobile_number_a,
                    'address' => $user->current_address,
                    'status' => $user->status ?? 'active',
                    'status_reason' => $user->status_reason ?: ($user->reason ?? null),
                ];
                if ($includeKinships) {
                    $payload['total_kinships'] = $user->total_kinships;
                }
                return $payload;
            });

            // Case 2: bookingType = 1 => Search in customers
        } elseif ($bookingType === '1') {
            $customers = Customer::select(
                'id',
                'customer_no',
                'name',
                'email',
                'contact',
                'cnic',
                'address',
                'member_name',
                'member_no',
                'guest_type_id'
            )
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('customer_no', 'like', "%{$query}%")
                        ->orWhere('cnic', 'like', "%{$query}%");
                })
                ->limit(40)
                ->get();

            $results = $customers->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'booking_type' => 'guest',
                    'name' => $customer->name,
                    'label' => "{$customer->name} ({$customer->customer_no})",
                    'customer_no' => $customer->customer_no,
                    'email' => $customer->email,
                    'cnic' => $customer->cnic,
                    'phone' => $customer->contact,
                    'address' => $customer->address,
                ];
            });

            // Case 3: bookingType like guest-1, guest-2 => Filter customers by guest_type_id
        } elseif (Str::startsWith($bookingType, 'guest-')) {
            $guestTypeId = (int) Str::after($bookingType, 'guest-');

            $customers = Customer::select(
                'id',
                'customer_no',
                'name',
                'email',
                'contact',
                'cnic',
                'address',
                'member_name',
                'member_no',
                'guest_type_id'
            )
                ->where('guest_type_id', $guestTypeId)
                ->where(function ($q) use ($query) {
                    $q
                        ->where('name', 'like', "%{$query}%")
                        ->orWhere('email', 'like', "%{$query}%")
                        ->orWhere('customer_no', 'like', "%{$query}%")
                        ->orWhere('cnic', 'like', "%{$query}%");
                })
                ->limit(40)
                ->get();

            $results = $customers->map(function ($customer) {
                return [
                    'id' => $customer->id,
                    'booking_type' => 'guest',
                    'name' => $customer->name,
                    'label' => "{$customer->name} ({$customer->customer_no})",
                    'customer_no' => $customer->customer_no,
                    'email' => $customer->email,
                    'cnic' => $customer->cnic,
                    'phone' => $customer->contact,
                    'address' => $customer->address,
                ];
            });
        } else {
            return response()->json(['success' => false, 'message' => 'Invalid booking type'], 400);
        }

        return response()->json(['success' => true, 'results' => $results], 200);
    }
}
