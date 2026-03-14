<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveApplication;
use App\Models\LeaveCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class LeaveApplicationController extends Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        // Just render the page, data will be fetched via API
        return Inertia::render('App/Admin/Employee/Attendance/LeaveApplication');
    }

    public function create()
    {
        $employees = Employee::with('user:id,name')->get();
        $leaveCategories = LeaveCategory::where('status', 'published')->get();

        return Inertia::render('App/Admin/Employee/Attendance/NewApplication', [
            'employees' => $employees,
            'leaveCategories' => $leaveCategories
        ]);
    }

    public function edit($id)
    {
        $leaveApplication = LeaveApplication::with(['employee.user:id,name', 'leaveCategory'])
            ->findOrFail($id);

        $employees = Employee::with('user:id,name')->get();
        $leaveCategories = LeaveCategory::where('status', 'published')->get();

        return Inertia::render('App/Admin/Employee/Attendance/NewApplication', [
            'leaveApplication' => $leaveApplication,
            'employees' => $employees,
            'leaveCategories' => $leaveCategories
        ]);
    }

    /**
     * API endpoint for fetching leave applications with search
     */
    public function getApplications(Request $request)
    {
        $search = $request->query('search', '');
        $date = $request->query('date', '');
        $page = $request->query('page', 1);

        $query = LeaveApplication::with(['employee:id,employee_id,name', 'leaveCategory:id,name,color'])
            ->orderByDesc('created_at');

        // Apply search filter
        if (!empty($search)) {
            $query->whereHas('employee', function ($q) use ($search) {
                $q
                    ->where('name', 'like', '%' . $search . '%')
                    ->orWhere('employee_id', 'like', '%' . $search . '%');
            });
        }

        // Apply date filter only if date is provided and not empty
        if (!empty($date) && $date !== 'null' && $date !== 'undefined') {
            $query->where(function ($q) use ($date) {
                $q
                    ->where(function ($subQ) use ($date) {
                        // Leave that starts on or before the date and ends on or after the date
                        $subQ
                            ->whereDate('start_date', '<=', $date)
                            ->whereDate('end_date', '>=', $date);
                    })
                    ->orWhere(function ($subQ) use ($date) {
                        // Or leave that was created on this date
                        $subQ->whereDate('created_at', $date);
                    });
            });
        }

        $applications = $query->paginate(10)->through(function ($app) {
            $appArray = $app->toArray();
            try {
                $appArray['start_date'] = $appArray['start_date'] ? \Carbon\Carbon::parse($appArray['start_date'])->format('d/m/Y') : '-';
                $appArray['end_date'] = $appArray['end_date'] ? \Carbon\Carbon::parse($appArray['end_date'])->format('d/m/Y') : '-';
            } catch (\Exception $e) {
            }
            return $appArray;
        });

        return response()->json([
            'success' => true,
            'applications' => $applications
        ]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function leaveReportPage()
    {
        return Inertia::render('App/Admin/Employee/Attendance/LeaveReport');
    }

    public function leaveReportPrint(Request $request)
    {
        return Inertia::render('App/Admin/Employee/Attendance/LeaveReportPrint', [
            'queryParams' => $request->all()
        ]);
    }

    public function leaveReport(Request $request)
    {
        $monthly = $request->query('month', now()->format('Y-m'));  // Default to current month
        $limit = (int) $request->query('limit', 10);  // Ensure limit is integer
        $search = $request->query('search', '');  // Search parameter

        // Get all active leave categories
        $leaveCategories = LeaveCategory::where('status', 'published')->orderBy('name')->get();

        // Create month start and end dates properly
        $monthStart = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->startOfDay();
        $monthEnd = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->endOfMonth()->endOfDay();

        // Fetch employees with search filter
        $employeesQuery = Employee::query();

        if (!empty($search)) {
            $employeesQuery->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', '%' . $search . '%')
                    ->orWhere('employee_id', 'like', '%' . $search . '%');
            });
        }

        $employees = $employeesQuery->paginate($limit);

        $employeeIds = $employees->pluck('id')->toArray();

        // Get all Sundays in the month
        $sundays = [];
        for ($date = $monthStart->copy(); $date->lte($monthEnd); $date->addDay()) {
            if ($date->isSunday()) {
                $sundays[] = $date->format('Y-m-d');
            }
        }

        // Calculate total working days correctly based on current date
        $today = Carbon::now();
        $totalDaysInMonth = $monthEnd->day;  // Get actual number of days in month

        // For current month, only count days up to today
        // For past months, count all days
        // For future months, count 0 (no absence for days that haven't happened)
        if ($monthEnd->isFuture() && $monthStart->isFuture()) {
            // Future month - no working days to count yet
            $totalWorkingDays = 0;
        } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
            // Current month - count only up to today
            $daysToCount = $today->day;
            $sundaysUpToToday = collect($sundays)->filter(function ($sunday) use ($today) {
                return Carbon::parse($sunday)->lte($today);
            })->count();
            $totalWorkingDays = $daysToCount - $sundaysUpToToday;
        } else {
            // Past month - count all days
            $totalWorkingDays = $totalDaysInMonth - count($sundays);
        }

        // Fetch leave applications with leave category names that overlap with the selected month
        $leaveCounts = LeaveApplication::whereIn('employee_id', $employeeIds)
            ->where('leave_applications.status', 'approved')
            ->where(function ($query) use ($monthStart, $monthEnd) {
                $query
                    ->whereBetween('start_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                    ->orWhereBetween('end_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                    ->orWhere(function ($q) use ($monthStart, $monthEnd) {
                        $q
                            ->where('start_date', '<=', $monthStart->format('Y-m-d'))
                            ->where('end_date', '>=', $monthEnd->format('Y-m-d'));
                    });
            })
            ->join('leave_categories', 'leave_applications.leave_category_id', '=', 'leave_categories.id')
            ->selectRaw('employee_id, leave_categories.name as leave_category, SUM(number_of_days) as total_leave')
            ->groupBy('employee_id', 'leave_categories.name')
            ->get()
            ->groupBy('employee_id');

        // Fetch attendance excluding Sundays
        $attendanceStats = Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->whereNotIn('date', $sundays)
            ->selectRaw("
                employee_id,
                COUNT(*) as total_attendance,
                SUM(CASE WHEN status = 'present' AND check_in IS NOT NULL THEN 1 ELSE 0 END) as time_present,
                SUM(CASE WHEN status = 'late' AND check_in IS NOT NULL THEN 1 ELSE 0 END) as time_late
            ")
            ->groupBy('employee_id')
            ->get()
            ->keyBy('employee_id');

        // Fetch unique attendance dates to exclude from leave
        $attendanceDates = Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->pluck('date', 'employee_id')
            ->toArray();

        // Initialize totals
        $totalSummary = [
            'total_attendance' => 0,
            'total_absence' => 0,
            'total_leave' => 0,
            'leave_categories' => [],
        ];

        // Prepare response data
        $reportData = [];

        foreach ($employees as $employee) {
            $leaveData = $leaveCounts[$employee->id] ?? collect();
            $attendanceData = $attendanceStats[$employee->id] ?? (object) ['total_attendance' => 0, 'time_present' => 0, 'time_late' => 0];

            // Calculate total leave, excluding days where attendance exists
            $leaveSummary = [];
            $totalLeave = 0;
            foreach ($leaveData as $leave) {
                $filteredLeaveDays = $leave->total_leave - (isset($attendanceDates[$employee->id]) ? 1 : 0);
                $leaveSummary[str_replace(' ', '_', $leave->leave_category)] = max(0, $filteredLeaveDays);  // Ensure no negative values
                $totalLeave += $leaveSummary[str_replace(' ', '_', $leave->leave_category)];

                // Update total summary
                if (!isset($totalSummary['leave_categories'][str_replace(' ', '_', $leave->leave_category)])) {
                    $totalSummary['leave_categories'][str_replace(' ', '_', $leave->leave_category)] = 0;
                }
                $totalSummary['leave_categories'][str_replace(' ', '_', $leave->leave_category)] += $leaveSummary[str_replace(' ', '_', $leave->leave_category)];
            }

            // Check if employee joined after the month start - if so, don't count absence
            $employeeJoinDate = Carbon::parse($employee->created_at);
            $employeeWorkingDays = $totalWorkingDays;

            // If employee joined during this month, calculate working days from join date
            if ($employeeJoinDate->gte($monthStart)) {
                if ($monthEnd->isFuture() && $monthStart->isFuture()) {
                    $employeeWorkingDays = 0;
                } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
                    // Current month - count from join date to today
                    $daysFromJoin = max(0, $today->diffInDays($employeeJoinDate->startOfDay()));
                    $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $today) {
                        $sundayDate = Carbon::parse($sunday);
                        return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($today);
                    })->count();
                    $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                } else {
                    // Past month - count from join date to month end
                    $daysFromJoin = $monthEnd->diffInDays($employeeJoinDate->startOfDay()) + 1;
                    $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $monthEnd) {
                        $sundayDate = Carbon::parse($sunday);
                        return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($monthEnd);
                    })->count();
                    $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                }
            }

            // Calculate total absence correctly (ensure it's never negative)
            $totalAbsence = max(0, $employeeWorkingDays - ($totalLeave + $attendanceData->total_attendance));

            // Update totals
            $totalSummary['total_attendance'] += $attendanceData->total_attendance;
            $totalSummary['total_absence'] += $totalAbsence;
            $totalSummary['total_leave'] += $totalLeave;

            // Use Employee model fields directly instead of User relationship
            $reportData[] = [
                'employee_id' => $employee->employee_id,
                'employee_name' => $employee->name,  // Use employee name directly
                'designation' => $employee->designation,  // Use employee designation
                'email' => $employee->email,  // Use employee email
                'total_attendance' => $attendanceData->total_attendance,
                'total_absence' => $totalAbsence,
                'total_leave' => $totalLeave,
                'leave_categories' => $leaveSummary,
            ];
        }

        return response()->json([
            'success' => true,
            'report_data' => [
                'employees' => $reportData,
                'total_summary' => $totalSummary,
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'total_records' => $employees->total(),
                'leave_categories' => $leaveCategories,
            ],
        ]);
    }

    public function exportLeaveReport(Request $request)
    {
        $monthly = $request->query('month', now()->format('Y-m'));
        $search = $request->query('search', '');

        // Get all active leave categories for headers
        $leaveCategories = LeaveCategory::where('status', 'published')->orderBy('name')->get();

        $monthStart = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->startOfDay();
        $monthEnd = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->endOfMonth()->endOfDay();

        $employeesQuery = Employee::query();
        if (!empty($search)) {
            $employeesQuery->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', '%' . $search . '%')
                    ->orWhere('employee_id', 'like', '%' . $search . '%');
            });
        }
        $employees = $employeesQuery->get();  // No pagination for export

        $employeeIds = $employees->pluck('id')->toArray();

        // Sundays logic
        $sundays = [];
        for ($date = $monthStart->copy(); $date->lte($monthEnd); $date->addDay()) {
            if ($date->isSunday()) {
                $sundays[] = $date->format('Y-m-d');
            }
        }

        // Working days logic
        $today = Carbon::now();
        $totalDaysInMonth = $monthEnd->day;
        if ($monthEnd->isFuture() && $monthStart->isFuture()) {
            $totalWorkingDays = 0;
        } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
            $daysToCount = $today->day;
            $sundaysUpToToday = collect($sundays)->filter(function ($sunday) use ($today) {
                return Carbon::parse($sunday)->lte($today);
            })->count();
            $totalWorkingDays = $daysToCount - $sundaysUpToToday;
        } else {
            $totalWorkingDays = $totalDaysInMonth - count($sundays);
        }

        // Leave Counts
        $leaveCounts = LeaveApplication::whereIn('employee_id', $employeeIds)
            ->where('leave_applications.status', 'approved')
            ->where(function ($query) use ($monthStart, $monthEnd) {
                $query
                    ->whereBetween('start_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                    ->orWhereBetween('end_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                    ->orWhere(function ($q) use ($monthStart, $monthEnd) {
                        $q
                            ->where('start_date', '<=', $monthStart->format('Y-m-d'))
                            ->where('end_date', '>=', $monthEnd->format('Y-m-d'));
                    });
            })
            ->join('leave_categories', 'leave_applications.leave_category_id', '=', 'leave_categories.id')
            ->selectRaw('employee_id, leave_categories.name as leave_category, SUM(number_of_days) as total_leave')
            ->groupBy('employee_id', 'leave_categories.name')
            ->get()
            ->groupBy('employee_id');

        // Attendance Stats
        $attendanceStats = Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->whereNotIn('date', $sundays)
            ->selectRaw('employee_id, COUNT(*) as total_attendance')
            ->groupBy('employee_id')
            ->get()
            ->keyBy('employee_id');

        // Attendance Dates
        $attendanceDates = Attendance::whereIn('employee_id', $employeeIds)
            ->whereBetween('date', [$monthStart, $monthEnd])
            ->pluck('date', 'employee_id')
            ->toArray();

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="leave_report_' . $monthly . '.csv"',
        ];

        $callback = function () use ($employees, $leaveCounts, $attendanceStats, $attendanceDates, $totalWorkingDays, $monthStart, $monthEnd, $today, $sundays, $leaveCategories) {
            $file = fopen('php://output', 'w');

            // CSV Headers
            $csvHeaders = ['ID', 'Employee Name', 'Designation', 'Email', 'Total Attendance', 'Total Absence', 'Total Leave'];
            foreach ($leaveCategories as $cat) {
                $csvHeaders[] = $cat->name;
            }
            fputcsv($file, $csvHeaders);

            foreach ($employees as $employee) {
                $leaveData = $leaveCounts[$employee->id] ?? collect();
                $attendanceData = $attendanceStats[$employee->id] ?? (object) ['total_attendance' => 0];

                $leaveSummary = [];
                $totalLeave = 0;

                // Initialize leave summary for all categories to 0
                $catMap = [];
                foreach ($leaveCategories as $cat) {
                    $catMap[$cat->name] = 0;
                }

                foreach ($leaveData as $leave) {
                    $filteredLeaveDays = $leave->total_leave - (isset($attendanceDates[$employee->id]) ? 1 : 0);
                    $val = max(0, $filteredLeaveDays);
                    $totalLeave += $val;
                    if (isset($catMap[$leave->leave_category])) {
                        $catMap[$leave->leave_category] += $val;
                    }
                }

                // Join Date calculation
                $employeeJoinDate = Carbon::parse($employee->created_at);
                $employeeWorkingDays = $totalWorkingDays;

                if ($employeeJoinDate->gte($monthStart)) {
                    // Same logic as leaveReport
                    if ($monthEnd->isFuture() && $monthStart->isFuture()) {
                        $employeeWorkingDays = 0;
                    } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
                        $daysFromJoin = max(0, $today->diffInDays($employeeJoinDate->startOfDay()));
                        $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $today) {
                            $sundayDate = Carbon::parse($sunday);
                            return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($today);
                        })->count();
                        $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                    } else {
                        $daysFromJoin = $monthEnd->diffInDays($employeeJoinDate->startOfDay()) + 1;
                        $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $monthEnd) {
                            $sundayDate = Carbon::parse($sunday);
                            return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($monthEnd);
                        })->count();
                        $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                    }
                }

                $totalAbsence = max(0, $employeeWorkingDays - ($totalLeave + $attendanceData->total_attendance));

                $row = [
                    $employee->employee_id,
                    $employee->name,
                    $employee->designation,
                    $employee->email,
                    $attendanceData->total_attendance,
                    $totalAbsence,
                    $totalLeave
                ];

                foreach ($leaveCategories as $cat) {
                    $row[] = $catMap[$cat->name];
                }

                fputcsv($file, $row);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function leaveReportMonthly(Request $request)
    {
        $monthly = $request->query('month', now()->format('Y-m'));  // Default to current month
        $limit = $request->query('limit', 10);  // Get per page limit from request (default: 10)

        // Create month start and end dates properly
        $monthStart = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->startOfDay();
        $monthEnd = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->endOfMonth()->endOfDay();

        // Get all Sundays in the month
        $sundays = [];
        for ($date = $monthStart->copy(); $date->lte($monthEnd); $date->addDay()) {
            if ($date->isSunday()) {
                $sundays[] = $date->format('Y-m-d');
            }
        }

        // Calculate total working days based on current date (for absence calculation)
        $today = Carbon::now();

        // Determine the cutoff date for counting working days
        if ($monthEnd->isFuture() && $monthStart->isFuture()) {
            // Future month - no working days to count yet
            $cutoffDate = null;
            $totalWorkingDays = 0;
        } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
            // Current month - count only up to today
            $cutoffDate = $today;
            $daysToCount = $today->day;
            $sundaysUpToToday = collect($sundays)->filter(function ($sunday) use ($today) {
                return Carbon::parse($sunday)->lte($today);
            })->count();
            $totalWorkingDays = $daysToCount - $sundaysUpToToday;
        } else {
            // Past month - count all days
            $cutoffDate = $monthEnd;
            $totalDaysInMonth = $monthEnd->day;
            $totalWorkingDays = $totalDaysInMonth - count($sundays);
        }

        $employees = Employee::paginate($limit);  // Pagination applied

        $reportData = [];
        $totalLeave = 0;
        $totalAttendance = 0;
        $totalTimePresent = 0;
        $totalTimeLate = 0;
        $totalAbsence = 0;

        foreach ($employees as $employee) {
            // Get approved leave applications that overlap with the selected month
            $leaveApplications = $employee
                ->leaveApplications()
                ->where('status', 'approved')
                ->where(function ($query) use ($monthStart, $monthEnd) {
                    $query
                        ->whereBetween('start_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                        ->orWhereBetween('end_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                        ->orWhere(function ($q) use ($monthStart, $monthEnd) {
                            $q
                                ->where('start_date', '<=', $monthStart->format('Y-m-d'))
                                ->where('end_date', '>=', $monthEnd->format('Y-m-d'));
                        });
                })
                ->get();

            // Get attendance records, excluding Sundays (only up to cutoff date)
            $attendanceQuery = $employee
                ->attendances()
                ->whereBetween('date', [$monthStart, $cutoffDate ?? $monthEnd])
                ->whereNotIn('date', $sundays);

            $attendance = $attendanceQuery->get();

            // Calculate leave days that fall within the selected month only (up to cutoff date)
            $leaveCount = 0;
            foreach ($leaveApplications as $leave) {
                $leaveStart = Carbon::parse($leave->start_date);
                $leaveEnd = Carbon::parse($leave->end_date);

                // Get the overlap period within the selected month (up to cutoff date)
                $overlapStart = $leaveStart->lt($monthStart) ? $monthStart : $leaveStart;
                $overlapEnd = $leaveEnd->gt($cutoffDate ?? $monthEnd) ? ($cutoffDate ?? $monthEnd) : $leaveEnd;

                // Count days in the overlap period, excluding Sundays
                for ($date = $overlapStart->copy(); $date->lte($overlapEnd); $date->addDay()) {
                    if (!$date->isSunday()) {
                        $leaveCount++;
                    }
                }
            }
            $attendanceCount = $attendance->whereIn('status', ['present', 'late'])->count();
            $timePresent = $attendance->where('status', 'present')->whereNotNull('check_in')->count();
            $timeLate = $attendance->where('status', 'late')->whereNotNull('check_in')->count();

            // Check if employee joined after the month start - if so, calculate working days from join date
            $employeeJoinDate = Carbon::parse($employee->created_at);
            $employeeWorkingDays = $totalWorkingDays;

            // If employee joined during this month, calculate working days from join date
            if ($employeeJoinDate->gte($monthStart)) {
                if ($monthEnd->isFuture() && $monthStart->isFuture()) {
                    $employeeWorkingDays = 0;
                } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
                    // Current month - count from join date to today
                    $daysFromJoin = max(0, $today->diffInDays($employeeJoinDate->startOfDay()));
                    $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $today) {
                        $sundayDate = Carbon::parse($sunday);
                        return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($today);
                    })->count();
                    $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                } else {
                    // Past month - count from join date to month end
                    $daysFromJoin = $monthEnd->diffInDays($employeeJoinDate->startOfDay()) + 1;
                    $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $monthEnd) {
                        $sundayDate = Carbon::parse($sunday);
                        return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($monthEnd);
                    })->count();
                    $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                }
            }

            // Calculate absence (only for past and current months up to today)
            $employeeAbsence = max(0, $employeeWorkingDays - ($leaveCount + $attendanceCount));

            // Update totals
            $totalLeave += $leaveCount;
            $totalAttendance += $attendanceCount;
            $totalTimePresent += $timePresent;
            $totalTimeLate += $timeLate;
            $totalAbsence += $employeeAbsence;

            // Add employee data to report
            $reportData[] = [
                'employee_id' => $employee->employee_id,
                'profile_image' => $employee->profile_image,
                'employee_name' => $employee->name,
                'designation' => $employee->designation,
                'total_leave' => $leaveCount,
                'total_attendance' => $attendanceCount,
                'time_present' => $timePresent,
                'time_late' => $timeLate,
                'total_absence' => $employeeAbsence,
            ];
        }

        // Add total summary at the bottom
        $totalSummary = [
            'employee_id' => 'Total',
            'employee_name' => 'All Employees',
            'total_leave' => $totalLeave,
            'total_attendance' => $totalAttendance,
            'time_present' => $totalTimePresent,
            'time_late' => $totalTimeLate,
            'total_absence' => $totalAbsence,
        ];

        return response()->json([
            'success' => true,
            'report_data' => [
                'employees' => $reportData,
                'total_summary' => $totalSummary,
                'current_page' => $employees->currentPage(),
                'last_page' => $employees->lastPage(),
                'total_records' => $employees->total(),
            ],
        ]);
    }

    public function exportMonthlyReport(Request $request)
    {
        $monthly = $request->query('month', now()->format('Y-m'));

        // Create month start and end dates properly
        $monthStart = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->startOfDay();
        $monthEnd = Carbon::createFromFormat('Y-m-d', $monthly . '-01')->endOfMonth()->endOfDay();

        // Get all Sundays in the month
        $sundays = [];
        for ($date = $monthStart->copy(); $date->lte($monthEnd); $date->addDay()) {
            if ($date->isSunday()) {
                $sundays[] = $date->format('Y-m-d');
            }
        }

        // Calculate total working days based on current date (for absence calculation)
        $today = Carbon::now();

        // Determine the cutoff date for counting working days
        if ($monthEnd->isFuture() && $monthStart->isFuture()) {
            $cutoffDate = null;
            $totalWorkingDays = 0;
        } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
            $cutoffDate = $today;
            $daysToCount = $today->day;
            $sundaysUpToToday = collect($sundays)->filter(function ($sunday) use ($today) {
                return Carbon::parse($sunday)->lte($today);
            })->count();
            $totalWorkingDays = $daysToCount - $sundaysUpToToday;
        } else {
            $cutoffDate = $monthEnd;
            $totalDaysInMonth = $monthEnd->day;
            $totalWorkingDays = $totalDaysInMonth - count($sundays);
        }

        $employees = Employee::all();  // No pagination for export

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="monthly_attendance_report_' . $monthly . '.csv"',
        ];

        $callback = function () use ($employees, $monthStart, $monthEnd, $sundays, $cutoffDate, $totalWorkingDays, $today) {
            $file = fopen('php://output', 'w');
            fputcsv($file, ['Employee Name', 'ID', 'Designation', 'Total Leave', 'Total Attendance', 'Time Present', 'Time Late', 'Total Absence']);

            foreach ($employees as $employee) {
                // Get approved leave applications
                $leaveApplications = $employee
                    ->leaveApplications()
                    ->where('status', 'approved')
                    ->where(function ($query) use ($monthStart, $monthEnd) {
                        $query
                            ->whereBetween('start_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                            ->orWhereBetween('end_date', [$monthStart->format('Y-m-d'), $monthEnd->format('Y-m-d')])
                            ->orWhere(function ($q) use ($monthStart, $monthEnd) {
                                $q
                                    ->where('start_date', '<=', $monthStart->format('Y-m-d'))
                                    ->where('end_date', '>=', $monthEnd->format('Y-m-d'));
                            });
                    })
                    ->get();

                // Get attendance records
                $attendanceQuery = $employee
                    ->attendances()
                    ->whereBetween('date', [$monthStart, $cutoffDate ?? $monthEnd])
                    ->whereNotIn('date', $sundays);

                $attendance = $attendanceQuery->get();

                // Calculate leave days
                $leaveCount = 0;
                foreach ($leaveApplications as $leave) {
                    $leaveStart = Carbon::parse($leave->start_date);
                    $leaveEnd = Carbon::parse($leave->end_date);
                    $overlapStart = $leaveStart->lt($monthStart) ? $monthStart : $leaveStart;
                    $overlapEnd = $leaveEnd->gt($cutoffDate ?? $monthEnd) ? ($cutoffDate ?? $monthEnd) : $leaveEnd;

                    for ($date = $overlapStart->copy(); $date->lte($overlapEnd); $date->addDay()) {
                        if (!$date->isSunday()) {
                            $leaveCount++;
                        }
                    }
                }

                $attendanceCount = $attendance->whereIn('status', ['present', 'late'])->count();
                $timePresent = $attendance->where('status', 'present')->whereNotNull('check_in')->count();
                $timeLate = $attendance->where('status', 'late')->whereNotNull('check_in')->count();

                // Join date logic
                $employeeJoinDate = Carbon::parse($employee->created_at);
                $employeeWorkingDays = $totalWorkingDays;

                if ($employeeJoinDate->gte($monthStart)) {
                    if ($monthEnd->isFuture() && $monthStart->isFuture()) {
                        $employeeWorkingDays = 0;
                    } elseif ($monthStart->isPast() && $monthEnd->isFuture()) {
                        $daysFromJoin = max(0, $today->diffInDays($employeeJoinDate->startOfDay()));
                        $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $today) {
                            $sundayDate = Carbon::parse($sunday);
                            return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($today);
                        })->count();
                        $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                    } else {
                        $daysFromJoin = $monthEnd->diffInDays($employeeJoinDate->startOfDay()) + 1;
                        $sundaysFromJoin = collect($sundays)->filter(function ($sunday) use ($employeeJoinDate, $monthEnd) {
                            $sundayDate = Carbon::parse($sunday);
                            return $sundayDate->gte($employeeJoinDate) && $sundayDate->lte($monthEnd);
                        })->count();
                        $employeeWorkingDays = max(0, $daysFromJoin - $sundaysFromJoin);
                    }
                }

                $employeeAbsence = max(0, $employeeWorkingDays - ($leaveCount + $attendanceCount));

                fputcsv($file, [
                    $employee->name,
                    $employee->employee_id,
                    $employee->designation,
                    $leaveCount,
                    $attendanceCount,
                    $timePresent,
                    $timeLate,
                    $employeeAbsence
                ]);
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_category_id' => 'required|exists:leave_categories,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
        ]);

        try {
            $startDate = Carbon::parse($request->start_date);
            $endDate = Carbon::parse($request->end_date);

            // Check if the employee already has a leave application in this range
            if (LeaveApplication::where('employee_id', $request->employee_id)
                    ->where(function ($query) use ($startDate, $endDate) {
                        $query
                            ->whereBetween('start_date', [$startDate, $endDate])
                            ->orWhereBetween('end_date', [$startDate, $endDate])
                            ->orWhere(function ($q) use ($startDate, $endDate) {
                                $q
                                    ->where('start_date', '<=', $startDate)
                                    ->where('end_date', '>=', $endDate);
                            });
                    })
                    ->exists()) {
                return response()->json(['success' => false, 'message' => 'Employee already has a leave application in this date range'], 422);
            }

            LeaveApplication::create([
                'employee_id' => $request->employee_id,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'leave_category_id' => $request->leave_category_id,
                'number_of_days' => $startDate->diffInDays($endDate) + 1,
                'reason' => $request->reason,
            ]);

            return response()->json(['success' => true, 'message' => 'Leave application created successfully']);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $application = LeaveApplication::with('employee:id,user_id', 'employee.user:id,name', 'leaveCategory:id,name')->find($id);

        return response()->json(['success' => true, 'application' => $application]);
    }

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_category_id' => 'required|exists:leave_categories,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'reason' => 'required|string',
            'status' => 'required|in:pending,approved,rejected',
        ]);

        try {
            $startDate = Carbon::parse($request->start_date);
            $endDate = Carbon::parse($request->end_date);

            // Check for overlapping leave applications (excluding current one)
            $existingLeave = LeaveApplication::where('employee_id', $request->employee_id)
                ->where('id', '!=', $id)
                ->where(function ($query) use ($startDate, $endDate) {
                    $query
                        ->whereBetween('start_date', [$startDate, $endDate])
                        ->orWhereBetween('end_date', [$startDate, $endDate])
                        ->orWhere(function ($q) use ($startDate, $endDate) {
                            $q
                                ->where('start_date', '<=', $startDate)
                                ->where('end_date', '>=', $endDate);
                        });
                })
                ->exists();

            if ($existingLeave) {
                return response()->json(['success' => false, 'message' => 'Employee already has a leave application in this date range'], 422);
            }

            LeaveApplication::find($id)->update([
                'employee_id' => $request->employee_id,
                'leave_category_id' => $request->leave_category_id,
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'reason' => $request->reason,
                'number_of_days' => $startDate->diffInDays($endDate) + 1,
                'status' => $request->status
            ]);

            return response()->json(['success' => true, 'message' => 'Leave application updated successfully']);
        } catch (\Throwable $th) {
            return response()->json(['success' => false, 'message' => $th->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }
}
