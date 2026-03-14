<?php

namespace App\Console\Commands;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\LeaveApplication;
use App\Models\Tenant;
use App\Services\ZKTecoService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SyncAttendance extends Command
{
    protected $signature = 'sync:attendance';
    protected $description = 'Fetch attendance from ZKTeco and update database';
    protected $zkService;

    public function __construct(ZKTecoService $zkService)
    {
        parent::__construct();
        $this->zkService = $zkService;
    }

    public function handle()
    {

        // Skip execution on Sundays
        if (Carbon::today()->isSunday()) {
            $this->info('Attendance sync skipped (Sunday).');
            return;
        }
        // Fetch attendance data from ZKTeco
        // $logs = $this->zkService->getAttendance();

        $logs = [
            // [
            //     'uid' => 1,
            //     'id' => '12345678',
            //     'timestamp' => '2025-10-31 9:00:00',
            //     'type' => 'check-in'
            // ],
            // [
            //     'uid' => 1,
            //     'id' => '12345679',
            //     'timestamp' => '2025-10-31 9:10:00',
            //     'type' => 'check-in'
            // ]
        ];

        if (!$logs) {
            $this->info('No attendance data found.');
        }

        // Define the standard working time (e.g., 9:00 AM) for late arrival check
        $standardTime = Carbon::createFromFormat('H:i', '09:00');
        $today = Carbon::today()->format('Y-m-d');

        // Get all employees
        $employees = Employee::all();

        // Track employees who have attendance logs today
        $employeesWithAttendance = [];

        foreach ($logs as $log) {
            $employee = Employee::where('employee_id', $log['id'])->first();

            if ($employee) {
                $employeesWithAttendance[] = $employee->id;

                $attendanceData = [
                    'employee_id' => $employee->id,
                    'date' => Carbon::parse($log['timestamp'])->format('Y-m-d'),
                    'check_in' => $log['type'] === 'check-in' ? Carbon::parse($log['timestamp'])->format('H:i:s') : null,
                    'check_out' => $log['type'] === 'check-out' ? Carbon::parse($log['timestamp'])->format('H:i:s') : null,
                ];

                if ($attendanceData['check_in']) {
                    $checkInTime = Carbon::parse($attendanceData['check_in']);
                    $attendanceData['status'] = $checkInTime->gt($standardTime) ? 'late' : 'present';
                }

                $attendance = Attendance::where('employee_id', $attendanceData['employee_id'])
                    ->where('date', $attendanceData['date'])
                    ->first();

                if ($attendance) {
                    if (!$attendance->check_in && $attendanceData['check_in']) {
                        $attendance->update($attendanceData);
                    } elseif ($attendance->check_in && !$attendance->check_out && $attendanceData['check_out']) {
                        $attendance->update(['check_out' => $attendanceData['check_out']]);
                    }
                } else {
                    Attendance::create($attendanceData);
                }
            }
        }

        // Check for employees who have no attendance records
        foreach ($employees as $employee) {
            if (!in_array($employee->id, $employeesWithAttendance)) {
                // Check if the employee is on leave today
                $onLeave = LeaveApplication::where('employee_id', $employee->id)
                    ->whereDate('start_date', '<=', $today)
                    ->whereDate('end_date', '>=', $today)
                    ->where('status', 'approved')  // Ensure leave is approved
                    ->exists();

                // Set status based on leave status
                $status = $onLeave ? 'leave' : 'absent';

                Attendance::updateOrCreate(
                    ['employee_id' => $employee->id, 'date' => $today],
                    ['status' => $status]
                );
            }
        }

        $this->info('Attendance sync completed.');
    }
}
