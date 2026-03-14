<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\LeaveApplicationController;
use App\Http\Controllers\LeaveCategoryController;
use App\Http\Controllers\PayrollApiController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * |--------------------------------------------------------------------------
 * | API Routes
 * |--------------------------------------------------------------------------
 * |
 * | Here is where you can register API routes for your application. These
 * | routes are loaded by the RouteServiceProvider and all of them will
 * | be assigned to the "api" middleware group. Make something great!
 * |
 */

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Attendance API Routes
Route::prefix('attendances')->group(function () {
    Route::get('/', [AttendanceController::class, 'index']);
    Route::put('/{attendanceId}', [AttendanceController::class, 'updateAttendance']);
    Route::get('/reports', [AttendanceController::class, 'attendanceReport']);
    Route::get('/profile/report/{employeeId}', [AttendanceController::class, 'profileReport']);
    Route::post('/all/report', [AttendanceController::class, 'allEmployeesReport']);
});

// Leave Categories API Routes
Route::get('/leave-categories', [LeaveCategoryController::class, 'getCategories']);

// Leave Applications API Routes
Route::prefix('leaves')->group(function () {
    Route::get('/reports', [LeaveApplicationController::class, 'leaveReport']);
});

// Note: Payroll API Routes are now in web.php following the application's pattern
// Note: Employee Reports API Routes are now in web.php under admin/employees/reports/api/
