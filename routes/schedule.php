<?php

use App\Http\Controllers\Schedule\ScheduleController;
use App\Http\Controllers\Schedule\ScheduleExportController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('jadwal/ekspor', ScheduleExportController::class)->name('schedule.export');
    Route::get('jadwal', ScheduleController::class)->name('schedule.index');
});
