<?php

use App\Http\Controllers\App\Auth\AuthController;
use App\Http\Controllers\App\Auth\AuthenticatedSessionController;
use App\Http\Controllers\App\Auth\ConfirmablePasswordController;
use App\Http\Controllers\App\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\App\Auth\EmailVerificationPromptController;
use App\Http\Controllers\App\Auth\NewPasswordController;
use App\Http\Controllers\App\Auth\PasswordResetLinkController;
use App\Http\Controllers\App\Auth\RegisteredUserController;
use App\Http\Controllers\App\Auth\VerifyEmailController;
use Illuminate\Support\Facades\Route;

Route::middleware(\App\Http\Middleware\RedirectIfTenantAuthenticated::class)->group(function () {
    Route::get('register', [RegisteredUserController::class, 'create'])->name('tenant.register');

    Route::post('register', [RegisteredUserController::class, 'store']);

    Route::post('check-user-id', [AuthController::class, 'checkUserId'])->name('tenant.check-user-id');

    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('tenant.login');

    Route::post('login', [AuthenticatedSessionController::class, 'store']);

    Route::get('forgot-password', [PasswordResetLinkController::class, 'create'])->name('tenant.password.request');

    Route::post('forgot-password', [PasswordResetLinkController::class, 'store'])->name('tenant.password.email');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])->name('tenant.password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])->name('tenant.password.store');
});

Route::middleware('auth:tenant')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)->name('tenant.verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)->middleware(['signed', 'throttle:6,1'])->name('tenant.verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])->middleware('throttle:6,1')->name('tenant.verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])->name('tenant.password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('tenant.logout');
});
