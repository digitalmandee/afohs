<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule the family member expiry command to run daily at 2:00 AM
Schedule::command('members:expire-by-age')
    ->dailyAt('02:00')
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/family-member-expiry.log'));

Schedule::command('sync:attendance')
    ->cron('*/5 * * * *')  // every 5 minutes, all 24 hours
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/attendance-sync.log'));

// Schedule for checking membership status expiry
Schedule::command('members:check-status-expiry')
    ->daily()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/membership-status-expiry.log'));

Schedule::command('accounting:journals:run-recurring --limit=200')
    ->hourly()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/accounting-journal-recurring.log'));

Schedule::command('accounting:journals:automation --overdue-limit=300 --retry-limit=150')
    ->everyTenMinutes()
    ->withoutOverlapping()
    ->runInBackground()
    ->appendOutputTo(storage_path('logs/accounting-journal-automation.log'));
