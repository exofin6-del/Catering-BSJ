<?php

use App\Http\Controllers\CustomerV2\CustomerController;
use App\Http\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', CustomerController::class)->name('home');


Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');
});

require __DIR__ . '/location.php';
require __DIR__ . '/order.php';
require __DIR__ . '/paket.php';
require __DIR__ . '/customerV2.php';
require __DIR__ . '/menu.php';
require __DIR__ . '/categories.php';
require __DIR__ . '/settings.php';
require __DIR__ . '/report.php';
require __DIR__ . '/schedule.php';
